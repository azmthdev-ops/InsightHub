"""
Machine Learning Engine
Supports 15+ algorithms for regression, classification, and clustering.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    mean_squared_error, r2_score, mean_absolute_error,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, silhouette_score
)

# Regression models
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor
from xgboost import XGBRegressor

# Classification models
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier

# Clustering
from sklearn.cluster import KMeans, DBSCAN


class MLEngine:
    """Machine Learning engine with 15+ algorithms"""
    
    REGRESSION_MODELS = {
        "linear_regression": LinearRegression,
        "ridge": Ridge,
        "lasso": Lasso,
        "decision_tree_regressor": DecisionTreeRegressor,
        "random_forest_regressor": RandomForestRegressor,
        "gradient_boosting_regressor": GradientBoostingRegressor,
        "svr": SVR,
        "knn_regressor": KNeighborsRegressor,
        "xgboost_regressor": XGBRegressor
    }
    
    CLASSIFICATION_MODELS = {
        "logistic_regression": LogisticRegression,
        "decision_tree_classifier": DecisionTreeClassifier,
        "random_forest_classifier": RandomForestClassifier,
        "gradient_boosting_classifier": GradientBoostingClassifier,
        "svc": SVC,
        "gaussian_nb": GaussianNB,
        "knn_classifier": KNeighborsClassifier
    }
    
    CLUSTERING_MODELS = {
        "kmeans": KMeans,
        "dbscan": DBSCAN
    }
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
    
    def train_model(
        self,
        df: pd.DataFrame,
        target_column: str,
        model_type: str,
        task: str = "regression",
        test_size: float = 0.2,
        params: Dict = None
    ) -> Dict[str, Any]:
        """
        Train a machine learning model
        
        Args:
            df: Input dataframe
            target_column: Name of target column
            model_type: Type of model (e.g., 'linear_regression', 'random_forest_classifier')
            task: 'regression', 'classification', or 'clustering'
            test_size: Proportion of test set
            params: Model hyperparameters
        
        Returns:
            Dictionary with model, metrics, and predictions
        """
        params = params or {}
        
        # Prepare data
        X, y = self._prepare_data(df, target_column, task)
        
        if task == "clustering":
            return self._train_clustering(X, model_type, params)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Get model class
        if task == "regression":
            model_class = self.REGRESSION_MODELS.get(model_type)
        elif task == "classification":
            model_class = self.CLASSIFICATION_MODELS.get(model_type)
        else:
            raise ValueError(f"Unknown task: {task}")
        
        if not model_class:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Train model
        model = model_class(**params)
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_pred_train = model.predict(X_train_scaled)
        y_pred_test = model.predict(X_test_scaled)
        
        # Calculate metrics
        if task == "regression":
            metrics = self._calculate_regression_metrics(y_train, y_pred_train, y_test, y_pred_test)
        else:
            metrics = self._calculate_classification_metrics(y_train, y_pred_train, y_test, y_pred_test)
        
        return {
            "model_type": model_type,
            "task": task,
            "metrics": metrics,
            "feature_names": list(X.columns),
            "predictions": {
                "train": y_pred_train.tolist()[:100],  # Limit to 100 for response size
                "test": y_pred_test.tolist()[:100]
            },
            "actual": {
                "train": y_train.tolist()[:100],
                "test": y_test.tolist()[:100]
            }
        }
    
    def _prepare_data(self, df: pd.DataFrame, target_column: str, task: str) -> Tuple:
        """Prepare data for training"""
        df_copy = df.copy()
        
        # Encode categorical variables
        for col in df_copy.select_dtypes(include=['object', 'category']).columns:
            if col != target_column:
                le = LabelEncoder()
                df_copy[col] = le.fit_transform(df_copy[col].astype(str))
                self.label_encoders[col] = le
        
        if task == "clustering":
            # For clustering, no target column
            X = df_copy.select_dtypes(include=[np.number])
            return X, None
        
        # Separate features and target
        X = df_copy.drop(columns=[target_column])
        y = df_copy[target_column]
        
        # Encode target if classification
        if task == "classification" and y.dtype == 'object':
            le = LabelEncoder()
            y = le.fit_transform(y)
            self.label_encoders[target_column] = le
        
        # Select only numeric features
        X = X.select_dtypes(include=[np.number])
        
        return X, y
    
    def _train_clustering(self, X: pd.DataFrame, model_type: str, params: Dict) -> Dict:
        """Train clustering model"""
        model_class = self.CLUSTERING_MODELS.get(model_type)
        if not model_class:
            raise ValueError(f"Unknown clustering model: {model_type}")
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        model = model_class(**params)
        labels = model.fit_predict(X_scaled)
        
        # Calculate silhouette score
        if len(set(labels)) > 1:
            silhouette = silhouette_score(X_scaled, labels)
        else:
            silhouette = 0.0
        
        return {
            "model_type": model_type,
            "task": "clustering",
            "metrics": {
                "silhouette_score": float(silhouette),
                "n_clusters": int(len(set(labels))),
                "cluster_sizes": {int(k): int(v) for k, v in pd.Series(labels).value_counts().to_dict().items()}
            },
            "labels": labels.tolist()[:100]
        }
    
    def _calculate_regression_metrics(
        self, y_train, y_pred_train, y_test, y_pred_test
    ) -> Dict:
        """Calculate regression metrics"""
        return {
            "train": {
                "mse": float(mean_squared_error(y_train, y_pred_train)),
                "rmse": float(np.sqrt(mean_squared_error(y_train, y_pred_train))),
                "mae": float(mean_absolute_error(y_train, y_pred_train)),
                "r2": float(r2_score(y_train, y_pred_train))
            },
            "test": {
                "mse": float(mean_squared_error(y_test, y_pred_test)),
                "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred_test))),
                "mae": float(mean_absolute_error(y_test, y_pred_test)),
                "r2": float(r2_score(y_test, y_pred_test))
            }
        }
    
    def _calculate_classification_metrics(
        self, y_train, y_pred_train, y_test, y_pred_test
    ) -> Dict:
        """Calculate classification metrics"""
        return {
            "train": {
                "accuracy": float(accuracy_score(y_train, y_pred_train)),
                "precision": float(precision_score(y_train, y_pred_train, average='weighted', zero_division=0)),
                "recall": float(recall_score(y_train, y_pred_train, average='weighted', zero_division=0)),
                "f1": float(f1_score(y_train, y_pred_train, average='weighted', zero_division=0))
            },
            "test": {
                "accuracy": float(accuracy_score(y_test, y_pred_test)),
                "precision": float(precision_score(y_test, y_pred_test, average='weighted', zero_division=0)),
                "recall": float(recall_score(y_test, y_pred_test, average='weighted', zero_division=0)),
                "f1": float(f1_score(y_test, y_pred_test, average='weighted', zero_division=0)),
                "confusion_matrix": confusion_matrix(y_test, y_pred_test).tolist()
            }
        }
    
    def get_available_models(self) -> Dict[str, List[str]]:
        """Get list of available models"""
        return {
            "regression": list(self.REGRESSION_MODELS.keys()),
            "classification": list(self.CLASSIFICATION_MODELS.keys()),
            "clustering": list(self.CLUSTERING_MODELS.keys())
        }
