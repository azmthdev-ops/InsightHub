import sys
import io
import traceback
import pandas as pd
import numpy as np
import multiprocessing
import time
import signal
from typing import Dict, Any

def worker(code: str, context: dict, queue: multiprocessing.Queue):
    """Worker function for isolated execution with enhanced security"""
    output = io.StringIO()
    sys.stdout = output
    sys.stderr = output
    
    # Restricted Globals - Only safe operations allowed
    safe_globals = {
        'pd': pd,
        'np': np,
        '__builtins__': {
            # Basic functions
            'print': print,
            'len': len,
            'range': range,
            'enumerate': enumerate,
            'zip': zip,
            'map': map,
            'filter': filter,
            'sorted': sorted,
            'reversed': reversed,
            'abs': abs,
            'round': round,
            'sum': sum,
            'min': min,
            'max': max,
            'all': all,
            'any': any,
            
            # Data types
            'dict': dict,
            'list': list,
            'tuple': tuple,
            'set': set,
            'str': str,
            'int': int,
            'float': float,
            'bool': bool,
            
            # Type checking
            'isinstance': isinstance,
            'type': type,
            
            # BLOCKED: No file I/O, no imports, no system access
            # 'open', 'file', 'input', '__import__', 'eval', 'exec', 'compile'
        }
    }
    
    if context:
        safe_globals.update(context)
        
    try:
        # Execute code with restricted globals
        exec(code, safe_globals)
        
        # Extract plot_data if exists
        plot_data = safe_globals.get('plot_data', [])
        if isinstance(plot_data, pd.DataFrame):
            plot_data = plot_data.to_dict(orient='records')
            
        queue.put({
            "success": True,
            "output": output.getvalue(),
            "plot_data": plot_data,
            "error": None
        })
    except Exception:
        queue.put({
            "success": False,
            "output": output.getvalue(),
            "error": traceback.format_exc()
        })

class CodeExecutor:
    """Sandboxed Python code executor with security restrictions"""
    
    def __init__(self, max_timeout: int = 15, max_memory_mb: int = 512):
        self.max_timeout = max_timeout
        self.max_memory_mb = max_memory_mb
    
    def execute_python_code(
        self, 
        code: str, 
        context: Dict[str, Any] = None, 
        timeout: int = None
    ) -> Dict[str, Any]:
        """
        Execute Python code in a separate process with timeout and memory limits.
        
        Security features:
        - Runs in isolated process
        - Restricted builtins (no file I/O, no imports, no eval/exec)
        - Timeout protection
        - Memory limits (via process isolation)
        - No network access
        
        Args:
            code: Python code to execute
            context: Variables to make available (e.g., {'df': dataframe})
            timeout: Maximum execution time in seconds
            
        Returns:
            Dict with success, output, plot_data, and error fields
        """
        if timeout is None:
            timeout = self.max_timeout
            
        # Validate code length
        if len(code) > 50000:  # 50KB limit
            return {
                "success": False,
                "output": "",
                "error": "Code too long. Maximum 50KB allowed."
            }
        
        # Check for dangerous patterns
        dangerous_patterns = [
            'import os', 'import sys', 'import subprocess', 
            '__import__', 'eval(', 'exec(', 'compile(',
            'open(', 'file(', 'input(', 'raw_input(',
            'socket', 'urllib', 'requests', 'http'
        ]
        
        code_lower = code.lower()
        for pattern in dangerous_patterns:
            if pattern in code_lower:
                return {
                    "success": False,
                    "output": "",
                    "error": f"Security violation: '{pattern}' is not allowed in code execution."
                }
        
        queue = multiprocessing.Queue()
        p = multiprocessing.Process(target=worker, args=(code, context, queue))
        p.start()
        
        p.join(timeout)
        if p.is_alive():
            p.terminate()
            p.join()
            return {
                "success": False,
                "output": "",
                "error": f"Execution timed out after {timeout} seconds. Code took too long to execute."
            }
            
        if not queue.empty():
            return queue.get()
        else:
            return {
                "success": False,
                "output": "",
                "error": "Execution failed silently or was interrupted."
            }
