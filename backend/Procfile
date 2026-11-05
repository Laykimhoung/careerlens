web: gunicorn config.wsgi:application --workers 2 --threads 4 --worker-class gthread --worker-tmp-dir /dev/shm --timeout 120 --access-logfile - --error-logfile -

