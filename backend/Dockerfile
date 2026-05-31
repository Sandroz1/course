FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN groupadd --system uchicode \
    && useradd --system --gid uchicode --home-dir /app --shell /usr/sbin/nologin uchicode

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY . .

RUN mkdir -p /app/staticfiles /app/media \
    && chown -R uchicode:uchicode /app

EXPOSE 8000

USER uchicode

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60"]
