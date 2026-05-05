#!/usr/bin/env bash
# One-shot deploy: static files + nginx site config + Certbot (Let's Encrypt HTTPS).
#
# Required (omit if SKIP_NGINX=1, or if DRY_RUN=1 and you only need static dry-run):
#   CERTBOT_EMAIL          Email for Let's Encrypt registration / expiry notices
#
# Common:
#   DEPLOY_HOST            Set for remote (SSH); empty = this machine only
#   DEPLOY_PATH            Web root (default: /var/www/rhythmCool)
#   DEPLOY_USER / DEPLOY_PORT
#   NGINX_SERVER_NAME      server_name value, space-separated (default: rhythm.cool www.rhythm.cool)
#   CERTBOT_DOMAINS        -d flags for certbot; default = NGINX_SERVER_NAME
#   NGINX_SITE_NAME        conf.d filename without path (default: rhythmCool)
#   CERTBOT_CLOUDFLARE_INI Cloudflare credentials file (default: /etc/letsencrypt/cloudflare.ini)
#
# Optional:
#   DEPLOY_CHOWN           Local only: chown after rsync (default nginx:nginx; empty = skip)
#   SKIP_NGINX             1 = only sync static files (no nginx / certbot; CERTBOT_EMAIL not required)
#   FORCE_NGINX_CONFIG     1 = push nginx template even if site already has SSL (dangerous)
#   DRY_RUN                1 = no writes; static rsync dry-run, skip nginx/certbot
#
# Examples:
#   CERTBOT_EMAIL=you@domain.com ./scripts/deploy-full.sh
#   DEPLOY_HOST=vps.example.com CERTBOT_EMAIL=you@domain.com ./scripts/deploy-full.sh
#   SKIP_NGINX=1 ./scripts/deploy-full.sh    # static only; no CERTBOT_EMAIL

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/nginx-rhythmCool.conf.template"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Missing template: $TEMPLATE" >&2
  exit 1
fi

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/rhythmCool}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-${USER:-root}}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_CHOWN="${DEPLOY_CHOWN:-nginx:nginx}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-rhythmCool}"
NGINX_SERVER_NAME="${NGINX_SERVER_NAME:-rhythm.cool www.rhythm.cool}"
CERTBOT_DOMAINS="${CERTBOT_DOMAINS:-$NGINX_SERVER_NAME}"
CERTBOT_CLOUDFLARE_INI="${CERTBOT_CLOUDFLARE_INI:-/etc/letsencrypt/cloudflare.ini}"
SKIP_NGINX="${SKIP_NGINX:-0}"
FORCE_NGINX_CONFIG="${FORCE_NGINX_CONFIG:-0}"
DRY_RUN="${DRY_RUN:-0}"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RSYNC_EXCLUDES=(
  --exclude '.git/'
  --exclude '.DS_Store'
  --exclude '*.swp'
)

sync_static_files() {
  local rsync_cmd=(rsync -rlptDv)
  [[ "$DRY_RUN" == "1" ]] && rsync_cmd+=(--dry-run)

  if [[ -n "$DEPLOY_HOST" ]]; then
    rsync_cmd+=(-e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=accept-new")
    rsync_cmd+=("${RSYNC_EXCLUDES[@]}")
    rsync_cmd+=(--delete)
    rsync_cmd+=("${PROJECT_ROOT}/")
    rsync_cmd+=("${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/")
    echo "Static -> ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
  else
    rsync_cmd+=("${RSYNC_EXCLUDES[@]}")
    rsync_cmd+=(--delete)
    rsync_cmd+=("${PROJECT_ROOT}/")
    rsync_cmd+=("${DEPLOY_PATH}/")
    echo "Static -> ${DEPLOY_PATH}"
  fi

  if [[ "$DRY_RUN" != "1" ]] && [[ -z "$DEPLOY_HOST" ]]; then
    sudo mkdir -p "$DEPLOY_PATH"
  fi

  if [[ -z "$DEPLOY_HOST" ]] && [[ "$DRY_RUN" != "1" ]]; then
    sudo "${rsync_cmd[@]}"
  else
    "${rsync_cmd[@]}"
  fi

  if [[ "$DRY_RUN" != "1" ]] && [[ -z "$DEPLOY_HOST" ]] && [[ -n "${DEPLOY_CHOWN}" ]]; then
    sudo chown -R "${DEPLOY_CHOWN}" "$DEPLOY_PATH"
  fi
}

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
  local site="/etc/nginx/conf.d/${NGINX_SITE_NAME}.conf"
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
    remote_sh "sudo install -m 644 ${remote_tmp} /etc/nginx/conf.d/${NGINX_SITE_NAME}.conf && rm -f ${remote_tmp}"
  else
    sudo install -m 644 "$tmp_local" "/etc/nginx/conf.d/${NGINX_SITE_NAME}.conf"
  fi
}

