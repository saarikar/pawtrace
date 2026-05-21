import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL  || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const DEMO = !url || url.includes('your-project')

export const supabase = DEMO ? null : createClient(url, key)
export const isDemoMode = DEMO
export const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
