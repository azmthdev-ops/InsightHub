# components/vision_lab_tab.py
"""
Vision Lab Tab - Video processing with YOLO detection and tracking.
"""

import os
import gradio as gr
import numpy as np
import cv2
import tempfile
import os
from typing import Tuple, Dict, Any, Optional, Generator
from core.vision_engine import vision_engine, VisionEngine
from core.data_manager import DataManager


def format_metrics_html(metrics: Dict[str, Any], status: str = "ready") -> str:
    """Format metrics as HTML dashboard."""
    
    status_colors = {
        "ready": ("#10b981", "Ready"),
        "processing": ("#f59e0b", "Processing..."),
        "done": ("#667eea", "Complete"),
        "error": ("#ef4444", "Error")
    }
    
    color, label = status_colors.get(status, ("#6b7280", "Unknown"))
    
    html = f"""
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        
        <!-- Status -->
        <div style="background: {color}; padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Status</div>
            <div style="font-size: 1.2rem; font-weight: 700;">{label}</div>
        </div>
        
        <!-- FPS -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">FPS</div>
            <div style="font-size: 1.5rem; font-weight: 700;">{metrics.get('fps', 0):.1f}</div>
        </div>
        
        <!-- Object Count -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Objects</div>
            <div style="font-size: 1.5rem; font-weight: 700;">{metrics.get('object_count', 0)}</div>
        </div>
        
        <!-- Tracks -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 16px; border-radius: 10px; color: white; text-align: center;">
            <div style="font-size: 0.85rem; opacity: 0.9;">Tracks</div>
            <div style="font-size: 1.5rem; font-weight: 700;">{metrics.get('track_count', 0)}</div>
        </div>
        
    </div>
    
    <!-- Detailed Stats -->
    <div style="margin-top: 12px; padding: 12px 16px; background: #f3f4f6; border-radius: 8px; display: flex; gap: 24px; font-size: 0.9rem; color: #4b5563;">
        <span>📊 Total Detections: <strong>{metrics.get('total_detections', 0)}</strong></span>
        <span>🎯 Avg Confidence: <strong>{metrics.get('avg_confidence', 0):.2%}</strong></span>
        <span>📹 Frame: <strong>{metrics.get('current_frame', 0)}/{metrics.get('total_frames', 0)}</strong></span>
    </div>
    """
    
    return html


