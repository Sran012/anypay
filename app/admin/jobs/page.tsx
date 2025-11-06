"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, RotateCcw } from "lucide-react"

interface Job {
  type: string
  id: string
  state: string
  data: any
  progress: number
  attempts: number
  failedReason?: string
}

export default function AdminJobs() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (!storedToken) {
      router.push("/login")
      return
    }
    setToken(storedToken)
    fetchJobs(storedToken)

    // Refresh every 5 seconds
    const interval = setInterval(() => fetchJobs(storedToken), 5000)
    return () => clearInterval(interval)
  }, [router])

  const fetchJobs = async (authToken: string) => {
    try {
      const res = await fetch("/api/admin/jobs", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setJobs(data)
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetryJob = async (jobId: string, jobType: string) => {
    if (!token) return

    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "retry",
          jobId,
          jobType,
        }),
      })

      if (res.ok) {
        fetchJobs(token)
      }
    } catch (error) {
      console.error("Failed to retry job:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const stateColors: Record<string, string> = {
    active: "bg-blue-100 text-blue-800",
    waiting: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    completed: "bg-green-100 text-green-800",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Background Jobs</h1>
            <p className="text-sm text-muted-foreground">Conversions and payouts queue</p>
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
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No jobs in queue</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={`${job.type}-${job.id}`} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-semibold">{job.type.toUpperCase()}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${stateColors[job.state] || ""}`}>
                        {job.state.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">ID: {job.id}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Invoice: {job.data.invoiceId}</p>
                      <p>Attempts: {job.attempts}</p>
                      {job.failedReason && <p className="text-red-600">Error: {job.failedReason}</p>}
                    </div>
                  </div>
                  {job.state === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryJob(job.id, job.type)}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
