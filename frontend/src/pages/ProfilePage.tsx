import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { Camera, CheckCircle, User, Mail, Phone, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PHONE_COUNTRIES } from '../lib/profile'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profileImage, setProfileImage] = useState(user?.profileImage ?? '')
  const [phoneCode, setPhoneCode] = useState(user?.phoneCode ?? '+91')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setProfileImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (phoneNumber && !/^\d{6,15}$/.test(phoneNumber)) {
      setError('Enter a valid phone number (6-15 digits)')
      return
    }

    try {
      await updateProfile({ profileImage, phoneCode, phoneNumber })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to update profile')
    }
  }

  const selectClass =
    'rounded-xl bg-surface-overlay border border-border px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent appearance-none cursor-pointer'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">View and update your account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Name and email cannot be changed</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-accent/10 border border-accent/30 px-4 py-3 text-sm text-accent flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Profile updated successfully
            </div>
          )}

          {/* Profile Image */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-accent/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-2xl border-2 border-accent/30">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-accent-hover transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Profile Photo</p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
              {profileImage && (
                <button
                  type="button"
                  onClick={() => setProfileImage('')}
                  className="text-xs text-danger hover:underline mt-1 cursor-pointer"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Read-only fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                <User className="w-3.5 h-3.5" /> Full Name
                <Lock className="w-3 h-3 text-slate-500 ml-1" />
              </label>
              <div className="w-full rounded-xl bg-surface-overlay/50 border border-border px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed">
                {user?.name}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                <Mail className="w-3.5 h-3.5" /> Email
                <Lock className="w-3 h-3 text-slate-500 ml-1" />
              </label>
              <div className="w-full rounded-xl bg-surface-overlay/50 border border-border px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Editable phone */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <Phone className="w-3.5 h-3.5" /> Mobile Number
            </label>
            <div className="flex gap-2">
              <select
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                className={`${selectClass} w-36 shrink-0`}
              >
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>
                    {c.flag} {c.dial}
                  </option>
                ))}
              </select>
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-slate-500">
              Full number: {phoneCode} {phoneNumber || '—'}
            </p>
          </div>

          <Button type="submit" loading={isLoading} className="w-full sm:w-auto">
            Update Profile
          </Button>
        </form>
      </Card>
    </div>
  )
}
