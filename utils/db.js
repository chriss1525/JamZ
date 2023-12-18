const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

//if (!supabaseUrl || !supabaseKey) {
//  console.error('Error: SUPABASE_URL or SUPABASE_KEY is missing.');
//} else {
//  console.log('SUPABASE_URL:', supabaseUrl);
//  console.log('SUPABASE_KEY:', supabaseKey);
//}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

