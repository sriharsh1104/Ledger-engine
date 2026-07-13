import type { PhoneCountry, ProfileUpdate } from '../types'

const PROFILES_KEY = 'ledger_profiles'

export interface StoredProfile {
  userId: string
  profileImage?: string
  phoneCode: string
  phoneNumber: string
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
]

function getProfiles(): StoredProfile[] {
  const raw = localStorage.getItem(PROFILES_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveProfiles(profiles: StoredProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function getProfile(userId: string): StoredProfile {
  const profiles = getProfiles()
  return (
    profiles.find((p) => p.userId === userId) ?? {
      userId,
      phoneCode: '+91',
      phoneNumber: '',
    }
  )
}

export async function updateProfile(userId: string, data: ProfileUpdate): Promise<StoredProfile> {
  await new Promise((r) => setTimeout(r, 400))
  const profiles = getProfiles()
  const idx = profiles.findIndex((p) => p.userId === userId)
  const updated: StoredProfile = {
    userId,
    profileImage: data.profileImage,
    phoneCode: data.phoneCode,
    phoneNumber: data.phoneNumber,
  }
  if (idx >= 0) profiles[idx] = updated
  else profiles.push(updated)
  saveProfiles(profiles)
  return updated
}
