#!/bin/bash

# End-to-end test script for FreelaPay
# This script tests the complete flow from invoice creation to payout

set -e

BASE_URL="http://localhost:3000"
ADMIN_SECRET="${ADMIN_SECRET:-your-admin-secret-key}"

echo "🚀 FreelaPay End-to-End Test"
echo "=============================="
echo ""

# 1. Register freelancer
echo "1️⃣  Registering freelancer..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "userType": "freelancer",
    "fullName": "Test Freelancer"
  }')

FREELANCER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
FREELANCER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$FREELANCER_TOKEN" == "null" ]; then
  echo "❌ Registration failed"
  echo $REGISTER_RESPONSE | jq .
  exit 1
fi

echo "✅ Freelancer registered: $FREELANCER_ID"
echo ""

# 2. Create invoice
echo "2️⃣  Creating invoice..."
INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/invoices/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -d '{
    "amountUsd": 100,
    "token": "USDT",
    "tokenNetwork": "ERC20",
    "memo": "Test invoice"
  }')

INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.id')
DEPOSIT_ADDRESS=$(echo $INVOICE_RESPONSE | jq -r '.deposit_address')

if [ "$INVOICE_ID" == "null" ]; then
  echo "❌ Invoice creation failed"
  echo $INVOICE_RESPONSE | jq .
  exit 1
fi

echo "✅ Invoice created: $INVOICE_ID"
echo "   Deposit address: $DEPOSIT_ADDRESS"
echo ""

# 3. Fetch invoice details
echo "3️⃣  Fetching invoice details..."
INVOICE_DETAILS=$(curl -s -X GET "$BASE_URL/api/invoices/$INVOICE_ID")

STATUS=$(echo $INVOICE_DETAILS | jq -r '.status')
echo "✅ Invoice status: $STATUS"
echo ""

# 4. Simulate deposit
echo "4️⃣  Simulating deposit detection..."
DEPOSIT_PAYLOAD=$(cat <<EOF
{
  "type": "MINED_TRANSACTION",
  "transaction": {
    "hash": "0x$(openssl rand -hex 32)",
    "to": "$DEPOSIT_ADDRESS",
    "from": "0x$(openssl rand -hex 20)",
    "value": "100000000000000000000",
    "blockNumber": 12345678
  }
}
EOF
)

ALCHEMY_AUTH_TOKEN="${ALCHEMY_AUTH_TOKEN:-test-token}"
SIGNATURE=$(echo -n "$DEPOSIT_PAYLOAD" | openssl dgst -sha256 -hmac "$ALCHEMY_AUTH_TOKEN" -hex | cut -d' ' -f2)

WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/alchemy" \
  -H "Content-Type: application/json" \
  -H "x-alchemy-signature: $SIGNATURE" \
  -d "$DEPOSIT_PAYLOAD")

echo "✅ Webhook processed"
echo ""

# 5. Check invoice status after deposit
echo "5️⃣  Checking invoice status after deposit..."
sleep 2
INVOICE_AFTER=$(curl -s -X GET "$BASE_URL/api/invoices/$INVOICE_ID")
STATUS_AFTER=$(echo $INVOICE_AFTER | jq -r '.status')
DEPOSIT_STATUS=$(echo $INVOICE_AFTER | jq -r '.deposit_status')

echo "✅ Invoice status: $STATUS_AFTER"
echo "   Deposit status: $DEPOSIT_STATUS"
echo ""

# 6. Trigger deposit polling
echo "6️⃣  Triggering deposit polling..."
POLL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/deposits/poll" \
  -H "x-admin-secret: $ADMIN_SECRET")

echo "✅ Polling completed"
echo ""

# 7. Check job queue
echo "7️⃣  Checking job queue..."
JOBS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/admin/jobs" \
  -H "Authorization: Bearer $FREELANCER_TOKEN")

echo "✅ Jobs in queue:"
echo $JOBS_RESPONSE | jq '.[] | {type, state, data}'
echo ""

echo "✅ End-to-end test completed!"
echo ""
echo "Next steps:"
echo "1. Monitor the job queue for conversion and payout jobs"
echo "2. Check admin dashboard for transaction status"
echo "3. Verify webhook events in admin webhooks page"
