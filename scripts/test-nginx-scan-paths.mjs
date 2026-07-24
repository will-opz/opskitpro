import assert from "node:assert/strict";

// Mirrors deploy/lightsail/nginx.conf. This is a fast fixture check; nginx -t
// remains the authoritative syntax validation before every production reload.
const frameworkProbe =
  /(?:^|\/)(?:wp-admin|wp-content|wp-includes|actuator|phpmyadmin|cgi-bin)(?:\/|$)/i;
const applianceProbe =
  /(?:^|\/)(?:wp-login\.php|xmlrpc\.php|server-status|HNAP1|boaform)(?:\/|$)/i;
const sensitiveFile =
  /^\/(?:en\/|zh\/)?(?:config\.(?:json|ya?ml)|docker-compose(?:\.[a-z0-9_-]+)?\.ya?ml|terraform\.(?:tfstate|tfvars)|(?:secrets?|credentials|service-account)\.(?:json|ya?ml)|appsettings(?:\.[a-z0-9_-]+)?\.json|(?:backup|database|db|dump)\.(?:sql|zip|tar(?:\.gz)?|tgz|gz)|config\.php\.(?:bak|old)|settings\.py(?:\.(?:bak|old))?)$/i;
const hiddenFile = /\/\.(?!well-known(?:\/|$))/;
const executableProbe = /\.(?:php|aspx|cgi|pl)$/i;

function isBlocked(path) {
  return (
    frameworkProbe.test(path) ||
    applianceProbe.test(path) ||
    sensitiveFile.test(path) ||
    hiddenFile.test(path) ||
    executableProbe.test(path)
  );
}

const blocked = [
  "/.env",
  "/.git/config",
  "/config.json",
  "/zh/config.yaml",
  "/docker-compose.yml",
  "/docker-compose.prod.yml",
  "/terraform.tfstate",
  "/credentials.json",
  "/appsettings.Production.json",
  "/backup.tar.gz",
  "/en/actuator/heapdump",
  "/en/blog/wp-includes/wlwmanifest.xml",
  "/phpmyadmin/",
  "/cgi-bin/",
  "/server-status",
  "/HNAP1",
  "/index.php",
];

const allowed = [
  "/",
  "/en",
  "/robots.txt",
  "/.well-known/security.txt",
  "/en/blog/public-api-error-contract-for-diagnostic-tools",
  "/blog-covers/json-tool.svg",
  "/api/diagnostic",
  "/api/tools/http-check",
  "/en/tools/json",
  "/openapi.json",
  "/swagger.json",
  "/index.js",
  "/assets/config.json",
];

for (const path of blocked) {
  assert.equal(isBlocked(path), true, `expected scanner path to be blocked: ${path}`);
}

for (const path of allowed) {
  assert.equal(isBlocked(path), false, `expected legitimate path to remain allowed: ${path}`);
}

console.log(`Nginx scanner fixtures passed (${blocked.length} blocked, ${allowed.length} allowed).`);
