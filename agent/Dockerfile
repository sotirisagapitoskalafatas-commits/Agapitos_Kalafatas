FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    portaudio19-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent package — preserve the `agent/` directory structure
# so that `from agent.brain import ...` resolves correctly
COPY agent/__init__.py agent/__init__.py
COPY agent/brain.py agent/brain.py
COPY agent/agents.py agent/agents.py
COPY agent/config.py agent/config.py
COPY agent/crm.py agent/crm.py
COPY agent/ears.py agent/ears.py
COPY agent/memory.py agent/memory.py
COPY agent/mouth.py agent/mouth.py
COPY agent/ptt.py agent/ptt.py
COPY agent/signals.py agent/signals.py
COPY agent/slack.py agent/slack.py
COPY agent/vlog.py agent/vlog.py
COPY agent/server.py server.py

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
