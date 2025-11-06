"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, ChevronDown } from "lucide-react"

interface WebhookEvent {
  id: string
  provider: string
  event_type: string
  payload: any
  processed: boolean
  error_message?: string
  created_at: string
}

export default function AdminWebhooks() {
  const router = useRouter()
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (!storedToken) {
      router.push("/login")
      return
    }
    setToken(storedToken)
    fetchWebhooks(storedToken)

    // Refresh every 10 seconds
    const interval = setInterval(() => fetchWebhooks(storedToken), 10000)
    return () => clearInterval(interval)
  }, [router])

  const fetchWebhooks = async (authToken: string) => {
    try {
      const res = await fetch("/api/admin/webhooks", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data)
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const providerColors: Record<string, string> = {
    alchemy: "bg-purple-100 text-purple-800",
    coindcx: "bg-orange-100 text-orange-800",
    cashfree: "bg-green-100 text-green-800",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Webhook Events</h1>
            <p className="text-sm text-muted-foreground">Recent webhook deliveries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/dashboard")}>
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading webhooks...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No webhook events</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === webhook.id ? null : webhook.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${providerColors[webhook.provider] || ""}`}
                    >
                      {webhook.provider.toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold">{webhook.event_type}</p>
                      <p className="text-sm text-muted-foreground">{new Date(webhook.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${expandedId === webhook.id ? "rotate-180" : ""}`}
                  />
                </button>

                {expandedId === webhook.id && (
                  <div className="border-t border-border p-6 bg-muted/30">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">Status</p>
                        <p className="text-sm">
                          {webhook.processed ? (
                            <span className="text-green-600">✓ Processed</span>
                          ) : (
                            <span className="text-yellow-600">⏳ Pending</span>
                          )}
                        </p>
                      </div>

                      {webhook.error_message && (
                        <div>
                          <p className="text-sm font-semibold mb-2 text-red-600">Error</p>
                          <p className="text-sm text-red-600">{webhook.error_message}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-semibold mb-2">Payload</p>
                        <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(webhook.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
