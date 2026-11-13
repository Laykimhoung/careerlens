web: gunicorn config.wsgi:application --workers 2 --threads 4 --worker-class gthread --worker-tmp-dir /dev/shm --timeout 120 --graceful-timeout 30 --keep-alive 5 --max-requests 1000 --max-requests-jitter 100 --limit-request-line 4094 --limit-request-fields 100 --limit-request-field_size 8190 --access-logfile - --error-logfile -

