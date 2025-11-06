"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, AlertTriangle, TrendingUp, Users, Zap, DollarSign } from "lucide-react"

interface Stats {
  totalInvoices: number
  paidInvoices: number
  failedInvoices: number
  totalVolume: number
  totalFees: number
  activeFreelancers: number
  pendingConversions: number
  failedPayouts: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (!storedToken) {
      router.push("/login")
      return
    }
    setToken(storedToken)
    fetchStats(storedToken)
  }, [router])

  const fetchStats = async (authToken: string) => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FreelaPay Admin</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : stats ? (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                    <p className="text-3xl font-bold">${stats.totalVolume.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Platform Fees</p>
                    <p className="text-3xl font-bold">₹{stats.totalFees.toFixed(0)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Freelancers</p>
                    <p className="text-3xl font-bold">{stats.activeFreelancers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                    <p className="text-3xl font-bold">
                      {stats.totalInvoices > 0 ? ((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(1) : "0"}%
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-600 opacity-20" />
                </div>
              </Card>
            </div>

            {/* Status Overview */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Invoice Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{stats.totalInvoices}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Paid</span>
                    <span className="font-medium text-green-600">{stats.paidInvoices}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Failed</span>
                    <span className="font-medium text-red-600">{stats.failedInvoices}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Processing Queue</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending Conversions</span>
                    <span className="font-medium">{stats.pendingConversions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed Payouts</span>
                    <span className="font-medium text-red-600">{stats.failedPayouts}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => router.push("/admin/transactions")}
                  >
                    View Transactions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => router.push("/admin/jobs")}
                  >
                    View Jobs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => router.push("/admin/webhooks")}
                  >
                    View Webhooks
                  </Button>
                </div>
              </Card>
            </div>

            {/* Alerts */}
            {stats.failedPayouts > 0 && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Failed Payouts</h3>
                    <p className="text-sm text-red-800 mb-3">
                      There are {stats.failedPayouts} failed payouts that need attention.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/admin/transactions?status=failed")}
                    >
                      Review Failed Payouts
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Failed to load dashboard</p>
          </Card>
        )}
      </div>
    </div>
  )
}
