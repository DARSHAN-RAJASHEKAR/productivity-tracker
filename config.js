// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_CONFIG = {
    url: 'https://uqspfkiyzhxkglrjkxlt.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxc3Bma2l5emh4a2dscmpreGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxODMsImV4cCI6MjA3MzI2NTE4M30.0I3wOaXNQssPOjosFy5ZmUuRDnNYwJ3NA_YAJ-NR4BM'
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