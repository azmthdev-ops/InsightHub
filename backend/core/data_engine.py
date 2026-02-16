# core/data_engine.py
"""
DataEngine - Handles data loading, encoding detection, and quality analysis.
Supports CSV, Excel, JSON, and Parquet file formats.
"""

import pandas as pd
import os
from typing import Dict, Any, Optional, Tuple
from pathlib import Path


class DataEngine:
    """
    Data loading and profiling engine.
    
    Features:
        - Multi-format support (CSV, Excel, JSON, Parquet)
        - Automatic encoding detection for CSV files
        - Data quality summary generation
    """
    
    # Supported file extensions
    SUPPORTED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.json', '.parquet', '.tsv'}
    
    # Common encodings to try (in order of likelihood)
    ENCODINGS_TO_TRY = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'utf-16']
    
    def __init__(self):
        self.last_encoding_used: Optional[str] = None
        self.last_file_path: Optional[str] = None
    
    def detect_encoding(self, file_path: str) -> str:
        """
        Detect the encoding of a CSV file by trying common encodings.
        
        Args:
            file_path: Path to the CSV file
            
        Returns:
            The detected encoding string
        """
        for encoding in self.ENCODINGS_TO_TRY:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    # Try reading the first 10000 characters
                    f.read(10000)
                return encoding
            except (UnicodeDecodeError, UnicodeError):
                continue
        
        # Default fallback
        return 'utf-8'
    
    def load_data(self, file_path: str) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
        """
        Load data from a file based on its extension.
        
        Args:
            file_path: Path to the data file
            
        Returns:
            Tuple of (DataFrame or None, error message or None)
        """
        if not file_path or not os.path.exists(file_path):
            return None, "File not found or path is empty"
        
        # Get file extension
        ext = Path(file_path).suffix.lower()
        
        if ext not in self.SUPPORTED_EXTENSIONS:
            return None, f"Unsupported file format: {ext}. Supported: {', '.join(self.SUPPORTED_EXTENSIONS)}"
        
        try:
            self.last_file_path = file_path
            
            if ext == '.csv':
                # Detect encoding first
                encoding = self.detect_encoding(file_path)
                self.last_encoding_used = encoding
                df = pd.read_csv(file_path, encoding=encoding)
                
            elif ext == '.tsv':
                encoding = self.detect_encoding(file_path)
                self.last_encoding_used = encoding
                df = pd.read_csv(file_path, encoding=encoding, sep='\t')
                
            elif ext in ['.xlsx', '.xls']:
                df = pd.read_excel(file_path)
                self.last_encoding_used = None
                
            elif ext == '.json':
                df = pd.read_json(file_path)
                self.last_encoding_used = None
                
            elif ext == '.parquet':
                df = pd.read_parquet(file_path)
                self.last_encoding_used = None
            
            else:
                return None, f"Unsupported file format: {ext}"
            
            return df, None
            
        except pd.errors.EmptyDataError:
            return None, "The file is empty"
        except pd.errors.ParserError as e:
            return None, f"Error parsing file: {str(e)}"
        except Exception as e:
            return None, f"Error loading file: {str(e)}"
    
    def get_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate a quality summary of the DataFrame.
        
        Args:
            df: The pandas DataFrame to analyze
            
        Returns:
            Dictionary containing data quality metrics
        """
        if df is None or df.empty:
            return {
                "status": "error",
                "message": "No data loaded"
            }
        
        # Calculate missing values per column
        missing_per_column = df.isnull().sum().to_dict()
        missing_percentage = {
            col: round((count / len(df)) * 100, 2) 
            for col, count in missing_per_column.items()
        }
        
        # Get column data types
        column_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Calculate memory usage
        memory_bytes = df.memory_usage(deep=True).sum()
        if memory_bytes < 1024:
            memory_str = f"{memory_bytes} B"
        elif memory_bytes < 1024 * 1024:
            memory_str = f"{memory_bytes / 1024:.2f} KB"
        else:
            memory_str = f"{memory_bytes / (1024 * 1024):.2f} MB"
        
        # Identify numeric and categorical columns
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        
        # Build summary
        summary = {
            "status": "success",
            "basic_info": {
                "rows": len(df),
                "columns": len(df.columns),
                "memory_usage": memory_str,
                "total_cells": len(df) * len(df.columns),
                "total_missing": int(df.isnull().sum().sum()),
                "completeness": round((1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100, 2)
            },
            "column_types": {
                "numeric": len(numeric_cols),
                "categorical": len(categorical_cols),
                "datetime": len(datetime_cols),
                "total": len(df.columns)
            },
            "missing_values": {
                "per_column": missing_per_column,
                "percentage": missing_percentage
            },
            "column_info": column_types,
            "encoding_used": self.last_encoding_used
        }
        
        return summary
    
    def get_preview(self, df: pd.DataFrame, n_rows: int = 10) -> pd.DataFrame:
        """
        Get a preview of the first N rows.
        
        Args:
            df: The DataFrame to preview
            n_rows: Number of rows to return
            
        Returns:
            First N rows of the DataFrame
        """
        if df is None or df.empty:
            return pd.DataFrame()
        return df.head(n_rows)
    
    def get_column_stats(self, df: pd.DataFrame) -> Dict[str, Dict]:
        """
        Get detailed statistics for each column.
        
        Args:
            df: The DataFrame to analyze
            
        Returns:
            Dictionary with statistics per column
        """
        stats = {}
        
        for col in df.columns:
            col_stats = {
                "dtype": str(df[col].dtype),
                "non_null": int(df[col].count()),
                "null_count": int(df[col].isnull().sum()),
                "unique": int(df[col].nunique())
            }
            
            # Add numeric stats if applicable
            if pd.api.types.is_numeric_dtype(df[col]):
                col_stats.update({
                    "mean": round(df[col].mean(), 4) if not df[col].isnull().all() else None,
                    "std": round(df[col].std(), 4) if not df[col].isnull().all() else None,
                    "min": df[col].min() if not df[col].isnull().all() else None,
                    "max": df[col].max() if not df[col].isnull().all() else None,
                })
            
            stats[col] = col_stats
        
        return stats


# Create a global instance for easy access
data_engine = DataEngine()
