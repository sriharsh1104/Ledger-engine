import { Shield } from 'lucide-react'

export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    </div>
  )
}
