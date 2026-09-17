FROM python:3.13-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=zenfix.settings.production

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000
CMD ["gunicorn", "-c", "gunicorn.conf.py"]
