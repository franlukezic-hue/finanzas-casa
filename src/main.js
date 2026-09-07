import { createClient } from '@supabase/supabase-js'
import './style.css'
import './app.js'

const SUPABASE_URL = 'https://eteqtnpqbqjvgpkqxsqh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
