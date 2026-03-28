#!/usr/bin/env bash
# One-shot deploy: static files + nginx site config + Certbot (Let's Encrypt HTTPS).
#
# Required:
#   CERTBOT_EMAIL          Email for Let's Encrypt registration / expiry notices
#
# Common:
#   DEPLOY_HOST            Set for remote (SSH); empty = this machine only
#   DEPLOY_PATH            Web root (default: /var/www/rhythmCool)
#   DEPLOY_USER / DEPLOY_PORT
#   NGINX_SERVER_NAME      server_name value, space-separated (default: rhythm.cool www.rhythm.cool)
#   CERTBOT_DOMAINS        -d flags for certbot; default = NGINX_SERVER_NAME
#   NGINX_SITE_NAME        sites-available filename without path (default: rhythmCool)
#
# Optional:
#   DEPLOY_CHOWN           Local only: chown after rsync (default www-data:www-data; empty = skip)
#   SKIP_NGINX             1 = only sync static (same as deploy.sh)
#   FORCE_NGINX_CONFIG     1 = push nginx template even if site already has SSL (dangerous)
#   DRY_RUN                1 = no writes; static rsync dry-run, skip nginx/certbot
#
# Examples:
#   CERTBOT_EMAIL=you@domain.com ./scripts/deploy-full.sh
#   DEPLOY_HOST=vps.example.com CERTBOT_EMAIL=you@domain.com ./scripts/deploy-full.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/nginx-rhythmCool.conf.template"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Missing template: $TEMPLATE" >&2
  exit 1
fi

: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL (Let's Encrypt contact email)}"

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/rhythmCool}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-${USER:-root}}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_CHOWN="${DEPLOY_CHOWN:-www-data:www-data}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-rhythmCool}"
NGINX_SERVER_NAME="${NGINX_SERVER_NAME:-rhythm.cool www.rhythm.cool}"
CERTBOT_DOMAINS="${CERTBOT_DOMAINS:-$NGINX_SERVER_NAME}"
SKIP_NGINX="${SKIP_NGINX:-0}"
FORCE_NGINX_CONFIG="${FORCE_NGINX_CONFIG:-0}"
DRY_RUN="${DRY_RUN:-0}"

remote_sh() {
  [[ -n "${DEPLOY_HOST:-}" ]] || {
    echo "remote_sh: DEPLOY_HOST is empty" >&2
    exit 1
  }
  ssh -p "${DEPLOY_PORT}" -o StrictHostKeyChecking=accept-new "${DEPLOY_USER}@${DEPLOY_HOST}" "$@"
}

# True if we should skip uploading nginx template (certbot already patched SSL).
should_skip_nginx_upload() {
  [[ "$FORCE_NGINX_CONFIG" == "1" ]] && return 1
  local site="/etc/nginx/sites-available/${NGINX_SITE_NAME}"
  if [[ -n "$DEPLOY_HOST" ]]; then
    remote_sh "sudo test -f ${site} && sudo grep -q ssl_certificate ${site} 2>/dev/null" && return 0
    return 1
  fi
  sudo test -f "$site" && sudo grep -q ssl_certificate "$site" 2>/dev/null && return 0
  return 1
}

generate_nginx_conf() {
  local out=$1
  local esc_name esc_path
  esc_name=$(printf '%s\n' "$NGINX_SERVER_NAME" | sed 's/[\/&|]/\\&/g')
  esc_path=$(printf '%s\n' "$DEPLOY_PATH" | sed 's/[\/&|]/\\&/g')
  sed \
    -e "s|__SERVER_NAME__|${esc_name}|g" \
    -e "s|__DEPLOY_PATH__|${esc_path}|g" \
    "$TEMPLATE" >"$out"
}

install_nginx_site() {
  local tmp_local=$1
  local remote_tmp="/tmp/${NGINX_SITE_NAME}.nginx.$$"

  if [[ -n "$DEPLOY_HOST" ]]; then
    rsync -av -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=accept-new" \
      "$tmp_local" "${DEPLOY_USER}@${DEPLOY_HOST}:${remote_tmp}"
    remote_sh "sudo install -m 644 ${remote_tmp} /etc/nginx/sites-available/${NGINX_SITE_NAME} && rm -f ${remote_tmp}"
    remote_sh "sudo ln -sf /etc/nginx/sites-available/${NGINX_SITE_NAME} /etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
  else
    sudo install -m 644 "$tmp_local" "/etc/nginx/sites-available/${NGINX_SITE_NAME}"
    sudo ln -sf "/etc/nginx/sites-available/${NGINX_SITE_NAME}" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
  fi
}

reload_nginx() {
  if [[ -n "$DEPLOY_HOST" ]]; then
    remote_sh "sudo nginx -t && sudo systemctl reload nginx"
  else
    sudo nginx -t && sudo systemctl reload nginx
  fi
}

run_certbot() {
  local args=()
  local d
  for d in $CERTBOT_DOMAINS; do
    [[ -n "$d" ]] || continue
    args+=(-d "$d")
  done
  if [[ ${#args[@]} -eq 0 ]]; then
    echo "CERTBOT_DOMAINS / NGINX_SERVER_NAME produced no domains." >&2
    exit 1
  fi
  if [[ -n "$DEPLOY_HOST" ]]; then
    remote_sh sudo certbot --nginx "${args[@]}" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect
  else
    sudo certbot --nginx "${args[@]}" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect
  fi
}

check_certbot() {
  if [[ -n "$DEPLOY_HOST" ]]; then
    remote_sh bash -lc 'command -v certbot >/dev/null' || {
      echo "On ${DEPLOY_HOST}: install certbot, e.g. sudo apt install certbot python3-certbot-nginx" >&2
      exit 1
    }
  else
    command -v certbot >/dev/null || {
      echo "Install certbot: sudo apt install certbot python3-certbot-nginx" >&2
      exit 1
    }
  fi
}

echo "=== 1. Static files (deploy.sh) ==="
CERTBOT_EMAIL="$CERTBOT_EMAIL" DEPLOY_PATH="$DEPLOY_PATH" DEPLOY_HOST="$DEPLOY_HOST" \
  DEPLOY_USER="$DEPLOY_USER" DEPLOY_PORT="$DEPLOY_PORT" DEPLOY_CHOWN="$DEPLOY_CHOWN" \
  DRY_RUN="$DRY_RUN" "$SCRIPT_DIR/deploy.sh"

if [[ "$SKIP_NGINX" == "1" ]]; then
  echo "SKIP_NGINX=1 — skipping nginx and certbot."
  exit 0
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN=1 — skipping nginx install and certbot."
  exit 0
fi

GEN=$(mktemp)
trap 'rm -f "$GEN"' EXIT
generate_nginx_conf "$GEN"

echo "=== 2. Nginx site config ==="
if should_skip_nginx_upload; then
  echo "Site already has SSL in /etc/nginx/sites-available/${NGINX_SITE_NAME}; skipping template upload."
  echo "Set FORCE_NGINX_CONFIG=1 to overwrite (you will need to run certbot again)."
else
  install_nginx_site "$GEN"
  reload_nginx
fi

echo "=== 3. Certbot (HTTPS) ==="
check_certbot
run_certbot

echo "Done. Check: https://$(echo $CERTBOT_DOMAINS | awk '{print $1}')/"
