import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allowed origins for CORS - includes pattern matching for Lovable preview domains
const ALLOWED_ORIGINS = [
  'https://haycuruhkzmhszwcmcpn.lovableproject.com',
  'https://intranet.redemontecarlo.com.br',
  'http://localhost:8080',
  'http://localhost:5173',
];

// Patterns for Lovable domains (supports both lovableproject.com and lovable.app)
const LOVABLE_PATTERNS = [
  /^https:\/\/[a-f0-9-]+\.lovableproject\.com$/,
  /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/,
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (LOVABLE_PATTERNS.some(pattern => pattern.test(origin))) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const LDAP_API_BASE = 'http://hubapi.redemontecarlo.com.br/auth/ldap';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxAttemptsPerIP: 10,       // Max attempts per IP in time window
  ipWindowMinutes: 15,        // Time window for IP-based limiting (minutes)
  maxAttemptsPerUser: 5,      // Max attempts per username in time window
  userWindowMinutes: 30,      // Time window for username-based limiting (minutes)
  progressiveDelayBase: 2,    // Base for progressive delay (seconds)
  maxProgressiveDelay: 60,    // Maximum progressive delay (seconds)
};

// Response from the validate endpoint based on actual API response
interface LdapValidateResponse {
  ok?: boolean;
  success?: boolean;
  message?: string;
  detail?: string;
  username?: string;
  full_name?: string;
  groups?: string[];
  department?: string;
  title?: string;
  email?: string;
  office?: string;
  phone?: string;
  objectId?: string;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: 'IP_RATE_LIMIT' | 'USERNAME_RATE_LIMIT';
  consecutiveFailures?: number;
}

// Extract client IP from request headers
function getClientIP(req: Request): string {
  // Check various headers for the real IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return 'unknown';
}

// Check rate limits before allowing login attempt
async function checkRateLimit(
  supabase: any,
  ip: string,
  username: string
): Promise<RateLimitResult> {
  const now = new Date();
  const ipWindowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.ipWindowMinutes * 60 * 1000);
  const userWindowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.userWindowMinutes * 60 * 1000);
  const normalizedUsername = username.toLowerCase().trim();

  try {
    // Check IP-based rate limit
    const { count: ipFailures } = await supabase
      .from('tab_tentativa_login')
      .select('*', { count: 'exact', head: true })
      .eq('des_ip_address', ip)
      .eq('ind_sucesso', false)
      .gte('dta_tentativa', ipWindowStart.toISOString());

    if ((ipFailures || 0) >= RATE_LIMIT_CONFIG.maxAttemptsPerIP) {
      console.log(`Rate limit exceeded for IP: ${ip} (${ipFailures} failures)`);
      return {
        allowed: false,
        retryAfterSeconds: RATE_LIMIT_CONFIG.ipWindowMinutes * 60,
        reason: 'IP_RATE_LIMIT',
      };
    }

    // Check username-based rate limit
    const { count: userFailures } = await supabase
      .from('tab_tentativa_login')
      .select('*', { count: 'exact', head: true })
      .eq('des_username', normalizedUsername)
      .eq('ind_sucesso', false)
      .gte('dta_tentativa', userWindowStart.toISOString());

    if ((userFailures || 0) >= RATE_LIMIT_CONFIG.maxAttemptsPerUser) {
      console.log(`Rate limit exceeded for username: ${normalizedUsername} (${userFailures} failures)`);
      return {
        allowed: false,
        retryAfterSeconds: RATE_LIMIT_CONFIG.userWindowMinutes * 60,
        reason: 'USERNAME_RATE_LIMIT',
      };
    }

    // Get consecutive failures for progressive delay
    const { data: recentFailures } = await supabase
      .from('tab_tentativa_login')
      .select('ind_sucesso')
      .or(`des_ip_address.eq.${ip},des_username.eq.${normalizedUsername}`)
      .order('dta_tentativa', { ascending: false })
      .limit(10);

    let consecutiveFailures = 0;
    if (recentFailures) {
      for (const attempt of recentFailures) {
        if (!attempt.ind_sucesso) {
          consecutiveFailures++;
        } else {
          break;
        }
      }
    }

    return {
      allowed: true,
      consecutiveFailures,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the attempt but log the issue
    return { allowed: true, consecutiveFailures: 0 };
  }
}

