import { Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

/** Shown when the user is not signed in — chatbot uses JWT via api-gateway. */
export function ChatSignInGate() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
          <Bot className="w-6 h-6 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">AI Assistant</h2>
          <p className="text-sm text-slate-400">
            Sign in to chat. History and daily usage limits are tied to your ledger
            account.
          </p>
        </div>
        <Button className="w-full" onClick={() => navigate('/login')}>
          Sign in to continue
        </Button>
      </div>
    </div>
  )
}
