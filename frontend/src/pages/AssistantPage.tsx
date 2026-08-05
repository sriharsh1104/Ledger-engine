import { useEffect, useRef, useState } from 'react'
import { Bot, PanelLeftClose, PanelLeft, Settings2 } from 'lucide-react'
import { useChatbot } from '../hooks/useChatbot'
import {
  clearChatbotApiKey,
  getChatbotApiKey,
  setChatbotApiKey,
} from '../api/chatbotClient'
import { ApiKeySetup } from '../components/chat/ApiKeySetup'
import { ChatInput } from '../components/chat/ChatInput'
import { ChatMessage } from '../components/chat/ChatMessage'
import { ConversationSidebar } from '../components/chat/ConversationSidebar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function AssistantPage() {
  const chat = useChatbot()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [keyDraft, setKeyDraft] = useState('')

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [chat.messages, chat.sending])

  if (!chat.hasApiKey) {
    return (
      <div className="-m-4 lg:-m-8 flex-1 min-h-0 flex bg-surface">
        <ApiKeySetup onSaved={chat.refreshKeyState} />
      </div>
    )
  }

  return (
    <div className="-m-4 lg:-m-8 flex-1 min-h-0 flex bg-surface overflow-hidden">
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } hidden md:block shrink-0 transition-all duration-200 overflow-hidden`}
      >
        <ConversationSidebar
          conversations={chat.conversations}
          activeId={chat.conversationId}
          loading={chat.loadingConversations}
          onSelect={(id) => void chat.loadConversation(id)}
          onNew={chat.resetChat}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 h-14 border-b border-border-subtle px-4 flex items-center justify-between gap-3 bg-surface-raised/50">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="hidden md:inline-flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-overlay cursor-pointer"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle conversations"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">AI Assistant</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {chat.meta.model_used
                    ? `Model: ${chat.meta.model_used}`
                    : 'Powered by AI CLI Chatbot'}
                  {chat.meta.calls_remaining_today != null
                    ? ` · ${chat.meta.calls_remaining_today} calls left today`
                    : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={chat.mode}
              onChange={(e) => chat.setMode(e.target.value)}
              disabled={chat.sending}
              className="rounded-xl bg-surface-overlay border border-border text-sm text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              {chat.modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setKeyDraft(getChatbotApiKey())
                setShowSettings((v) => !v)
              }}
              aria-label="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {showSettings && (
          <div className="border-b border-border-subtle bg-surface-raised px-4 py-3 space-y-3 animate-fade-in">
            <p className="text-xs text-slate-400">
              API key is sent as <code className="text-slate-300">X-API-Key</code> to the chatbot
              service. Stored in this browser only.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder="API key"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setChatbotApiKey(keyDraft)
                    chat.refreshKeyState()
                    void chat.refreshConversations()
                    setShowSettings(false)
                  }}
                >
                  Update key
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    clearChatbotApiKey()
                    chat.refreshKeyState()
                    chat.resetChat()
                    setShowSettings(false)
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {chat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 max-w-lg mx-auto animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Bot className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">How can I help?</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Ask about SQL, Python, Ruby, or code review — or keep it general.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Explain double-entry ledger balances',
                  'Write a SQL query for monthly transfers',
                  'Review this transfer validation logic',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void chat.sendMessage(prompt)}
                    className="text-xs px-3 py-2 rounded-xl border border-border-subtle bg-surface-raised text-slate-300 hover:border-accent/30 hover:text-white transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {chat.messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border-subtle px-4 lg:px-8 py-4 bg-surface-raised/40">
          <div className="max-w-3xl mx-auto space-y-2">
            {chat.error && (
              <p className="text-xs text-danger px-1">{chat.error}</p>
            )}
            <ChatInput
              sending={chat.sending}
              onSend={(msg) => void chat.sendMessage(msg)}
              onStop={chat.stop}
            />
            <p className="text-[10px] text-slate-500 text-center">
              Responses come from the AI CLI Chatbot API · mode: {chat.mode}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
