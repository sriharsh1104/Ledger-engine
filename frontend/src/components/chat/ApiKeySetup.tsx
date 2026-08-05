import { KeyRound, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { setChatbotApiKey } from '../../api/chatbotClient'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface ApiKeySetupProps {
  onSaved: () => void
}

export function ApiKeySetup({ onSaved }: ApiKeySetupProps) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  function handleSave() {
    if (!key.trim()) {
      setError('Paste your API key from the chatbot service')
      return
    }
    setChatbotApiKey(key)
    onSaved()
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-white">Connect AI Assistant</h2>
          <p className="text-sm text-slate-400">
            This app talks to the{' '}
            <a
              href="https://ai-cli-chatbot-production.up.railway.app/docs"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              AI CLI Chatbot API
              <ExternalLink className="w-3 h-3" />
            </a>
            . Add your <code className="text-xs bg-surface-overlay px-1.5 py-0.5 rounded">X-API-Key</code>.
          </p>
        </div>

        <div className="space-y-4 glass-card rounded-2xl p-5">
          <Input
            label="API key"
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              setError('')
            }}
            placeholder="Paste key…"
            error={error}
            autoComplete="off"
          />
          <Button className="w-full" onClick={handleSave}>
            Save & continue
          </Button>
          <p className="text-[11px] text-slate-500 text-center">
            Or set <code className="text-slate-400">VITE_CHATBOT_API_KEY</code> in{' '}
            <code className="text-slate-400">frontend/.env</code> and restart Vite.
          </p>
        </div>
      </div>
    </div>
  )
}
