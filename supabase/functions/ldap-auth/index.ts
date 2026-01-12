import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LDAP_API_BASE = 'http://hubapi.redemontecarlo.com.br/auth/ldap';

// Response from the validate endpoint based on actual API response
interface LdapValidateResponse {
  ok?: boolean;
  success?: boolean;
  message?: string;
  detail?: string;
  username?: string;
  full_name?: string;
  groups?: string[];
  // Additional profile fields if available
  department?: string;
  title?: string;
  email?: string;
  office?: string;
  phone?: string;
  objectId?: string;
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
    
    let ldapData: LdapValidateResponse;
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
    // The API returns { ok: true, username, full_name, groups } on success
    const isSuccess = ldapResponse.ok && (ldapData.ok === true || ldapData.success === true);
    
    if (!isSuccess) {
      console.log('LDAP validation failed:', ldapData);
      return new Response(
        JSON.stringify({ error: ldapData.message || ldapData.detail || 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Try to get more profile information from LDAP API (if endpoint exists)
    let profileInfo: LdapValidateResponse = { ...ldapData };
    
    try {
      const profileResponse = await fetch(`${LDAP_API_BASE}/profile/${username}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'X-API-Token': apiToken,
        },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('LDAP profile data:', JSON.stringify(profileData));
        // Merge profile data with existing data
        profileInfo = { ...profileInfo, ...profileData };
      } else {
        console.log('Profile endpoint not available or returned error:', profileResponse.status);
      }
    } catch (profileError) {
      console.log('Error fetching profile (optional):', profileError);
      // Continue without additional profile data
    }

    // Step 3: Create/update user in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate email from username if not provided
    const ldapUsername = profileInfo.username || username;
    const userEmail = profileInfo.email || `${ldapUsername.toLowerCase()}@redemontecarlo.com.br`;
    const displayName = profileInfo.full_name || ldapUsername;
    const department = profileInfo.department || null;
    const jobTitle = profileInfo.title || null;
    const office = profileInfo.office || null;
    const phone = profileInfo.phone || null;
    const adGroups = profileInfo.groups || [];
    
    console.log('Syncing user profile:', {
      username: ldapUsername,
      email: userEmail,
      displayName,
      department,
      jobTitle,
      groups: adGroups,
    });
    
    // Check if user exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === userEmail);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      console.log('Existing user found:', userId);
      
      // Update user metadata with latest LDAP info
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: displayName,
          ldap_username: ldapUsername,
          ldap_groups: adGroups,
        },
      });
    } else {
      // Create new user with a random password (they'll use LDAP to login)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          ldap_username: ldapUsername,
          ldap_groups: adGroups,
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

    // Step 4: Update/create profile with LDAP data (sync on every login)
    const profileData: Record<string, unknown> = {
      cod_usuario: userId,
      des_email: userEmail,
      des_nome_completo: displayName,
      dta_sincronizacao_ad: new Date().toISOString(),
      ind_ativo: true,
    };
    
    // Only update fields that have values from LDAP
    if (department) profileData.des_departamento = department;
    if (jobTitle) profileData.des_cargo = jobTitle;
    if (office) profileData.des_unidade = office;
    if (phone) profileData.des_telefone = phone;
    if (profileInfo.objectId) profileData.des_ad_object_id = profileInfo.objectId;

    const { error: profileError } = await supabase
      .from('tab_perfil_usuario')
      .upsert(profileData, { onConflict: 'cod_usuario' });

    if (profileError) {
      console.error('Error upserting profile:', profileError);
      // Don't fail the login, just log the error
    } else {
      console.log('Profile synced successfully');
    }

    // Step 5: Assign default 'user' role if new user
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

    // Step 6: Generate session token for the user
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

    console.log('LDAP login successful for:', ldapUsername);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          fullName: displayName,
          department,
          jobTitle,
          office,
          groups: adGroups,
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
