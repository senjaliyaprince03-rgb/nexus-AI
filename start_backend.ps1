
$env:USE_MONGO_MOCK = 'true'
Set-Location -Path 'C:\Users\Prince\Downloads\NexusAi\nexusai\backend'
& 'C:\Users\Prince\Downloads\NexusAi\nexusai\backend\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000
