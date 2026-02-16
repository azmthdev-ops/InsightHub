import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json

class Visualizer:
    def __init__(self):
        pass

    def generate_plot(self, df: pd.DataFrame, config: dict):
        """
        Generate a Plotly plot configuration based on the provided config.
        """
        plot_type = config.get("type", "scatter")
        x = config.get("x")
        y = config.get("y")
        color = config.get("color")
        
        try:
            if plot_type == "scatter":
                fig = px.scatter(df, x=x, y=y, color=color, template="plotly_dark")
            elif plot_type == "line":
                fig = px.line(df, x=x, y=y, color=color, template="plotly_dark")
            elif plot_type == "bar":
                fig = px.bar(df, x=x, y=y, color=color, template="plotly_dark")
            elif plot_type == "histogram":
                fig = px.histogram(df, x=x, color=color, template="plotly_dark")
            elif plot_type == "box":
                fig = px.box(df, x=x, y=y, color=color, template="plotly_dark")
            elif plot_type == "heatmap":
                # For heatmap, we usually need a correlation matrix or similar
                corr = df.corr()
                fig = px.imshow(corr, text_auto=True, template="plotly_dark")
            else:
                fig = px.scatter(df, x=x, y=y, template="plotly_dark")

            # Update layout to be transparent for better UI integration
            fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color="white")
            )
            
            return json.loads(fig.to_json())
        except Exception as e:
            return {"error": str(e)}

    def get_supported_plots(self):
        return ["scatter", "line", "bar", "histogram", "box", "heatmap"]
