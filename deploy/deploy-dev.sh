#!/bin/sh
set -eu

IMAGE_TAG="${1:?Usage: deploy-dev.sh IMAGE_TAG}"
APP_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
COMPOSE_FILE="$APP_DIR/compose.dev.yml"
ENV_FILE="$APP_DIR/.env"
TAG_FILE="$APP_DIR/.deployed-tag"
CONTAINER_NAME="zroimg-frontend-dev"
NGINX_CONTAINER="nginx"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Create it from env.dev.example before the first deployment." >&2
  exit 1
fi

previous_tag=""
if [ -f "$TAG_FILE" ]; then
  previous_tag="$(cat "$TAG_FILE")"
fi

compose() {
  docker compose \
    --project-name zroimg-frontend-dev \
    --env-file "$ENV_FILE" \
    --file "$COMPOSE_FILE" \
    "$@"
}

wait_until_healthy() {
  attempt=1
  while [ "$attempt" -le 30 ]; do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_NAME" 2>/dev/null || true)"

    if [ "$health" = "healthy" ]; then
      return 0
    fi

    if [ "$health" = "unhealthy" ] || [ "$health" = "exited" ]; then
      return 1
    fi

    sleep 2
    attempt=$((attempt + 1))
  done

  return 1
}

reload_nginx() {
  docker exec "$NGINX_CONTAINER" nginx -t
  docker exec "$NGINX_CONTAINER" nginx -s reload
}

cd "$APP_DIR"
export IMAGE_TAG

echo "Pulling frontend image: $IMAGE_TAG"
compose pull frontend
compose up -d --remove-orphans frontend

if wait_until_healthy && reload_nginx; then
  printf '%s\n' "$IMAGE_TAG" > "$TAG_FILE.tmp"
  mv "$TAG_FILE.tmp" "$TAG_FILE"
  echo "Frontend deployment succeeded: $IMAGE_TAG"
  exit 0
fi

echo "Frontend health check failed: $IMAGE_TAG" >&2
docker logs --tail 100 "$CONTAINER_NAME" >&2 || true

if [ -n "$previous_tag" ] && [ "$previous_tag" != "$IMAGE_TAG" ]; then
  echo "Rolling back to: $previous_tag" >&2
  IMAGE_TAG="$previous_tag"
  export IMAGE_TAG
  compose up -d --remove-orphans frontend

  if wait_until_healthy && reload_nginx; then
    echo "Rollback succeeded: $previous_tag" >&2
  else
    echo "Rollback failed. Manual recovery is required." >&2
  fi
fi

exit 1
