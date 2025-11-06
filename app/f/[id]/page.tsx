"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { mockApi } from "@/lib/mock-api"

interface InvoiceData {
  id: string
  amount: number
  currency: string
  network: string
  status: "pending" | "confirmed" | "completed"
  depositAddress: string
  description: string
  createdAt: string
}

export default function PublicInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await mockApi.getInvoice(params.id)
        if (!data) throw new Error("Invoice not found")
        setInvoice(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
    const interval = setInterval(fetchInvoice, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  const copyToClipboard = () => {
    if (invoice?.depositAddress) {
      navigator.clipboard.writeText(invoice.depositAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error || "Invoice not found"}</p>
        </Card>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Payment Invoice</h1>
            <p className="text-muted-foreground">Invoice ID: {invoice.id.slice(0, 8)}...</p>
          </div>

          {/* Status */}
          <div className="mb-8 text-center">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                statusColors[invoice.status] || "bg-gray-100"
              }`}
            >
              {invoice.status.toUpperCase()}
            </span>
          </div>

          {/* Amount Section */}
          <div className="bg-muted p-6 rounded-lg mb-8">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount (USD)</p>
                <p className="text-2xl font-bold">${invoice.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Token</p>
                <p className="text-2xl font-bold">{invoice.currency}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Network: <span className="font-semibold">{invoice.network}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-4 rounded-lg border border-border">
              <QRCodeSVG value={invoice.depositAddress} size={256} level="H" includeMargin={true} />
            </div>
          </div>

          {/* Deposit Address */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Deposit Address</p>
            <div className="flex items-center gap-2 bg-muted p-4 rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">{invoice.depositAddress}</code>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="flex-shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">How to Pay</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open your crypto wallet (MetaMask, TrustWallet, etc.)</li>
              <li>
                Send exactly <strong>${invoice.amount.toFixed(2)}</strong> in {invoice.currency} to the address above
              </li>
              <li>
                Make sure you're on the <strong>{invoice.network}</strong> network
              </li>
              <li>Wait for confirmation - we'll notify you when payment is received</li>
            </ol>
          </div>

          {/* Paid Status */}
          {invoice.status === "completed" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-green-900 mb-2">Payment Received</h3>
              <p className="text-sm text-green-800">Thank you! Your payment has been confirmed and processed.</p>
            </div>
          )}

          {/* Expiration */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Invoice created: {new Date(invoice.createdAt).toLocaleString()}</p>
          </div>

          {/* Description */}
          {invoice.description && (
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-foreground">{invoice.description}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
