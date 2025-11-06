# anypay - Crypto to INR Payout Platform

A full-stack MVP for accepting crypto payments and converting them to INR payouts.

## Features

- **Public Invoice Pages**: Share a link with clients - no registration required
- **Automatic Deposit Detection**: Blockchain webhooks detect incoming payments
- **Instant Conversion**: Crypto automatically converts to INR via CoinDCX
- **Direct Payouts**: INR deposits to freelancer bank accounts via Cashfree/RazorpayX
- **Admin Dashboard**: Monitor all transactions and manage payouts
- **Secure**: Encrypted private keys, webhook verification, KYC support

## Local Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Quick Start

1. **Clone and install**
   \`\`\`bash
   git clone <repo>
   cd freelapay
   npm install
   \`\`\`

2. **Start services**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. **Run migrations**
   \`\`\`bash
   psql postgresql://freelapay:freelapay_dev@localhost:5432/freelapay < scripts/01-init-schema.sql
   \`\`\`

4. **Configure environment**
   \`\`\`bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   \`\`\`

5. **Start dev server**
   \`\`\`bash
   npm run dev
   \`\`\`

Visit http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register freelancer
- `POST /api/auth/login` - Login

### Invoices
- `POST /api/invoices/create` - Create invoice (authenticated)
- `GET /api/invoices/:id` - Get invoice details (public)

### Webhooks
- `POST /api/webhooks/alchemy` - Deposit detection
- `POST /api/webhooks/coindcx` - Exchange order updates
- `POST /api/webhooks/cashfree` - Payout status updates

## Configuration

Key environment variables:

- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `ALCHEMY_API_KEY` - For deposit detection
- `COINDCX_API_KEY` - For crypto conversion
- `CASHFREE_CLIENT_ID` - For INR payouts
- `PLATFORM_FEE_PERCENT` - Platform fee (default 1.5%)
- `INVOICE_TTL_MINUTES` - Invoice expiration (default 60)

## Testing End-to-End

1. **Create invoice**
   \`\`\`bash
   curl -X POST http://localhost:3000/api/invoices/create \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"amountUsd": 100, "token": "USDT", "tokenNetwork": "ERC20"}'
   \`\`\`

2. **Simulate deposit** (see scripts/simulate-webhook.sh)

3. **Monitor conversion** in admin dashboard

## Architecture

\`\`\`
Frontend (Next.js)
├── Public invoice pages (/f/:id)
├── Freelancer dashboard
└── Admin dashboard

Backend (Next.js API Routes)
├── Auth endpoints
├── Invoice management
├── Webhook handlers
└── Worker jobs (BullMQ)

External Services
├── Alchemy (deposit detection)
├── CoinDCX (crypto conversion)
├── Cashfree (INR payouts)
└── SendGrid (notifications)

Database
├── PostgreSQL (invoices, deposits, payouts)
└── Redis (job queue, caching)
\`\`\`

## Security Notes

- Private keys are encrypted with AES-256-CBC
- All webhooks verify signatures
- KYC verification required for high-value invoices
- Row-level security on database
- Admin endpoints require authentication

## TODO / Production Checklist

- [ ] Implement real CoinGecko price fetching
- [ ] Add CoinDCX market sell order placement
- [ ] Implement Cashfree beneficiary creation
- [ ] Add email notifications (SendGrid)
- [ ] Implement WebSocket for real-time updates
- [ ] Add comprehensive test suite
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting
- [ ] Add request logging and audit trails
- [ ] Security audit and penetration testing

## Support

For issues or questions, open a GitHub issue or contact support@freelapay.com
