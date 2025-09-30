const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  console.log('Test proxy function called!');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    console.log('Parsed URL:', url.toString());
    console.log('Search params:', Object.fromEntries(url.searchParams.entries()));
    
    const testData = {
      message: 'Test proxy function is working!',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(req.headers.entries())
    };
    
    console.log('Returning test data:', testData);
    
    return new Response(
      JSON.stringify(testData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error) {
    console.error('Test proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Test proxy error', 
        message: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});