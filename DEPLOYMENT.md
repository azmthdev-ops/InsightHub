# Insight-Hub Deployment Guide

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

**Prerequisites:**
- Docker Desktop installed
- Docker Compose v2+

**Steps:**
```bash
# 1. Clone repository
git clone <your-repo-url>
cd insight-hub

# 2. Create .env file
cp web/.env.local.example .env

# 3. Build and start services
docker-compose up -d

# 4. Check logs
docker-compose logs -f

# 5. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

**Stop services:**
```bash
docker-compose down
```

---

### Option 2: Vercel (Frontend) + Railway (Backend)

#### Backend on Railway

1. **Create Railway Account**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Select Repository**: insight-hub
4. **Root Directory**: `/backend`
5. **Build Command**: `pip install -r requirements.txt`
6. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. **Environment Variables**:
   ```
   PYTHON_VERSION=3.11
   ```
8. **Deploy** → Copy the public URL

#### Frontend on Vercel

1. **Create Vercel Account**: https://vercel.com
2. **Import Project** → Select insight-hub repo
3. **Root Directory**: `/web`
4. **Framework Preset**: Next.js
5. **Environment Variables**:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app/api
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
6. **Deploy** → Your app will be live at `your-app.vercel.app`

---

### Option 3: AWS (Production)

#### Backend on EC2

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t3.medium)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install dependencies
sudo apt update
sudo apt install python3.11 python3-pip nginx -y

# 4. Clone repository
git clone <your-repo-url>
cd insight-hub/backend

# 5. Install Python packages
pip3 install -r requirements.txt

# 6. Create systemd service
sudo nano /etc/systemd/system/insight-hub.service
```

**Service file:**
```ini
[Unit]
Description=Insight-Hub Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/insight-hub/backend
ExecStart=/usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 7. Start service
sudo systemctl daemon-reload
sudo systemctl enable insight-hub
sudo systemctl start insight-hub

# 8. Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/insight-hub
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# 9. Enable site
sudo ln -s /etc/nginx/sites-available/insight-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

#### Frontend on S3 + CloudFront

```bash
# 1. Build Next.js for static export
cd insight-hub/web
npm run build
npm run export

# 2. Upload to S3
aws s3 sync out/ s3://your-bucket-name --acl public-read

# 3. Create CloudFront distribution
# - Origin: your-bucket-name.s3.amazonaws.com
# - Default Root Object: index.html
# - Custom Error Response: 404 → /404.html

# 4. Update DNS
# Point your domain to CloudFront distribution
```

---

### Option 4: Kubernetes (Enterprise)

**Prerequisites:**
- Kubernetes cluster (EKS, GKE, AKS)
- kubectl configured
- Helm installed

```bash
# 1. Create namespace
kubectl create namespace insight-hub

# 2. Create secrets
kubectl create secret generic insight-hub-secrets \
  --from-literal=groq-api-key=$GROQ_API_KEY \
  --from-literal=deepseek-api-key=$DEEPSEEK_API_KEY \
  -n insight-hub

# 3. Apply manifests
kubectl apply -f k8s/ -n insight-hub

# 4. Check status
kubectl get pods -n insight-hub
kubectl get svc -n insight-hub

# 5. Access via LoadBalancer
kubectl get svc frontend -n insight-hub
```

---

## 🔐 Security Checklist

### Production Hardening

- [ ] Change default API keys
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable authentication (Supabase Auth)
- [ ] Implement API key rotation
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backups
- [ ] Enable logging
- [ ] Set up firewall rules

### Environment Variables

**Never commit these to Git:**
```env
GROQ_API_KEY=your_production_key
DEEPSEEK_API_KEY=your_production_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

---

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl https://your-backend.com/health

# Frontend health
curl https://your-frontend.com/api/health
```

### Logging

**Backend logs:**
```bash
# Docker
docker-compose logs -f backend

# Systemd
sudo journalctl -u insight-hub -f

# Kubernetes
kubectl logs -f deployment/backend -n insight-hub
```

**Frontend logs:**
```bash
# Vercel
vercel logs

# Docker
docker-compose logs -f frontend
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Insight-Hub

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🚨 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process
netstat -ano | findstr :8000
# Kill process
taskkill /PID <pid> /F
```

**Dependencies missing:**
```bash
pip install -r requirements.txt --upgrade
```

### Frontend Issues

**Build fails:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**API connection fails:**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running
- Check CORS configuration

### Docker Issues

**Container won't start:**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Out of disk space:**
```bash
docker system prune -a
```

---

## 📈 Performance Optimization

### Backend

1. **Enable caching:**
   ```python
   from fastapi_cache import FastAPICache
   from fastapi_cache.backends.redis import RedisBackend
   ```

2. **Use connection pooling:**
   ```python
   from sqlalchemy.pool import QueuePool
   ```

3. **Optimize YOLO inference:**
   - Use GPU if available
   - Batch processing
   - Model quantization

### Frontend

1. **Enable Next.js optimizations:**
   ```javascript
   // next.config.ts
   images: {
     domains: ['your-cdn.com'],
     formats: ['image/avif', 'image/webp']
   }
   ```

2. **Use CDN for static assets**
3. **Enable compression**
4. **Implement lazy loading**

---

## 🎯 Scaling Strategy

### Horizontal Scaling

**Backend:**
- Multiple uvicorn workers
- Load balancer (Nginx, HAProxy)
- Redis for session storage

**Frontend:**
- Multiple Next.js instances
- CDN for static assets
- Edge functions for API routes

### Vertical Scaling

**Backend:**
- Increase CPU/RAM
- GPU for YOLO inference
- SSD for faster I/O

**Database:**
- Read replicas
- Connection pooling
- Query optimization

---

## 📞 Support

For deployment issues or enterprise support:
- Email: support@insight-hub.com
- Slack: insight-hub.slack.com
- Docs: docs.insight-hub.com

---

**Last Updated:** 2024
**Version:** 2.0.0