def create_vision_lab_tab(data_manager: DataManager):
    """
    Create the Vision Lab tab with video processing, detection, and tracking.
    
    Args:
        data_manager: The shared DataManager instance
    """
    
    def handle_model_load(model_name: str) -> str:
        """Load selected YOLO model."""
        if not model_name:
            return "⚠️ Please select a model"
        
        success = vision_engine.load_model(model_name)
        if success:
            return f"✅ Loaded {model_name}"
        else:
            return f"❌ Failed to load {model_name}"
    
    def handle_settings_change(confidence: float, iou: float) -> str:
        """Update detection settings."""
        vision_engine.set_confidence(confidence)
        vision_engine.set_iou_threshold(iou)
        return f"⚙️ Confidence: {confidence:.2f}, IoU: {iou:.2f}"
    
    def process_video(
        video_path: str,
        model_name: str,
        confidence: float,
        iou: float,
        max_frames: int = 300
    ) -> Generator[Tuple[Optional[str], str, str], None, None]:
        """
        Process video with detection and tracking.
        Yields progress updates.
        """
        if not video_path:
            yield None, "❌ No video uploaded", format_metrics_html({}, "error")
            return
        
        # Load model if not already loaded
        if vision_engine.model_ensemble.current_model_name != model_name:
            if not vision_engine.load_model(model_name):
                yield None, f"❌ Failed to load {model_name}", format_metrics_html({}, "error")
                return
        
        # Update settings
        vision_engine.set_confidence(confidence)
        vision_engine.set_iou_threshold(iou)
        vision_engine.reset()
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            yield None, "❌ Could not open video", format_metrics_html({}, "error")
            return
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Limit frames
        frames_to_process = min(total_frames, max_frames)
        
        # Create output video
        output_path = tempfile.mktemp(suffix=".mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Processing metrics
        all_metrics = []
        frame_count = 0
        
        try:
            while frame_count < frames_to_process:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process frame
                annotated_frame, metrics = vision_engine.process_frame(frame)
                
                # Write to output
                out.write(annotated_frame)
                
                frame_count += 1
                metrics["current_frame"] = frame_count
                metrics["total_frames"] = frames_to_process
                all_metrics.append(metrics.copy())
                
                # Yield progress every 10 frames
                if frame_count % 10 == 0 or frame_count == frames_to_process:
                    progress_pct = (frame_count / frames_to_process) * 100
                    status_msg = f"🔄 Processing: {progress_pct:.0f}% ({frame_count}/{frames_to_process})"
                    yield None, status_msg, format_metrics_html(metrics, "processing")
        
        finally:
            cap.release()
            out.release()
        
        # Calculate summary metrics
        if all_metrics:
            summary = {
                "fps": sum(m["fps"] for m in all_metrics) / len(all_metrics),
                "object_count": max(m["object_count"] for m in all_metrics),
                "total_detections": sum(m["total_detections"] for m in all_metrics),
                "avg_confidence": sum(m["avg_confidence"] for m in all_metrics) / len(all_metrics),
                "track_count": max(m["track_count"] for m in all_metrics),
                "current_frame": frames_to_process,
                "total_frames": frames_to_process
            }
            
            # Save to DataManager for Analytics tab
            data_manager.set_vision_results({
                "summary": summary,
                "frame_metrics": all_metrics,
                "video_path": video_path,
                "output_path": output_path,
                "model_used": model_name
            })
        else:
            summary = {}
        
        yield output_path, f"✅ Processed {frame_count} frames", format_metrics_html(summary, "done")
    
    def handle_process_click(video, model_name, confidence, iou, max_frames):
        """Handle the process button click."""
        if video is None:
            return None, "❌ Please upload a video first", format_metrics_html({}, "error")
        
        # Get video path
        video_path = video if isinstance(video, str) else video
        
        # Process and get final result
        result = None
        status = ""
        metrics_html = ""
        
        for output, stat, html in process_video(video_path, model_name, confidence, iou, max_frames):
            result = output
            status = stat
            metrics_html = html
        
        return result, status, metrics_html
    
    def handle_clear():
        """Clear vision results."""
        vision_engine.reset()
        data_manager.clear_vision_results()
        return None, None, "🗑️ Cleared", format_metrics_html({}, "ready")
    
    # ==================== Tab UI ====================
    
    # ==================== Tab UI ====================
    
    with gr.Column():
        # Header
        gr.HTML("<h2 class='tab-header'>👁️ Vision Lab</h2>")
        gr.Markdown(
            """
            ### Real-time object detection, tracking, and trajectory prediction
            **Features:** YOLO detection • Multi-object tracking • Kalman filtering • Trajectory prediction
            """
        )
        
        with gr.Row():
            # Left Column - Controls
            with gr.Column(scale=1):
                gr.Markdown("### ⚙️ Settings")
                
                # Model selection
                model_dropdown = gr.Dropdown(
                    choices=vision_engine.get_available_models(),
                    value="YOLOv8n",
                    label="Model variant",
                    info="Select pre-trained YOLO model"
                )
                
                # Confidence slider
                confidence_slider = gr.Slider(
                    minimum=0.1, maximum=1.0, value=0.5, step=0.05, label="Confidence Threshold"
                )
                
                # IoU slider
                iou_slider = gr.Slider(
                    minimum=0.1, maximum=1.0, value=0.45, step=0.05, label="IoU Threshold"
                )
                
                # Max frames
                max_frames_slider = gr.Slider(
                    minimum=30, maximum=1000, value=300, step=30, label="Max frames to process"
                )
                
                # Status
                status_label = gr.Markdown("⏳ Ready to process video...")
                
                # Buttons
                with gr.Row():
                    process_btn = gr.Button("▶️ Process Video", variant="primary")
                    clear_btn = gr.Button("🗑️ Clear", variant="secondary")
            
            # Right Column - Video
            with gr.Column(scale=2):
                gr.Markdown("### 📹 Video Stream")
                
                with gr.Row():
                    # Input video
                    input_video = gr.Video(
                        label="Input Video",
                        sources=["upload"],
                        elem_classes=["video-container"]
                    )
                    
                    # Output video
                    output_video = gr.Video(
                        label="Processed Output",
                        elem_classes=["video-container"]
                    )
        
        # Metrics Dashboard
        gr.Markdown("### 📊 Detection Intelligence")
        metrics_display = gr.HTML(value=format_metrics_html({}, "ready"))
        
        # ==================== Event Handlers ====================
        
        # Process button
        process_btn.click(
            fn=handle_process_click,
            inputs=[input_video, model_dropdown, confidence_slider, iou_slider, max_frames_slider],
            outputs=[output_video, status_label, metrics_display]
        )
        
        # Clear button
        clear_btn.click(
            fn=handle_clear,
            inputs=[],
            outputs=[input_video, output_video, status_label, metrics_display]
        )
        
        # Model change
        model_dropdown.change(
            fn=handle_model_load,
            inputs=[model_dropdown],
            outputs=[status_label]
        )
