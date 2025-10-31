const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function api(url: string, init?: RequestInit) {
  const res = await fetch(API_BASE + url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    let error: any
    try {
      error = JSON.parse(text)
    } catch {
      error = { message: text }
    }
    throw new Error(error.error || error.message || 'Request failed')
  }
  return res.json()
}

export function apiWithAuth(jwt: string) {
  return (url: string, init?: RequestInit) => {
    return api(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${jwt}`,
        ...init?.headers,
      },
    })
  }
}

