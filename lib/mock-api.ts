// Mock API client for frontend demonstration

interface Invoice {
  id: string
  amount: number
  currency: string
  network: string
  description: string
  status: "pending" | "confirmed" | "completed"
  createdAt: string
  depositAddress: string
}

interface User {
  id: string
  email: string
  name: string
}

export const mockApi = {
  // Auth
  async login(email: string, password: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (!email || !password) throw new Error("Invalid credentials")
    return {
      token: "mock_jwt_token_" + Date.now(),
      user: { ...MOCK_USER, email },
    }
  },

  async register(email: string, name: string, password: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (!email || !name || !password) throw new Error("Invalid input")
    return {
      token: "mock_jwt_token_" + Date.now(),
      user: { ...MOCK_USER, email, name },
    }
  },

  // Invoices
  async createInvoice(data: {
    amount: number
    currency: string
    network: string
    description: string
  }) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return {
      id: "inv_" + Math.random().toString(36).substr(2, 9),
      ...data,
      status: "pending",
      depositAddress: "0x" + Math.random().toString(16).substr(2, 40),
      createdAt: new Date().toISOString(),
    }
  },

  async getInvoices() {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return MOCK_INVOICES
  },

  async getInvoice(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return MOCK_INVOICES.find((inv) => inv.id === id)
  },

  // User
  async getProfile() {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return MOCK_USER
  },

  async updateProfile(data: Partial<typeof MOCK_USER>) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { ...MOCK_USER, ...data }
  },

  // Stats
  async getStats() {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return MOCK_STATS
  },
}

import { MOCK_INVOICES, MOCK_USER, MOCK_STATS } from "./mock-data"
