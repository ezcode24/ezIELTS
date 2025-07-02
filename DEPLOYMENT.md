# Deployment Guide

This guide provides step-by-step instructions for deploying the IELTS Exam Simulation Platform to production.

## 🚀 Prerequisites

- Node.js 14+ and npm
- MongoDB 4.4+
- Redis (optional, for caching)
- Domain name and SSL certificate
- Cloud hosting provider (AWS, DigitalOcean, Heroku, etc.)

## 📋 Environment Setup

### 1. Environment Variables

Create a `.env` file in the root directory (there is a env.example file in the folder) with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://your-mongodb-uri

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Payment Gateway
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Security Configuration
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,audio/mpeg,audio/wav,application/pdf
```

### 2. Database Setup

1. **MongoDB Atlas** (Recommended for production):
   - Create a MongoDB Atlas cluster
   - Set up database user with read/write permissions
   - Configure network access (IP whitelist)
   - Get connection string

2. **Local MongoDB**:
   - Install MongoDB on your server
   - Create database and user
   - Configure authentication

### 3. Email Configuration

1. **Gmail SMTP**:
   - Enable 2-factor authentication
   - Generate app password
   - Use app password in EMAIL_PASS

2. **Other SMTP providers**:
   - Update EMAIL_HOST and EMAIL_PORT
   - Use appropriate credentials

## 🏗️ Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-username/ielts-exam-simulation-platform.git
cd ielts-exam-simulation-platform

# Install dependencies
npm run install-all

# Build frontend
npm run build

# Set environment variables
cp .env.example .env
# Edit .env with your production values

# Start application with PM2
pm2 start server.js --name "ielts-platform"
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

Create `/etc/nginx/sites-available/ielts-platform`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend
    location / {
        root /path/to/ielts-exam-simulation-platform/client/build;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /path/to/ielts-exam-simulation-platform/uploads;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ielts-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
# Backend Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/ielts_platform
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  mongo_data:
```

#### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 3: Heroku Deployment

#### 1. Heroku Setup

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-ielts-platform

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
# Add other environment variables...
```

#### 2. Deploy to Heroku

```bash
# Add Heroku remote
heroku git:remote -a your-ielts-platform

# Deploy
git push heroku main

# Open app
heroku open
```

## 🔒 Security Configuration

### 1. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Security Headers

Add to Nginx configuration:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 📊 Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart ielts-platform
```

### 2. Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 3. Application Logs

```bash
# PM2 logs
pm2 logs ielts-platform

# Docker logs
docker-compose logs -f app
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm run install-all
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /path/to/ielts-platform
          git pull origin main
          npm run install-all
          npm run build
          pm2 restart ielts-platform
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **MongoDB connection failed**:
   - Check MongoDB service status
   - Verify connection string
   - Check firewall settings

3. **File upload issues**:
   - Check upload directory permissions
   - Verify file size limits
   - Check disk space

4. **Email not sending**:
   - Verify SMTP credentials
   - Check email provider settings
   - Review application logs

### Performance Optimization

1. **Enable Gzip compression**:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **Add caching headers**:
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Database optimization**:
   - Create indexes for frequently queried fields
   - Monitor slow queries
   - Regular database maintenance

## 📈 Scaling

### Horizontal Scaling

1. **Load Balancer**:
   - Use Nginx as load balancer
   - Deploy multiple application instances
   - Configure session sharing

2. **Database Scaling**:
   - MongoDB replica sets
   - Read replicas for analytics
   - Database sharding for large datasets

3. **Caching**:
   - Redis for session storage
   - CDN for static assets
   - Application-level caching

## 🔄 Backup Strategy

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/ielts_platform" --out=/backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/ielts_platform" --out="$BACKUP_DIR/$DATE"
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

### File Backup

```bash
# Upload files backup
rsync -av /path/to/uploads/ /backup/uploads/

# Automated backup
0 2 * * * rsync -av /path/to/uploads/ /backup/uploads/$(date +\%Y\%m\%d)/
```

## 📞 Support

For deployment issues:
- Check application logs
- Review server resources
- Verify configuration files
- Contact development team

---

**Happy Deploying! 🚀** 
