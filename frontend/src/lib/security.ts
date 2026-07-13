const SECURITY_KEY = 'ledger_security'

export interface SecuritySettings {
  userId: string
  twoFactorEnabled: boolean
  twoFactorSecret?: string
}

function getAll(): SecuritySettings[] {
  const raw = localStorage.getItem(SECURITY_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveAll(settings: SecuritySettings[]) {
  localStorage.setItem(SECURITY_KEY, JSON.stringify(settings))
}

export function getSecuritySettings(userId: string): SecuritySettings {
  return (
    getAll().find((s) => s.userId === userId) ?? {
      userId,
      twoFactorEnabled: false,
    }
  )
}

export function saveSecuritySettings(settings: SecuritySettings) {
  const all = getAll()
  const idx = all.findIndex((s) => s.userId === settings.userId)
  if (idx >= 0) all[idx] = settings
  else all.push(settings)
  saveAll(all)
}

export async function enableTwoFactor(userId: string, secret: string) {
  await delay(400)
  saveSecuritySettings({ userId, twoFactorEnabled: true, twoFactorSecret: secret })
}

export async function disableTwoFactor(userId: string) {
  await delay(400)
  saveSecuritySettings({ userId, twoFactorEnabled: false, twoFactorSecret: undefined })
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
