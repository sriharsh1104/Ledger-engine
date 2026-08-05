import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface MessageComposerProps {
  disabled?: boolean
  placeholder?: string
  sending?: boolean
  onSend: (body: string) => Promise<void> | void
}

export function MessageComposer({
  disabled,
  placeholder = 'Message…',
  sending,
  onSend,
}: MessageComposerProps) {
  const [value, setValue] = useState('')

  async function submit() {
    const body = value.trim()
    if (!body || disabled || sending) return
    setValue('')
    await onSend(body)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void submit()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="px-4 py-3 border-t border-border-subtle bg-surface-raised/80"
    >
      <div className="flex items-end gap-2 rounded-2xl bg-surface-overlay border border-border-subtle px-3 py-2 focus-within:border-accent/40 transition-colors">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 outline-none max-h-32 py-1.5"
        />
        <button
          type="submit"
          disabled={disabled || sending || !value.trim()}
          className="p-2 rounded-xl bg-accent text-white disabled:opacity-40 hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5 px-1">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  )
}
