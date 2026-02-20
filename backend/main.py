import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Insight-Hub Execution Engine",
    description="Enterprise Data Intelligence Platform API",
    version="2.0.0"
)

# Configure CORS - Restrict to specific origins for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",  # Alternative localhost
        "https://your-production-domain.vercel.app",  # Add your production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Insight-Hub Execution Engine",
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "insight-hub-backend",
        "timestamp": __import__('datetime').datetime.now().isoformat()
    }

def print_banner():
    """Print startup banner"""
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║              INSIGHT-HUB EXECUTION ENGINE v2.0                ║
    ║                                                               ║
    ║         Enterprise Data Intelligence Platform API             ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    🚀 Server Status: ONLINE
    📡 API Endpoint: http://localhost:8000
    📚 Documentation: http://localhost:8000/docs
    🔍 Health Check: http://localhost:8000/health
    
    ✨ Features Enabled:
       • AI Co-Pilot (Groq + DeepSeek)
       • ML Training (15+ Algorithms)
       • Computer Vision (YOLO v8/v9/v11/v12)
       • Data Analytics Engine
       • Code Execution Sandbox
    
    ⚡ Ready to process requests...
    """
    print(banner)

if __name__ == "__main__":
    print_banner()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
