const USERS_KEY = 'ledger_users'
const SESSION_KEY = 'ledger_session'

export const DEMO_CREDENTIALS = {
  email: 'demo@ledger.com',
  password: 'demo123',
} as const

interface StoredUser {
  id: string
  name: string
  email: string
  password: string
}

const DEMO_USER: StoredUser = {
  id: 'demo-user-001',
  name: 'Demo User',
  email: DEMO_CREDENTIALS.email,
  password: DEMO_CREDENTIALS.password,
}

function getUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY)
  const users: StoredUser[] = raw ? JSON.parse(raw) : []
  if (!users.some((u) => u.email.toLowerCase() === DEMO_USER.email)) {
    users.push(DEMO_USER)
    saveUsers(users)
  }
  return users
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function generateId() {
  return crypto.randomUUID()
}

function generateToken() {
  return `led_${crypto.randomUUID().replace(/-/g, '')}`
}

export async function signup(name: string, email: string, password: string) {
  await delay(600)
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists')
  }
  const user: StoredUser = { id: generateId(), name, email, password }
  users.push(user)
  saveUsers(users)
  const token = generateToken()
  const session = { token, user: { id: user.id, name: user.name, email: user.email } }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function login(email: string, password: string) {
  await delay(500)
  const users = getUsers()
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  )
  if (!user) {
    throw new Error('Invalid email or password')
  }
  const token = generateToken()
  const session = { token, user: { id: user.id, name: user.name, email: user.email } }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function forgotPassword(email: string) {
  await delay(700)
  const users = getUsers()
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!exists) {
    throw new Error('No account found with this email address')
  }
  return { message: 'Password reset link sent to your email' }
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as { token: string; user: { id: string; name: string; email: string } }
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
