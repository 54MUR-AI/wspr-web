# Deployment Guide

## Overview
This guide outlines the deployment process for the WSPR Web application, including environment setup, configuration, and maintenance procedures.

## Prerequisites
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher
- Google Cloud Platform account
- Domain name and SSL certificates

## Environment Setup

### 1. Infrastructure Requirements
- **Web Servers**
  - Minimum: 2 servers
  - Recommended: 4+ servers for high availability
  - Specs per server:
    - 4 vCPUs
    - 8GB RAM
    - 50GB SSD

- **Database**
  - Primary: 1 server
  - Replica: 1+ servers
  - Specs per server:
    - 8 vCPUs
    - 16GB RAM
    - 100GB SSD

- **Redis Cluster**
  - Minimum: 3 nodes
  - Recommended: 6 nodes
  - Specs per node:
    - 2 vCPUs
    - 4GB RAM
    - 20GB SSD

- **TURN/STUN Servers**
  - Minimum: 2 servers
  - Recommended: 4+ servers
  - Specs per server:
    - 2 vCPUs
    - 4GB RAM
    - 20GB SSD

### 2. Network Configuration
- Load balancer setup
- Firewall rules
- SSL/TLS configuration
- DNS configuration
- CDN setup

## Application Configuration

### 1. Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=3001
API_URL=https://api.wspr.com
WS_URL=wss://ws.wspr.com

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=wspr
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# WebRTC Configuration
TURN_URLS=["turn:turn1.wspr.com:3478", "turn:turn2.wspr.com:3478"]
TURN_USERNAME=your-turn-username
TURN_CREDENTIAL=your-turn-credential

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@wspr.com

# Storage Configuration
STORAGE_BUCKET=wspr-storage
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Monitoring Configuration
MONITORING_ENABLED=true
ERROR_REPORTING_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true
```

### 2. SSL/TLS Setup
1. Obtain SSL certificates
2. Configure nginx/apache
3. Set up automatic renewal
4. Configure security headers

### 3. Database Setup
1. Create database
2. Run migrations
3. Set up replication
4. Configure backups

### 4. Redis Setup
1. Configure cluster
2. Set up persistence
3. Configure security
4. Set up monitoring

## Deployment Process

### 1. Build Process
```bash
# Install dependencies
npm install --production

# Build frontend
cd client
npm install --production
npm run build

# Build backend
cd ../server
npm run build
```

### 2. Deployment Steps
1. **Prepare Release**
   ```bash
   # Create release tag
   git tag v1.0.0
   
   # Push tag
   git push origin v1.0.0
   ```

2. **Database Migration**
   ```bash
   # Run migrations
   npm run migrate
   
   # Verify migration
   npm run migrate:status
   ```

3. **Deploy Application**
   ```bash
   # Deploy to servers
   ./deploy.sh production
   
   # Verify deployment
   ./healthcheck.sh
   ```

4. **Post-deployment**
   ```bash
   # Clear cache
   npm run cache:clear
   
   # Warm up cache
   npm run cache:warm
   ```

## Monitoring Setup

### 1. Application Monitoring
- Set up error tracking
- Configure performance monitoring
- Set up log aggregation
- Configure alerts

### 2. Infrastructure Monitoring
- Server metrics
- Database metrics
- Redis metrics
- Network metrics

### 3. Alert Configuration
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Error rate > 1%
- Response time > 1s

## Backup Strategy

### 1. Database Backups
- Full backup daily
- Incremental backup hourly
- Point-in-time recovery
- Backup verification

### 2. File Backups
- Media files daily
- User uploads daily
- Configuration files
- SSL certificates

### 3. Application Backups
- Code repository
- Environment configs
- Deployment scripts
- Documentation

## Scaling Strategy

### 1. Horizontal Scaling
- Add web servers
- Add database replicas
- Expand Redis cluster
- Add TURN/STUN servers

### 2. Vertical Scaling
- Upgrade CPU
- Increase RAM
- Expand storage
- Optimize resources

### 3. Load Balancing
- Round-robin
- Least connections
- Resource-based
- Geographic

## Maintenance Procedures

### 1. Regular Updates
- Security patches
- Dependency updates
- OS updates
- SSL renewal

### 2. Performance Optimization
- Database optimization
- Cache optimization
- Code optimization
- Resource optimization

### 3. Health Checks
- Service status
- Resource usage
- Error rates
- Performance metrics

## Rollback Procedures

### 1. Application Rollback
```bash
# Revert to previous version
./rollback.sh v1.0.0

# Verify rollback
./healthcheck.sh
```

### 2. Database Rollback
```bash
# Revert migration
npm run migrate:down

# Verify database state
npm run migrate:status
```

### 3. Configuration Rollback
```bash
# Restore configuration
./restore-config.sh backup-date

# Verify configuration
./verify-config.sh
```

## Troubleshooting

### Common Issues
1. **Connection Issues**
   - Check network configuration
   - Verify DNS settings
   - Check SSL certificates
   - Verify firewall rules

2. **Performance Issues**
   - Check resource usage
   - Analyze database queries
   - Review caching strategy
   - Monitor network traffic

3. **Application Errors**
   - Check application logs
   - Review error reports
   - Verify configurations
   - Test dependencies

## Security Measures

### 1. Access Control
- IP whitelisting
- VPN access
- SSH key authentication
- Role-based access

### 2. Monitoring
- Security logs
- Access logs
- Audit trails
- Intrusion detection

### 3. Compliance
- Data encryption
- Access controls
- Audit logging
- Security policies
