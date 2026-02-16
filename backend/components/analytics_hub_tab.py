# components/analytics_hub_tab.py
"""
Analytics Hub Tab - Statistical analysis, visualizations, and ML models.
"""

import gradio as gr
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, Optional, List
from core.analytics_engine import analytics_engine
from core.data_manager import DataManager


def format_stats_html(stats: Dict[str, Any]) -> str:
    """Format statistics as HTML dashboard."""
    
    if not stats or "error" in stats:
        return """
        <div style="padding: 30px; text-align: center; color: #6b7280;">
            <h3>📊 No Data Loaded</h3>
            <p>Upload a dataset in the Data Ingestion tab to see analytics.</p>
        </div>
        """
    
    overview = stats.get("overview", {})
    types = stats.get("column_types", {})
    quality = stats.get("data_quality_score", 0)
    
    # Quality color
    if quality >= 80:
        quality_color = "#10b981"
    elif quality >= 60:
        quality_color = "#f59e0b"
    else:
        quality_color = "#ef4444"
    
    html = f"""
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px;">
        
        <!-- Quality Score -->
        <div style="background: {quality_color}; padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Quality Score</div>
            <div style="font-size: 1.8rem; font-weight: 700;">{quality:.0f}%</div>
        </div>
        
        <!-- Rows -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Rows</div>
            <div style="font-size: 1.5rem; font-weight: 700;">{overview.get('rows', 0):,}</div>
        </div>
        
        <!-- Columns -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Columns</div>
            <div style="font-size: 1.5rem; font-weight: 700;">{overview.get('columns', 0)}</div>
        </div>
        
        <!-- Missing -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Missing %</div>
            <div style="font-size: 1.5rem; font-weight: 700;">{overview.get('missing_pct', 0):.1f}%</div>
        </div>
        
        <!-- Memory -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Memory</div>
            <div style="font-size: 1.5rem; font-weight: 700;">{overview.get('memory_mb', 0):.1f} MB</div>
        </div>
        
    </div>
    
    <!-- Column Types -->
    <div style="padding: 16px; background: #1f2937; border-radius: 10px; display: flex; gap: 24px; font-size: 0.9rem; color: #d1d5db;">
        <span>📊 Numeric: <strong style="color: #667eea;">{types.get('numeric', 0)}</strong></span>
        <span>📝 Categorical: <strong style="color: #10b981;">{types.get('categorical', 0)}</strong></span>
        <span>📅 DateTime: <strong style="color: #f59e0b;">{types.get('datetime', 0)}</strong></span>
        <span>✓ Boolean: <strong style="color: #8b5cf6;">{types.get('boolean', 0)}</strong></span>
        <span>🔄 Duplicates: <strong style="color: #ef4444;">{overview.get('duplicates', 0)}</strong></span>
    </div>
    """
    
    return html


def format_column_stats_html(stats: Dict[str, Any], column: str) -> str:
    """Format individual column statistics."""
    
    if not stats or "columns" not in stats or column not in stats["columns"]:
        return "<p>Select a column to view statistics</p>"
    
    col_stats = stats["columns"][column]
    
    html = f"""
    <div style="padding: 16px; background: #1f2937; border-radius: 10px;">
        <h4 style="color: #d1d5db; margin-bottom: 12px;">📊 {column}</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.9rem;">
            <span style="color: #9ca3af;">Type: <strong style="color: white;">{col_stats.get('dtype', 'N/A')}</strong></span>
            <span style="color: #9ca3af;">Count: <strong style="color: white;">{col_stats.get('count', 0):,}</strong></span>
            <span style="color: #9ca3af;">Missing: <strong style="color: #f59e0b;">{col_stats.get('missing', 0)} ({col_stats.get('missing_pct', 0):.1f}%)</strong></span>
            <span style="color: #9ca3af;">Unique: <strong style="color: white;">{col_stats.get('unique', 0):,}</strong></span>
    """
    
    # Add numeric stats if available
    if "mean" in col_stats:
        html += f"""
            <span style="color: #9ca3af;">Mean: <strong style="color: #667eea;">{col_stats.get('mean', 'N/A')}</strong></span>
            <span style="color: #9ca3af;">Median: <strong style="color: #667eea;">{col_stats.get('median', 'N/A')}</strong></span>
            <span style="color: #9ca3af;">Std: <strong style="color: white;">{col_stats.get('std', 'N/A')}</strong></span>
            <span style="color: #9ca3af;">Range: <strong style="color: white;">{col_stats.get('min', 'N/A')} - {col_stats.get('max', 'N/A')}</strong></span>
        """
        if "skewness" in col_stats:
            html += f"""
            <span style="color: #9ca3af;">Skewness: <strong style="color: white;">{col_stats.get('skewness', 'N/A')}</strong></span>
            <span style="color: #9ca3af;">Kurtosis: <strong style="color: white;">{col_stats.get('kurtosis', 'N/A')}</strong></span>
            """
    
    html += "</div></div>"
    return html


