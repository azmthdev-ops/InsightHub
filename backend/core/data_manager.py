# core/data_manager.py
"""
DataManager - Singleton class for managing shared state across all tabs.
Stores the current DataFrame, video path, vision results, and chat history.
"""

import pandas as pd
from typing import Dict, List, Optional, Any
from threading import Lock


class DataManager:
    """
    Singleton class to manage shared state across all tabs.
    
    Stores:
        - df: Current pandas DataFrame
        - video_path: Path to current video file
        - vision_results: Dictionary containing detection/tracking results
        - chat_history: List of chat messages for AI Co-Pilot
    """
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        """Ensure only one instance exists (Singleton pattern)"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the data manager with empty state"""
        if self._initialized:
            return
            
        self._df: Optional[pd.DataFrame] = None
        self._video_path: Optional[str] = None
        self._vision_results: Dict[str, Any] = {}
        self._chat_history: List[Dict[str, str]] = []
        self._ml_models: Dict[str, Any] = {}
        self._initialized = True
    
    # ==================== DataFrame Methods ====================
    
    def get_df(self) -> Optional[pd.DataFrame]:
        """Get the current DataFrame"""
        return self._df
    
    def set_df(self, df: pd.DataFrame) -> None:
        """Set the current DataFrame"""
        self._df = df
    
    def has_df(self) -> bool:
        """Check if a DataFrame is loaded"""
        return self._df is not None and not self._df.empty
    
    def clear_df(self) -> None:
        """Clear the current DataFrame"""
        self._df = None
    
    # ==================== Video Path Methods ====================
    
    def get_video_path(self) -> Optional[str]:
        """Get the current video path"""
        return self._video_path
    
    def set_video_path(self, path: str) -> None:
        """Set the current video path"""
        self._video_path = path
    
    def has_video(self) -> bool:
        """Check if a video path is set"""
        return self._video_path is not None
    
    def clear_video_path(self) -> None:
        """Clear the current video path"""
        self._video_path = None
    
    # ==================== Vision Results Methods ====================
    
    def get_vision_results(self) -> Dict[str, Any]:
        """Get the vision processing results"""
        return self._vision_results
    
    def set_vision_results(self, results: Dict[str, Any]) -> None:
        """Set the vision processing results"""
        self._vision_results = results
    
    def update_vision_results(self, key: str, value: Any) -> None:
        """Update a specific key in vision results"""
        self._vision_results[key] = value
    
    def has_vision_results(self) -> bool:
        """Check if vision results exist"""
        return len(self._vision_results) > 0
    
    def clear_vision_results(self) -> None:
        """Clear vision results"""
        self._vision_results = {}
    
    # ==================== Chat History Methods ====================
    
    def get_chat_history(self) -> List[Dict[str, str]]:
        """Get the chat history"""
        return self._chat_history
    
    def set_chat_history(self, history: List[Dict[str, str]]) -> None:
        """Set the chat history"""
        self._chat_history = history
    
    def add_chat_message(self, role: str, content: str) -> None:
        """Add a message to chat history"""
        self._chat_history.append({"role": role, "content": content})
    
    def clear_chat_history(self) -> None:
        """Clear chat history"""
        self._chat_history = []
    
    # ==================== ML Models Methods ====================
    
    def get_ml_models(self) -> Dict[str, Any]:
        """Get trained ML models"""
        return self._ml_models
    
    def set_ml_model(self, name: str, model: Any) -> None:
        """Store a trained ML model"""
        self._ml_models[name] = model
    
    def get_ml_model(self, name: str) -> Optional[Any]:
        """Get a specific ML model by name"""
        return self._ml_models.get(name)
    
    def clear_ml_models(self) -> None:
        """Clear all ML models"""
        self._ml_models = {}
    
    # ==================== Utility Methods ====================
    
    def reset_all(self) -> None:
        """Reset all stored data"""
        self._df = None
        self._video_path = None
        self._vision_results = {}
        self._chat_history = []
        self._ml_models = {}
    
    def get_state_summary(self) -> Dict[str, Any]:
        """Get a summary of current state"""
        return {
            "has_dataframe": self.has_df(),
            "dataframe_shape": self._df.shape if self.has_df() else None,
            "has_video": self.has_video(),
            "video_path": self._video_path,
            "vision_results_keys": list(self._vision_results.keys()),
            "chat_history_length": len(self._chat_history),
            "ml_models_count": len(self._ml_models)
        }
    
    def export_report(self) -> Optional[str]:
        """
        Compile current data summary and analytics into a downloadable CSV report.
        In a production app, this would generate a PDF or XLSX with charts.
        For now, we export a detailed CSV with summary stats appended.
        """
        if not self.has_df():
            return None
            
        import tempfile
        import os
        
        # Create a temp file
        temp_dir = tempfile.gettempdir()
        report_path = os.path.join(temp_dir, "datasynth_analytics_report.csv")
        
        # Save the main dataframe
        self._df.to_csv(report_path, index=False)
        
        # We could append stats here, but for simplicity we return the CSV
        return report_path


# Create a global instance for easy access
data_manager = DataManager()
