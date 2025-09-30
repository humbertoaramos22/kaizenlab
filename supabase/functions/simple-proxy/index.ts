const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  console.log('=== SIMPLE PROXY START ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse URL and get parameters
    const url = new URL(req.url);
    const domainId = url.searchParams.get('domain');
    const token = url.searchParams.get('token');
    
    console.log('Domain ID:', domainId);
    console.log('Token present:', !!token);

    // Simple test response first
    const testResponse = {
      success: true,
      message: 'Simple proxy is working!',
      receivedParams: {
        domain: domainId,
        hasToken: !!token,
        tokenLength: token?.length || 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('Returning test response:', testResponse);

    return new Response(
      JSON.stringify(testResponse, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('=== SIMPLE PROXY ERROR ===');
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Simple proxy error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});