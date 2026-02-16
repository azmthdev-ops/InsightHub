# app.py
"""
DataSynth Analytics Hub - Main Application
A 4-tab Gradio application for enterprise-grade data analytics.

Tabs:
    1. Data Ingestion - Upload and preview data files
    2. Vision Lab - Video processing with YOLO detection and tracking
    3. Analytics Hub - Statistical analysis and ML models
    4. AI Co-Pilot - Natural language interface for data queries
"""

import gradio as gr
from core.ai_engine import ai_engine
from core.data_manager import data_manager
from components.data_ingestion_tab import create_data_ingestion_tab
from components.vision_lab_tab import create_vision_lab_tab
from components.analytics_hub_tab import create_analytics_hub_tab
from components.ai_copilot_tab import create_ai_copilot_tab

# ==================== Constants ====================
DEFAULT_GEMINI_KEY = "AIzaSyDjeu06ADLkF29orzanbxkEzW4x60jL7O8"

# ==================== Custom CSS ====================
CUSTOM_CSS = """
/* Import Inter Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Lexend:wght@400;600;700&display=swap');

:root {
    --cyber-blue: #00d2ff;
    --electric-purple: #9d50bb;
    --neon-glow: 0 0 15px rgba(0, 210, 255, 0.4);
    --glass-bg: rgba(15, 23, 42, 0.7);
    --glass-border: rgba(255, 255, 255, 0.1);
}

/* Base App Styling */
.gradio-container {
    font-family: 'Lexend', sans-serif !important;
    background: radial-gradient(circle at top right, #1e293b, #0f172a) !important;
    color: #f8fafc !important;
}

/* Glassmorphism Panels */
.info-card, .tab-nav, .form, .gr-box {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
}

/* Header Animation & Style */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.header-title {
    background: linear-gradient(90deg, var(--cyber-blue), var(--electric-purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 3rem !important;
    font-weight: 800 !important;
    letter-spacing: -1px;
    animation: fadeInUp 0.8s ease-out;
}

.header-subtitle {
    color: #94a3b8 !important;
    font-weight: 400;
    opacity: 0.8;
    animation: fadeInUp 1s ease-out;
}

/* Tab Navigation Styling */
.tab-nav {
    border: none !important;
    padding: 8px !important;
    margin-bottom: 24px !important;
}

.tab-nav button {
    border: none !important;
    padding: 12px 24px !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    color: #94a3b8 !important;
}

.tab-nav button:hover {
    background: rgba(255, 255, 255, 0.05) !important;
    color: white !important;
}

.tab-nav button.selected {
    background: linear-gradient(135deg, var(--cyber-blue), var(--electric-purple)) !important;
    color: white !important;
    box-shadow: var(--neon-glow) !important;
    transform: scale(1.05);
}

/* Button Neon Effects */
.gr-button-primary {
    background: linear-gradient(135deg, var(--cyber-blue), var(--electric-purple)) !important;
    border: none !important;
    box-shadow: var(--neon-glow) !important;
    transition: all 0.2s ease !important;
}

.gr-button-primary:hover {
    transform: translateY(-2px);
    filter: brightness(1.2);
    box-shadow: 0 0 25px rgba(0, 210, 255, 0.6) !important;
}

/* Custom Tab Headers */
.tab-header {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin-bottom: 20px;
    border-left: 5px solid var(--cyber-blue);
    padding-left: 15px;
}

/* Scrollbar Customization */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { 
    background: linear-gradient(var(--cyber-blue), var(--electric-purple)); 
    border-radius: 10px;
}

/* Center Video Players */
.video-container {
    display: flex;
    justify-content: center;
    align-items: center;
}
"""


# ==================== Main Application ====================

