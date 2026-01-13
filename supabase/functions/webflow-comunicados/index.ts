import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Allowed origins for CORS - includes pattern matching for Lovable preview domains
const ALLOWED_ORIGINS = [
  'https://haycuruhkzmhszwcmcpn.lovableproject.com',
  'https://intranet.redemontecarlo.com.br',
  'http://localhost:8080',
  'http://localhost:5173',
];

// Pattern for Lovable preview domains (UUID.lovableproject.com)
const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-f0-9-]+\.lovableproject\.com$/;

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
  };
}

interface WebflowItem {
  id: string;
  fieldData: {
    name?: string;
    title?: string;
    slug?: string;
    summary?: string;
    'post-body'?: string;
    content?: string;
    pinned?: boolean;
    'published-on'?: string;
    'post-date'?: string;
    active?: boolean;
  };
  createdOn?: string;
  publishedOn?: string;
}

interface Announcement {
  id: string;
  title: string;
  summary: string;
  content: string;
  pinned: boolean;
  publishedAt: string;
  active: boolean;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Rejected: No authorization header provided');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          announcements: [],
          source: 'error'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.log('Rejected: Invalid authentication token');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication token',
          announcements: [],
          source: 'error'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Authenticated user: ${userData.user.id}`);
    // ========== END AUTHENTICATION ==========

    const webflowToken = Deno.env.get('WEBFLOW_API_TOKEN');
    const collectionId = Deno.env.get('WEBFLOW_COLLECTION_ID');

    if (!webflowToken || !collectionId) {
      console.log('Webflow credentials not configured, returning empty array');
      return new Response(
        JSON.stringify({ 
          announcements: [], 
          source: 'none',
          message: 'Webflow não configurado. Configure WEBFLOW_API_TOKEN e WEBFLOW_COLLECTION_ID.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching from Webflow collection: ${collectionId}`);

    // Fetch from Webflow CMS API v2
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}/items`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${webflowToken}`,
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webflow API error: ${response.status} - ${errorText}`);
      throw new Error(`Webflow API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received ${data.items?.length || 0} items from Webflow`);

    // Transform Webflow items to our Announcement format
    const announcements: Announcement[] = (data.items || []).map((item: WebflowItem) => ({
      id: item.id,
      title: item.fieldData?.title || item.fieldData?.name || 'Sem título',
      summary: item.fieldData?.summary || '',
      content: item.fieldData?.['post-body'] || item.fieldData?.content || '',
      pinned: item.fieldData?.pinned || false,
      publishedAt: item.fieldData?.['post-date'] || item.publishedOn || item.createdOn || new Date().toISOString(),
      active: item.fieldData?.active !== false, // Default to true if not specified
    })).filter((a: Announcement) => a.active);

    // Sort: pinned first, then by date
    announcements.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return new Response(
      JSON.stringify({ announcements, source: 'webflow' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching announcements:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        announcements: [],
        source: 'error'
      }),
      { 
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
  }
});
