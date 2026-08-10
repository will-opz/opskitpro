# OpsKitPro Lightsail Deployment

This path runs OpsKitPro as a standard Next.js standalone server on AWS Lightsail.

## Server Baseline

- Amazon Linux 2023 or Ubuntu 24.04 LTS
- Node.js 24
- Nginx or Caddy as reverse proxy
- Cloudflare DNS/CDN remains in front of the Lightsail public IP
- Cloudflare Zero Trust can still protect `/admin*`

## First-Time Server Setup

```bash
sudo adduser --system --group --home /opt/opskitpro opskitpro
sudo mkdir -p /opt/opskitpro/releases /etc/opskitpro
sudo chown -R opskitpro:opskitpro /opt/opskitpro
sudo install -m 600 deploy/lightsail/opskitpro.env.example /etc/opskitpro/opskitpro.env
sudo install -m 644 deploy/lightsail/opskitpro.service /etc/systemd/system/opskitpro.service
sudo systemctl daemon-reload
sudo systemctl enable opskitpro
```

Edit `/etc/opskitpro/opskitpro.env` and set real admin secrets.

## IPinfo Lite Database

Keep the MMDB outside versioned release directories so normal deploys and release
pruning do not remove it. Upload the database to a temporary server path, then
validate the planned install before applying it:

```bash
sudo /opt/opskitpro/current/deploy/lightsail/install-ipinfo-mmdb.sh \
  --source /tmp/ipinfo_lite.mmdb \
  --sha256 YOUR_VERIFIED_SHA256 \
  --dry-run

sudo /opt/opskitpro/current/deploy/lightsail/install-ipinfo-mmdb.sh \
  --source /tmp/ipinfo_lite.mmdb \
  --sha256 YOUR_VERIFIED_SHA256
```

The script installs the database at
`/var/lib/opskitpro/ipinfo/ipinfo_lite.mmdb`, stores one rollback copy, updates
`IPINFO_MMDB_PATH`, and restarts the service. Never commit the MMDB or an IPinfo
download token to this repository.

## Manual Release

Build locally or in CI:

```bash
npm ci
bash scripts/package-standalone.sh
```

Upload and activate:

```bash
scp .deploy/opskitpro-standalone.tar.gz ec2-user@YOUR_LIGHTSAIL_IP:/tmp/opskitpro.tar.gz
ssh ec2-user@YOUR_LIGHTSAIL_IP '
  set -e
  release=/opt/opskitpro/releases/$(date +%Y%m%d%H%M%S)
  sudo mkdir -p "$release"
  sudo tar -xzf /tmp/opskitpro.tar.gz -C "$release"
  sudo chown -R opskitpro:opskitpro "$release"
  sudo ln -sfn "$release" /opt/opskitpro/current
  sudo systemctl restart opskitpro
  sudo systemctl status opskitpro --no-pager
'
```

## Reverse Proxy

With Nginx on Amazon Linux:

```bash
sudo mkdir -p /etc/nginx/ssl/opskitpro.com
sudo install -m 644 ca.pem /etc/nginx/ssl/opskitpro.com/origin.pem
sudo install -m 600 ca.key /etc/nginx/ssl/opskitpro.com/origin.key
sudo install -m 644 deploy/lightsail/nginx.conf /etc/nginx/conf.d/opskitpro.conf
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

With Caddy:

```bash
sudo install -m 644 deploy/lightsail/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Keep Cloudflare proxy enabled after the origin is healthy. Use Cloudflare SSL mode `Full (strict)` after port 443 is open in Lightsail Networking and the Cloudflare Origin Certificate is installed.

## GitHub Secrets For CI Deploy

Add these repository secrets before enabling the Lightsail workflow:

- `LIGHTSAIL_HOST`: public IP or DNS name
- `LIGHTSAIL_USER`: `ec2-user` for Amazon Linux, `ubuntu` for Ubuntu
- `LIGHTSAIL_SSH_KEY`: private key with SSH access
