# OpsKitPro Marketing Automation

This workflow turns X/Twitter reactions and Cloudflare traffic into a daily promotion plan.

## Goal

- Keep promotion focused on real user response.
- Route traffic to `https://opskitpro.com`, not Qiita.
- Convert comments and analytics into tool improvements.
- Default to draft generation. Use explicit publish flags for live posting.

## Daily Loop

1. Collect X metrics for recent OpsKitPro posts.
2. Collect Cloudflare traffic for `opskitpro.com`.
3. Score promoted topics by clicks, reactions, replies, and tool-page visits.
4. Extract user pain points from replies/comments.
5. Generate:
   - daily report
   - next-post recommendation
   - backlog items for tools
   - optional X draft text

## Data Sources

The script supports two modes.

Manual input:

```bash
npm run marketing:daily -- --input marketing/sample-daily-input.json
```

API input:

```bash
npm run marketing:daily
```

Required env vars for API mode:

```bash
X_BEARER_TOKEN=
X_USERNAME=deopsai
CLOUDFLARE_ANALYTICS_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

Optional env vars:

```bash
OPSKITPRO_SITE_URL=https://opskitpro.com
MARKETING_LOOKBACK_DAYS=1
X_RECENT_POST_LIMIT=20
X_COMMENT_POST_LIMIT=8
CLOUDFLARE_ANALYTICS_LIMIT=100
```

Notes:

- X API mode uses public v2 endpoints. URL click metrics are not available through bearer-token public metrics, so the script uses likes, reposts, replies, impressions when available, and Cloudflare path visits for click/traffic signals.
- Reply fetching uses recent search by `conversation_id`. If the X app plan does not include recent search, the script records the API error in the report and still uses post metrics.
- Cloudflare mode uses GraphQL Analytics with path and country dimensions. Some plans/tokens may not expose `clientRequestPath`; the report will show the GraphQL error if the field is unavailable.

## Publishing Policy

The daily script does not publish by default. It writes recommended drafts to `marketing/generated/`.

Use publish mode only after reviewing the output:

```bash
npm run marketing:daily -- --publish
```

## Files

- `marketing/generated/YYYY-MM-DD-report.md`
- `marketing/generated/YYYY-MM-DD-drafts.json`
- `marketing/tool-backlog.md`