def format_ml_results_html(results: Dict[str, Any]) -> str:
    """Format ML model results as HTML."""
    
    if not results:
        return "<p>Run a model to see results</p>"
    
    if "error" in results:
        return f"""
        <div style="padding: 16px; background: #7f1d1d; border-radius: 10px; color: #fecaca;">
            <strong>❌ Error:</strong> {results['error']}
        </div>
        """
    
    score_color = "#10b981" if results.get("score", 0) > 0.7 else "#f59e0b"
    
    html = f"""
    <div style="padding: 16px; background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%); border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
                <h4 style="color: white; margin: 0;">🤖 {results.get('task_type', 'Model')}</h4>
                <span style="color: #9ca3af; font-size: 0.85rem;">Target: {results.get('target', 'N/A')}</span>
            </div>
            <div style="background: {score_color}; padding: 12px 20px; border-radius: 8px; text-align: center;">
                <div style="color: white; font-size: 0.75rem; opacity: 0.9;">{results.get('metric_name', 'Score')}</div>
                <div style="color: white; font-size: 1.5rem; font-weight: 700;">{results.get('score', 0):.2%}</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 0.85rem; color: #d1d5db;">
            <span>📊 Train Samples: <strong>{results.get('train_samples', 0):,}</strong></span>
            <span>🧪 Test Samples: <strong>{results.get('test_samples', 0):,}</strong></span>
            <span>🔢 Features Used: <strong>{results.get('n_features', 0)}</strong></span>
        </div>
    </div>
    """
    
    return html


