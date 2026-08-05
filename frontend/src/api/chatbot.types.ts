export type ChatMode = 'general' | 'ruby' | 'python' | 'sql' | 'code-review'

export interface ChatRequest {
  message: string
  mode?: ChatMode | string
  conversation_id?: string | null
  max_tokens?: number
}

export interface ChatResponse {
  response: string
  conversation_id: string
  mode: string
  model_used: string
  tokens: number
  cost_usd: string
  calls_remaining_today: number
}

export interface ChatConversationSummary {
  id: string
  mode?: string
  title?: string
  preview?: string
  created_at?: string
  updated_at?: string
  message_count?: number
}

export interface ChatConversationMessage {
  role: 'user' | 'assistant' | 'system' | string
  content: string
  created_at?: string
}

export interface ChatConversationDetail {
  id: string
  mode?: string
  messages: ChatConversationMessage[]
  created_at?: string
  updated_at?: string
}

export interface ChatModesResponse {
  modes: string | Record<string, string> | Array<{ id: string; label: string }>
}

export interface ChatUserInfo {
  id: string
  username: string
  email: string
  tier: string
  created_at: string
}

export interface UiChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
  error?: boolean
  meta?: {
    model_used?: string
    tokens?: number
    cost_usd?: string
    calls_remaining_today?: number
  }
}
