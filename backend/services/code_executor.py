import sys
import io
import traceback
import pandas as pd
import numpy as np
import multiprocessing
import time

def worker(code, context, queue):
    """Worker function for isolated execution"""
    output = io.StringIO()
    sys.stdout = output
    sys.stderr = output
    
    # Restricted Globals
    safe_globals = {
        'pd': pd,
        'np': np,
        '__builtins__': {
            'print': print,
            'len': len,
            'range': range,
            'dict': dict,
            'list': list,
            'str': str,
            'int': int,
            'float': float,
            'sum': sum,
            'min': min,
            'max': max,
        }
    }
    
    if context:
        safe_globals.update(context)
        
    try:
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
    def execute_python_code(self, code: str, context: dict = None, timeout: int = 15):
        """
        Execute Python code in a separate process with a timeout.
        """
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
                "error": f"Execution timed out after {timeout} seconds."
            }
            
        if not queue.empty():
            return queue.get()
        else:
            return {
                "success": False,
                "output": "",
                "error": "Execution failed silently or was interrupted."
            }
