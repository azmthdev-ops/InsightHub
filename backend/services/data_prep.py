"""
Data Preparation Service
Handles missing values, encoding, scaling, and feature engineering.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer


class DataPreparation:
    """Data preparation and feature engineering engine"""
    
    IMPUTATION_STRATEGIES = {
        "mean": "mean",
        "median": "median",
        "mode": "most_frequent",
        "constant": "constant",
        "forward_fill": "ffill",
        "backward_fill": "bfill",
        "knn": "knn",
        "mice": "mice",
        "drop_rows": "drop_rows",
        "drop_columns": "drop_columns"
    }
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
    
    def prepare_data(self, df: pd.DataFrame, operations: List[Dict]) -> Dict[str, Any]:
        """
        Apply data preparation operations
        
        Args:
            df: Input dataframe
            operations: List of operations to apply
                Example: [
                    {"type": "impute", "column": "age", "strategy": "mean"},
                    {"type": "encode", "column": "category", "method": "onehot"},
                    {"type": "scale", "columns": ["age", "salary"], "method": "standard"}
                ]
        
        Returns:
            Dictionary with transformed dataframe and operation details
        """
        df_transformed = df.copy()
        applied_operations = []
        
        for operation in operations:
            op_type = operation.get("type")
            
            if op_type == "impute":
                df_transformed, details = self._handle_missing_values(
                    df_transformed,
                    operation.get("column"),
                    operation.get("strategy"),
                    operation.get("fill_value")
                )
                applied_operations.append({"operation": "impute", "details": details})
            
            elif op_type == "encode":
                df_transformed, details = self._encode_categorical(
                    df_transformed,
                    operation.get("column"),
                    operation.get("method", "label")
                )
                applied_operations.append({"operation": "encode", "details": details})
            
            elif op_type == "scale":
                df_transformed, details = self._scale_features(
                    df_transformed,
                    operation.get("columns"),
                    operation.get("method", "standard")
                )
                applied_operations.append({"operation": "scale", "details": details})
            
            elif op_type == "create_column":
                df_transformed, details = self._create_column(
                    df_transformed,
                    operation.get("name"),
                    operation.get("formula")
                )
                applied_operations.append({"operation": "create_column", "details": details})
        
        return {
            "transformed_data": df_transformed.to_dict(orient="records")[:100],  # Limit for response
            "shape": {"rows": len(df_transformed), "columns": len(df_transformed.columns)},
            "columns": list(df_transformed.columns),
            "applied_operations": applied_operations,
            "preview": df_transformed.head(10).to_dict(orient="records")
        }
    
    def _handle_missing_values(
        self, df: pd.DataFrame, column: str, strategy: str, fill_value: Any = None
    ) -> tuple:
        """Handle missing values with various strategies"""
        df_copy = df.copy()
        
        if column not in df_copy.columns:
            return df_copy, {"error": f"Column '{column}' not found"}
        
        missing_before = df_copy[column].isna().sum()
        
        if strategy == "drop_rows":
            df_copy = df_copy.dropna(subset=[column])
        
        elif strategy == "drop_columns":
            df_copy = df_copy.drop(columns=[column])
        
        elif strategy in ["mean", "median", "mode"]:
            imputer = SimpleImputer(strategy=self.IMPUTATION_STRATEGIES[strategy])
            if pd.api.types.is_numeric_dtype(df_copy[column]):
                df_copy[column] = imputer.fit_transform(df_copy[[column]])
            else:
                return df_copy, {"error": f"Cannot apply {strategy} to non-numeric column"}
        
        elif strategy == "constant":
            df_copy[column].fillna(fill_value, inplace=True)
        
        elif strategy == "forward_fill":
            df_copy[column].fillna(method='ffill', inplace=True)
        
        elif strategy == "backward_fill":
            df_copy[column].fillna(method='bfill', inplace=True)
        
        elif strategy == "knn":
            # KNN imputation for numeric columns only
            numeric_cols = df_copy.select_dtypes(include=[np.number]).columns
            if column in numeric_cols:
                imputer = KNNImputer(n_neighbors=5)
                df_copy[numeric_cols] = imputer.fit_transform(df_copy[numeric_cols])
            else:
                return df_copy, {"error": "KNN imputation only works for numeric columns"}
        
        elif strategy == "mice":
            # MICE imputation
            numeric_cols = df_copy.select_dtypes(include=[np.number]).columns
            if column in numeric_cols:
                imputer = IterativeImputer(random_state=42)
                df_copy[numeric_cols] = imputer.fit_transform(df_copy[numeric_cols])
            else:
                return df_copy, {"error": "MICE imputation only works for numeric columns"}
        
        missing_after = df_copy[column].isna().sum() if column in df_copy.columns else 0
        
        details = {
            "column": column,
            "strategy": strategy,
            "missing_before": int(missing_before),
            "missing_after": int(missing_after),
            "rows_affected": int(missing_before - missing_after)
        }
        
        return df_copy, details
    
    def _encode_categorical(self, df: pd.DataFrame, column: str, method: str = "label") -> tuple:
        """Encode categorical variables"""
        df_copy = df.copy()
        
        if column not in df_copy.columns:
            return df_copy, {"error": f"Column '{column}' not found"}
        
        if method == "label":
            le = LabelEncoder()
            df_copy[column] = le.fit_transform(df_copy[column].astype(str))
            self.encoders[column] = le
            
            details = {
                "column": column,
                "method": "label_encoding",
                "unique_values": int(len(le.classes_)),
                "classes": le.classes_.tolist()[:20]  # Limit to 20
            }
        
        elif method == "onehot":
            # One-hot encoding
            dummies = pd.get_dummies(df_copy[column], prefix=column)
            df_copy = pd.concat([df_copy.drop(columns=[column]), dummies], axis=1)
            
            details = {
                "column": column,
                "method": "onehot_encoding",
                "new_columns": list(dummies.columns),
                "columns_created": len(dummies.columns)
            }
        
        else:
            return df_copy, {"error": f"Unknown encoding method: {method}"}
        
        return df_copy, details
    
    def _scale_features(self, df: pd.DataFrame, columns: List[str], method: str = "standard") -> tuple:
        """Scale numeric features"""
        df_copy = df.copy()
        
        if not columns:
            columns = df_copy.select_dtypes(include=[np.number]).columns.tolist()
        
        # Filter to only numeric columns
        numeric_columns = [col for col in columns if col in df_copy.columns and pd.api.types.is_numeric_dtype(df_copy[col])]
        
        if not numeric_columns:
            return df_copy, {"error": "No numeric columns to scale"}
        
        if method == "standard":
            scaler = StandardScaler()
        elif method == "minmax":
            scaler = MinMaxScaler()
        else:
            return df_copy, {"error": f"Unknown scaling method: {method}"}
        
        df_copy[numeric_columns] = scaler.fit_transform(df_copy[numeric_columns])
        self.scalers[method] = scaler
        
        details = {
            "columns": numeric_columns,
            "method": method,
            "columns_scaled": len(numeric_columns)
        }
        
        return df_copy, details
    
    def _create_column(self, df: pd.DataFrame, name: str, formula: str) -> tuple:
        """Create new column using formula"""
        df_copy = df.copy()
        
        try:
            # Simple formula evaluation (be careful in production!)
            df_copy[name] = df_copy.eval(formula)
            
            details = {
                "column_name": name,
                "formula": formula,
                "dtype": str(df_copy[name].dtype),
                "sample_values": df_copy[name].head(5).tolist()
            }
        except Exception as e:
            return df_copy, {"error": f"Formula evaluation failed: {str(e)}"}
        
        return df_copy, details
    
    def get_available_strategies(self) -> Dict[str, List[str]]:
        """Get list of available strategies"""
        return {
            "imputation": list(self.IMPUTATION_STRATEGIES.keys()),
            "encoding": ["label", "onehot"],
            "scaling": ["standard", "minmax"]
        }
