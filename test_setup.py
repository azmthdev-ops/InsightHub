#!/usr/bin/env python3
"""
Insight-Hub Setup Verification Script
Tests all critical components and dependencies
"""

import sys
import importlib
from pathlib import Path

def test_import(module_name, package_name=None):
    """Test if a module can be imported"""
    try:
        importlib.import_module(module_name)
        print(f"✅ {package_name or module_name}")
        return True
    except ImportError as e:
        print(f"❌ {package_name or module_name}: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("  Insight-Hub Backend Setup Verification")
    print("=" * 60)
    print()
    
    # Core dependencies
    print("📦 Core Dependencies:")
    results = []
    results.append(test_import("fastapi", "FastAPI"))
    results.append(test_import("uvicorn", "Uvicorn"))
    results.append(test_import("pandas", "Pandas"))
    results.append(test_import("numpy", "NumPy"))
    print()
    
    # ML/Analytics
    print("🤖 ML & Analytics:")
    results.append(test_import("sklearn", "scikit-learn"))
    results.append(test_import("scipy", "SciPy"))
    results.append(test_import("xgboost", "XGBoost"))
    results.append(test_import("plotly", "Plotly"))
    print()
    
    # Computer Vision
    print("👁️ Computer Vision:")
    results.append(test_import("cv2", "OpenCV"))
    results.append(test_import("torch", "PyTorch"))
    results.append(test_import("ultralytics", "Ultralytics YOLO"))
    print()
    
    # AI/LLM
    print("🧠 AI & LLM:")
    results.append(test_import("groq", "Groq SDK"))
    results.append(test_import("google.generativeai", "Google Gemini"))
    results.append(test_import("httpx", "HTTPX"))
    print()
    
    # File handling
    print("📄 File Handling:")
    results.append(test_import("openpyxl", "OpenPyXL"))
    results.append(test_import("pyarrow", "PyArrow"))
    print()
    
    # Check YOLO model
    print("🎯 YOLO Model:")
    model_path = Path("backend/yolov8n.pt")
    if model_path.exists():
        print(f"✅ YOLOv8n model found at {model_path}")
        results.append(True)
    else:
        print(f"⚠️ YOLOv8n model not found (will auto-download on first run)")
        results.append(True)  # Not critical
    print()
    
    # Summary
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total) * 100
    
    print(f"Results: {passed}/{total} checks passed ({success_rate:.1f}%)")
    
    if success_rate == 100:
        print("🎉 All systems operational! Ready for production.")
        return 0
    elif success_rate >= 80:
        print("⚠️ Most systems operational. Some optional features may be limited.")
        return 0
    else:
        print("❌ Critical dependencies missing. Please install requirements:")
        print("   pip install -r backend/requirements.txt")
        return 1

if __name__ == "__main__":
    sys.exit(main())
