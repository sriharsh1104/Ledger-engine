import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { AuthLayout, AuthFooter } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'

export function Signup() {
  const { signup, isLoading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await signup(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    }
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start managing your finances with ledger-grade precision</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Full name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            <UserPlus className="w-4 h-4" />
            Create account
          </Button>
        </form>

        <AuthFooter text="Already have an account?" linkText="Sign in" to="/login" />
      </Card>
    </AuthLayout>
  )
}
