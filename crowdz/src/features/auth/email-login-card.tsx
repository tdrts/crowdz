import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type LoginValues = z.infer<typeof loginSchema>

export function EmailLoginCard() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }: LoginValues) => {
    setServerError(null)
    setStatusMessage(null)

    const redirectTo = `${window.location.origin}`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    setStatusMessage('Magic link sent! Check your email to finish signing in.')
    reset({ email })
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Crowd Meet</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your email to get a magic link.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
            {...register('email')}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending magic link…' : 'Send magic link'}
        </button>
      </form>

      {statusMessage ? (
        <p className="mt-4 text-center text-sm text-emerald-600">{statusMessage}</p>
      ) : null}

      {serverError ? (
        <p className="mt-2 text-center text-sm text-destructive">{serverError}</p>
      ) : null}
    </div>
  )
}
