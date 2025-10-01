import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

function SupabaseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setSession(session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SupabaseSessionProvider')
  }
  return context
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseSessionProvider>{children}</SupabaseSessionProvider>
    </QueryClientProvider>
  )
}