// Log a login attempt
async function logLoginAttempt(
  supabase: any,
  ip: string,
  username: string,
  success: boolean,
  failureReason?: string,
  userAgent?: string
): Promise<void> {
  try {
    await supabase.from('tab_tentativa_login').insert({
      des_ip_address: ip,
      des_username: username.toLowerCase().trim(),
      ind_sucesso: success,
      des_motivo_falha: failureReason?.substring(0, 255),
      des_user_agent: userAgent?.substring(0, 500),
    });
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}

// Clear failed attempts for a username after successful login
async function clearFailedAttempts(
  supabase: any,
  username: string
): Promise<void> {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    await supabase
      .from('tab_tentativa_login')
      .delete()
      .eq('des_username', normalizedUsername)
      .eq('ind_sucesso', false);
    
    console.log(`Cleared failed attempts for username: ${normalizedUsername}`);
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
  }
}

// Calculate progressive delay based on consecutive failures
function calculateProgressiveDelay(consecutiveFailures: number): number {
  if (consecutiveFailures < 3) return 0;
  
  const delay = Math.pow(RATE_LIMIT_CONFIG.progressiveDelayBase, consecutiveFailures - 2);
  return Math.min(delay, RATE_LIMIT_CONFIG.maxProgressiveDelay);
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || undefined;
  
  console.log(`[${requestId}] LDAP auth request from IP: ${clientIP}`);

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username e password são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client early for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check rate limits BEFORE attempting LDAP validation
    const rateLimitResult = await checkRateLimit(supabase, clientIP, username);
    
    if (!rateLimitResult.allowed) {
      console.log(`[${requestId}] Rate limit blocked: ${rateLimitResult.reason}`);
      
      // Log the blocked attempt
      await logLoginAttempt(
        supabase,
        clientIP,
        username,
        false,
        `BLOCKED_${rateLimitResult.reason}`,
        userAgent
      );
      
      const retryAfter = rateLimitResult.retryAfterSeconds || 900;
      const message = rateLimitResult.reason === 'IP_RATE_LIMIT'
        ? 'Muitas tentativas de login deste endereço IP. Por favor, aguarde antes de tentar novamente.'
        : 'Muitas tentativas de login para este usuário. Por favor, aguarde antes de tentar novamente.';
      
      return new Response(
        JSON.stringify({ 
          error: message,
          code: rateLimitResult.reason,
          retryAfter,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          } 
        }
      );
    }

    // Apply progressive delay if there are consecutive failures
    if (rateLimitResult.consecutiveFailures && rateLimitResult.consecutiveFailures >= 3) {
      const delay = calculateProgressiveDelay(rateLimitResult.consecutiveFailures);
      console.log(`[${requestId}] Progressive delay: ${delay}s (${rateLimitResult.consecutiveFailures} consecutive failures)`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    const apiToken = Deno.env.get('MC_HUB_API');
    if (!apiToken) {
      console.error(`[${requestId}] MC_HUB_API token not configured`);
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Validate credentials with LDAP API
    console.log(`[${requestId}] Attempting LDAP validation for user: ${username}`);
    
    let ldapResponse: Response;
    try {
      ldapResponse = await fetch(`${LDAP_API_BASE}/validate`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-API-Token': apiToken,
        },
        body: JSON.stringify({ username, password }),
      });
    } catch (fetchError) {
      console.error(`[${requestId}] Failed to connect to LDAP server:`, fetchError);
      
      // Don't log this as a failed attempt (infrastructure issue, not user error)
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível conectar ao servidor de autenticação. Por favor, tente novamente em alguns minutos.',
          code: 'LDAP_CONNECTION_ERROR'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ldapText = await ldapResponse.text();
    console.log(`[${requestId}] LDAP response status:`, ldapResponse.status);
    
    // Check for gateway/proxy errors (502, 503, 504)
    if (ldapResponse.status >= 502 && ldapResponse.status <= 504) {
      console.error(`[${requestId}] LDAP server gateway error: ${ldapResponse.status}`);
      return new Response(
        JSON.stringify({ 
          error: 'O servidor de autenticação está temporariamente indisponível. Por favor, tente novamente em alguns minutos.',
          code: 'LDAP_SERVER_UNAVAILABLE',
          status: ldapResponse.status
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let ldapData: LdapValidateResponse;
    try {
      ldapData = JSON.parse(ldapText);
    } catch {
      console.error(`[${requestId}] Failed to parse LDAP response as JSON. Raw response:`, ldapText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          error: 'Resposta inesperada do servidor de autenticação. Por favor, contate o suporte técnico.',
          code: 'LDAP_INVALID_RESPONSE'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check various possible success indicators from the API
    const isSuccess = ldapResponse.ok && (ldapData.ok === true || ldapData.success === true);
    
    if (!isSuccess) {
      console.log(`[${requestId}] LDAP validation failed for user: ${username}`);
      
      // Log failed attempt
      await logLoginAttempt(
        supabase,
        clientIP,
        username,
        false,
        'INVALID_CREDENTIALS',
        userAgent
      );
      
      return new Response(
        JSON.stringify({ error: ldapData.message || ldapData.detail || 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Login successful - log success and clear failed attempts
    await logLoginAttempt(supabase, clientIP, username, true, undefined, userAgent);
    await clearFailedAttempts(supabase, username);

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
        console.log(`[${requestId}] LDAP profile data retrieved`);
        profileInfo = { ...profileInfo, ...profileData };
      }
    } catch (profileError) {
      console.log(`[${requestId}] Error fetching profile (optional):`, profileError);
    }

    // Step 3: Create/update user in Supabase
    const ldapUsername = profileInfo.username || username;
    const userEmail = profileInfo.email || `${ldapUsername.toLowerCase()}@redemontecarlo.com.br`;
    const displayName = profileInfo.full_name || ldapUsername;
    const department = profileInfo.department || null;
    const jobTitle = profileInfo.title || null;
    const office = profileInfo.office || null;
    const phone = profileInfo.phone || null;
    const adGroups = profileInfo.groups || [];
    
    console.log(`[${requestId}] Syncing user profile for: ${ldapUsername}`);
    
    // Check if user exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === userEmail);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      
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
        console.error(`[${requestId}] Error creating user:`, createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário no sistema' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user!.id;
      isNewUser = true;
      console.log(`[${requestId}] New user created: ${userId}`);
    }

    // Step 4: Update/create profile with LDAP data
    const { data: existingProfile } = await supabase
      .from('tab_perfil_usuario')
      .select('des_email, des_telefone')
      .eq('cod_usuario', userId)
      .single();
    
    const profileData: Record<string, unknown> = {
      cod_usuario: userId,
      des_nome_completo: displayName,
      dta_sincronizacao_ad: new Date().toISOString(),
      ind_ativo: true,
    };
    
    if (!existingProfile?.des_email) {
      profileData.des_email = userEmail;
    }
    
    if (department) profileData.des_departamento = department;
    if (jobTitle) profileData.des_cargo = jobTitle;
    if (office) profileData.des_unidade = office;
    if (phone && !existingProfile?.des_telefone) profileData.des_telefone = phone;
    if (profileInfo.objectId) profileData.des_ad_object_id = profileInfo.objectId;

    const { error: profileError } = await supabase
      .from('tab_perfil_usuario')
      .upsert(profileData, { onConflict: 'cod_usuario' });

    if (profileError) {
      console.error(`[${requestId}] Error upserting profile:`, profileError);
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
        console.error(`[${requestId}] Error assigning default role:`, roleError);
      }
    }

    // Step 6: Generate session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (sessionError) {
      console.error(`[${requestId}] Error generating session link:`, sessionError);
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

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] LDAP login successful for: ${ldapUsername} (${duration}ms)`);

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
          roles: roles?.map((r: any) => r.des_role) || ['user'],
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
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] LDAP auth error (${duration}ms):`, error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
