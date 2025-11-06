# FreelaPay Deployment Guide

## Production Checklist

### Security
- [ ] Change all default API keys and secrets
- [ ] Enable HTTPS/TLS for all endpoints
- [ ] Set up rate limiting on public endpoints
- [ ] Enable CORS restrictions
- [ ] Rotate encryption keys regularly
- [ ] Enable database encryption at rest
- [ ] Set up VPN/private network for internal services
- [ ] Enable audit logging for all admin actions

### Infrastructure
- [ ] Set up managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- [ ] Set up managed Redis (AWS ElastiCache, Google Cloud Memorystore, etc.)
- [ ] Configure auto-scaling for app servers
- [ ] Set up load balancer with health checks
- [ ] Configure CDN for static assets
- [ ] Set up backup and disaster recovery

### Monitoring & Alerting
- [ ] Set up application monitoring (Sentry, DataDog, etc.)
- [ ] Set up database monitoring
- [ ] Set up Redis monitoring
- [ ] Set up uptime monitoring
- [ ] Configure alerts for failed jobs
- [ ] Configure alerts for high error rates
- [ ] Set up log aggregation (ELK, Splunk, etc.)

### Integrations
- [ ] Complete Alchemy webhook setup
- [ ] Complete CoinDCX API integration
- [ ] Complete Cashfree API integration
- [ ] Set up SendGrid for email notifications
- [ ] Configure webhook retry policies
- [ ] Test all webhook endpoints

### Testing
- [ ] Run full test suite
- [ ] Perform load testing
- [ ] Test failover scenarios
- [ ] Test backup/restore procedures
- [ ] Perform security audit
- [ ] Test KYC verification flow

## Deployment Steps

### 1. Prepare Environment

\`\`\`bash
# Create production environment file
cp .env.local .env.production

# Update with production values
nano .env.production
\`\`\`

### 2. Database Migration

\`\`\`bash
# Run migrations on production database
psql $PRODUCTION_DATABASE_URL < scripts/01-init-schema.sql
\`\`\`

### 3. Deploy Application

\`\`\`bash
# Using Docker
docker build -t freelapay:latest .
docker push your-registry/freelapay:latest

# Deploy to Kubernetes/ECS/etc
kubectl apply -f k8s/deployment.yaml
\`\`\`

### 4. Deploy Worker

\`\`\`bash
# Build worker image
docker build -f Dockerfile.worker -t freelapay-worker:latest .
docker push your-registry/freelapay-worker:latest

# Deploy worker
kubectl apply -f k8s/worker-deployment.yaml
\`\`\`

### 5. Verify Deployment

\`\`\`bash
# Check health endpoint
curl https://api.freelapay.com/api/health

# Check admin dashboard
# Login at https://freelapay.com/login
\`\`\`

## Scaling Considerations

### Horizontal Scaling
- App servers are stateless and can be scaled horizontally
- Use load balancer to distribute traffic
- Configure auto-scaling based on CPU/memory

### Database Scaling
- Use read replicas for read-heavy operations
- Consider sharding for very high volume
- Monitor connection pool usage

### Worker Scaling
- Run multiple worker instances for parallel job processing
- Monitor job queue depth
- Scale workers based on queue size

## Monitoring Queries

### Check pending jobs
\`\`\`sql
SELECT COUNT(*) FROM conversions WHERE status = 'pending';
SELECT COUNT(*) FROM payouts WHERE status = 'pending';
\`\`\`

### Check failed transactions
\`\`\`sql
SELECT * FROM invoices WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
\`\`\`

### Check platform fees
\`\`\`sql
SELECT SUM(platform_fee_inr) FROM conversions WHERE status = 'completed' AND created_at > NOW() - INTERVAL '1 day';
\`\`\`

## Rollback Procedure

\`\`\`bash
# Rollback to previous version
kubectl rollout undo deployment/freelapay
kubectl rollout undo deployment/freelapay-worker

# Verify rollback
kubectl get pods
\`\`\`

## Support

For deployment issues, contact: ops@freelapay.com
