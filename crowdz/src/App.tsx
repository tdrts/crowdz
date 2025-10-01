import { EmailLoginCard } from './features/auth/email-login-card'
import { HomeScreen } from './features/home/home-screen'
import { UsernameSetupScreen } from './features/profile/username-setup-screen'
import { useProfile } from './features/profile/use-profile'
import { useSession } from './providers/app-providers'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Loading…</div>
    </div>
  )
}

function LoginScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-1/3 top-1/3 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <EmailLoginCard />
        <p className="mt-10 max-w-sm text-center text-xs text-white/70">
          Crowd Meet helps you and your friends find each other fast in busy spaces. Sign in to get started.
        </p>
      </div>
    </div>
  )
}

function App() {
  const { session, isLoading } = useSession()
  const userId = session?.user.id
  const { data: profile, isLoading: isProfileLoading } = useProfile(userId)

  if (isLoading || (session && isProfileLoading)) return <LoadingScreen />
  if (!session) return <LoginScreen />

  if (!profile) {
    return <UsernameSetupScreen />
  }

  return <HomeScreen username={profile.username} />
}

export default App
