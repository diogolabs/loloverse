#!/usr/bin/env bash
# ==============================================================================
# Loloverse — Instalador Hardened do PocketBase para Oracle Cloud Ubuntu ARM64
# Otimizado para VM Ampere 1 OCPU / 1 GB RAM
#
# Uso na VM (a partir da raiz do repositório clonado):
#   sudo PB_VERSION=0.26.6 bash pocketbase/deploy/install-oracle-arm64.sh
# ==============================================================================
set -euo pipefail

PB_VERSION="${PB_VERSION:-0.26.6}"
INSTALL_DIR="/opt/loloverse-pb"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute este script com sudo: sudo bash $0"
  exit 1
fi

ARCH="$(uname -m)"
case "${ARCH}" in
  aarch64|arm64) PB_ARCH="linux_arm64" ;;
  x86_64|amd64)  PB_ARCH="linux_amd64" ;;
  *)
    echo "Arquitetura não suportada automaticamente: ${ARCH}"
    exit 1
    ;;
esac

echo "[1/6] Verificando memória e configurando swap de segurança (2 GB) para VM 1GB..."
if ! swapon --show | grep -q "/swapfile"; then
  if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  if ! grep -q "^/swapfile " /etc/fstab; then
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
  fi
  sysctl -w vm.swappiness=10 >/dev/null
  echo "vm.swappiness=10" > /etc/sysctl.d/99-loloverse-swap.conf
fi

echo "[2/6] Criando usuário de sistema dedicado sem shell (pocketbase)..."
if ! id -u pocketbase >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin pocketbase
fi

echo "[3/6] Preparando diretórios em ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}/pb_data" "${INSTALL_DIR}/pb_migrations" "${INSTALL_DIR}/pb_hooks"

echo "[4/6] Instalando binário PocketBase v${PB_VERSION} (${PB_ARCH})..."
if ! command -v curl >/dev/null 2>&1 || ! command -v unzip >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  export NEEDRESTART_MODE=a
  apt-get update -qq
  apt-get install -y -qq -o Dpkg::Options::="--force-confold" curl unzip ca-certificates >/dev/null
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

PB_ZIP="pocketbase_${PB_VERSION}_${PB_ARCH}.zip"
PB_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${PB_ZIP}"
echo "Baixando ${PB_URL}..."
curl -fsSL "${PB_URL}" -o "${TMP_DIR}/${PB_ZIP}"
unzip -oq "${TMP_DIR}/${PB_ZIP}" pocketbase -d "${TMP_DIR}"
install -m 0755 -o pocketbase -g pocketbase "${TMP_DIR}/pocketbase" "${INSTALL_DIR}/pocketbase"

echo "[5/6] Copiando migrations e hooks do repositório Loloverse..."
rm -rf "${INSTALL_DIR}/pb_migrations" "${INSTALL_DIR}/pb_hooks"
cp -R "${REPO_PB_DIR}/pb_migrations" "${INSTALL_DIR}/pb_migrations"
cp -R "${REPO_PB_DIR}/pb_hooks" "${INSTALL_DIR}/pb_hooks"

chown -R pocketbase:pocketbase "${INSTALL_DIR}"
chmod 0750 "${INSTALL_DIR}" "${INSTALL_DIR}/pb_data"
chmod 0750 "${INSTALL_DIR}/pb_migrations" "${INSTALL_DIR}/pb_hooks"

echo "[6/6] Instalando unit systemd endurecida..."
install -m 0644 "${SCRIPT_DIR}/pocketbase.service" /etc/systemd/system/pocketbase.service
systemctl daemon-reload
systemctl enable pocketbase.service

echo ""
echo "=============================================================================="
echo " Instalação concluída em ${INSTALL_DIR}!"
echo "=============================================================================="
echo "Próximos passos obrigatórios:"
echo "  1. (Opcional) Configure /opt/loloverse-pb/.env (chmod 600, dono pocketbase)"
echo "     com LOLOVERSE_ADMIN_EMAIL e LOLOVERSE_ADMIN_PASSWORD (>=14 chars) para"
echo "     criar sua conta de Admin fora do Google no primeiro boot."
echo "  2. Inicie o serviço e aplique migrations:"
echo "       sudo systemctl start pocketbase"
echo "       sudo journalctl -u pocketbase -n 40 --no-pager"
echo "  3. Crie o Superuser do PocketBase (painel /_/):"
echo "       sudo -u pocketbase /opt/loloverse-pb/pocketbase superuser upsert seu-admin@seudominio.com --dir=/opt/loloverse-pb/pb_data"
echo "  4. Remova LOLOVERSE_ADMIN_PASSWORD do .env após confirmar o boot!"
echo "  5. Acesse o painel /_/ com segurança via túnel SSH (sem expor na internet):"
echo "       ssh -L 8090:127.0.0.1:8090 ubuntu@SEU_IP_ORACLE"
echo "     E abra http://127.0.0.1:8090/_/ para configurar:"
echo "       - Google OAuth2 Client ID & Secret na coleção 'users'"
echo "       - Backups automáticos (S3 / Cloudflare R2)"
echo "  6. Exponha com HTTPS usando Cloudflare Tunnel (recomendado) ou Caddy."
echo "=============================================================================="
