"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Eye, Copy, LogOut, Settings, TrendingUp } from "lucide-react"
import { mockApi } from "@/lib/mock-api"

interface Invoice {
  id: string
  amount: number
  currency: string
  status: "pending" | "confirmed" | "completed"
  description: string
  createdAt: string
  depositAddress: string
}

export default function FreelancerDashboard() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalInvoices: 0,
    completedPayouts: 0,
  })

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (!auth) {
      router.push("/login")
      return
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const [invoicesData, statsData] = await Promise.all([mockApi.getInvoices(), mockApi.getStats()])

      setInvoices(invoicesData)
      setStats(statsData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = () => {
    router.push("/freelancer/create-invoice")
  }

  const copyPublicUrl = (id: string) => {
    const fullUrl = `${window.location.origin}/f/${id}`
    navigator.clipboard.writeText(fullUrl)
    alert("Copied to clipboard!")
  }

  const handleLogout = () => {
    localStorage.removeItem("auth")
    router.push("/")
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  }

  const gradientStyle = {
    background: "linear-gradient(to right, #307936, #71a83c)",
    color: "white",
  } as const

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F4D8" }}>
      {/* Header */}
      <div className="border-b border-border bg-white/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={gradientStyle}>
            CryptoForGigs
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/freelancer/settings")}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Invoices</p>
              <p className="text-3xl font-bold">{stats.totalInvoices}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed Payouts</p>
              <p className="text-3xl font-bold text-green-600">${stats.completedPayouts.toFixed(2)}</p>
            </div>
          </Card>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Invoices</h2>
            <p className="text-muted-foreground">Manage your payment invoices</p>
          </div>
          <Button onClick={handleCreateInvoice} style={gradientStyle} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No invoices yet</p>
            <Button onClick={handleCreateInvoice} style={gradientStyle}>
              Create Your First Invoice
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg">${invoice.amount.toFixed(2)}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[invoice.status] || "bg-gray-100"
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.currency} • {invoice.description} • Created{" "}
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPublicUrl(invoice.id)}
                      className="gap-2"
                      title="Copy payment link"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/f/${invoice.id}`)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
