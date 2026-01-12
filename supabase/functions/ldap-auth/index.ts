import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LDAP_API_BASE = 'http://hubapi.redemontecarlo.com.br/auth/ldap';

interface LdapLoginResponse {
  success: boolean;
  message?: string;
  user?: {
    username: string;
    displayName?: string;
    email?: string;
    department?: string;
    title?: string;
    objectId?: string;
    // Add other fields as returned by the API
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username e password são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiToken = Deno.env.get('MC_HUB_API');
    if (!apiToken) {
      console.error('MC_HUB_API token not configured');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Validate credentials with LDAP API
    console.log(`Attempting LDAP validation for user: ${username}`);
    console.log(`API Token present: ${!!apiToken}, length: ${apiToken?.length}`);
    
    const ldapResponse = await fetch(`${LDAP_API_BASE}/validate`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Token': apiToken,
      },
      body: JSON.stringify({ username, password }),
    });

    const ldapText = await ldapResponse.text();
    console.log('LDAP raw response:', ldapText);
    console.log('LDAP response status:', ldapResponse.status);
    
    let ldapData: LdapLoginResponse;
    try {
      ldapData = JSON.parse(ldapText);
    } catch {
      console.error('Failed to parse LDAP response as JSON');
      return new Response(
        JSON.stringify({ error: 'Erro na resposta do servidor LDAP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check various possible success indicators from the API
    const isSuccess = ldapResponse.ok && (ldapData.success !== false);
    
    if (!isSuccess) {
      console.log('LDAP validation failed:', ldapData);
      return new Response(
        JSON.stringify({ error: ldapData.message || 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Create/update user in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate email from username if not provided
    const userEmail = ldapData.user?.email || `${username.toLowerCase()}@redemontecarlo.com.br`;
    const displayName = ldapData.user?.displayName || username;
    
    // Check if user exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === userEmail);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      console.log('Existing user found:', userId);
    } else {
      // Create new user with a random password (they'll use LDAP to login)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          ldap_username: username,
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário no sistema' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user!.id;
      isNewUser = true;
      console.log('New user created:', userId);
    }

    // Step 3: Update/create profile with LDAP data
    const profileData = {
      cod_usuario: userId,
      des_email: userEmail,
      des_nome_completo: displayName,
      des_departamento: ldapData.user?.department || null,
      des_cargo: ldapData.user?.title || null,
      des_ad_object_id: ldapData.user?.objectId || null,
      dta_sincronizacao_ad: new Date().toISOString(),
      ind_ativo: true,
    };

    const { error: profileError } = await supabase
      .from('tab_perfil_usuario')
      .upsert(profileData, { onConflict: 'cod_usuario' });

    if (profileError) {
      console.error('Error upserting profile:', profileError);
      // Don't fail the login, just log the error
    }

    // Step 4: Assign default 'user' role if new user
    if (isNewUser) {
      const { error: roleError } = await supabase
        .from('tab_usuario_role')
        .insert({
          seq_usuario: userId,
          des_role: 'user',
        });

      if (roleError) {
        console.error('Error assigning default role:', roleError);
      }
    }

    // Step 5: Generate session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (sessionError) {
      console.error('Error generating session link:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar sessão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token from the link
    const linkUrl = new URL(sessionData.properties.action_link);
    const token = linkUrl.searchParams.get('token');
    const tokenHash = linkUrl.hash?.replace('#', '') || linkUrl.searchParams.get('token_hash');

    // Get user roles
    const { data: roles } = await supabase
      .from('tab_usuario_role')
      .select('des_role')
      .eq('seq_usuario', userId);

    console.log('LDAP login successful for:', username);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          fullName: displayName,
          department: ldapData.user?.department,
          jobTitle: ldapData.user?.title,
          isNewUser,
          roles: roles?.map(r => r.des_role) || ['user'],
        },
        auth: {
          token,
          tokenHash,
          actionLink: sessionData.properties.action_link,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('LDAP auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
