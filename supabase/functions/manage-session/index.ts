import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SessionRequest {
  action: 'create' | 'validate' | 'cleanup';
  userId?: string;
  sessionToken?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key for elevated permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body
    const { action, userId, sessionToken }: SessionRequest = await req.json();

    switch (action) {
      case 'create':
        // Deactivate all existing sessions for this user
        await supabaseAdmin
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Create new session
        const newSessionToken = crypto.randomUUID();
        const { data: newSession, error: createError } = await supabaseAdmin
          .from('user_sessions')
          .insert({
            user_id: user.id,
            session_token: newSessionToken,
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            sessionToken: newSessionToken,
            sessionId: newSession.id 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'validate':
        if (!sessionToken) {
          return new Response(
            JSON.stringify({ error: 'Session token required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Check if session is valid and active
        const { data: session, error: validateError } = await supabaseAdmin
          .from('user_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (validateError || !session) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Invalid or inactive session' }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Update last activity
        await supabaseAdmin
          .from('user_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', session.id);

        return new Response(
          JSON.stringify({ valid: true, session }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'cleanup':
        // Run cleanup function
        await supabaseAdmin.rpc('cleanup_old_sessions');

        return new Response(
          JSON.stringify({ success: true, message: 'Cleanup completed' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Session management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});