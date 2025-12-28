import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
