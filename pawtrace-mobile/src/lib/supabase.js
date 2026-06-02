import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const url = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const key = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
const DEMO = !url || url.includes('your-project') || url.includes('placeholder')

export const supabase = DEMO ? null : createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
export const isDemoMode = DEMO
