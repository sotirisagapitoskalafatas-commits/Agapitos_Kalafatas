FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    portaudio19-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent package — preserve the `agent/` directory structure
# so that `from agent.brain import ...` resolves correctly
COPY __init__.py agent/__init__.py
COPY brain.py agent/brain.py
COPY config.py agent/config.py
COPY memory.py agent/memory.py
COPY mouth.py agent/mouth.py
COPY vlog.py agent/vlog.py
COPY server.py server.py

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
