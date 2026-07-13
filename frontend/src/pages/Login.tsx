import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { AuthLayout, AuthFooter } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'

export function Login() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your Ledger Engine account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div className="rounded-xl bg-accent/5 border border-accent/20 px-4 py-3 text-sm">
            <p className="text-slate-300 font-medium mb-1">Demo account</p>
            <p className="text-slate-400">
              Email: <span className="text-accent font-mono">{DEMO_CREDENTIALS.email}</span>
            </p>
            <p className="text-slate-400">
              Password: <span className="text-accent font-mono">{DEMO_CREDENTIALS.password}</span>
            </p>
          </div> */}

          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            <LogIn className="w-4 h-4" />
            Sign in
          </Button>
        </form>

        <AuthFooter text="Don't have an account?" linkText="Create one" to="/signup" />
      </Card>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Encrypted</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
      </div>
    </AuthLayout>
  )
}
