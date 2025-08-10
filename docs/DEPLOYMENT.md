# 🚀 Deployment Guide

This guide covers deploying the Video Conference App to various environments, from local development to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before deploying, ensure you have:

- **Node.js 18+** and **npm 8+**
- **MongoDB 6+** or **MongoDB Atlas**
- **Docker** and **Docker Compose** (for containerized deployment)
- **Git** for version control
- **SSL certificates** (for production HTTPS)

## 🏠 Local Development

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd video-conference-app

# Install dependencies
npm install
cd server && npm install
cd ../client && npm install

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start MongoDB (if not using Docker)
mongod

# Start the application
npm run dev
```

### Environment Configuration

Create `.env` files with your local settings:

**Server (.env):**
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/video-conference-app
JWT_SECRET=your-local-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

**Client (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Production with Docker Compose

```bash
# Start production services
docker-compose --profile production up -d

# Scale backend servers
docker-compose up -d --scale server=3
```

### Custom Docker Builds

```bash
# Build development image
docker build --target development -t video-conference:dev .

# Build production image
docker build --target production -t video-conference:prod .

# Build with client
docker build --target production-with-client -t video-conference:full .
```

## 🌐 Production Deployment

### Manual Server Setup

1. **Server Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone <your-repo-url> /opt/video-conference-app
   cd /opt/video-conference-app
   
   # Install dependencies
   npm install --production
   cd server && npm install --production
   
   # Set up environment
   cp server/.env.example server/.env
   # Edit server/.env with production values
   
   # Create service user
   sudo useradd -r -s /bin/false videoapp
   sudo chown -R videoapp:videoapp /opt/video-conference-app
   
   # Set up systemd service
   sudo cp deployment/video-conference.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable video-conference
   sudo systemctl start video-conference
   ```

3. **Nginx Setup**
   ```bash
   # Install Nginx
   sudo apt install nginx -y
   
   # Copy configuration
   sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
   
   # Test configuration
   sudo nginx -t
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

### Systemd Service File

Create `/etc/systemd/system/video-conference.service`:

```ini
[Unit]
Description=Video Conference App
After=network.target mongod.service

[Service]
Type=simple
User=videoapp
Group=videoapp
WorkingDirectory=/opt/video-conference-app/server
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
```

## ☁️ Cloud Deployment

### AWS Deployment

1. **EC2 Setup**
   ```bash
   # Launch EC2 instance (Ubuntu 22.04 LTS)
   # Security Group: Allow ports 22, 80, 443, 5000
   
   # Connect and follow manual server setup above
   ```

2. **RDS MongoDB** (Alternative to local MongoDB)
   ```bash
   # Create RDS MongoDB instance
   # Update MONGO_URI in .env
   MONGO_URI=mongodb://username:password@your-rds-endpoint:27017/dbname
   ```

3. **S3 for File Storage**
   ```bash
   # Create S3 bucket
   # Update AWS configuration in config.js
   # Install AWS SDK
   npm install aws-sdk
   ```

4. **Load Balancer**
   ```bash
   # Create Application Load Balancer
   # Target Group: Port 5000
   # Health Check: /api/health
   ```

### Google Cloud Platform

1. **Compute Engine**
   ```bash
   # Create VM instance
   # Follow manual server setup
   ```

2. **Cloud Run** (Serverless)
   ```bash
   # Build container
   gcloud builds submit --tag gcr.io/PROJECT_ID/video-conference
   
   # Deploy to Cloud Run
   gcloud run deploy video-conference \
     --image gcr.io/PROJECT_ID/video-conference \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Azure Deployment

1. **Azure VM**
   ```bash
   # Create Ubuntu VM
   # Follow manual server setup
   ```

2. **Azure Container Instances**
   ```bash
   # Build and push to Azure Container Registry
   az acr build --registry yourregistry --image video-conference .
   
   # Deploy to Container Instances
   az container create \
     --resource-group your-rg \
     --name video-conference \
     --image yourregistry.azurecr.io/video-conference:latest \
     --ports 5000
   ```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Basic health check
curl http://your-domain.com/api/health

# Detailed health check
curl http://your-domain.com/api/health/detailed

# Prometheus metrics
curl http://your-domain.com/api/health/metrics
```

### Log Monitoring

```bash
# View application logs
sudo journalctl -u video-conference -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Performance Monitoring

```bash
# System resources
htop
iotop
nethogs

# Application metrics
curl http://your-domain.com/api/health/detailed | jq
```

### Backup Strategy

```bash
# MongoDB backup
mongodump --db video-conference-app --out /backup/$(date +%Y%m%d)

# File uploads backup
tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /opt/video-conference-app/server/uploads

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Database backup
mongodump --db video-conference-app --out $BACKUP_DIR

# Files backup
tar -czf $BACKUP_DIR/uploads.tar.gz /opt/video-conference-app/server/uploads

# Clean old backups (keep 7 days)
find /backup -type d -mtime +7 -exec rm -rf {} \;
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tlnp | grep :5000
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   
   # Test connection
   mongosh --eval "db.adminCommand('ping')"
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R videoapp:videoapp /opt/video-conference-app
   sudo chmod -R 755 /opt/video-conference-app
   ```

4. **Nginx Configuration Issues**
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Check syntax
   sudo nginx -T
   
   # Reload configuration
   sudo nginx -s reload
   ```

### Performance Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   free -h
   
   # Check Node.js memory
   node --max-old-space-size=4096 server.js
   ```

2. **Slow Database Queries**
   ```bash
   # Enable MongoDB profiling
   db.setProfilingLevel(2)
   
   # Check slow queries
   db.system.profile.find().pretty()
   ```

3. **Network Issues**
   ```bash
   # Check network connectivity
   ping google.com
   
   # Check DNS resolution
   nslookup your-domain.com
   
   # Test WebRTC connectivity
   curl -I https://stun.l.google.com:19302
   ```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change default MongoDB credentials
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup encryption
- [ ] User authentication audit

### SSL Certificate Setup

```bash
# Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Multiple backend instances
docker-compose up -d --scale server=3

# Load balancer configuration
upstream backend_servers {
    server server1:5000;
    server server2:5000;
    server server3:5000;
}
```

### Vertical Scaling

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=8192"

# MongoDB optimization
# Update /etc/mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4
```

## 📚 Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Checklist](https://docs.mongodb.com/manual/administration/production-checklist/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [SSL/TLS Configuration](https://ssl-config.mozilla.org/)

## 🆘 Support

If you encounter issues:

1. Check the logs for error messages
2. Review this troubleshooting section
3. Check GitHub issues for similar problems
4. Create a new issue with detailed information
5. Include logs, environment details, and steps to reproduce

---

**Happy Deploying! 🚀**