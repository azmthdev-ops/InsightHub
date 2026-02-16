# components/data_ingestion_tab.py
"""
Data Ingestion Tab - File upload, preview, and quality summary.
"""

import os
import gradio as gr
import pandas as pd
from typing import Tuple, Dict, Any, Optional
from core.data_engine import data_engine
from core.data_manager import DataManager


def format_summary_html(summary: Dict[str, Any]) -> str:
    """Format the quality summary as HTML cards."""
    if summary.get("status") == "error":
        return f"""
        <div style="padding: 20px; background: #fef2f2; border-radius: 8px; border: 1px solid #f87171;">
            <h3 style="color: #dc2626; margin: 0;">⚠️ {summary.get('message', 'No data loaded')}</h3>
        </div>
        """
    
    basic = summary.get("basic_info", {})
    col_types = summary.get("column_types", {})
    missing = summary.get("missing_values", {})
    
    # Find columns with most missing values
    missing_pct = missing.get("percentage", {})
    top_missing = sorted(missing_pct.items(), key=lambda x: x[1], reverse=True)[:5]
    top_missing_html = "".join([
        f'<li><code>{col}</code>: {pct}%</li>' 
        for col, pct in top_missing if pct > 0
    ]) or "<li>None! ✅</li>"
    
    html = f"""
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        
        <!-- Basic Info Card -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.1rem;">📊 Dataset Overview</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                    <div style="font-size: 2rem; font-weight: 700;">{basic.get('rows', 0):,}</div>
                    <div style="opacity: 0.8; font-size: 0.85rem;">Rows</div>
                </div>
                <div>
                    <div style="font-size: 2rem; font-weight: 700;">{basic.get('columns', 0)}</div>
                    <div style="opacity: 0.8; font-size: 0.85rem;">Columns</div>
                </div>
            </div>
            <div style="margin-top: 12px; font-size: 0.9rem; opacity: 0.9;">
                Memory: {basic.get('memory_usage', 'N/A')}
            </div>
        </div>
        
        <!-- Completeness Card -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; color: white;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.1rem;">✅ Data Completeness</h3>
            <div style="font-size: 2.5rem; font-weight: 700;">{basic.get('completeness', 0)}%</div>
            <div style="opacity: 0.8; font-size: 0.85rem;">
                {basic.get('total_missing', 0):,} missing values
            </div>
        </div>
        
        <!-- Column Types Card -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 12px; color: white;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.1rem;">🔢 Column Types</h3>
            <div style="font-size: 0.95rem;">
                <div style="margin-bottom: 6px;">📈 Numeric: <strong>{col_types.get('numeric', 0)}</strong></div>
                <div style="margin-bottom: 6px;">📝 Categorical: <strong>{col_types.get('categorical', 0)}</strong></div>
                <div>📅 DateTime: <strong>{col_types.get('datetime', 0)}</strong></div>
            </div>
        </div>
        
        <!-- Missing Values Card -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 12px; color: white;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.1rem;">⚠️ Top Missing</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.9rem;">
                {top_missing_html}
            </ul>
        </div>
        
    </div>
    
    <!-- Encoding Info -->
    <div style="margin-top: 16px; padding: 12px 16px; background: #f3f4f6; border-radius: 8px; font-size: 0.9rem; color: #4b5563;">
        {f'📁 Encoding detected: <code>{summary.get("encoding_used", "auto")}</code>' if summary.get("encoding_used") else '📁 File loaded successfully'}
    </div>
    """
    
    return html


def create_data_ingestion_tab(data_manager: DataManager):
    """
    Create the Data Ingestion tab with file upload, preview, and quality summary.
    
    Args:
        data_manager: The shared DataManager instance
    """
    
    def handle_file_upload(file) -> Tuple[pd.DataFrame, str, str]:
        """Handle file upload and update DataManager."""
        if file is None:
            gr.Warning("⚠️ No file uploaded.")
            return (
                pd.DataFrame(),
                format_summary_html({"status": "error", "message": "No file uploaded"}),
                "⏳ Waiting for file upload..."
            )
        
        # Get the file path - handle both string and file object
        file_path = file if isinstance(file, str) else file.name
        
        gr.Info(f"📂 Loading {os.path.basename(file_path)}...")
        df, error = data_engine.load_data(file_path)
        
        if error:
            gr.Warning(f"❌ Failed to load file: {error}")
            return (
                pd.DataFrame(),
                format_summary_html({"status": "error", "message": error}),
                f"❌ Error: {error}"
            )
        
        # Store in DataManager
        data_manager.set_df(df)
        gr.Info("✅ Data loaded successfully!")
        
        # Get summary
        summary = data_engine.get_summary(df)
        
        # Return preview (first 10 rows), summary HTML, and status
        preview = data_engine.get_preview(df, n_rows=10)
        
        return (
            preview,
            format_summary_html(summary),
            f"✅ Loaded {len(df):,} rows × {len(df.columns)} columns"
        )
    
    def handle_clear_data() -> Tuple[pd.DataFrame, str, str, None]:
        """Clear all data from DataManager."""
        data_manager.clear_df()
        return (
            pd.DataFrame(),
            format_summary_html({"status": "error", "message": "Data cleared. Upload a new file to begin."}),
            "🗑️ Data cleared",
            None  # Clear the file input
        )
    
    # ==================== Tab UI ====================
    
    with gr.Column():
        # Header
        gr.HTML(
            """
            <div class="tab-header">📁 Data Ingestion Lab</div>
            <p style="margin-top: -10px; opacity: 0.8; margin-left: 20px;">
                Advanced file processing and structural data profiling
            </p>
            """
        )
        
        gr.Markdown(
            """
            **Supported formats:** CSV, Excel (xlsx, xls), JSON, Parquet, TSV
            
            ---
            """
        )
        
        with gr.Row():
            # Left Column - Upload
            with gr.Column(scale=1):
                gr.Markdown("### 📤 Upload Data")
                
                file_input = gr.File(
                    label="Drop file here or click to upload",
                    file_types=[".csv", ".xlsx", ".xls", ".json", ".parquet", ".tsv"]
                )
                
                status_label = gr.Markdown("⏳ Waiting for file upload...")
                
                clear_btn = gr.Button(
                    "🗑️ Clear Data",
                    variant="secondary",
                    size="sm"
                )
            
            # Right Column - Preview
            with gr.Column(scale=2):
                gr.Markdown("### 📊 Data Preview (First 10 Rows)")
                
                data_preview = gr.DataFrame(
                    label="Data Preview",
                    interactive=False,
                    wrap=True
                )
        
        # Quality Summary Section
        gr.Markdown("### 📈 Data Quality Summary")
        
        quality_summary = gr.HTML(
            value=format_summary_html({"status": "error", "message": "Upload a file to see quality metrics"})
        )
        
        # ==================== Event Handlers ====================
        
        # File upload handler
        file_input.change(
            fn=handle_file_upload,
            inputs=[file_input],
            outputs=[data_preview, quality_summary, status_label]
        )
        
        # Clear button handler
        clear_btn.click(
            fn=handle_clear_data,
            inputs=[],
            outputs=[data_preview, quality_summary, status_label, file_input]
        )
