#!/bin/sh
# Entrypoint para iniciar ngrok se NGROK_ENABLED=true
if [ "$NGROK_ENABLED" = "true" ]; then
  if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo "NGROK_AUTHTOKEN não definido."
    exit 1
  fi
  ngrok config add-authtoken "$NGROK_AUTHTOKEN"
  ngrok http 5173 --log=stdout &
fi
exec "$@"
