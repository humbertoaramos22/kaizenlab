// Script to check current environment variables
console.log('=== SUPABASE CONFIGURATION CHECK ===');
console.log('');

// Check if environment variables are set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
console.log('');

if (supabaseUrl && supabaseKey) {
  console.log('✅ Supabase is configured!');
  console.log('');
  console.log('Your .env file should contain:');
  console.log(`VITE_SUPABASE_URL=${supabaseUrl}`);
  console.log(`VITE_SUPABASE_ANON_KEY=${supabaseKey}`);
} else {
  console.log('❌ Supabase is not configured');
  console.log('You need to set up your Supabase credentials');
}

console.log('');
console.log('=== END CHECK ===');