reload_nginx() {
  if [[ -n "$DEPLOY_HOST" ]]; then
    remote_sh "sudo nginx -t && sudo systemctl reload nginx"
  else
    sudo nginx -t && sudo systemctl reload nginx
  fi
}

install_nginx_https_site() {
  local first_domain
  first_domain=$(echo "$CERTBOT_DOMAINS" | awk '{print $1}')
  local tmp
  tmp=$(mktemp)

  sed \
    -e "s|__SERVER_NAME__|${NGINX_SERVER_NAME}|g" \
    -e "s|__DEPLOY_PATH__|${DEPLOY_PATH}|g" \
    -e "s|__FIRST_DOMAIN__|${first_domain}|g" \
    << 'NGINXEOF' > "$tmp"
# Managed by deploy-full.sh
server {
    listen 80;
    listen [::]:80;
    server_name __SERVER_NAME__;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name __SERVER_NAME__;

    ssl_certificate /etc/letsencrypt/live/__FIRST_DOMAIN__/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/__FIRST_DOMAIN__/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    root __DEPLOY_PATH__;
    index challenge/challenge.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

  if [[ -n "$DEPLOY_HOST" ]]; then
    local remote_tmp="/tmp/${NGINX_SITE_NAME}.https.$$"
    rsync -av -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=accept-new" \
      "$tmp" "${DEPLOY_USER}@${DEPLOY_HOST}:${remote_tmp}"
    remote_sh "sudo install -m 644 ${remote_tmp} /etc/nginx/conf.d/${NGINX_SITE_NAME}.conf && rm -f ${remote_tmp}"
  else
    sudo install -m 644 "$tmp" "/etc/nginx/conf.d/${NGINX_SITE_NAME}.conf"
  fi
  rm -f "$tmp"
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
    remote_sh sudo certbot certonly --dns-cloudflare \
      --dns-cloudflare-credentials "$CERTBOT_CLOUDFLARE_INI" \
      "${args[@]}" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --keep-until-expiring
  else
    sudo certbot certonly --dns-cloudflare \
      --dns-cloudflare-credentials "$CERTBOT_CLOUDFLARE_INI" \
      "${args[@]}" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --keep-until-expiring
  fi
}

check_certbot() {
  if [[ -n "$DEPLOY_HOST" ]]; then
    remote_sh bash -lc 'command -v certbot >/dev/null' || {
      echo "On ${DEPLOY_HOST}: install certbot, e.g. sudo dnf install certbot" >&2
      exit 1
    }
    remote_sh "sudo test -f ${CERTBOT_CLOUDFLARE_INI}" || {
      echo "On ${DEPLOY_HOST}: missing ${CERTBOT_CLOUDFLARE_INI}" >&2
      exit 1
    }
  else
    command -v certbot >/dev/null || {
      echo "Install certbot: sudo dnf install certbot" >&2
      exit 1
    }
    [[ -f "$CERTBOT_CLOUDFLARE_INI" ]] || {
      echo "Missing Cloudflare credentials: ${CERTBOT_CLOUDFLARE_INI}" >&2
      exit 1
    }
  fi
}

echo "=== 1. Static files ==="
sync_static_files

if [[ "$SKIP_NGINX" == "1" ]]; then
  echo "SKIP_NGINX=1 — skipping nginx and certbot."
  exit 0
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN=1 — skipping nginx install and certbot."
  exit 0
fi

: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL (required for Certbot / ACME)}"

GEN=$(mktemp) || exit 1
_deploy_nginx_tmp=$GEN
cleanup_deploy_nginx_tmp() {
  [[ -n "${_deploy_nginx_tmp-}" ]] && rm -f -- "$_deploy_nginx_tmp"
}
trap cleanup_deploy_nginx_tmp EXIT
generate_nginx_conf "$GEN"

echo "=== 2. Nginx site config (HTTP) ==="
if should_skip_nginx_upload; then
  echo "Site already has SSL in /etc/nginx/conf.d/${NGINX_SITE_NAME}.conf; skipping HTTP template upload."
else
  install_nginx_site "$GEN"
  reload_nginx
fi

echo "=== 3. Certbot (DNS-Cloudflare) ==="
check_certbot
run_certbot

echo "=== 4. Nginx site config (HTTPS) ==="
install_nginx_https_site
reload_nginx

first_domain=$(echo "${CERTBOT_DOMAINS}" | awk '{print $1}')
echo "Done. Check: https://${first_domain}/"