def create_analytics_hub_tab(data_manager: DataManager):
    """
    Create the Analytics Hub tab with statistical profiling, visualizations, and ML.
    """
    
    # State for current statistics
    current_stats = {"value": None}
    
    def refresh_data():
        """Refresh data from DataManager."""
        df = data_manager.get_df()
        
        if df is None or df.empty:
            gr.Warning("⚠️ No data loaded to analyze.")
            return (
                format_stats_html(None),
                gr.update(choices=[], value=None),
                gr.update(choices=[], value=None),
                gr.update(choices=[], value=None)
            )
        
        gr.Info("🔄 Refreshing analytics engine...")
        # Get statistics
        stats = analytics_engine.get_detailed_stats(df)
        current_stats["value"] = stats
        
        # Get column lists
        all_columns = df.columns.tolist()
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Set default values
        default_all = all_columns[0] if all_columns else None
        default_numeric = numeric_columns[0] if numeric_columns else None
        
        gr.Info("✅ Analytics engine ready.")
        return (
            format_stats_html(stats),
            gr.update(choices=all_columns, value=default_all),
            gr.update(choices=numeric_columns, value=default_numeric),
            gr.update(choices=all_columns, value=default_all)
        )
    
    def generate_correlation(method: str):
        """Generate correlation matrix."""
        df = data_manager.get_df()
        if df is None:
            return None
        
        gr.Info(f"🔗 Calculating {method} correlations...")
        _, fig = analytics_engine.get_correlation_matrix(df, method=method)
        return fig
    
    def analyze_distribution(column: str):
        """Analyze column distribution."""
        df = data_manager.get_df()
        if df is None or not column:
            return None, ""
        
        gr.Info(f"📉 Analyzing {column} distribution...")
        fig = analytics_engine.create_distribution_plot(df, column)
        
        # Get column stats
        if current_stats["value"] and "columns" in current_stats["value"]:
            col_html = format_column_stats_html(current_stats["value"], column)
        else:
            col_html = ""
        
        return fig, col_html
    
    def run_detect_outliers(column: str, method: str):
        """Detect outliers in a column."""
        df = data_manager.get_df()
        if df is None or not column:
            return None, "Select a numeric column"
        
        gr.Info(f"🔍 Detecting outliers in {column} using {method.upper()}...")
        result = analytics_engine.detect_outliers(df, column, method)
        fig = analytics_engine.create_distribution_plot(df, column)
        
        html = f"""
        <div style="padding: 16px; background: #1f2937; border-radius: 10px;">
            <h4 style="color: #d1d5db;">🔍 Outlier Detection ({method.upper()})</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.9rem; margin-top: 12px;">
                <span style="color: #9ca3af;">Outliers Found: <strong style="color: #ef4444;">{result.n_outliers}</strong></span>
                <span style="color: #9ca3af;">Lower Bound: <strong style="color: white;">{result.lower_bound:.2f}</strong></span>
                <span style="color: #9ca3af;">Upper Bound: <strong style="color: white;">{result.upper_bound:.2f}</strong></span>
                <span style="color: #9ca3af;">Method: <strong style="color: white;">{result.method}</strong></span>
            </div>
        </div>
        """
        gr.Info(f"✅ Found {result.n_outliers} outliers.")
        return fig, html
    
    def handle_train_model(target_column: str, test_size: float):
        """Train a baseline ML model."""
        df = data_manager.get_df()
        if df is None or not target_column:
            return None, format_ml_results_html({"error": "No data or target column"})
        
        gr.Info(f"🤖 Training baseline model for {target_column}...")
        results = analytics_engine.run_baseline_model(df, target_column, test_size)
        fig = analytics_engine.create_feature_importance_plot(results) if "error" not in results else None
        
        if "error" not in results:
            gr.Info("✅ Model trained successfully.")
        return fig, format_ml_results_html(results)

    def handle_export():
        path = data_manager.export_report()
        if path:
            gr.Info("✅ Analysis Report generated successfully!")
            return gr.update(value=path, visible=True)
        else:
            gr.Warning("⚠️ No data available to export.")
            return gr.update(visible=False)
    
    # ==================== Tab UI ====================
    
    with gr.Column():
        # Header
        with gr.Row():
            gr.HTML("<h2 class='tab-header'>📊 Analytics Hub</h2>")
            export_btn = gr.Button("📥 Export Analysis Report", variant="primary", scale=0)
            export_file = gr.File(label="Download Report", visible=False)
        
        # Overview Stats and Refresh
        with gr.Row():
            refresh_btn = gr.Button("🔄 Initialize / Refresh Analytics", variant="primary")
        
        gr.Markdown("### 🔍 Dataset Summary")
        stats_display = gr.HTML(value=format_stats_html(None))
        
        with gr.Tabs():
            # Tab 1: Correlation Matrix
            with gr.TabItem("🔗 Correlations"):
                with gr.Row():
                    corr_method = gr.Dropdown(
                        choices=["pearson", "spearman", "kendall"],
                        value="pearson",
                        label="Method"
                    )
                    corr_btn = gr.Button("Generate Matrix", variant="secondary")
                
                corr_plot = gr.Plot(label="Correlation Matrix")
            
            # Tab 2: Distribution Explorer
            with gr.TabItem("📉 Distributions"):
                with gr.Row():
                    dist_column = gr.Dropdown(choices=[], label="Select Column")
                    dist_btn = gr.Button("Analyze", variant="secondary")
                
                dist_plot = gr.Plot(label="Distribution")
                dist_stats = gr.HTML()
            
            # Tab 3: Outlier Detection
            with gr.TabItem("🔍 Outliers"):
                with gr.Row():
                    outlier_column = gr.Dropdown(choices=[], label="Select Numeric Column")
                    outlier_method = gr.Dropdown(
                        choices=["iqr", "zscore"],
                        value="iqr",
                        label="Method"
                    )
                    outlier_btn = gr.Button("Detect", variant="secondary")
                
                outlier_plot = gr.Plot(label="Distribution with Outliers")
                outlier_results = gr.HTML()
            
            # Tab 4: ML Preview
            with gr.TabItem("🤖 ML Preview"):
                gr.Markdown("Baseline Random Forest model for quick predictions.")
                
                with gr.Row():
                    ml_target = gr.Dropdown(choices=[], label="Target Column")
                    ml_test_size = gr.Slider(
                        minimum=0.1, maximum=0.4, value=0.2, step=0.05, label="Test Size"
                    )
                    ml_btn = gr.Button("🚀 Train Model", variant="primary")
                
                ml_results = gr.HTML()
                ml_importance_plot = gr.Plot(label="Feature Importance")
        
        # ==================== Event Handlers ====================
        
        refresh_btn.click(
            fn=refresh_data,
            inputs=[],
            outputs=[stats_display, dist_column, outlier_column, ml_target]
        )
        
        corr_btn.click(
            fn=generate_correlation,
            inputs=[corr_method],
            outputs=[corr_plot]
        )
        
        dist_btn.click(
            fn=analyze_distribution,
            inputs=[dist_column],
            outputs=[dist_plot, dist_stats]
        )
        
        outlier_btn.click(
            fn=run_detect_outliers,
            inputs=[outlier_column, outlier_method],
            outputs=[outlier_plot, outlier_results]
        )
        
        ml_btn.click(
            fn=handle_train_model,
            inputs=[ml_target, ml_test_size],
            outputs=[ml_importance_plot, ml_results]
        )

        export_btn.click(
            fn=handle_export,
            outputs=[export_file]
        )
