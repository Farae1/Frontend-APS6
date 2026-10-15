#!/bin/sh
# Creates a self-signed certificate on the first start (kept in a volume).
set -e
mkdir -p /etc/nginx/certs
if [ ! -f /etc/nginx/certs/cert.pem ]; then
    openssl req -x509 -newkey rsa:2048 -nodes -days 825 -subj "/CN=aps6.local" \
        -keyout /etc/nginx/certs/key.pem -out /etc/nginx/certs/cert.pem 2>/dev/null
    echo "self-signed certificate created"
fi
