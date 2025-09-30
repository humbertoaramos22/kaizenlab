const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  console.log('=== PUBLIC TEST FUNCTION ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const domainId = url.searchParams.get('domain');
    const token = url.searchParams.get('token');
    
    console.log('Domain ID:', domainId);
    console.log('Token present:', !!token);
    console.log('Token length:', token?.length);
    
    // Return simple HTML page without any database operations
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Public Test Function</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
            color: #28a745;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info {
            background: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .redirect-btn {
            background: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        .redirect-btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">✅ Edge Function Working!</div>
        
        <div class="info">
            <strong>Domain ID:</strong> ${domainId || 'Not provided'}
        </div>
        
        <div class="info">
            <strong>Token Present:</strong> ${token ? 'Yes' : 'No'}
        </div>
        
        <div class="info">
            <strong>Token Length:</strong> ${token?.length || 0} characters
        </div>
        
        <div class="info">
            <strong>Function URL:</strong> ${req.url}
        </div>
        
        <div class="info">
            <strong>Timestamp:</strong> ${new Date().toISOString()}
        </div>
        
        <button class="redirect-btn" onclick="window.location.href='https://www.google.com'">
            Test Redirect to Google
        </button>
        
        <p style="margin-top: 30px; color: #666;">
            This is a test function to verify Edge Functions are working properly.
            If you can see this page, the Edge Function system is operational.
        </p>
    </div>
</body>
</html>`;

    console.log('=== PUBLIC TEST SUCCESS ===');
    
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('=== PUBLIC TEST ERROR ===');
    console.error('Error:', error.message);
    
    return new Response(
      `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`,
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }
});