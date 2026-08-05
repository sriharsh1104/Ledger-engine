import { Bot, User } from 'lucide-react'
import type { UiChatMessage } from '../../api/chatbot.types'

interface ChatMessageProps {
  message: UiChatMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isUser ? 'bg-accent/20 text-accent' : 'bg-surface-overlay text-slate-300 border border-border-subtle'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`max-w-[min(100%,42rem)] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-accent text-white rounded-tr-md'
              : message.error
                ? 'bg-danger/10 text-danger border border-danger/30 rounded-tl-md'
                : 'bg-surface-raised border border-border-subtle text-slate-200 rounded-tl-md'
          }`}
        >
          {message.content}
          {message.pending && (
            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-accent/80 animate-pulse rounded-sm" />
          )}
        </div>
        {message.meta?.model_used && !message.pending && (
          <p className="text-[10px] text-slate-500 px-1">
            {message.meta.model_used}
            {message.meta.tokens != null ? ` · ${message.meta.tokens} tokens` : ''}
            {message.meta.cost_usd ? ` · $${message.meta.cost_usd}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}
