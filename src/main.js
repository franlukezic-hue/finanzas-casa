import { createClient } from '@supabase/supabase-js'
import './style.css'
import './app.js'

const SUPABASE_URL = 'https://eteqtnpqbqjvgpkqxsqh.supabase.co'
const SUPABASE_KEY = 'sb_publishable_sYaHERhSHZDp09RYom8hLA_YLVdM9dV'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)