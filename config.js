// Supabase Configuration
// IMPORTANT: Set your actual credentials in the environment variables below

const SUPABASE_CONFIG = {
    url: window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL',
    key: window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
};

// Supabase API endpoints
const API_BASE = `${SUPABASE_CONFIG.url}/rest/v1`;

// Supabase client headers
const SUPABASE_HEADERS = {
    'apikey': SUPABASE_CONFIG.key,
    'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};