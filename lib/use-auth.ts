"use client"

import { useEffect, useState, useCallback } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("auth")
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored)
        setUser(user)
        setToken(token)
      } catch (error) {
        console.error("[v0] Failed to load auth from storage", error)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { mockApi } = await import("./mock-api")
      const response = await mockApi.login(email, password)
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem("auth", JSON.stringify(response))
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, name: string, password: string) => {
    setLoading(true)
    try {
      const { mockApi } = await import("./mock-api")
      const response = await mockApi.register(email, name, password)
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem("auth", JSON.stringify(response))
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("auth")
  }, [])

  return { user, token, loading, login, register, logout }
}
