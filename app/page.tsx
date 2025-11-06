"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Zap, Globe, Lock } from "lucide-react"

export default function Home() {
  const router = useRouter()

  const gradientStyle = {
    background: "linear-gradient(to right, #307936, #71a83c)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as const

  const gradientButtonStyle = {
    background: "linear-gradient(to right, #307936, #71a83c)",
    color: "white",
  } as const

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F4D8" }}>
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold" style={gradientStyle}>
              CryptoForGigs
            </h1>
            <p className="text-xs text-muted-foreground">by Verdant Bharat Fresh Private Limited</p>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button onClick={() => router.push("/register")} style={gradientButtonStyle}>
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6" style={gradientStyle}>
          Crypto Payments Made Simple
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Accept crypto payments from anywhere in the world and get paid in INR instantly. No registration required for
          your clients.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => router.push("/register")} style={gradientButtonStyle}>
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12" style={gradientStyle}>
          Why CryptoForGigs?
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8">
            <Zap className="w-12 h-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Instant Conversion</h4>
            <p className="text-muted-foreground">
              Crypto automatically converts to INR and deposits to your bank account within minutes.
            </p>
          </Card>
          <Card className="p-8">
            <Globe className="w-12 h-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Global Reach</h4>
            <p className="text-muted-foreground">
              Accept payments from clients anywhere using any wallet or exchange. No barriers.
            </p>
          </Card>
          <Card className="p-8">
            <Lock className="w-12 h-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Secure & Transparent</h4>
            <p className="text-muted-foreground">
              Blockchain-verified payments with full audit trail and encrypted key management.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Card className="p-12" style={gradientButtonStyle}>
          <h3 className="text-3xl font-bold mb-4 text-white">Ready to get paid in crypto?</h3>
          <p className="text-lg mb-8 text-white/90">
            Create your first invoice in seconds and start accepting payments.
          </p>
          <Button size="lg" variant="secondary" onClick={() => router.push("/register")}>
            Create Free Account
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 CryptoForGigs. All rights reserved.</p>
          <p className="text-xs mt-2">Powered by Verdant Bharat Fresh Private Limited</p>
        </div>
      </footer>
    </div>
  )
}
