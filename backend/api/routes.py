"""
API Routes for DataSynth Analytics Hub
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import io
import uuid
import os
import json
import pickle
from pathlib import Path

# Persistence Configuration
STORAGE_DIR = Path("data/uploads")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
MANIFEST_FILE = STORAGE_DIR / "manifest.json"

# File upload limits
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.json', '.parquet'}

# Import services
import sys
sys.path.append('..')
from services.profiler import DataProfiler
from services.ml_engine import MLEngine
from services.data_prep import DataPreparation
from services.visualizer import Visualizer
from services.code_executor import CodeExecutor
from services.ai_agent import AIAgent
from services.vision_service import VisionService

router = APIRouter()

# Initialize services
profiler = DataProfiler()
ml_engine = MLEngine()
data_prep = DataPreparation()
visualizer = Visualizer()
code_executor = CodeExecutor()
ai_agent = AIAgent()
vision_service = VisionService()

# In-memory storage for datasets
datasets_store = {}

def save_to_disk(dataset_id: str, df: pd.DataFrame, filename: str):
    """Save dataset to disk and update manifest"""
    # Save the dataframe
    file_path = STORAGE_DIR / f"{dataset_id}.parquet"
    df.to_parquet(file_path)
    
    # Update manifest
    manifest = {}
    if MANIFEST_FILE.exists():
        with open(MANIFEST_FILE, 'r') as f:
            manifest = json.load(f)
    
    manifest[dataset_id] = {
        "id": dataset_id,
        "filename": filename,
        "path": str(file_path)
    }
    
    with open(MANIFEST_FILE, 'w') as f:
        json.dump(manifest, f)

def load_from_disk():
    """Load all datasets from disk on startup"""
    if not MANIFEST_FILE.exists():
        return
    
    try:
        with open(MANIFEST_FILE, 'r') as f:
            manifest = json.load(f)
        
        for dataset_id, info in manifest.items():
            file_path = Path(info["path"])
            if file_path.exists():
                df = pd.read_parquet(file_path)
                datasets_store[dataset_id] = {
                    "id": dataset_id,
                    "filename": info["filename"],
                    "dataframe": df,
                    "shape": {"rows": len(df), "columns": len(df.columns)},
                    "columns": list(df.columns)
                }
        print(f"Loaded {len(datasets_store)} datasets from persistent storage.")
    except Exception as e:
        print(f"Error loading datasets: {e}")

# Initial load
load_from_disk()


# Pydantic models
class MLTrainRequest(BaseModel):
    dataset_id: str
    target_column: str
    model_type: str
    task: str = "regression"
    test_size: float = 0.2
    params: Optional[Dict] = None


class DataPrepRequest(BaseModel):
    dataset_id: str
    operations: List[Dict]


class VisualizeRequest(BaseModel):
    dataset_id: str
    plot_config: Dict


class CodeExecutionRequest(BaseModel):
    code: str
    dataset_id: Optional[str] = None


class AIAnalyzeRequest(BaseModel):
    dataset_id: str
    query: Optional[str] = None


# Data Management
@router.post("/data/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a dataset with size and type validation"""
    try:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        content = await file.read()
        
        # Validate file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(content))
        elif file.filename.endswith('.parquet'):
            df = pd.read_parquet(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        dataset_id = str(uuid.uuid4())
        
        datasets_store[dataset_id] = {
            "id": dataset_id,
            "filename": file.filename,
            "dataframe": df,
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "columns": list(df.columns)
        }
        
        # Save to disk for persistence
        save_to_disk(dataset_id, df, file.filename)
        
        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "columns": list(df.columns),
            "preview": df.head(5).to_dict(orient="records")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/list")
async def list_datasets():
    """List all datasets"""
    return [
        {
            "id": ds["id"],
            "filename": ds["filename"],
            "shape": ds["shape"],
            "columns": ds["columns"]
        }
        for ds in datasets_store.values()
    ]


@router.get("/data/prep-strategies")
async def get_prep_strategies():
    """Get data prep strategies"""
    return data_prep.get_available_strategies()


@router.get("/data/summary/{dataset_id}")
async def get_dataset_summary(dataset_id: str):
    """Generate summary statistics for dashboard charts"""
    if dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = datasets_store[dataset_id]["dataframe"]
    
    # Generate simple time-series or category summary for preview charts
    # If there's a numeric column, group it. If not, just row counts.
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    
    if numeric_cols:
        target = numeric_cols[0]
        # Just top 10 for simplicity in this dashboard view
        summary = df.head(10)[[target]].reset_index().to_dict(orient="records")
    else:
        summary = [{"index": i, "value": 1} for i in range(min(10, len(df)))]

    return {
        "stats": {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "missing_values": int(df.isnull().sum().sum()),
            "memory_usage": f"{df.memory_usage().sum() / 1024:.2f} KB"
        },
        "chart_data": summary,
        "columns": list(df.columns),
        "numeric_columns": numeric_cols
    }


@router.get("/data/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get dataset details"""
    if dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    ds = datasets_store[dataset_id]
    return {
        "id": ds["id"],
        "filename": ds["filename"],
        "shape": ds["shape"],
        "columns": ds["columns"],
        "preview": ds["dataframe"].head(10).to_dict(orient="records")
    }

@router.delete("/data/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset from memory and disk"""
    if dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # 1. Remove from memory
    del datasets_store[dataset_id]
    
    # 2. Update manifest and remove from disk
    if MANIFEST_FILE.exists():
        with open(MANIFEST_FILE, 'r') as f:
            manifest = json.load(f)
        
        if dataset_id in manifest:
            file_path = Path(manifest[dataset_id]["path"])
            if file_path.exists():
                file_path.unlink() # Delete parquet file
            
            del manifest[dataset_id]
            
            with open(MANIFEST_FILE, 'w') as f:
                json.dump(manifest, f)
                
    return {"status": "success", "message": f"Dataset {dataset_id} deleted"}


# Data Profiling
@router.post("/data/profile")
async def profile_dataset(request: Dict):
    """Generate comprehensive data profile"""
    dataset_id = request.get("dataset_id")
    
    if dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = datasets_store[dataset_id]["dataframe"]
    
    try:
        profile = profiler.comprehensive_profile(df)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Machine Learning
@router.post("/ml/train")
async def train_model(request: MLTrainRequest):
    """Train ML model"""
    if request.dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = datasets_store[request.dataset_id]["dataframe"]
    
    try:
        result = ml_engine.train_model(
            df=df,
            target_column=request.target_column,
            model_type=request.model_type,
            task=request.task,
            test_size=request.test_size,
            params=request.params or {}
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ml/models")
async def get_available_models():
    """Get available ML models"""
    return ml_engine.get_available_models()


# Data Preparation
@router.post("/data/prepare")
async def prepare_data(request: DataPrepRequest):
    """Prepare data"""
    if request.dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = datasets_store[request.dataset_id]["dataframe"]
    
    try:
        result = data_prep.prepare_data(df, request.operations)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Visualization
@router.post("/data/visualize")
async def create_visualization(request: VisualizeRequest):
    """Generate a visualization"""
    if request.dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = datasets_store[request.dataset_id]["dataframe"]
    
    try:
        result = visualizer.generate_plot(df, request.plot_config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Code Execution (Notebook)
@router.post("/execute")
async def execute_code(request: CodeExecutionRequest):
    """Execute Python code"""
    context = {}
    if request.dataset_id and request.dataset_id in datasets_store:
        context['df'] = datasets_store[request.dataset_id]["dataframe"]
        
    try:
        result = code_executor.execute_python_code(request.code, context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# AI Insights
@router.post("/ai/analyze")
async def analyze_data(request: AIAnalyzeRequest):
    """Generate AI insights for a dataset"""
    if request.dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    df = datasets_store[request.dataset_id]["dataframe"]
    profile = profiler.comprehensive_profile(df)
    
    try:
        if request.query:
            response = await ai_agent.chat_with_context(request.query, profile)
            return {"response": response}
        else:
            insights = ai_agent.generate_insights(profile)
            return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi.responses import StreamingResponse

# Vision Suite
@router.post("/vision/analyze")
async def analyze_vision(file: UploadFile = File(...), models: str = "yolov8", confidence: float = 0.5):
    """Analyze a video file and stream results"""
    try:
        temp_id = str(uuid.uuid4())
        temp_path = STORAGE_DIR / f"temp_vid_{temp_id}.mp4"
        
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
            
        model_list = models.split(",")
        
        return StreamingResponse(
            vision_service.stream_video(str(temp_path), model_list, confidence),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vision/models")
async def list_vision_models():
    """List available vision models and their configs"""
    from services.vision_service import CONFIG
    return CONFIG["models"]

@router.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "online",
        "cpu": "stable",
        "memory": "optimal",
        "services": {
            "ml_engine": "active",
            "vision_suite": "active",
            "profiler": "active"
        }
    }

