# components/__init__.py
"""DataSynth Analytics Hub - UI Components"""

from components.data_ingestion_tab import create_data_ingestion_tab
from components.vision_lab_tab import create_vision_lab_tab
from components.analytics_hub_tab import create_analytics_hub_tab
from components.ai_copilot_tab import create_ai_copilot_tab

__all__ = [
    'create_data_ingestion_tab',
    'create_vision_lab_tab',
    'create_analytics_hub_tab',
    'create_ai_copilot_tab'
]
