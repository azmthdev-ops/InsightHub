# core/ai_engine.py
import google.generativeai as genai
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import httpx
import traceback
from typing import Dict, Any, List, Optional

class AIEngine:
    """
    AI Engine supporting Google Gemini and DeepSeek for natural language data interaction.
    """
    
    DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
    
    def __init__(self, api_key: Optional[str] = None, provider: str = "gemini"):
        self.model = None
        self.provider = provider  # "gemini" or "deepseek"
        self.deepseek_api_key = None
        
        if provider == "deepseek" and api_key:
            self.configure_deepseek(api_key)
        elif api_key:
            self.configure(api_key)
            
    def configure(self, api_key: str):
        """Configure Gemini with a new API key."""
        try:
            genai.configure(api_key=api_key)
            
            available_models = [m.name for m in genai.list_models() 
                              if 'generateContent' in m.supported_generation_methods]
            
            target_model = "models/gemini-1.5-flash"
            if target_model not in available_models:
                flash_models = [m for m in available_models if 'flash' in m.lower()]
                if flash_models:
                    target_model = flash_models[0]
                elif available_models:
                    target_model = available_models[0]
            
            print(f"Initializing Gemini with model: {target_model}")
            self.model = genai.GenerativeModel(target_model)
            self.provider = "gemini"
            return True
        except Exception as e:
            print(f"Error configuring Gemini: {e}")
            return False
    
    def configure_deepseek(self, api_key: str):
        """Configure DeepSeek with an API key."""
        self.deepseek_api_key = api_key
        self.provider = "deepseek"
        self.model = "deepseek-reasoner"
        print("DeepSeek configured successfully")
        return True
    
    def _call_deepseek(self, messages: List[Dict], model: str = "deepseek-reasoner") -> Optional[str]:
        """Make async call to DeepSeek API."""
        if not self.deepseek_api_key:
            return None
            
        headers = {
            "Authorization": f"Bearer {self.deepseek_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7
        }
        
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(self.DEEPSEEK_API_URL, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"DeepSeek API Error: {e}")
            return None
    
    def _classify_intent(self, query: str) -> str:
        """Classify user intent using the configured provider."""
        if self.provider == "deepseek" and self.deepseek_api_key:
            return self._classify_intent_deepseek(query)
        
        if not self.model:
            return "GENERAL"
        
        prompt = f"""
        Classify intent: "{query}"
        Options: VISUALIZE, SUMMARY, STATS, GENERAL
        Reply with ONE word.
        """
        
        try:
            response = self.model.generate_content(prompt)
            intent = response.text.strip().upper()
            return intent if intent in ["VISUALIZE", "SUMMARY", "STATS", "GENERAL"] else "GENERAL"
        except:
            return "GENERAL"
    
    def _classify_intent_deepseek(self, query: str) -> str:
        """Classify intent using DeepSeek."""
        messages = [{"role": "user", "content": f"Classify: '{query}'. Reply VISUALIZE, SUMMARY, STATS, or GENERAL."}]
        response = self._call_deepseek(messages)
        if response:
            intent = response.strip().upper()
            return intent if intent in ["VISUALIZE", "SUMMARY", "STATS", "GENERAL"] else "GENERAL"
        return "GENERAL"
    
    def _parse_nlq(self, query: str, columns: List[str]) -> Dict[str, Any]:
        """Extract columns and plot types from natural language."""
        if self.provider == "deepseek" and self.deepseek_api_key:
            return self._parse_nlq_deepseek(query, columns)
            
        if not self.model:
            return {}
            
        prompt = f"""
        Parse: "{query}"
        Columns: {columns}
        Return JSON: {{"chart_type": "scatter", "columns": []}}
        """
        
        try:
            response = self.model.generate_content(prompt)
            content = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            print(f"NLQ Parsing Error: {e}")
            return {}
    
    def _parse_nlq_deepseek(self, query: str, columns: List[str]) -> Dict[str, Any]:
        """Parse NLQ using DeepSeek."""
        messages = [
            {"role": "system", "content": f"Columns: {columns}. Return JSON only."""},
            {"role": "user", "content": f"Parse: '{query}'. Return {{\"chart_type\": \"\", \"columns\": []}}"}
        ]
        response = self._call_deepseek(messages)
        if response:
            try:
                content = response.replace('```json', '').replace('```', '').strip()
                return json.loads(content)
            except:
                pass
        return {}
    
    def process_query(self, query: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Main entry point for processing AI queries."""
        if df is None or df.empty:
            return {
                "answer": "No data loaded. Please upload a file first.",
                "type": "text"
            }
        
        if not self.model and not self.deepseek_api_key:
            return {
                "answer": "AI not configured. Please set Gemini or DeepSeek API key in Settings.",
                "type": "text"
            }

        intent = self._classify_intent(query)
        
        if intent == "VISUALIZE":
            parsing_result = self._parse_nlq(query, df.columns.tolist())
            chart_type = parsing_result.get("chart_type", "histogram").lower()
            requested_cols = parsing_result.get("columns", [])
            
            cols = [c for c in requested_cols if c in df.columns]
            if not cols and len(df.columns) > 0:
                cols = [df.columns[0]]
                
            fig = self._create_plot(df, chart_type, cols)
            if fig:
                return {
                    "answer": f"Generated {chart_type} using {', '.join(cols)}.",
                    "type": "plot",
                    "plot": fig
                }

        # Handle all other queries with AI
        schema_info = df.dtypes.to_dict()
        
        if self.provider == "deepseek" and self.deepseek_api_key:
            return self._process_with_deepseek(query, schema_info, df)
        
        # Gemini path
        prompt = f"""
        You are a Data Scientist.
        Schema: {schema_info}
        Columns: {df.columns.tolist()}
        Rows: {len(df)}
        Query: "{query}"
        Intent: {intent}
        
        Provide analysis based on the data.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return {"answer": response.text, "type": "text"}
        except Exception as e:
            return {"answer": f"Error: {str(e)}", "type": "text"}
    
    def _process_with_deepseek(self, query: str, schema_info: Dict, df: pd.DataFrame) -> Dict[str, Any]:
        """Process query using DeepSeek."""
        messages = [
            {"role": "system", "content": "You are an expert Data Scientist."},
            {"role": "user", "content": f"""
            Dataset Schema: {json.dumps(schema_info)}
            Columns: {df.columns.tolist()}
            Rows: {len(df)}
            
            Query: "{query}"
            
            Provide helpful analysis about the data.
            """}
        ]
        
        response = self._call_deepseek(messages)
        if response:
            return {"answer": response, "type": "text"}
        
        return {"answer": "DeepSeek API error. Please check your API key.", "type": "text"}
    
    def _create_plot(self, df: pd.DataFrame, chart_type: str, cols: List[str]):
        """Create a Plotly figure."""
        try:
            if not cols: return None
            
            chart_type = chart_type.lower()
            if chart_type == "histogram":
                return px.histogram(df, x=cols[0], title=f"Distribution of {cols[0]}", template="plotly_dark")
            elif chart_type == "scatter" and len(cols) >= 2:
                return px.scatter(df, x=cols[0], y=cols[1], title=f"{cols[0]} vs {cols[1]}", template="plotly_dark")
            elif chart_type == "line":
                return px.line(df, y=cols[0], title=f"Trend of {cols[0]}", template="plotly_dark")
            elif chart_type == "bar":
                return px.bar(df, x=cols[0], y=cols[1] if len(cols) > 1 else None, title=f"Comparison of {cols[0]}", template="plotly_dark")
            elif chart_type == "box":
                return px.box(df, y=cols[0], title=f"Box Plot of {cols[0]}", template="plotly_dark")
            else:
                return px.histogram(df, x=cols[0], title=f"Distribution of {cols[0]}", template="plotly_dark")
        except Exception as e:
            print(f"Plotting Error: {e}")
            return None

ai_engine = AIEngine()
