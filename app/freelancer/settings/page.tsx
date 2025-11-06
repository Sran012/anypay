"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { mockApi } from "@/lib/mock-api"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    bankAccountNumber: "",
    bankIfscCode: "",
    upiId: "",
    payoutMethod: "bank",
  })

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (!auth) {
      router.push("/login")
      return
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      await mockApi.updateProfile({
        bankAccount: {
          accountNumber: formData.bankAccountNumber,
          ifsc: formData.bankIfscCode,
          accountHolder: "User",
        },
        upiId: formData.upiId,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.push("/freelancer/dashboard")} className="mb-8">
          ← Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Payout Settings</h1>
            <p className="text-muted-foreground">Configure where you want to receive payments</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Settings saved successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payout Method */}
            <div>
              <label className="block text-sm font-medium mb-2">Payout Method</label>
              <select
                name="payoutMethod"
                value={formData.payoutMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="bank">Bank Transfer (IMPS/NEFT)</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            {/* Bank Details */}
            {formData.payoutMethod === "bank" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Bank Account Number</label>
                  <Input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="1234567890123456"
                    required={formData.payoutMethod === "bank"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">IFSC Code</label>
                  <Input
                    type="text"
                    name="bankIfscCode"
                    value={formData.bankIfscCode}
                    onChange={handleChange}
                    placeholder="SBIN0001234"
                    required={formData.payoutMethod === "bank"}
                  />
                </div>
              </>
            )}

            {/* UPI */}
            {formData.payoutMethod === "upi" && (
              <div>
                <label className="block text-sm font-medium mb-2">UPI ID</label>
                <Input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="yourname@upi"
                  required={formData.payoutMethod === "upi"}
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your payout details are encrypted and securely stored. We never share them with
                third parties.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
