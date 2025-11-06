# FreelaPay Testing Guide

## Unit Tests

\`\`\`bash
npm test
\`\`\`

## Integration Tests

\`\`\`bash
# Start test environment
docker-compose -f docker-compose.test.yml up

# Run integration tests
npm run test:integration

# Stop test environment
docker-compose -f docker-compose.test.yml down
\`\`\`

## End-to-End Tests

\`\`\`bash
# Start development environment
docker-compose up

# Run e2e test script
bash scripts/test-end-to-end.sh

# Check results in admin dashboard
# http://localhost:3000/admin/dashboard
\`\`\`

## Manual Testing

### Test Invoice Creation
1. Register at http://localhost:3000/register
2. Create invoice at http://localhost:3000/freelancer/create-invoice
3. Share public link with test client
4. Verify QR code and deposit address

### Test Deposit Detection
1. Run: `npx ts-node scripts/simulate-deposit.ts <invoiceId> <address> <amount>`
2. Check admin dashboard for deposit status
3. Verify conversion job in queue

### Test Payout
1. Configure payout settings in freelancer dashboard
2. Monitor job queue for payout job
3. Check admin dashboard for payout status

## Load Testing

\`\`\`bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/health

# Using k6
k6 run scripts/load-test.js
\`\`\`

## Security Testing

- [ ] Test SQL injection on all endpoints
- [ ] Test XSS on all input fields
- [ ] Test CSRF on state-changing endpoints
- [ ] Test authentication bypass
- [ ] Test authorization bypass
- [ ] Test rate limiting
- [ ] Test webhook signature verification
