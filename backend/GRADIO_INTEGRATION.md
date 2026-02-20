# Gradio Integration Guide

## Overview

The Insight-Hub platform includes **two backend interfaces**:

1. **FastAPI (main.py)** - Production REST API for Next.js frontend
2. **Gradio (app.py)** - Interactive visualization and prototyping interface

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INSIGHT-HUB BACKEND                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   FastAPI        │         │   Gradio UI      │        │
│  │   (main.py)      │         │   (app.py)       │        │
│  │   Port: 8000     │         │   Port: 7860     │        │
│  └──────────────────┘         └──────────────────┘        │
│          │                             │                    │
│          └─────────────┬───────────────┘                    │
│                        │                                    │
│              ┌─────────▼─────────┐                         │
│              │  Shared Services  │                         │
│              │  - ML Engine      │                         │
│              │  - Data Manager   │                         │
│              │  - Vision Engine  │                         │
│              │  - AI Engine      │                         │
│              └───────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## When to Use Each

### FastAPI (main.py) - Production
**Use for:**
- Production deployments
- Next.js frontend integration
- REST API endpoints
- Scalable architecture
- Docker deployments

**Start:**
```bash
cd insight-hub/backend
python main.py
```

**Access:** http://localhost:8000

---

### Gradio (app.py) - Visualization & Prototyping
**Use for:**
- Quick data visualization
- Interactive prototyping
- Demo presentations
- Testing new features
- Non-technical user access

**Start:**
```bash
cd insight-hub/backend
python app.py
```

**Access:** http://localhost:7860

## Gradio Features

### 1. Data Ingestion Tab
- Upload CSV, Excel, JSON, Parquet files
- Preview data in table format
- View column types and statistics

### 2. Vision Lab Tab
- Upload videos for YOLO processing
- Real-time object detection
- Multi-object tracking
- Trajectory prediction

### 3. Analytics Hub Tab
- Statistical profiling
- Correlation analysis
- Outlier detection
- ML model training

### 4. AI Co-Pilot Tab
- Natural language queries
- Code generation
- Data insights
- Business recommendations

## Shared Components

Both interfaces use the same core services:

```python
# Shared across FastAPI and Gradio
from core.ai_engine import ai_engine
from core.data_manager import data_manager
from core.analytics_engine import analytics_engine
from core.vision_engine import vision_engine
```

## Running Both Simultaneously

You can run both interfaces at the same time:

**Terminal 1 - FastAPI:**
```bash
cd insight-hub/backend
python main.py
```

**Terminal 2 - Gradio:**
```bash
cd insight-hub/backend
python app.py
```

**Terminal 3 - Frontend:**
```bash
cd insight-hub/web
npm run dev
```

Now you have:
- FastAPI REST API: http://localhost:8000
- Gradio UI: http://localhost:7860
- Next.js Frontend: http://localhost:3000

## Configuration

### Gradio Settings (app.py)

```python
app.launch(
    server_name="127.0.0.1",  # Localhost only
    server_port=7860,          # Default Gradio port
    share=False,               # Don't create public link
    debug=True,                # Enable debug mode
    show_error=True            # Show detailed errors
)
```

### FastAPI Settings (main.py)

```python
uvicorn.run(
    "main:app", 
    host="0.0.0.0",  # Accept external connections
    port=8000,        # Standard HTTP port
    reload=True       # Auto-reload on code changes
)
```

## API Key Configuration

Both interfaces use environment variables for API keys:

```bash
# .env file
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
```

**Important:** Never hardcode API keys in the code!

## Deployment Recommendations

### Development
- Use both FastAPI and Gradio locally
- Gradio for quick testing and visualization
- FastAPI for frontend integration

### Staging
- Deploy FastAPI only
- Use Gradio locally for demos

### Production
- Deploy FastAPI only
- Disable Gradio in production
- Use Next.js frontend exclusively

## Gradio UI Customization

The Gradio interface uses a custom theme:

```python
theme=gr.themes.Soft(
    primary_hue="indigo",
    secondary_hue="purple",
    neutral_hue="slate"
)
```

Custom CSS is applied for:
- Glassmorphism effects
- Neon glow buttons
- Terminal-style headers
- Smooth animations

## Troubleshooting

### Port Conflicts

If port 7860 is in use:
```python
# Change in app.py
app.launch(server_port=7861)  # Use different port
```

### Gradio Not Loading

1. Check if Gradio is installed:
```bash
pip install gradio
```

2. Check for errors:
```bash
python app.py
```

3. Try different browser

### Shared State Issues

Both interfaces share the same `data_manager` state. If you upload data in Gradio, it's available in FastAPI and vice versa.

## Best Practices

1. **Use FastAPI for production** - It's more scalable and secure
2. **Use Gradio for demos** - It's more visual and interactive
3. **Keep services in sync** - Both should use the same core logic
4. **Don't expose Gradio publicly** - It's meant for internal use
5. **Use environment variables** - Never hardcode secrets

## Future Enhancements

- [ ] Add authentication to Gradio
- [ ] Sync state between FastAPI and Gradio
- [ ] Add more visualization options
- [ ] Create Gradio-specific features
- [ ] Add export functionality

## Summary

- **FastAPI (main.py)**: Production REST API for Next.js frontend
- **Gradio (app.py)**: Interactive visualization and prototyping tool
- **Both share**: Same core services and data manager
- **Use case**: FastAPI for production, Gradio for demos and testing

---

**Need help?** Check the main README.md or contact the development team.
