import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// This function is triggered by a cron job to cleanup old login attempts
// It runs daily at 3:00 AM UTC

Deno.serve(async (req) => {
  // Only allow internal cron invocations or service role
  const authHeader = req.headers.get('Authorization');
  
  // Check if it's a cron job invocation (no auth header) or service role
  if (authHeader && !authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
    console.log('Unauthorized access attempt to cleanup function');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  console.log('Starting login attempts cleanup...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete attempts older than 24 hours
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // First count the records to be deleted
    const { count } = await supabase
      .from('tab_tentativa_login')
      .select('*', { count: 'exact', head: true })
      .lt('dta_tentativa', cutoffDate);

    // Then delete them
    const { error } = await supabase
      .from('tab_tentativa_login')
      .delete()
      .lt('dta_tentativa', cutoffDate);

    if (error) {
      console.error('Error deleting old login attempts:', error);
      throw error;
    }

    const duration = Date.now() - startTime;
    console.log(`Cleanup completed in ${duration}ms. Deleted ${count || 0} old login attempts.`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: count || 0,
        durationMs: duration,
        cutoffDate,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Cleanup error after ${duration}ms:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
