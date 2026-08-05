import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '../ui/Button'

interface ChatInputProps {
  disabled?: boolean
  sending?: boolean
  onSend: (message: string) => void
  onStop?: () => void
}

export function ChatInput({ disabled, sending, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled || sending) return
    onSend(trimmed)
    setValue('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-2 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20 transition-all"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
        className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none max-h-40 disabled:opacity-50"
      />
      {sending ? (
        <Button type="button" variant="secondary" size="sm" onClick={onStop} className="shrink-0 mb-0.5">
          <Square className="w-3.5 h-3.5 fill-current" />
          Stop
        </Button>
      ) : (
        <Button
          type="submit"
          size="sm"
          disabled={disabled || !value.trim()}
          className="shrink-0 mb-0.5"
        >
          <Send className="w-4 h-4" />
          Send
        </Button>
      )}
    </form>
  )
}
