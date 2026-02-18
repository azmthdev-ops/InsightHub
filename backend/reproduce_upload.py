import requests
import pandas as pd
import io

# Create a dummy CSV
df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
csv_buffer = io.StringIO()
df.to_csv(csv_buffer, index=False)
csv_buffer.seek(0)

url = 'http://localhost:8000/api/data/upload'
files = {'file': ('test_data.csv', csv_buffer.getvalue(), 'text/csv')}

try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request Failed: {e}")
