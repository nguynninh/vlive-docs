#!/usr/bin/env bash
# Deploy vlive-docs on the server: latest release at "/" (port 3000)
# plus optional pinned older releases at "/vX.Y.Z/" (separate port each).
#
# Usage:
#   ./deploy.sh latest v1.0.2
#   ./deploy.sh pinned v1.0.0 4000
#   ./deploy.sh reload-nginx
set -euo pipefail

REPO_URL="https://github.com/nguynninh/vlive-docs.git"
LATEST_DIR="/home/vtvlive/vlive-docs"
RELEASES_DIR="/home/vtvlive/releases"
LATEST_APP_NAME="vlive-docs"
LATEST_PORT=3000

usage() {
  echo "Usage:"
  echo "  $0 latest <tag>              Deploy latest release at / (port $LATEST_PORT)"
  echo "  $0 pinned <tag> <port>       Deploy a pinned release at /<tag>/ on <port>"
  echo "  $0 reload-nginx              Test and reload nginx config"
  exit 1
}

deploy_latest() {
  local tag="$1"
  cd "$LATEST_DIR"
  git fetch --tags
  git checkout "$tag"
  npm install
  npm run build
  pm2 restart "$LATEST_APP_NAME" || pm2 start npm --name "$LATEST_APP_NAME" -- start -- -p "$LATEST_PORT"
  pm2 save
}

deploy_pinned() {
  local tag="$1"
  local port="$2"
  local app_name="vlive-docs-${tag}"
  local dir="${RELEASES_DIR}/${tag}"

  mkdir -p "$RELEASES_DIR"
  if [ ! -d "$dir/.git" ]; then
    git clone "$REPO_URL" "$dir"
  fi

  cd "$dir"
  git fetch --tags
  git checkout "$tag"
  npm install
  BASE_PATH="/${tag}" npm run build
  pm2 restart "$app_name" || BASE_PATH="/${tag}" pm2 start npm --name "$app_name" -- start -- -p "$port"
  pm2 save
}

reload_nginx() {
  nginx -t
  systemctl reload nginx
}

case "${1:-}" in
  latest)
    [ $# -eq 2 ] || usage
    deploy_latest "$2"
    ;;
  pinned)
    [ $# -eq 3 ] || usage
    deploy_pinned "$2" "$3"
    ;;
  reload-nginx)
    reload_nginx
    ;;
  *)
    usage
    ;;
esac

pm2 list
