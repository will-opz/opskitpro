# OpsKitPro Cloudflare Edge Probe

This Worker is an authenticated, user-triggered HTTP observation point for Website Check.

It is intentionally not:

- a fixed-region monitor;
- an independent provider;
- a replacement for the AWS Lightsail probe;
- a raw IP, TCP, WHOIS, or full TLS-chain scanner.

## Preflight

```bash
npm run edge-probe:check
```

The preflight type-checks/tests the Worker and asks Wrangler to build a dry-run bundle. It does not deploy, create a route, or change secrets.

## Required secret

The Worker expects `EDGE_PROBE_TOKEN` in Wrangler secret storage. The matching Product secret must be stored as `EDGE_PROBE_TOKEN` in GitHub/Lightsail environment configuration.

Never expose the token through `NEXT_PUBLIC_*`, client JavaScript, logs, or diagnostic responses.

The Free plan does not accept explicit `limits` configuration. The Worker stays
inside the platform defaults (10 ms CPU and 50 external subrequests), while the
code imposes a stricter practical budget of five redirects, two DNS validation
requests per hop, one target request per hop, and an eight-second deadline.

## Routing

Use a dedicated Worker custom domain such as `probe-edge.opskitpro.com`. Never attach this Worker to `opskitpro.com/*`.
