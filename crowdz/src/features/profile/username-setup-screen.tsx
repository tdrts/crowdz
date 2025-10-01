import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../providers/app-providers'

const usernameSchema = z
  .object({ username: z.string().min(3, 'Must be at least 3 characters').max(24, 'Too long') })
  .refine((values) => /^[a-z0-9_]+$/.test(values.username), {
    message: 'Use lowercase letters, numbers, or underscores only',
    path: ['username'],
  })

type UsernameValues = z.infer<typeof usernameSchema>

export function UsernameSetupScreen() {
  const { session } = useSession()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: session?.user?.email?.split('@')[0]?.replace(/[^a-z0-9_]/g, '') ?? '' },
  })

  const mutation = useMutation({
    mutationFn: async ({ username }: UsernameValues) => {
      if (!userId) throw new Error('Missing session')
      const normalizedUsername = username.trim().toLowerCase()

      const { error } = await supabase.from('profiles').upsert(
        { id: userId, username: normalizedUsername },
        { onConflict: 'id' },
      )

      if (error) throw error
    },
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })

  const onSubmit = async (values: UsernameValues) => {
    setServerError(null)
    try {
      await mutation.mutateAsync(values)
    } catch (error) {
      const pgError = error as PostgrestError
      if (pgError?.code === '23505') {
        setServerError('That username is taken. Try another.')
        return
      }
      setServerError(pgError?.message ?? 'Something went wrong. Please try again.')
    }
  }

  const email = useMemo(() => session?.user.email ?? 'your email', [session?.user.email])

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Choose a username</h1>
          <p className="text-sm text-muted-foreground">
            You signed in as {email}. Pick how friends will see you in Crowd Meet.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              spellCheck={false}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
              placeholder="crowdhero"
              {...register('username')}
            />
            {errors.username ? (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save username'}
          </button>
        </form>

        {serverError ? <p className="text-center text-sm text-destructive">{serverError}</p> : null}

        <p className="text-center text-xs text-muted-foreground">
          Usernames are lowercase, unique, and can include numbers or underscores.
        </p>
      </div>
    </div>
  )
}
