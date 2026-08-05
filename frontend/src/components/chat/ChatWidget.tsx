import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot, Maximize2, MessageCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../../hooks/useChatbot'
import { useAuth } from '../../hooks/useAuth'
import { getChatbotApiKey, setChatbotApiKey } from '../../api/chatbotClient'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const chat = useChatbot()
  const { isAuthenticated } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [keyDraft, setKeyDraft] = useState('')

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !open) return
    el.scrollTop = el.scrollHeight
  }, [chat.messages, chat.sending, open])

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      {open && (
        <div className="pointer-events-auto w-[min(100vw-1.5rem,24rem)] h-[min(70vh,32rem)] rounded-2xl border border-border-subtle bg-surface-raised shadow-2xl shadow-black/40 flex flex-col overflow-hidden animate-fade-in">
          <header className="shrink-0 h-12 px-3 flex items-center justify-between gap-2 border-b border-border-subtle bg-accent/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">AI Assistant</p>
                <p className="text-[10px] text-slate-400 truncate">Ask anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isAuthenticated && (
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-overlay cursor-pointer"
                  title="Open full page"
                  onClick={() => {
                    setOpen(false)
                    navigate('/assistant')
                  }}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-overlay cursor-pointer"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {!chat.hasApiKey ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-sm text-slate-400">
                Paste your chatbot API key to start chatting.
              </p>
              <Input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="X-API-Key…"
                autoComplete="off"
              />
              <Button
                className="w-full"
                size="sm"
                onClick={() => {
                  setChatbotApiKey(keyDraft || getChatbotApiKey())
                  chat.refreshKeyState()
                }}
              >
                Save key & chat
              </Button>
            </div>
          ) : (
            <>
              <div className="shrink-0 px-3 py-2 border-b border-border-subtle">
                <select
                  value={chat.mode}
                  onChange={(e) => chat.setMode(e.target.value)}
                  disabled={chat.sending}
                  className="w-full rounded-lg bg-surface-overlay border border-border text-xs text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {chat.modes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                {chat.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-4">
                    <Bot className="w-8 h-8 text-accent/70" />
                    <p className="text-sm text-slate-300">Hi! How can I help?</p>
                    <p className="text-xs text-slate-500">Ledger, SQL, code review, and more.</p>
                  </div>
                ) : (
                  chat.messages.map((m) => <ChatMessage key={m.id} message={m} />)
                )}
              </div>

              <div className="shrink-0 p-3 border-t border-border-subtle">
                {chat.error && <p className="text-[11px] text-danger mb-2">{chat.error}</p>}
                <ChatInput
                  sending={chat.sending}
                  onSend={(msg) => void chat.sendMessage(msg)}
                  onStop={chat.stop}
                />
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto group relative w-14 h-14 rounded-full bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        aria-label={open ? 'Close chatbot' : 'Open chatbot'}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-accent animate-pulse" />
        )}
      </button>
    </div>,
    document.body,
  )
}
