import { createClient } from '@supabase/supabase-js'
import './style.css'
import './app.js'

const SUPABASE_URL = 'https://eteqtnpqbqjvgpkqxsqh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZXF0bnBxYnFqdmdwa3F4c3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzMxNjUsImV4cCI6MjA5MTg0OTE2NX0.gYkeVCuzIECsHdG61Xa94S76_E6WiieUIAuLYq2K8AU'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
