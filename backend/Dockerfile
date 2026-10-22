FROM python:3.12-slim

WORKDIR /app

COPY requirements-runtime.txt .
RUN pip install --no-cache-dir -r requirements-runtime.txt

COPY app ./app

CMD ["uvicorn", "app.production:app", "--host", "0.0.0.0", "--port", "8000"]
