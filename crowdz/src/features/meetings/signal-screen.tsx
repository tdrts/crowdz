import { useMemo, useState } from 'react'
import type { Meeting } from './types'

interface SignalScreenProps {
  open: boolean
  meeting: Meeting
  currentUserId: string
  onEndMeeting: () => Promise<void> | void
  isEnding?: boolean
}

export function SignalScreen({ open, meeting, currentUserId, onEndMeeting, isEnding = false }: SignalScreenProps) {
  const [endError, setEndError] = useState<string | null>(null)

  const otherParticipants = useMemo(
    () => meeting.participants.filter((participant) => participant.userId !== currentUserId),
    [meeting.participants, currentUserId],
  )

  const partnerLabel = otherParticipants.length
    ? otherParticipants.map(({ username }) => username || 'Friend').join(', ')
    : 'Friend'

  const handleEndMeeting = async () => {
    setEndError(null)
    try {
      await onEndMeeting()
    } catch (error) {
      const message = (error as { message?: string }).message ?? 'Failed to end the meeting.'
      setEndError(message)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between" style={{ backgroundColor: meeting.colorHex }}>
      <header className="pt-16 text-center text-white">
        <p className="text-sm uppercase tracking-wide opacity-80">Meeting active</p>
        <h1 className="mt-4 text-4xl font-bold">Meeting with {partnerLabel}</h1>
      </header>

      <footer className="mb-16 flex w-full max-w-sm flex-col items-center gap-4 px-6">
        {endError ? <p className="text-center text-sm text-white/80">{endError}</p> : null}
        <button
          type="button"
          onClick={handleEndMeeting}
          className="w-full rounded-xl bg-white/90 px-4 py-3 text-base font-semibold text-gray-900 backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isEnding}
        >
          {isEnding ? 'Ending…' : 'End meeting'}
        </button>
        <p className="text-xs uppercase tracking-wide text-white/80">
          Keep your screen visible so your friend can spot you
        </p>
      </footer>
    </div>
  )
}
