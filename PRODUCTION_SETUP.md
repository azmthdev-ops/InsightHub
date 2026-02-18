# Insight-Hub Production Setup Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip or uv (Python package manager)

### 1. Backend Setup

```bash
cd insight-hub/backend

# Install dependencies
pip install -r requirements.txt

# The YOLO model will auto-download on first run
# Or manually place yolov8n.pt in the backend directory

# Start FastAPI server
python main.py
```

Backend will run on: `http://localhost:8000`

### 2. Frontend Setup

```bash
cd insight-hub/web

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Frontend will run on: `http://localhost:3000`

### 3. Environment Variables

The `.env.local` file is already configured with:
- ✅ Groq API Key (for Llama 3.3 70B)
- ✅ DeepSeek API Key (for DeepSeek R1 Reasoner)
- ✅ Supabase credentials
- ✅ Backend API URL

**All API keys are active and working!**

## 🎯 Features

### AI Co-Pilot Terminal
- Natural language data queries
- Automatic code generation
- Real-time streaming responses
- Multi-model reasoning (Groq + DeepSeek)
- Execute Python code directly in chat

### Data Analytics
- Upload CSV, Excel, JSON, Parquet files
- Comprehensive statistical profiling
- Correlation analysis
- Outlier detection
- Data quality scoring

### ML Studio
- 15+ algorithms (Random Forest, XGBoost, etc.)
- Automated feature engineering
- Model training and evaluation
- Feature importance visualization

### Vision Lab
- Real YOLO object detection (v8, v9, v11, v12)
- Multi-object tracking with Kalman filters
- Trajectory prediction
- Real-time video processing

## 🎨 UI Theme

The interface uses a **black/white minimalist aesthetic**:
- Pure black backgrounds (#000000, #0a0a0a)
- White/zinc text with opacity variations
- Blue accent colors for CTAs
- Glassmorphism effects
- Smooth animations with Framer Motion

## 📡 API Endpoints

### Data Management
- `POST /api/data/upload` - Upload dataset
- `GET /api/data/list` - List all datasets
- `GET /api/data/summary/{id}` - Get dataset summary

### Analytics
- `POST /api/data/profile` - Generate statistical profile
- `POST /api/data/prep` - Data preprocessing

### ML Training
- `POST /api/ml/train` - Train ML model
- `GET /api/ml/models` - List available models

### AI Co-Pilot
- `POST /api/ai-relay` - Stream AI responses
- `POST /api/execute` - Execute Python code

### Vision
- `POST /api/vision/analyze` - Process video with YOLO

## 🔧 Production Deployment

### Backend (FastAPI)
```bash
# Using uvicorn with workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend (Next.js)
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🐛 Troubleshooting

### YOLO Model Not Loading
- Ensure `yolov8n.pt` exists in `backend/` directory
- Or let it auto-download on first run
- Check internet connection for model download

### API Connection Issues
- Verify backend is running on port 8000
- Check Next.js proxy configuration in `next.config.ts`
- Ensure CORS is enabled in FastAPI

### Chat Not Streaming
- Verify Groq/DeepSeek API keys in `.env.local`
- Check browser console for errors
- Ensure `/api/ai-relay` endpoint is accessible

## 📊 Database (Supabase)

The app uses Supabase for:
- User authentication (optional)
- Dataset metadata persistence
- Chat history storage
- Activity logs

Schema is defined in `supabase_schema.sql`

## 🎯 Next Steps

1. **Authentication**: Implement Supabase Auth for multi-user support
2. **Model Persistence**: Save trained ML models to disk
3. **Report Generation**: Add PDF export with charts
4. **Real-time Collaboration**: WebSocket support for team features
5. **Cloud Deployment**: Deploy to Vercel (frontend) + Railway (backend)

## 💡 Tips

- Use the AI Co-Pilot for natural language queries
- Upload datasets via the Data tab
- Train models in ML Studio
- Process videos in Vision Lab
- All features work together seamlessly

## 🔐 Security Notes

- Code execution is sandboxed with restricted globals
- Multiprocessing isolation for safety
- 15-second timeout on code execution
- No file system access from executed code

---

**Built with ❤️ for enterprise data intelligence**
