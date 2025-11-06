export interface Invoice {
  id: string
  freelancer_id: string
  amount_usd: number
  amount_token: number
  token_type: string
  token_network: string
  memo?: string
  status: "pending" | "received" | "converting" | "paid" | "failed" | "expired"
  deposit_address: string
  deposit_address_source: "local_wallet" | "exchange"
  public_url: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export interface Deposit {
  id: string
  invoice_id: string
  tx_hash: string
  from_address: string
  amount_token: number
  confirmations: number
  confirmed_at?: Date
  status: "pending" | "confirmed" | "failed"
  created_at: Date
  updated_at: Date
}

export interface Conversion {
  id: string
  invoice_id: string
  deposit_id?: string
  exchange_order_id?: string
  amount_token: number
  rate_token_to_inr: number
  amount_inr_gross: number
  platform_fee_inr: number
  amount_inr_net: number
  status: "pending" | "processing" | "completed" | "failed"
  error_message?: string
  created_at: Date
  updated_at: Date
}

export interface Payout {
  id: string
  invoice_id: string
  conversion_id?: string
  freelancer_id: string
  amount_inr: number
  payout_provider: string
  payout_id?: string
  status: "pending" | "processing" | "completed" | "failed"
  error_message?: string
  retry_count: number
  created_at: Date
  updated_at: Date
}

export interface User {
  id: string
  email: string
  user_type: "freelancer" | "admin"
  kyc_status: "pending" | "verified" | "rejected"
  created_at: Date
  updated_at: Date
}
