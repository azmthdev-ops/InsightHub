#!/usr/bin/env python3
"""
Insight-Hub System Status Checker
Verifies all services are running and accessible
"""

import sys
import time
import requests
from pathlib import Path

def check_service(name, url, timeout=5):
    """Check if a service is accessible"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            print(f"✅ {name}: Online ({url})")
            return True
        else:
            print(f"⚠️ {name}: Responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection refused ({url})")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name}: Timeout ({url})")
        return False
    except Exception as e:
        print(f"❌ {name}: Error - {str(e)}")
        return False

def check_file(name, path):
    """Check if a file exists"""
    if Path(path).exists():
        print(f"✅ {name}: Found")
        return True
    else:
        print(f"⚠️ {name}: Not found (will auto-download)")
        return True  # Not critical

def main():
    print("=" * 70)
    print("  Insight-Hub System Status Check")
    print("=" * 70)
    print()
    
    results = []
    
    # Check Backend
    print("🔧 Backend Services:")
    results.append(check_service("FastAPI Server", "http://localhost:8000"))
    results.append(check_service("Health Endpoint", "http://localhost:8000/health"))
    results.append(check_service("API Docs", "http://localhost:8000/docs"))
    print()
    
    # Check Frontend
    print("🌐 Frontend Services:")
    results.append(check_service("Next.js Server", "http://localhost:3000"))
    print()
    
    # Check Files
    print("📁 Critical Files:")
    results.append(check_file("YOLO Model", "backend/yolov8n.pt"))
    results.append(check_file("Environment Config", "web/.env.local"))
    print()
    
    # Check API Endpoints
    print("📡 API Endpoints:")
    try:
        response = requests.get("http://localhost:8000/api/data/list", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Data API: {len(data)} datasets loaded")
            results.append(True)
        else:
            print(f"⚠️ Data API: Status {response.status_code}")
            results.append(False)
    except Exception as e:
        print(f"❌ Data API: {str(e)}")
        results.append(False)
    print()
    
    # Summary
    print("=" * 70)
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total) * 100
    
    print(f"Status: {passed}/{total} checks passed ({success_rate:.1f}%)")
    print()
    
    if success_rate == 100:
        print("🎉 All systems operational!")
        print()
        print("Access your application:")
        print("  Frontend: http://localhost:3000")
        print("  Backend:  http://localhost:8000")
        print("  API Docs: http://localhost:8000/docs")
        return 0
    elif success_rate >= 70:
        print("⚠️ Some services are not running.")
        print()
        print("To start services:")
        print("  Backend:  cd backend && python main.py")
        print("  Frontend: cd web && npm run dev")
        return 1
    else:
        print("❌ Critical services are down.")
        print()
        print("Please check:")
        print("  1. Backend is running on port 8000")
        print("  2. Frontend is running on port 3000")
        print("  3. All dependencies are installed")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nStatus check interrupted.")
        sys.exit(1)