def create_app():
    """Create the main Gradio application with 4 tabs"""
    
    # Pre-initialize AI Engine
    ai_engine.configure(DEFAULT_GEMINI_KEY)
    
    with gr.Blocks(
        title="DataSynth Analytics Hub",
        theme=gr.themes.Soft(
            primary_hue="indigo",
            secondary_hue="purple",
            neutral_hue="slate"
        ),
        css=CUSTOM_CSS
    ) as app:
        
        # Sidebar for Settings
        with gr.Sidebar(label="⚙️ Settings"):
            gr.Markdown("### 🤖 AI Provider")
            provider_radio = gr.Radio(
                choices=["Google Gemini", "DeepSeek"],
                value="Google Gemini",
                label="Select AI Provider"
            )
            
            gr.Markdown("### 🛠️ API Configuration")
            with gr.Column(visible=True) as gemini_col:
                api_key_input = gr.Textbox(
                    label="Google Gemini API Key",
                    placeholder="Enter your Gemini API key...",
                    value=DEFAULT_GEMINI_KEY,
                    type="password"
                )
            
            with gr.Column(visible=False) as deepseek_col:
                deepseek_key_input = gr.Textbox(
                    label="DeepSeek API Key",
                    placeholder="Enter your DeepSeek API key...",
                    type="password"
                )
            
            def toggle_provider(provider):
                if provider == "DeepSeek":
                    return gr.update(visible=False), gr.update(visible=True)
                return gr.update(visible=True), gr.update(visible=False)
            
            provider_radio.change(toggle_provider, provider_radio, [gemini_col, deepseek_col])
            
            update_key_btn = gr.Button("Update Configuration", variant="primary")
            config_status = gr.Markdown("*Select a provider and enter API key*")
            
            def update_ai_config(provider, gemini_key, deepseek_key):
                if provider == "Google Gemini":
                    if gemini_key:
                        success = ai_engine.configure(gemini_key)
                        if success:
                            return "✅ Gemini AI Configured"
                        return "❌ Invalid Gemini Key"
                else:  # DeepSeek
                    if deepseek_key:
                        success = ai_engine.configure_deepseek(deepseek_key)
                        if success:
                            return "✅ DeepSeek AI Configured"
                        return "❌ Invalid DeepSeek Key"
                return "⚠️ Please enter an API key"
            
            update_key_btn.click(update_ai_config, [provider_radio, api_key_input, deepseek_key_input], config_status)
            
            gr.Markdown("---")
            gr.Markdown("### 📊 App Info")
            gr.Markdown("Version: 2.1.0 (AI Enhanced)")
            gr.Markdown("Datahub: v4.1")

        # Header
        gr.HTML(
            """
            <div style="text-align: center; padding: 20px 0;">
                <h1 class="header-title">🚀 DataSynth Analytics Hub</h1>
                <p class="header-subtitle">
                    Enterprise-grade data analytics platform | Gemini AI Powered
                </p>
            </div>
            """
        )
        
        # Main Tabs
        with gr.Tabs() as tabs:
            # Tab 1: Data Ingestion
            with gr.TabItem("📁 Data Ingestion", id="data_ingestion"):
                create_data_ingestion_tab(data_manager)
            
            # Tab 2: Vision Lab
            with gr.TabItem("🎥 Vision Lab", id="vision_lab"):
                create_vision_lab_tab(data_manager)
            
            # Tab 3: Analytics Hub
            with gr.TabItem("📈 Analytics Hub", id="analytics_hub"):
                create_analytics_hub_tab(data_manager)
            
            # Tab 4: AI Co-Pilot
            with gr.TabItem("🤖 AI Co-Pilot", id="ai_copilot"):
                create_ai_copilot_tab(data_manager)
        
        # Footer
        gr.HTML(
            """
            <div style="text-align: center; padding: 20px; margin-top: 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 0.9rem;">
                    🚀 <strong>DataSynth Analytics Hub</strong> | 
                    Built with Gradio | 
                    Powered by YOLO, Scikit-learn & Plotly
                </p>
            </div>
            """
        )
    
    return app


# ==================== Entry Point ====================

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 DataSynth Analytics Hub Starting...")
    print("=" * 60)
    print("📊 Initializing Data Manager...")
    print(f"   State: {data_manager.get_state_summary()}")
    print("=" * 60)
    
    # Create and launch the app
    app = create_app()
    
    app.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False,
        debug=True,
        show_error=True
    )
