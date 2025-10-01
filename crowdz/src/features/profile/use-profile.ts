import { useQuery } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export interface Profile {
  id: string
  username: string
  created_at?: string
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    const pgError = error as PostgrestError
    if (pgError.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data as Profile | null
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  })
}
