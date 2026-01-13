import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // First, check if any admin already exists
    const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
      .from("tab_usuario_role")
      .select("seq_usuario")
      .eq("des_role", "admin")
      .limit(1);

    if (adminCheckError) {
      console.error("Error checking for existing admins:", adminCheckError);
      throw new Error("Failed to check existing admins");
    }

    const hasExistingAdmin = existingAdmins && existingAdmins.length > 0;
    console.log(`Existing admin check: ${hasExistingAdmin ? 'Yes, admin exists' : 'No admin exists'}`);

    // If an admin already exists, require authentication from an existing admin
    if (hasExistingAdmin) {
      const authHeader = req.headers.get("Authorization");
      
      if (!authHeader?.startsWith("Bearer ")) {
        console.log("Rejected: No authorization header provided");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authentication required. Only existing admins can create new admins.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          }
        );
      }

      // Verify the calling user using getUser
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: userData, error: userError } = await supabaseUser.auth.getUser();

      if (userError || !userData?.user) {
        console.log("Rejected: Invalid token");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid authentication token.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          }
        );
      }

      const callingUserId = userData.user.id;
      console.log(`Authenticated user: ${callingUserId}`);

      // Check if calling user is an admin
      const { data: callerRole, error: roleError } = await supabaseAdmin
        .from("tab_usuario_role")
        .select("des_role")
        .eq("seq_usuario", callingUserId)
        .eq("des_role", "admin")
        .single();

      if (roleError || !callerRole) {
        console.log(`Rejected: User ${callingUserId} is not an admin`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Access denied. Only administrators can create new admin accounts.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }

      console.log(`Admin verified: ${callingUserId} is creating a new admin`);
    } else {
      console.log("First admin setup - no authentication required");
    }

    // Parse request body
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email and password are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Creating admin user: ${email}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`User already exists with ID: ${userId}`);

      // Check if this user already has admin role
      const { data: existingRole } = await supabaseAdmin
        .from("tab_usuario_role")
        .select("des_role")
        .eq("seq_usuario", userId)
        .eq("des_role", "admin")
        .single();

      if (existingRole) {
        console.log(`User ${email} is already an admin`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "This user is already an administrator.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Update password if provided
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });

      if (updateError) {
        console.error("Error updating password:", updateError);
      } else {
        console.log("Password updated successfully");
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email.split("@")[0],
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      userId = newUser.user.id;
      console.log(`Created new user with ID: ${userId}`);

      // Create profile in correct table
      const { error: profileError } = await supabaseAdmin
        .from("tab_perfil_usuario")
        .upsert({
          cod_usuario: userId,
          des_email: email,
          des_nome_completo: fullName || email.split("@")[0],
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    // Add admin role to correct table
    const { error: roleError } = await supabaseAdmin
      .from("tab_usuario_role")
      .upsert(
        { seq_usuario: userId, des_role: "admin" },
        { onConflict: "seq_usuario,des_role" }
      );

    if (roleError) {
      console.error("Error adding admin role:", roleError);
      throw roleError;
    }

    console.log(`Admin role added for user: ${userId}`);

    // Log audit entry
    try {
      await supabaseAdmin
        .from("tab_log_auditoria")
        .insert({
          seq_usuario: userId,
          des_acao: "CREATE_ADMIN",
          des_entidade: "tab_usuario_role",
          des_descricao: `Admin role granted to ${email}${hasExistingAdmin ? " by existing admin" : " (first admin setup)"}`,
        });
    } catch (auditError) {
      console.error("Error creating audit log:", auditError);
      // Don't fail the request for audit log errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: hasExistingAdmin 
          ? "Admin user created successfully by authorized administrator" 
          : "First admin user created successfully",
        userId,
        isFirstAdmin: !hasExistingAdmin,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
