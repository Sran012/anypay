// Mock data for frontend demonstration without API dependencies

export const MOCK_INVOICES = [
  {
    id: "inv_001",
    amount: 500,
    currency: "USDC",
    network: "ethereum",
    description: "Logo Design Project",
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    depositAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f4bEb0",
    walletAddress: "",
    bankAccount: "XXXX1234",
  },
  {
    id: "inv_002",
    amount: 1000,
    currency: "USDT",
    network: "polygon",
    description: "Website Development",
    status: "confirmed",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    depositAddress: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    walletAddress: "0xabc123...",
    bankAccount: "XXXX5678",
  },
  {
    id: "inv_003",
    amount: 2000,
    currency: "ETH",
    network: "ethereum",
    description: "Smart Contract Audit",
    status: "completed",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    depositAddress: "0x1234567890123456789012345678901234567890",
    walletAddress: "0xdef456...",
    bankAccount: "XXXX9012",
  },
]

export const MOCK_USER = {
  id: "user_001",
  email: "freelancer@example.com",
  name: "John Doe",
  bankAccount: {
    accountNumber: "XXXX1234",
    ifsc: "HDFC0000001",
    accountHolder: "John Doe",
  },
  upiId: "john@okhdfcbank",
  createdAt: new Date().toISOString(),
}

export const MOCK_STATS = {
  totalEarnings: 3500,
  totalInvoices: 3,
  pendingPayments: 500,
  completedPayouts: 3000,
  averageInvoiceValue: 1167,
}
