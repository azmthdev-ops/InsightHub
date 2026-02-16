# core/analytics_engine.py
"""
Analytics Engine - Statistical analysis, correlations, outlier detection, and ML models.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass

# Try to import optional dependencies
try:
    from scipy import stats as scipy_stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("⚠️ scipy not installed. Some statistical functions will be limited.")

try:
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, r2_score, mean_squared_error
    from sklearn.preprocessing import LabelEncoder
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("⚠️ scikit-learn not installed. ML features will be unavailable.")

try:
    import plotly.express as px
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    print("⚠️ plotly not installed. Visualizations will be limited.")


@dataclass
class StatisticalProfile:
    """Contains statistical profile for a column."""
    column_name: str
    dtype: str
    count: int
    missing: int
    missing_pct: float
    unique: int
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None


@dataclass
class OutlierResult:
    """Contains outlier detection results."""
    column: str
    method: str
    n_outliers: int
    outlier_indices: List[int]
    lower_bound: float
    upper_bound: float
    outlier_values: List[float]


class AnalyticsEngine:
    """
    Analytics Engine for comprehensive data analysis.
    """
    
    def __init__(self):
        self.last_profile = None
        self.last_correlation = None
        self.ml_models = {}
    
    # ==================== Statistical Analysis ====================
    
    def get_detailed_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate comprehensive descriptive statistics for the DataFrame.
        
        Args:
            df: Input DataFrame
            
        Returns:
            Dictionary with detailed statistics
        """
        if df is None or df.empty:
            return {"error": "No data available"}
        
        stats = {
            "overview": {
                "rows": len(df),
                "columns": len(df.columns),
                "memory_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
                "duplicates": df.duplicated().sum(),
                "total_missing": df.isnull().sum().sum(),
                "missing_pct": round(df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100, 2)
            },
            "column_types": {
                "numeric": len(df.select_dtypes(include=[np.number]).columns),
                "categorical": len(df.select_dtypes(include=['object', 'category']).columns),
                "datetime": len(df.select_dtypes(include=['datetime64']).columns),
                "boolean": len(df.select_dtypes(include=['bool']).columns)
            },
            "columns": {},
            "data_quality_score": 0.0
        }
        
        # Calculate per-column statistics
        for col in df.columns:
            col_stats = self._get_column_stats(df[col])
            stats["columns"][col] = col_stats
        
        # Calculate data quality score
        stats["data_quality_score"] = self._calculate_quality_score(df, stats)
        
        self.last_profile = stats
        return stats
    
    def _get_column_stats(self, series: pd.Series) -> Dict[str, Any]:
        """Get statistics for a single column."""
        col_stats = {
            "dtype": str(series.dtype),
            "count": int(series.count()),
            "missing": int(series.isnull().sum()),
            "missing_pct": round(series.isnull().sum() / len(series) * 100, 2),
            "unique": int(series.nunique())
        }
        
        # Numeric columns
        if pd.api.types.is_numeric_dtype(series):
            clean_series = series.dropna()
            if len(clean_series) > 0:
                col_stats.update({
                    "mean": round(float(clean_series.mean()), 4),
                    "median": round(float(clean_series.median()), 4),
                    "std": round(float(clean_series.std()), 4),
                    "min": round(float(clean_series.min()), 4),
                    "max": round(float(clean_series.max()), 4),
                    "range": round(float(clean_series.max() - clean_series.min()), 4),
                    "q1": round(float(clean_series.quantile(0.25)), 4),
                    "q3": round(float(clean_series.quantile(0.75)), 4),
                    "iqr": round(float(clean_series.quantile(0.75) - clean_series.quantile(0.25)), 4)
                })
                
                # Advanced stats if scipy available
                if SCIPY_AVAILABLE and len(clean_series) > 2:
                    try:
                        col_stats["skewness"] = round(float(scipy_stats.skew(clean_series)), 4)
                        col_stats["kurtosis"] = round(float(scipy_stats.kurtosis(clean_series)), 4)
                    except:
                        pass
        
        # Categorical columns
        elif pd.api.types.is_object_dtype(series) or pd.api.types.is_categorical_dtype(series):
            value_counts = series.value_counts()
            if len(value_counts) > 0:
                col_stats["top_value"] = str(value_counts.index[0])
                col_stats["top_freq"] = int(value_counts.iloc[0])
                col_stats["top_5"] = {str(k): int(v) for k, v in value_counts.head(5).items()}
        
        return col_stats
    
    def _calculate_quality_score(self, df: pd.DataFrame, stats: Dict) -> float:
        """Calculate overall data quality score (0-100)."""
        scores = []
        
        # Completeness score (40% weight)
        completeness = 100 - stats["overview"]["missing_pct"]
        scores.append(completeness * 0.4)
        
        # Uniqueness score - penalize too many duplicates (20% weight)
        dup_pct = stats["overview"]["duplicates"] / len(df) * 100
        uniqueness = max(0, 100 - dup_pct * 2)
        scores.append(uniqueness * 0.2)
        
        # Consistency score - based on dtype variety (20% weight)
        type_counts = stats["column_types"]
        total_cols = sum(type_counts.values())
        if total_cols > 0:
            # Prefer datasets with more numeric columns
            numeric_ratio = type_counts["numeric"] / total_cols
            consistency = 50 + (numeric_ratio * 50)
            scores.append(consistency * 0.2)
        
        # Validity score - based on reasonable value ranges (20% weight)
        validity = 100  # Start at 100
        for col_name, col_stats in stats["columns"].items():
            if "skewness" in col_stats:
                # Penalize extreme skewness
                if abs(col_stats["skewness"]) > 3:
                    validity -= 5
        scores.append(max(0, validity) * 0.2)
        
        return round(sum(scores), 1)
    
    # ==================== Correlation Analysis ====================
    
    def get_correlation_matrix(self, df: pd.DataFrame, method: str = "pearson") -> Tuple[Optional[pd.DataFrame], Optional[Any]]:
        """
        Generate correlation matrix for numerical columns.
        
        Args:
            df: Input DataFrame
            method: Correlation method ('pearson', 'spearman', 'kendall')
            
        Returns:
            Tuple of (correlation DataFrame, Plotly figure)
        """
        if df is None or df.empty:
            return None, None
        
        # Select numeric columns only
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty or len(numeric_df.columns) < 2:
            return None, None
        
        # Calculate correlation matrix
        corr_matrix = numeric_df.corr(method=method)
        self.last_correlation = corr_matrix
        
        # Create Plotly heatmap if available
        fig = None
        if PLOTLY_AVAILABLE:
            fig = go.Figure(data=go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns.tolist(),
                y=corr_matrix.columns.tolist(),
                colorscale='RdBu_r',
                zmid=0,
                text=np.round(corr_matrix.values, 2),
                texttemplate='%{text}',
                textfont={"size": 10},
                hovertemplate='%{x} vs %{y}: %{z:.3f}<extra></extra>'
            ))
            
            fig.update_layout(
                title=f"Correlation Matrix ({method.capitalize()})",
                xaxis_title="Features",
                yaxis_title="Features",
                height=500,
                template="plotly_dark"
            )
        
        return corr_matrix, fig
    
    # ==================== Outlier Detection ====================
    
    def detect_outliers(self, df: pd.DataFrame, column: str, method: str = "iqr") -> OutlierResult:
        """
        Detect outliers in a numeric column using IQR or Z-score method.
        
        Args:
            df: Input DataFrame
            column: Column name to analyze
            method: Detection method ('iqr' or 'zscore')
            
        Returns:
            OutlierResult dataclass with outlier information
        """
        if df is None or column not in df.columns:
            return OutlierResult(
                column=column,
                method=method,
                n_outliers=0,
                outlier_indices=[],
                lower_bound=0,
                upper_bound=0,
                outlier_values=[]
            )
        
        try:
            series = df[column].dropna()
            
            if not pd.api.types.is_numeric_dtype(series):
                # Try to coerce to numeric if it's the target of analysis
                numeric_series = pd.to_numeric(series, errors='coerce')
                if numeric_series.notna().sum() > 0:
                    series = numeric_series.dropna()
                else:
                    return OutlierResult(column=column, method=method, n_outliers=0, outlier_indices=[], lower_bound=0, upper_bound=0, outlier_values=[])
            
            if method == "iqr":
                q1 = series.quantile(0.25)
                q3 = series.quantile(0.75)
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
            else:  # z-score
                mean = series.mean()
                std = series.std()
                if std == 0:
                    return OutlierResult(column=column, method=method, n_outliers=0, outlier_indices=[], lower_bound=mean, upper_bound=mean, outlier_values=[])
                lower_bound = mean - 3 * std
                upper_bound = mean + 3 * std
            
            # Find outliers
            outlier_mask = (series < lower_bound) | (series > upper_bound)
            outlier_indices = series[outlier_mask].index.tolist()
            outlier_values = series[outlier_mask].tolist()
            
            return OutlierResult(
                column=column,
                method=method,
                n_outliers=len(outlier_indices),
                outlier_indices=outlier_indices,
                lower_bound=float(lower_bound),
                upper_bound=float(upper_bound),
                outlier_values=outlier_values
            )
        except Exception as e:
            print(f"Error in detect_outliers: {str(e)}")
            return OutlierResult(column=column, method=method, n_outliers=0, outlier_indices=[], lower_bound=0, upper_bound=0, outlier_values=[])
    
    # ==================== Visualizations ====================
    
    def create_distribution_plot(self, df: pd.DataFrame, column: str) -> Optional[Any]:
        """
        Create histogram with box plot for a column.
        
        Args:
            df: Input DataFrame
            column: Column name to visualize
            
        Returns:
            Plotly figure or None
        """
        if not PLOTLY_AVAILABLE or df is None or column not in df.columns:
            return None
        
        try:
            series = df[column]
            
            # Handle categorical and hybrid columns
            if not pd.api.types.is_numeric_dtype(series):
                # Treat as categorical
                value_counts = series.value_counts().head(20)
                
                fig = go.Figure(data=[
                    go.Bar(
                        x=value_counts.index.tolist(),
                        y=value_counts.values,
                        marker_color='#667eea'
                    )
                ])
                
                fig.update_layout(
                    title=f"Value Counts for '{column}'",
                    xaxis_title=column,
                    yaxis_title="Count",
                    height=400,
                    template="plotly_dark"
                )
                return fig
            else:
                # Numeric Distribution
                fig = make_subplots(
                    rows=2, cols=1,
                    row_heights=[0.7, 0.3],
                    shared_xaxes=True,
                    vertical_spacing=0.05
                )
                
                fig.add_trace(
                    go.Histogram(x=series, name="Distribution", marker_color='#667eea', opacity=0.75),
                    row=1, col=1
                )
                
                fig.add_trace(
                    go.Box(x=series, name="Box Plot", marker_color='#764ba2', boxpoints='outliers'),
                    row=2, col=1
                )
                
                fig.update_layout(
                    title=f"Distribution of '{column}'",
                    showlegend=False,
                    height=400,
                    template="plotly_dark"
                )
                return fig
        except Exception as e:
            print(f"Error in create_distribution_plot: {str(e)}")
            return None
        
        return None
    
    # ==================== Machine Learning ====================
    
    def run_baseline_model(
        self,
        df: pd.DataFrame,
        target_column: str,
        test_size: float = 0.2,
        random_state: int = 42
    ) -> Dict[str, Any]:
        """
        Train a baseline Random Forest model.
        
        Args:
            df: Input DataFrame
            target_column: Target column name
            test_size: Test split ratio
            random_state: Random seed
            
        Returns:
            Dictionary with model results
        """
        if not SKLEARN_AVAILABLE:
            return {"error": "scikit-learn not installed"}
        
        try:
            if df is None or target_column not in df.columns:
                return {"error": "Invalid data or target column"}
            
            # Clean data - drop rows with missing target
            df_clean = df.dropna(subset=[target_column])
            
            if len(df_clean) < 10:
                return {"error": "Not enough data (need at least 10 rows)"}
            
            # Determine task type
            target = df_clean[target_column]
            is_classification = (
                pd.api.types.is_object_dtype(target) or
                pd.api.types.is_categorical_dtype(target) or
                target.nunique() <= 10
            )
            
            # Prepare features
            feature_cols = [c for c in df_clean.columns if c != target_column]
            X = df_clean[feature_cols].copy()
            y = target.copy()
            
            # Handle categorical features - much more robust check
            for col in X.columns:
                if not pd.api.types.is_numeric_dtype(X[col]):
                    le = LabelEncoder()
                    X[col] = le.fit_transform(X[col].astype(str))
            
            # Handle categorical target for classification
            if is_classification:
                if not pd.api.types.is_numeric_dtype(y):
                    le = LabelEncoder()
                    y = le.fit_transform(y.astype(str))
            else:
                # For regression, ensure target is numeric
                y = pd.to_numeric(y, errors='coerce')
                # Drop any NaNs that resulted from coercion in BOTH X and y
                valid_idx = y.notna()
                X = X[valid_idx]
                y = y[valid_idx]
            
            # Final check - if X still has objects, force strings-to-labels
            for col in X.columns:
                if X[col].dtype == object or X[col].dtype.name == 'category':
                    le = LabelEncoder()
                    X[col] = le.fit_transform(X[col].astype(str))
            
            # Fill remaining NaNs - use median for numeric, mode for categorical
            numeric_cols = X.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                X[col] = X[col].fillna(X[col].median())
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )
            
            # Train model
            if is_classification:
                model = RandomForestClassifier(n_estimators=100, random_state=random_state, n_jobs=-1)
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                score = accuracy_score(y_test, y_pred)
                metric_name = "Accuracy"
            else:
                model = RandomForestRegressor(n_estimators=100, random_state=random_state, n_jobs=-1)
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                score = r2_score(y_test, y_pred)
                metric_name = "R² Score"
            
            # Feature importance
            feature_importance = dict(zip(
                feature_cols,
                model.feature_importances_.tolist()
            ))
            top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
            
            # Store model
            self.ml_models[target_column] = {
                "model": model,
                "features": feature_cols,
                "is_classification": is_classification
            }
            
            return {
                "task_type": "Classification" if is_classification else "Regression",
                "target": target_column,
                "metric_name": metric_name,
                "score": round(score, 4),
                "n_samples": len(df_clean),
                "top_features": top_features
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": f"ML Error: {str(e)}"}
    
    def create_feature_importance_plot(self, results: Dict[str, Any]) -> Optional[Any]:
        """Create feature importance bar chart."""
        if not PLOTLY_AVAILABLE or "top_features" not in results:
            return None
        
        features = [f[0] for f in results["top_features"]]
        importance = [f[1] for f in results["top_features"]]
        
        fig = go.Figure(data=[
            go.Bar(
                x=importance,
                y=features,
                orientation='h',
                marker_color='#667eea'
            )
        ])
        
        fig.update_layout(
            title="Top 10 Feature Importance",
            xaxis_title="Importance",
            yaxis_title="Feature",
            height=400,
            template="plotly_dark",
            yaxis={'categoryorder': 'total ascending'}
        )
        
        return fig


# Create global instance
analytics_engine = AnalyticsEngine()
