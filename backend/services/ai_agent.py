import os
import json
from typing import Dict, List, Any, Optional
import httpx

class AIAgent:
    """AI Agent for automated data insights and recommendations using DeepSeek/Groq"""
    
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
    
    def __init__(self, groq_api_key: str = None, deepseek_api_key: str = None):
        self.groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        self.deepseek_api_key = deepseek_api_key or os.getenv("DEEPSEEK_API_KEY")
        
    async def _call_llm(self, api_url: str, messages: List[Dict], model: str = "llama-3.3-70b-versatile") -> Optional[str]:
        """Make async call to LLM API"""
        api_key = self.deepseek_api_key if "deepseek" in api_url else self.groq_api_key
        if not api_key:
            return None
            
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"model": model, "messages": messages, "temperature": 0.7}
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(api_url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"LLM API Error: {e}")
            return None
    
    def generate_insights(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate automated insights based on the data profile.
        Uses DeepSeek for intelligent insights generation.
        """
        insights = []
        recommendations = []
        
        # 1. Quality Insights
        qual = profile.get("data_quality_score", {})
        rating = qual.get("rating", "N/A")
        score = qual.get("overall_score", 0)
        
        if score > 80:
            insights.append(f"Data quality is remarkably high ({rating}), suggesting minimal cleaning required before modeling.")
        elif score < 50:
            insights.append(f"Data quality is currently {rating}. Significant missing values or low uniqueness detected.")
            recommendations.append("Apply imputation strategies in the Data Prep Studio to improve quality.")

        # 2. Correlation Insights
        corr = profile.get("correlations", {})
        high_corr = corr.get("high_correlations", [])
        if high_corr:
            col1 = high_corr[0]["column1"]
            col2 = high_corr[0]["column2"]
            val = high_corr[0]["correlation"]
            insights.append(f"Strong correlation detected between '{col1}' and '{col2}' ({val:.2f}). Consider feature selection to avoid redundancy.")
            
        # 3. Missing Value Insights
        missing = profile.get("missing_analysis", {})
        if missing.get("overall_missing_percentage", 0) > 5:
            recommendations.append(f"Handle the {missing['overall_missing_percentage']:.1f}% missing values using KNN or MICE imputation for better ML accuracy.")

        # 4. ML Recommendations
        summary = profile.get("summary_stats", {})
        rows = summary.get("total_rows", 0)
        
        if rows > 1000:
            recommendations.append("Dataset size is sufficient for ensemble methods like Random Forest or XGBoost.")
        else:
            recommendations.append("Small dataset detected. Consider simpler models like Linear Regression or Naive Bayes to avoid overfitting.")

        return {
            "insights": insights,
            "recommendations": recommendations,
            "smart_summary": f"Analyzed {summary.get('total_columns')} columns and {rows} rows. Data is overall {rating.lower()} quality."
        }

    async def chat_with_context(self, query: str, profile: Dict[str, Any], context: str = "") -> str:
        """
        Chat with context using DeepSeek for intelligent responses.
        Falls back to heuristic if API not available.
        """
        # Build context from profile
        profile_text = json.dumps(profile, indent=2) if profile else "No dataset loaded."
        
        system_prompt = f"""You are an expert Data Scientist and ML Engineer at Azmth.
        You have access to the user's dataset profile:
        
        {profile_text}
        
        {context}
        
        Provide helpful, accurate responses about data analysis, ML, and visualizations.
        When providing code, use Python with pandas and plotly.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]
        
        # Try DeepSeek first, then Groq, then fallback
        response = await self._call_llm(self.DEEPSEEK_API_URL, messages, "deepseek-reasoner")
        if not response:
            response = await self._call_llm(self.GROQ_API_URL, messages, "llama-3.3-70b-versatile")
        
        if not response:
            # Fallback to heuristic if no API keys
            if "insight" in query.lower():
                res = self.generate_insights(profile)
                response = f"Based on my analysis: {res['insights'][0] if res['insights'] else 'No insights available.'} "
                response += f"I recommend you {res['recommendations'][0] if res['recommendations'] else 'explore your data more.'}"
            else:
                response = "I am the DataSynth AI Agent. I can help you analyze your data, suggest visualizations, or recommend ML models. "
                response += "Upload a dataset and ask me anything about it!"
        
        return response
    
    async def generate_code(self, query: str, columns: List[str], context: str = "") -> Dict[str, Any]:
        """Generate executable Python code for data analysis tasks"""
        columns_text = ", ".join(columns) if columns else "No columns available"
        
        system_prompt = f"""You are an expert Python Data Scientist.
        Available columns: {columns_text}
        Context: {context}
        
        Generate Python code using pandas (pd) and plotly (px) for visualizations.
        Store any plot data in a variable called 'plot_data' as a pandas DataFrame.
        Wrap code in ```python ``` blocks.
        
        Return JSON: {{"code": "...", "explanation": "..."}}
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate code for: {query}"}
        ]
        
        response = await self._call_llm(self.DEEPSEEK_API_URL, messages, "deepseek-reasoner")
        if not response:
            response = await self._call_llm(self.GROQ_API_URL, messages, "llama-3.3-70b-versatile")
        
        # Parse code from response
        if response:
            # Extract code block if present
            import re
            code_match = re.search(r'```python\s*(.*?)\s*```', response, re.DOTALL)
            if code_match:
                code = code_match.group(1)
            else:
                code = response
            return {"code": code, "explanation": response}
        
        return {"code": "", "explanation": "Could not generate code."}
