# components/ai_copilot_tab.py
"""
AI Co-Pilot Tab - Chat interface for natural language data interaction.
"""

import gradio as gr
import pandas as pd
from core.ai_engine import ai_engine
from core.data_manager import DataManager

def create_ai_copilot_tab(data_manager: DataManager):
    """
    Creates the AI Co-Pilot tab interface with split-view layout.
    """
    
    with gr.Column():
        # Header
        gr.HTML(
            """
            <div class="tab-header">🤖 Gemini AI Co-Pilot</div>
            <p style="margin-top: -10px; opacity: 0.8; margin-left: 20px;">
                Natural language data assistant and automated visualization workspace
            </p>
            """
        )
        
        with gr.Row(equal_height=True):
            # Left: Chat
            with gr.Column(scale=1):
                chatbot = gr.Chatbot(
                    label="AI Assistant",
                    height=600,
                    avatar_images=(None, "https://cdn-icons-png.flaticon.com/512/4712/4712035.png")
                )
                
                with gr.Row():
                    msg = gr.Textbox(
                        placeholder="Ask me something about your data...",
                        label="Explain your request",
                        scale=8
                    )
                    submit_btn = gr.Button("Send", variant="primary", scale=2, size="lg")
                    
                clear = gr.Button("🗑️ Clear History", variant="secondary")
                
            # Right: Visualization
            with gr.Column(scale=1):
                ai_plot = gr.Plot(label="🚀 Generated Visualization")
                
                with gr.Accordion("💡 Query Inspiration", open=True):
                    gr.Markdown("""
                    - **Summarize dataset**: Get an overview of all columns and rows.
                    - **Plot [column]**: Automatically generate the best chart for a column.
                    - **Mean/Median of [column]**: Calculate quick statistics.
                    - **Outliers in [column]**: Detect anomalies in your data.
                    - **Show correlations**: See the relationships between variables.
                    """)

    def user_msg(message, history):
        if not message:
            return "", history
        history = history or []
        history.append({"role": "user", "content": message})
        return "", history

    def bot_response(history):
        if not history:
            return history, None
            
        user_message = history[-1]["content"]
        df = data_manager.get_df()
        
        if df is None or df.empty:
            gr.Warning("⚠️ No data loaded! Please upload a file in the Data Ingestion tab.")
            history.append({"role": "assistant", "content": "I don't see any data loaded yet. Please upload a file first."})
            return history, None
            
        gr.Info("🧠 Gemini is analyzing your data...")
        
        try:
            result = ai_engine.process_query(user_message, df)
            
            # Add assistant response to history
            history.append({"role": "assistant", "content": result["answer"]})
            
            # If there's a plot, we return it separately
            plot_output = None
            if result.get("type") == "plot":
                plot_output = result.get("plot")
                gr.Info("📊 Visualization generated!")
            else:
                gr.Info("✅ Analysis complete.")
                
            return history, plot_output
        except Exception as e:
            error_msg = f"AI Error: {str(e)}"
            gr.Warning(f"❌ AI Error: {str(e)}")
            history.append({"role": "assistant", "content": error_msg})
            return history, None

    # Event handlers
    # Submit via button or Enter key
    msg.submit(user_msg, [msg, chatbot], [msg, chatbot], queue=False).then(
        bot_response, chatbot, [chatbot, ai_plot]
    )
    
    submit_btn.click(user_msg, [msg, chatbot], [msg, chatbot], queue=False).then(
        bot_response, chatbot, [chatbot, ai_plot]
    )
    
    clear.click(lambda: ([], None), None, [chatbot, ai_plot], queue=False)

    return chatbot, ai_plot
