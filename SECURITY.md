# 🔐 Security Guide - Insight-Hub

## Overview

This document outlines the security measures implemented in Insight-Hub and best practices for secure deployment.

## ✅ Implemented Security Features

### 1. Code Execution Sandboxing

**Location:** `backend/services/code_executor.py`

**Features:**
- ✅ Isolated process execution
- ✅ Restricted builtins (no file I/O, no imports)
- ✅ Timeout protection (15 seconds default)
- ✅ Code length limits (50KB max)
- ✅ Pattern-based security checks
- ✅ No network access
- ✅ No system calls

**Blocked Operations:**
```python
# These are NOT allowed in code execution:
- import os, sys, subprocess
- open(), file(), input()
- eval(), exec(), compile()
- __import__()
- socket, urllib, requests
```

**Allowed Operations:**
```python
# Only these are allowed:
- pandas, numpy operations
- Basic Python functions (print, len, range, etc.)
- Data manipulation
- Mathematical operations
```

---

### 2. File Upload Validation

**Location:** `backend/api/routes.py`

**Features:**
- ✅ File size limits (500MB max)
- ✅ File type validation (.csv, .xlsx, .json, .parquet only)
- ✅ Content validation before processing

**Example:**
```python
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.json', '.parquet'}
```

---

### 3. CORS Configuration

**Location:** `backend/main.py`

**Features:**
- ✅ Restricted to specific origins
- ✅ No wildcard (*) origins in production
- ✅ Credentials support enabled

**Configuration:**
```python
allow_origins=[
    "http://localhost:3000",  # Development
    "https://your-domain.vercel.app",  # Production
]
```

---

### 4. Environment Variables

**Features:**
- ✅ No hardcoded API keys
- ✅ All secrets in .env files
- ✅ .env files in .gitignore

**Required Variables:**
```env
GROQ_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

---

### 5. Error Handling

**Features:**
- ✅ Graceful error handling
- ✅ No sensitive data in error messages
- ✅ Detailed logs for debugging (server-side only)
- ✅ User-friendly error messages (client-side)

---

## ⚠️ Security Recommendations

### 1. Authentication & Authorization (TODO)

**Current Status:** ❌ Not implemented

**Recommendation:** Implement Supabase Auth

```typescript
// Add to all API routes
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return new Response("Unauthorized", { status: 401 })
}
```

**Benefits:**
- User isolation
- Multi-tenancy support
- Secure data access
- Session management

---

### 2. Rate Limiting (TODO)

**Current Status:** ❌ Not implemented

**Recommendation:** Add rate limiting middleware

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@limiter.limit("10/minute")
@router.post("/api/ml/train")
async def train_model(...):
    ...
```

**Benefits:**
- Prevent API abuse
- Protect against DoS attacks
- Control resource usage
- Reduce costs

---

### 3. Input Validation

**Current Status:** ✅ Partially implemented

**Recommendations:**
- ✅ Validate all user inputs
- ✅ Sanitize file names
- ✅ Check data types
- ✅ Validate ranges and limits

---

### 4. HTTPS/TLS

**Current Status:** ⚠️ Development only (HTTP)

**Production Requirements:**
- ✅ Use HTTPS for all connections
- ✅ Valid SSL certificates
- ✅ Redirect HTTP to HTTPS
- ✅ HSTS headers

**Deployment:**
```nginx
# Nginx configuration
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

### 5. Database Security

**Current Status:** ⚠️ In-memory storage

**Recommendations:**
- ✅ Use PostgreSQL (Supabase)
- ✅ Enable Row Level Security (RLS)
- ✅ Parameterized queries
- ✅ Connection pooling
- ✅ Regular backups

**Supabase RLS Example:**
```sql
-- Only users can see their own data
CREATE POLICY "Users can view own data"
ON datasets FOR SELECT
USING (auth.uid() = user_id);
```

---

### 6. API Key Management

**Current Status:** ✅ Environment variables

**Best Practices:**
- ✅ Never commit keys to Git
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/staging/prod
- ✅ Monitor API usage
- ✅ Set spending limits

**Key Rotation:**
```bash
# 1. Generate new key
# 2. Update .env file
# 3. Restart services
# 4. Revoke old key
```

---

### 7. Logging & Monitoring

**Current Status:** ⚠️ Basic logging only

**Recommendations:**
- ✅ Structured logging
- ✅ Log all security events
- ✅ Monitor for anomalies
- ✅ Set up alerts
- ✅ Regular log reviews

**Example:**
```python
import structlog

logger = structlog.get_logger()

logger.info("user_login", 
    user_id=user_id, 
    ip=request.client.host,
    timestamp=datetime.now())
```

---

## 🚨 Security Checklist

### Development
- [x] No hardcoded secrets
- [x] Code execution sandboxed
- [x] File upload validation
- [x] CORS configured
- [x] Error handling
- [ ] Authentication implemented
- [ ] Rate limiting added
- [ ] Input validation complete

### Staging
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Database RLS enabled
- [ ] API keys rotated
- [ ] Monitoring set up
- [ ] Penetration testing done

### Production
- [ ] All staging items complete
- [ ] Regular security audits
- [ ] Incident response plan
- [ ] Backup strategy
- [ ] Disaster recovery plan
- [ ] Compliance requirements met

---

## 🔒 Secure Deployment Guide

### 1. Environment Setup

```bash
# Production .env
GROQ_API_KEY=prod_key_here
DEEPSEEK_API_KEY=prod_key_here
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### 2. Docker Security

```dockerfile
# Use non-root user
USER node

# Read-only filesystem
RUN chmod -R 555 /app

# No shell access
CMD ["node", "server.js"]
```

### 3. Kubernetes Security

```yaml
# Security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

### 4. Network Security

```yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: insight-hub-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: insight-hub-frontend
```

---

## 📋 Security Incident Response

### 1. Detection
- Monitor logs for suspicious activity
- Set up alerts for anomalies
- Regular security scans

### 2. Response
1. Isolate affected systems
2. Assess the damage
3. Contain the breach
4. Eradicate the threat
5. Recover systems
6. Document everything

### 3. Post-Incident
- Conduct post-mortem
- Update security measures
- Notify affected users
- Improve monitoring

---

## 🔍 Security Testing

### Manual Testing

```bash
# Test code execution sandbox
curl -X POST http://localhost:8000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "import os; os.system(\"ls\")"}'
# Should fail with security violation

# Test file size limit
curl -X POST http://localhost:8000/api/data/upload \
  -F "file=@large_file.csv"
# Should fail if > 500MB

# Test CORS
curl -X POST http://localhost:8000/api/data/upload \
  -H "Origin: http://malicious-site.com" \
  -F "file=@test.csv"
# Should fail with CORS error
```

### Automated Testing

```python
# tests/test_security.py
def test_code_execution_blocks_imports():
    executor = CodeExecutor()
    result = executor.execute_python_code("import os")
    assert not result["success"]
    assert "Security violation" in result["error"]

def test_file_size_limit():
    # Create 600MB file
    large_file = create_large_file(600 * 1024 * 1024)
    response = client.post("/api/data/upload", files={"file": large_file})
    assert response.status_code == 413
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth)

---

## 🆘 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@your-domain.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

---

**Last Updated:** 2024
**Version:** 2.0.0
**Security Level:** Development (Not production-ready without authentication)
