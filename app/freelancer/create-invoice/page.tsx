"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { mockApi } from "@/lib/mock-api"

const SUPPORTED_TOKENS = [
  { symbol: "USDT", networks: ["ERC20", "TRC20", "BEP20"] },
  { symbol: "USDC", networks: ["ERC20", "POLYGON"] },
  { symbol: "ETH", networks: ["ERC20"] },
  { symbol: "BTC", networks: ["BITCOIN"] },
]

export default function CreateInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    amountUsd: "",
    token: "USDT",
    tokenNetwork: "ERC20",
    memo: "",
  })

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (!auth) {
      router.push("/login")
      return
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "token") {
      const selectedToken = SUPPORTED_TOKENS.find((t) => t.symbol === value)
      if (selectedToken) {
        setFormData((prev) => ({ ...prev, tokenNetwork: selectedToken.networks[0] }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.amountUsd || Number.parseFloat(formData.amountUsd) <= 0) {
        throw new Error("Please enter a valid amount")
      }

      const invoice = await mockApi.createInvoice({
        amount: Number.parseFloat(formData.amountUsd),
        currency: formData.token,
        network: formData.tokenNetwork,
        description: formData.memo || "Payment Invoice",
      })

      router.push(`/f/${invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const selectedTokenData = SUPPORTED_TOKENS.find((t) => t.symbol === formData.token)
  const gradientStyle = {
    background: "linear-gradient(to right, #307936, #71a83c)",
    color: "white",
  } as const

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "#F8F4D8" }}>
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.push("/freelancer/dashboard")} className="mb-8">
          ← Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={gradientStyle}>
              Create Invoice
            </h1>
            <p className="text-muted-foreground">Generate a payment link for your client</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-muted-foreground">$</span>
                <Input
                  type="number"
                  name="amountUsd"
                  value={formData.amountUsd}
                  onChange={handleChange}
                  placeholder="100.00"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum: $1.00</p>
            </div>

            {/* Token Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Token</label>
                <select
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  {SUPPORTED_TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Network</label>
                <select
                  name="tokenNetwork"
                  value={formData.tokenNetwork}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  {selectedTokenData?.networks.map((network) => (
                    <option key={network} value={network}>
                      {network}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className="block text-sm font-medium mb-2">Memo (Optional)</label>
              <textarea
                name="memo"
                value={formData.memo}
                onChange={handleChange}
                placeholder="Add a note for your client (e.g., project description)"
                className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                rows={3}
              />
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Invoice Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${formData.amountUsd || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token:</span>
                  <span className="font-medium">{formData.token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-medium">{formData.tokenNetwork}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="text-muted-foreground">Expires in:</span>
                  <span className="font-medium">60 minutes</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" style={gradientStyle} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating invoice...
                </>
              ) : (
                <>
                  Create Invoice
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
