import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if user is authenticated
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper to check subscription tier
export async function getSubscriptionTier(): Promise<'public' | 'paid'> {
  const user = await getUser()
  if (!user) return 'public'
  
  const { data } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()
  
  return data?.subscription_tier === 'paid' ? 'paid' : 'public'
}
