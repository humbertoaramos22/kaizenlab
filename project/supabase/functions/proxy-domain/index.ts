const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  console.log('=== PROXY REQUEST START ===');
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
    console.log('Token length:', token?.length);

    if (!domainId) {
      console.log('ERROR: Missing domain ID');
      return new Response(
        JSON.stringify({ error: 'Domain ID required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!token) {
      console.log('ERROR: Missing auth token');
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Import and create Supabase client
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Verifying user with token...');
    
    // Verify user with the auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User verified:', user.email);

    // Get the domain info
    console.log('Fetching domain info...');
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domainId);

    if (domainError) {
      console.log('Domain fetch error:', domainError.message);
      return new Response(
        JSON.stringify({ error: 'Domain fetch failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!domains || domains.length === 0) {
      console.log('Domain not found');
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const domain = domains[0];
    console.log('Domain found:', domain.masked_name);

    // Check if user has access to this domain
    console.log('Checking user access...');
    const { data: userAccess, error: accessError } = await supabase
      .from('user_domains')
      .select('*')
      .eq('user_id', user.id)
      .eq('domain_id', domainId);

    if (accessError) {
      console.log('Access check error:', accessError.message);
      return new Response(
        JSON.stringify({ error: 'Access check failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!userAccess || userAccess.length === 0) {
      console.log('User does not have access to this domain');
      return new Response(
        JSON.stringify({ error: 'Access denied - user not assigned to this domain' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Access granted! Redirecting to:', domain.original_domain);

    // Return redirect HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessing ${domain.masked_name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 0.5rem;
            margin-top: 1rem;
            transition: background 0.3s;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Accessing ${domain.masked_name}</h2>
        <p>Redirecting you securely...</p>
        <a href="${domain.original_domain}" class="btn" target="_blank">Continue to Resource</a>
    </div>
    
    <script>
        // Auto-redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '${domain.original_domain}';
        }, 2000);
    </script>
</body>
</html>`;

    console.log('=== PROXY REQUEST SUCCESS ===');
    
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('=== PROXY REQUEST ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});