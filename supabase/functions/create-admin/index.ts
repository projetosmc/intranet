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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, fullName } = await req.json();

    console.log(`Creating admin user: ${email}`);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`User already exists with ID: ${userId}`);
      
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
      });
      
      if (updateError) {
        console.error("Error updating password:", updateError);
      } else {
        console.log("Password updated successfully");
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      userId = newUser.user.id;
      console.log(`Created new user with ID: ${userId}`);

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: fullName,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    // Add admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "admin" },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      console.error("Error adding admin role:", roleError);
      throw roleError;
    }

    console.log(`Admin role added for user: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created successfully",
        userId,
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
