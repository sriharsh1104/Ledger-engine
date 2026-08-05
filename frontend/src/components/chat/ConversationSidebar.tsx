import { MessageSquarePlus, MessagesSquare } from 'lucide-react'
import type { ChatConversationSummary } from '../../api/chatbot.types'
import { Button } from '../ui/Button'

interface ConversationSidebarProps {
  conversations: ChatConversationSummary[]
  activeId: string | null
  loading?: boolean
  onSelect: (id: string) => void
  onNew: () => void
}

function labelFor(c: ChatConversationSummary) {
  return (
    c.title ||
    c.preview ||
    (c.mode ? `${c.mode} chat` : 'Conversation')
  )
}

export function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
}: ConversationSidebarProps) {
  return (
    <div className="flex flex-col h-full border-r border-border-subtle bg-surface-raised/60">
      <div className="p-3 border-b border-border-subtle">
        <Button variant="secondary" size="sm" className="w-full" onClick={onNew}>
          <MessageSquarePlus className="w-4 h-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && conversations.length === 0 && (
          <p className="text-xs text-slate-500 px-2 py-3">Loading conversations…</p>
        )}
        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <MessagesSquare className="w-8 h-8 text-slate-600" />
            <p className="text-xs text-slate-500">No saved conversations yet</p>
          </div>
        )}
        {conversations.map((c) => {
          const active = c.id === activeId
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${
                active
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-overlay border border-transparent'
              }`}
            >
              <p className="text-sm font-medium truncate">{labelFor(c)}</p>
              {c.updated_at || c.created_at ? (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(c.updated_at || c.created_at || '').toLocaleString()}
                </p>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
