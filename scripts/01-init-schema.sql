-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('freelancer', 'admin')),
  kyc_status VARCHAR(50) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Freelancer profiles
CREATE TABLE freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  bank_account_number VARCHAR(255),
  bank_ifsc_code VARCHAR(20),
  upi_id VARCHAR(255),
  payout_method VARCHAR(50) CHECK (payout_method IN ('bank', 'upi')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(18, 2) NOT NULL,
  amount_token DECIMAL(18, 8),
  token_type VARCHAR(50) NOT NULL,
  token_network VARCHAR(50) NOT NULL,
  memo TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'converting', 'paid', 'failed', 'expired')),
  deposit_address VARCHAR(255),
  deposit_address_source VARCHAR(50) CHECK (deposit_address_source IN ('local_wallet', 'exchange')),
  public_url VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_freelancer_id ON invoices(freelancer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_deposit_address ON invoices(deposit_address);

-- Deposits
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tx_hash VARCHAR(255) NOT NULL UNIQUE,
  from_address VARCHAR(255) NOT NULL,
  amount_token DECIMAL(18, 8) NOT NULL,
  confirmations INT DEFAULT 0,
  confirmed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deposits_invoice_id ON deposits(invoice_id);
CREATE INDEX idx_deposits_tx_hash ON deposits(tx_hash);

-- Conversions (crypto to INR)
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  deposit_id UUID REFERENCES deposits(id),
  exchange_order_id VARCHAR(255),
  amount_token DECIMAL(18, 8) NOT NULL,
  rate_token_to_inr DECIMAL(18, 2),
  amount_inr_gross DECIMAL(18, 2),
  platform_fee_inr DECIMAL(18, 2),
  amount_inr_net DECIMAL(18, 2),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversions_invoice_id ON conversions(invoice_id);

-- Payouts
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES conversions(id),
  freelancer_id UUID NOT NULL REFERENCES users(id),
  amount_inr DECIMAL(18, 2) NOT NULL,
  payout_provider VARCHAR(50) NOT NULL,
  payout_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payouts_invoice_id ON payouts(invoice_id);
CREATE INDEX idx_payouts_freelancer_id ON payouts(freelancer_id);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Ledger entries (for in-app balance tracking)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_inr DECIMAL(18, 2) NOT NULL,
  entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('credit', 'debit')),
  reason VARCHAR(255),
  reference_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_entries_freelancer_id ON ledger_entries(freelancer_id);

-- Webhook events (for debugging and replay)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
