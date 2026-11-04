#!/usr/bin/env bash
# ==============================================================================
# DreamGuard — Automated Oracle Cloud (OCI) Ubuntu Deployment Script
# Run this on your Oracle Cloud Ubuntu VM:
#   curl -sSL https://raw.githubusercontent.com/Satyanarayana2417/Dream-guard-2-/main/FULL_CODE/scripts/deploy_oci.sh | bash
# ==============================================================================
set -euo pipefail

echo "==> 1. Updating system and installing dependencies..."
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv git curl iptables-persistent

echo "==> 2. Opening port 8000 in Ubuntu firewall (iptables)..."
sudo iptables -I INPUT 1 -p tcp --dport 8000 -j ACCEPT || true
sudo netfilter-persistent save || true

APP_DIR="/opt/dreamguard"
REPO_URL="https://github.com/Satyanarayana2417/Dream-guard-2-.git"

echo "==> 3. Setting up application directory at $APP_DIR..."
if [ -d "$APP_DIR" ]; then
    echo "Updating existing repository..."
    cd "$APP_DIR"
    git pull origin main
else
    sudo git clone "$REPO_URL" "$APP_DIR"
    sudo chown -R "$USER:$USER" "$APP_DIR"
    cd "$APP_DIR"
fi

echo "==> 4. Setting up Python virtual environment..."
cd "$APP_DIR/FULL_CODE/backend"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

echo "==> 5. Initializing database and scanning Saffron Bank dataset..."
.venv/bin/python -m app.cli reset

echo "==> 6. Generating persistent cryptographic secrets..."
mkdir -p "$APP_DIR/data/secrets"
if [ ! -f "$APP_DIR/data/secrets/hmac.key" ]; then
    python3 -c "import secrets; open('$APP_DIR/data/secrets/hmac.key', 'w').write(secrets.token_hex(32))"
    chmod 600 "$APP_DIR/data/secrets/hmac.key"
fi
if [ ! -f "$APP_DIR/data/secrets/credential.key" ]; then
    python3 -c "import secrets; open('$APP_DIR/data/secrets/credential.key', 'w').write(secrets.token_hex(32))"
    chmod 600 "$APP_DIR/data/secrets/credential.key"
fi

echo "==> 7. Creating systemd service for 24/7 background execution..."
SERVICE_FILE="/etc/systemd/system/dreamguard.service"
sudo bash -c "cat <<EOF > $SERVICE_FILE
[Unit]
Description=DreamGuard Data Protection Engine
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=SENTINEL_ENV=production
Environment=SENTINEL_ALLOWED_DB_HOSTS=localhost,127.0.0.1
ExecStart=$APP_DIR/FULL_CODE/backend/.venv/bin/python -m uvicorn app.main:app --app-dir FULL_CODE/backend --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF"

echo "==> 8. Enabling and starting dreamguard.service..."
sudo systemctl daemon-reload
sudo systemctl enable dreamguard
sudo systemctl restart dreamguard

sleep 3
echo "==> Checking service status..."
sudo systemctl status dreamguard --no-pager

echo ""
echo "=========================================================================="
echo "SUCCESS! DreamGuard is now running 24/7 on port 8000."
echo "Access health check: curl http://localhost:8000/api/health"
echo "Public Access:       http://<YOUR_OCI_PUBLIC_IP>:8000"
echo "=========================================================================="
