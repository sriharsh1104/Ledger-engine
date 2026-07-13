import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { TwoFactorSetup } from '../components/security/TwoFactorSetup'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'

export function TwoFactorPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Secure your account with an authenticator app</CardDescription>
            </div>
          </div>
        </CardHeader>

        <TwoFactorSetup userId={user.id} email={user.email} />
      </Card>
    </div>
  )
}
