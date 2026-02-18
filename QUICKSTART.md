# 🚀 Insight-Hub Quick Start Guide

**Get your production-ready SaaS platform running in 5 minutes!**

---

## ⚡ Super Quick Start (Windows)

### Option 1: One-Click Launch
```bash
# Just double-click this file:
start.bat
```

That's it! Your browser will open automatically.

---

## 📋 Manual Setup (All Platforms)

### Step 1: Install Dependencies

**Backend:**
```bash
cd insight-hub/backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd insight-hub/web
npm install
```

### Step 2: Start Services

**Terminal 1 - Backend:**
```bash
cd insight-hub/backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd insight-hub/web
npm run dev
```

### Step 3: Access Application

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ✅ Verify Everything Works

```bash
# Run system check
python check_status.py

# Or test manually
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## 🎯 First Steps in the App

### 1. Upload Your First Dataset
1. Go to **Dashboard** → **Data** tab
2. Click **Upload Dataset**
3. Select a CSV/Excel file
4. Preview your data

### 2. Try the AI Co-Pilot
1. Go to **Dashboard** → **Chat** tab
2. Type: "Analyze the distribution of my data"
3. Watch the AI generate insights in real-time!

### 3. Train Your First Model
1. Go to **Dashboard** → **ML Studio** tab
2. Select your dataset
3. Choose target column
4. Pick an algorithm (try Random Forest)
5. Click **Train Model**
6. View results and feature importance

### 4. Process a Video (Vision Lab)
1. Go to **Dashboard** → **Vision** tab
2. Upload a video file
3. Select YOLO model
4. Watch real-time object detection!

---

## 🎨 UI Features

### Black & White Theme
- Pure black backgrounds for that sleek look
- White/zinc text with perfect contrast
- Blue accents for important actions
- Smooth animations everywhere

### Terminal-Style Chat
- Real-time streaming responses
- Code syntax highlighting
- Execute Python code directly
- Multi-model AI reasoning

### Interactive Dashboards
- Live charts and graphs
- Drag-and-drop file uploads
- Real-time metrics
- Responsive design

---

## 🔑 API Keys (Already Configured!)

Your `.env.local` file already has:
- ✅ **Groq API Key** - For Llama 3.3 70B (fast inference)
- ✅ **DeepSeek API Key** - For DeepSeek R1 (advanced reasoning)
- ✅ **Supabase** - For database and auth

**No setup needed - just start coding!**

---

## 📚 Learn More

### Documentation
- **Full Setup**: See `PRODUCTION_SETUP.md`
- **Deployment**: See `DEPLOYMENT.md`
- **API Reference**: http://localhost:8000/docs

### Example Queries for AI Co-Pilot
```
"Show me the correlation between price and quantity"
"Create a scatter plot of sales vs profit"
"Find outliers in the revenue column"
"Generate Python code to clean missing values"
"Train a model to predict customer churn"
```

### Available ML Algorithms
- Random Forest (Regression & Classification)
- XGBoost (Gradient Boosting)
- Support Vector Machines (SVM)
- Neural Networks (MLP)
- K-Nearest Neighbors (KNN)
- Decision Trees
- Logistic Regression
- Linear Regression
- And more...

---

## 🐛 Common Issues

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### "Module not found"
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd web
rm -rf node_modules
npm install
```

### "YOLO model not found"
Don't worry! It will auto-download on first run (about 6MB).

### "Chat not responding"
1. Check backend is running: http://localhost:8000/health
2. Check browser console for errors
3. Verify API keys in `.env.local`

---

## 🎉 You're Ready!

Your production-grade SaaS platform is now running!

**What you have:**
- ✅ AI-powered chat terminal
- ✅ Data analytics engine
- ✅ ML training studio
- ✅ Computer vision lab
- ✅ Beautiful black/white UI
- ✅ Real-time streaming
- ✅ Code execution
- ✅ Interactive visualizations

**Next steps:**
1. Upload your data
2. Ask the AI questions
3. Train some models
4. Build something amazing!

---

## 💬 Need Help?

- Check `README.md` for detailed docs
- Run `python test_setup.py` to verify installation
- Run `python check_status.py` to check services
- Check API docs at http://localhost:8000/docs

---

**Built with ❤️ - Now go build something incredible!**
