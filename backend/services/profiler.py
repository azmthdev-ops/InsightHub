"""
Data Profiling Service
Provides comprehensive statistical analysis, missing value detection, 
correlation analysis, and data quality scoring.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any
from scipy import stats
from scipy.stats import skew, kurtosis


class DataProfiler:
    """Comprehensive data profiling engine"""
    
    def __init__(self):
        self.high_cardinality_threshold = 50
    
    def comprehensive_profile(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate comprehensive data profile
        
        Returns:
            Dictionary containing:
            - descriptive_stats: Mean, median, std, skew, kurtosis
            - missing_analysis: Counts, percentages, patterns
            - cardinality: Unique value counts
            - data_quality: Overall quality score
            - correlations: Correlation matrix
            - outliers: Outlier detection results
        """
        profile = {
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "columns": self._profile_columns(df),
            "missing_analysis": self._analyze_missing_values(df),
            "correlations": self._compute_correlations(df),
            "data_quality_score": self._calculate_quality_score(df),
            "outliers": self._detect_outliers(df),
            "summary_stats": self._get_summary_stats(df)
        }
        
        return profile
    
    def _profile_columns(self, df: pd.DataFrame) -> List[Dict]:
        """Profile each column individually"""
        columns_info = []
        
        for col in df.columns:
            col_info = {
                "name": col,
                "dtype": str(df[col].dtype),
                "missing_count": int(df[col].isna().sum()),
                "missing_percentage": float(df[col].isna().sum() / len(df) * 100),
                "unique_count": int(df[col].nunique()),
                "cardinality": "high" if df[col].nunique() > self.high_cardinality_threshold else "low"
            }
            
            # Add numeric statistics
            if pd.api.types.is_numeric_dtype(df[col]):
                col_info.update({
                    "mean": float(df[col].mean()) if not df[col].isna().all() else None,
                    "median": float(df[col].median()) if not df[col].isna().all() else None,
                    "std": float(df[col].std()) if not df[col].isna().all() else None,
                    "min": float(df[col].min()) if not df[col].isna().all() else None,
                    "max": float(df[col].max()) if not df[col].isna().all() else None,
                    "skewness": float(skew(df[col].dropna())) if len(df[col].dropna()) > 0 else None,
                    "kurtosis": float(kurtosis(df[col].dropna())) if len(df[col].dropna()) > 0 else None
                })
            
            # Add categorical statistics
            elif pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
                value_counts = df[col].value_counts()
                col_info.update({
                    "most_common": str(value_counts.index[0]) if len(value_counts) > 0 else None,
                    "most_common_count": int(value_counts.iloc[0]) if len(value_counts) > 0 else None,
                    "top_5_values": value_counts.head(5).to_dict()
                })
            
            columns_info.append(col_info)
        
        return columns_info
    
    def _analyze_missing_values(self, df: pd.DataFrame) -> Dict:
        """Analyze missing value patterns"""
        total_cells = df.shape[0] * df.shape[1]
        total_missing = df.isna().sum().sum()
        
        missing_by_column = df.isna().sum().to_dict()
        missing_percentage_by_column = (df.isna().sum() / len(df) * 100).to_dict()
        
        return {
            "total_missing_cells": int(total_missing),
            "total_cells": int(total_cells),
            "overall_missing_percentage": float(total_missing / total_cells * 100),
            "missing_by_column": {k: int(v) for k, v in missing_by_column.items()},
            "missing_percentage_by_column": {k: float(v) for k, v in missing_percentage_by_column.items()},
            "columns_with_missing": [col for col in df.columns if df[col].isna().any()]
        }
    
    def _compute_correlations(self, df: pd.DataFrame) -> Dict:
        """Compute correlation matrix for numeric columns"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty or len(numeric_df.columns) < 2:
            return {"message": "Not enough numeric columns for correlation analysis"}
        
        corr_matrix = numeric_df.corr()
        
        # Find high correlations (> 0.7 or < -0.7)
        high_correlations = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:
                    high_correlations.append({
                        "column1": corr_matrix.columns[i],
                        "column2": corr_matrix.columns[j],
                        "correlation": float(corr_value)
                    })
        
        return {
            "correlation_matrix": corr_matrix.to_dict(),
            "high_correlations": high_correlations
        }
    
    def _calculate_quality_score(self, df: pd.DataFrame) -> Dict:
        """Calculate overall data quality score"""
        # Completeness: % of non-missing values
        completeness = (1 - df.isna().sum().sum() / (df.shape[0] * df.shape[1])) * 100
        
        # Uniqueness: Average uniqueness across columns
        uniqueness_scores = []
        for col in df.columns:
            if len(df) > 0:
                uniqueness = (df[col].nunique() / len(df)) * 100
                uniqueness_scores.append(uniqueness)
        
        uniqueness = np.mean(uniqueness_scores) if uniqueness_scores else 0
        
        # Overall score (weighted average)
        overall_score = (completeness * 0.7) + (uniqueness * 0.3)
        
        return {
            "overall_score": float(overall_score),
            "completeness": float(completeness),
            "uniqueness": float(uniqueness),
            "rating": self._get_quality_rating(overall_score)
        }
    
    def _get_quality_rating(self, score: float) -> str:
        """Convert quality score to rating"""
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Fair"
        else:
            return "Poor"
    
    def _detect_outliers(self, df: pd.DataFrame) -> Dict:
        """Detect outliers using IQR method"""
        outliers_info = {}
        
        numeric_df = df.select_dtypes(include=[np.number])
        
        for col in numeric_df.columns:
            Q1 = numeric_df[col].quantile(0.25)
            Q3 = numeric_df[col].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = numeric_df[(numeric_df[col] < lower_bound) | (numeric_df[col] > upper_bound)][col]
            
            outliers_info[col] = {
                "count": int(len(outliers)),
                "percentage": float(len(outliers) / len(df) * 100),
                "lower_bound": float(lower_bound),
                "upper_bound": float(upper_bound)
            }
        
        return outliers_info
    
    def _get_summary_stats(self, df: pd.DataFrame) -> Dict:
        """Get summary statistics"""
        return {
            "numeric_columns": len(df.select_dtypes(include=[np.number]).columns),
            "categorical_columns": len(df.select_dtypes(include=['object', 'category']).columns),
            "datetime_columns": len(df.select_dtypes(include=['datetime64']).columns),
            "total_columns": len(df.columns),
            "total_rows": len(df),
            "memory_usage_mb": float(df.memory_usage(deep=True).sum() / 1024 / 1024)
        }
