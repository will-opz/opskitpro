import { mkdir, readFile, writeFile, appendFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = dirname(__dirname)
const siteUrl = process.env.OPSKITPRO_SITE_URL || 'https://opskitpro.com'
const generatedDir = join(repoRoot, 'marketing', 'generated')
const historyDir = join(repoRoot, 'marketing', 'history')
const backlogPath = join(repoRoot, 'marketing', 'tool-backlog.md')
const xApiBase = 'https://api.twitter.com/2'
const cloudflareGraphqlUrl = 'https://api.cloudflare.com/client/v4/graphql'

const toolMap = [
  {
    key: 'website-check',
    paths: ['/tools/website-check', '/blog/website-check-module'],
    keywords: ['website', 'site', 'サイト', 'ssl', 'cdn', 'http', '証明書', '期限'],
    post: `サイトが正常に見えているかをすぐ確認したいとき用に、website-check を作りました。\n\nHTTP / DNS / SSL / 応答時間をまとめて確認できます。\n\n${siteUrl}/tools/website-check\n\n#Web開発 #運用 #個人開発`,
  },
  {
    key: 'dns',
    paths: ['/tools/dns-lookup', '/blog/ip-dns-module'],
    keywords: ['dns', 'DNS', 'resolver', 'A ', 'AAAA', 'CNAME', 'MX', 'TXT', 'CAA', '解析'],
    post: `DNS の確認で、複数のサイトを行き来するのが面倒だったので作りました。\n\nA / AAAA / CNAME / MX / NS / TXT / CAA をまとめて確認できます。\n\n${siteUrl}/tools/dns-lookup\n\n#DNS #Web開発 #運用`,
  },
  {
    key: 'json',
    paths: ['/tools/json', '/blog/json-tool'],
    keywords: ['json', 'JSON', 'diff', 'schema', '整形', '修復', '比較'],
    post: `JSON を貼って、整形、修復、比較、schema 確認までできるツールを作りました。\n\nAPI レスポンスやログを確認するときに使いやすい形を目指しています。\n\n${siteUrl}/tools/json\n\n#JSON #Web開発 #TypeScript`,
  },
  {
    key: 'websocket',
    paths: ['/tools/websocket', '/blog/websocket-tool'],
    keywords: ['websocket', 'WebSocket', 'ws', '接続', 'リアルタイム'],
    post: `WebSocket の接続確認ツールを作りました。\n\n接続、送信、ログ確認、複数セッションの整理まで、ブラウザ上で試せます。\n\n${siteUrl}/tools/websocket\n\n#WebSocket #Web開発 #個人開発`,
  },
]

const ignoredPathPatterns = [
  /^\/(?:wp-admin|wp-login\.php|xmlrpc\.php|\.env|\.git|admin|phpmyadmin|cgi-bin)(?:\/|$)/i,
  /^\/(?:favicon\.ico|robots\.txt|sitemap\.xml)$/i,
  /^\/cdn-cgi\//i,
  /^\/g\/collect$/i,
  /^\/com\/v\d+\//i,
  /\.(?:php|asp|aspx|jsp|cgi)(?:$|\?)/i,
]

const productPathPrefixes = [
  '/',
  '/tools',
  '/tools/website-check',
  '/tools/dns-lookup',
  '/tools/ip-lookup',
  '/tools/json',
  '/tools/websocket',
  '/tools/passgen',
  '/tools/qrgen',
  '/blog',
]

function parseArgs(argv) {
  const args = { publish: false, input: null, lookbackDays: Number(process.env.MARKETING_LOOKBACK_DAYS || 1) }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--publish') args.publish = true
    if (argv[i] === '--input') {
      args.input = argv[i + 1]
      i += 1
    }
    if (argv[i] === '--lookback-days') {
      args.lookbackDays = Number(argv[i + 1])
      i += 1
    }
  }
  return args
}

function todayJst() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function loadInput(filePath, args) {
  if (!filePath) return collectFromApis(args)
  const raw = await readFile(join(repoRoot, filePath), 'utf8')
  return JSON.parse(raw)
}

function normalizePath(path) {
  const raw = String(path || '/')
  try {
    return new URL(raw, siteUrl).pathname || '/'
  } catch {
    return raw.split('?')[0] || '/'
  }
}

function isIgnoredPath(path) {
  const normalized = normalizePath(path)
  return ignoredPathPatterns.some((pattern) => pattern.test(normalized))
}

function isProductPath(path) {
  const normalized = normalizePath(path)
  if (normalized === '/') return true
  return productPathPrefixes.some((prefix) => prefix !== '/' && (normalized === prefix || normalized.startsWith(`${prefix}/`)))
}

function cleanCloudflareData(cloudflare = {}) {
  const mergeByKey = (items, keyName) => {
    const counts = new Map()
    for (const item of items || []) {
      const key = keyName === 'path' ? normalizePath(item[keyName]) : String(item[keyName] || 'Unknown')
      const visits = Number(item.visits || 0)
      counts.set(key, (counts.get(key) || 0) + visits)
    }
    return [...counts.entries()]
      .map(([key, visits]) => ({ [keyName]: key, visits }))
      .sort((a, b) => b.visits - a.visits)
  }

  const rawPaths = mergeByKey(cloudflare.paths || [], 'path')
  const paths = rawPaths.filter((entry) => !isIgnoredPath(entry.path) && isProductPath(entry.path))
  const ignoredPaths = rawPaths.filter((entry) => isIgnoredPath(entry.path) || !isProductPath(entry.path)).slice(0, 20)
  const countries = mergeByKey(cloudflare.countries || [], 'country')

  return { ...cloudflare, paths, ignoredPaths, countries }
}

function cleanMarketingData(data) {
  return {
    ...data,
    cloudflare: cleanCloudflareData(data.cloudflare || {}),
  }
}

async function readDotEnv(filePath) {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

function applyDotEnv(raw) {
  if (!raw) return
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex <= 0) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

async function loadLocalEnv() {
  const home = process.env.HOME || '/Users/will'
  const candidates = [
    join(repoRoot, '.env.local'),
    join(repoRoot, '.env'),
    join(home, '.hermes', '.env'),
    join(home, '.config', 'x-cli', '.env'),
  ]

  for (const candidate of candidates) {
    applyDotEnv(await readDotEnv(candidate))
  }
}

function startDate(daysBack) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - Math.max(1, Number(daysBack) || 1))
  return date
}

function startIso(daysBack) {
  return startDate(daysBack).toISOString()
}

function endIso() {
  return new Date().toISOString()
}

function boundedEndIso(daysBack) {
  const start = startDate(daysBack)
  const now = new Date()
  const maxEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1000)
  return new Date(Math.min(now.getTime(), maxEnd.getTime())).toISOString()
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const bodyText = await response.text()
  let body = null
  try {
    body = bodyText ? JSON.parse(bodyText) : null
  } catch {
    body = { raw: bodyText }
  }

  if (!response.ok) {
    const message = body?.detail || body?.title || body?.errors?.[0]?.message || bodyText || response.statusText
    throw new Error(`${response.status} ${response.statusText}: ${message}`)
  }

  return body
}

function publicMetrics(tweet) {
  const metrics = tweet.public_metrics || {}
  return {
    impressions: Number(metrics.impression_count || 0),
    likes: Number(metrics.like_count || 0),
    reposts: Number(metrics.retweet_count || 0) + Number(metrics.quote_count || 0),
    replies: Number(metrics.reply_count || 0),
    urlClicks: 0,
  }
}

async function collectX({ lookbackDays }) {
  if (!process.env.X_BEARER_TOKEN) {
    throw new Error('Missing X_BEARER_TOKEN')
  }

  const username = process.env.X_USERNAME || 'deopsai'
  const headers = { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` }
  const userUrl = `${xApiBase}/users/by/username/${encodeURIComponent(username)}`
  const user = await fetchJson(userUrl, { headers })
  const userId = user?.data?.id
  if (!userId) throw new Error(`X user not found: ${username}`)

  const params = new URLSearchParams({
    max_results: String(Number(process.env.X_RECENT_POST_LIMIT || 20)),
    start_time: startIso(lookbackDays),
    exclude: 'retweets,replies',
    'tweet.fields': 'created_at,public_metrics,entities,conversation_id,text',
  })
  const tweetsUrl = `${xApiBase}/users/${userId}/tweets?${params.toString()}`
  const tweets = await fetchJson(tweetsUrl, { headers })
  const posts = (tweets?.data || [])
    .filter((tweet) => String(tweet.text || '').includes('opskitpro.com') || /OpsKitPro/i.test(String(tweet.text || '')))
    .map((tweet) => ({
      id: tweet.id,
      url: `https://x.com/${username}/status/${tweet.id}`,
      text: tweet.text,
      createdAt: tweet.created_at,
      ...publicMetrics(tweet),
    }))

  const comments = []
  const commentLimit = Number(process.env.X_COMMENT_POST_LIMIT || 8)
  for (const post of posts.slice(0, commentLimit)) {
    const searchParams = new URLSearchParams({
      query: `conversation_id:${post.id} -from:${username}`,
      max_results: '20',
      'tweet.fields': 'created_at,public_metrics,text',
    })

    try {
      const replies = await fetchJson(`${xApiBase}/tweets/search/recent?${searchParams.toString()}`, { headers })
      comments.push(...(replies?.data || []).map((tweet) => tweet.text).filter(Boolean))
    } catch (error) {
      comments.push(`[reply_fetch_error:${post.id}] ${error.message}`)
    }
  }

  return { posts, comments }
}

async function collectCloudflare({ lookbackDays }) {
  const cloudflareAnalyticsToken = process.env.CLOUDFLARE_ANALYTICS_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
  const missing = [
    !cloudflareAnalyticsToken ? 'CLOUDFLARE_ANALYTICS_API_TOKEN' : null,
    !process.env.CLOUDFLARE_ZONE_ID ? 'CLOUDFLARE_ZONE_ID' : null,
  ].filter(Boolean)
  if (missing.length) {
    throw new Error(`Missing ${missing.join(', ')}`)
  }

  const query = `
    query OpsKitProMarketing($zoneTag: string, $datetimeGeq: string, $datetimeLeq: string, $limit: int64) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequestsAdaptiveGroups(
            limit: $limit
            filter: { datetime_geq: $datetimeGeq, datetime_leq: $datetimeLeq }
            orderBy: [count_DESC]
          ) {
            count
            dimensions {
              clientCountryName
              clientRequestPath
            }
          }
        }
      }
    }
  `

  const body = {
    query,
    variables: {
      zoneTag: process.env.CLOUDFLARE_ZONE_ID,
      datetimeGeq: startIso(lookbackDays),
      datetimeLeq: boundedEndIso(lookbackDays),
      limit: Number(process.env.CLOUDFLARE_ANALYTICS_LIMIT || 100),
    },
  }

  const result = await fetchJson(cloudflareGraphqlUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cloudflareAnalyticsToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join('; '))
  }

  const groups = result?.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || []
  const pathCounts = new Map()
  const countryCounts = new Map()

  for (const group of groups) {
    const count = Number(group.count || 0)
    const path = group.dimensions?.clientRequestPath || '/'
    const country = group.dimensions?.clientCountryName || 'Unknown'
    pathCounts.set(path, (pathCounts.get(path) || 0) + count)
    countryCounts.set(country, (countryCounts.get(country) || 0) + count)
  }

  const paths = [...pathCounts.entries()]
    .map(([path, visits]) => ({ path, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 30)

  const countries = [...countryCounts.entries()]
    .map(([country, visits]) => ({ country, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 20)

  return { paths, countries }
}

async function collectFromApis(args = {}) {
  await loadLocalEnv()
  const lookbackDays = Number(args.lookbackDays || process.env.MARKETING_LOOKBACK_DAYS || 1)
  const hasX = Boolean(process.env.X_BEARER_TOKEN)
  const hasCloudflare = Boolean((process.env.CLOUDFLARE_ANALYTICS_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN) && process.env.CLOUDFLARE_ZONE_ID)

  if (!hasX && !hasCloudflare) {
    throw new Error('API mode needs X_BEARER_TOKEN or CLOUDFLARE_ANALYTICS_API_TOKEN + CLOUDFLARE_ZONE_ID. Use --input marketing/sample-daily-input.json for manual mode.')
  }

  const [xResult, cloudflareResult] = await Promise.allSettled([
    hasX ? collectX({ lookbackDays }) : Promise.resolve({ posts: [], comments: [] }),
    hasCloudflare ? collectCloudflare({ lookbackDays }) : Promise.resolve({ paths: [], countries: [] }),
  ])

  const apiErrors = []
  if (xResult.status === 'rejected') apiErrors.push(`X: ${xResult.reason.message}`)
  if (cloudflareResult.status === 'rejected') apiErrors.push(`Cloudflare: ${cloudflareResult.reason.message}`)

  return {
    date: todayJst(),
    x: xResult.status === 'fulfilled' ? xResult.value : { posts: [], comments: [] },
    cloudflare: cloudflareResult.status === 'fulfilled' ? cloudflareResult.value : { paths: [], countries: [] },
    apiErrors,
  }
}

function scoreTopic(topic, data) {
  const pathVisits = (data.cloudflare?.paths || [])
    .filter((entry) => topic.paths.some((path) => entry.path?.startsWith(path)))
    .reduce((sum, entry) => sum + Number(entry.visits || 0), 0)

  const commentHits = (data.x?.comments || [])
    .filter((comment) => topic.keywords.some((keyword) => String(comment).toLowerCase().includes(keyword.toLowerCase())))
    .length

  const postClicks = (data.x?.posts || [])
    .filter((post) => topic.keywords.some((keyword) => String(post.text || '').toLowerCase().includes(keyword.toLowerCase())))
    .reduce((sum, post) => sum + Number(post.urlClicks || 0) * 3 + Number(post.replies || 0) * 5 + Number(post.likes || 0), 0)

  return pathVisits * 2 + commentHits * 20 + postClicks
}

function extractPainPoints(data) {
  const comments = data.x?.comments || []
  const painPoints = []

  for (const comment of comments) {
    const text = String(comment)
    if (/DNS|dns|解析|resolver/.test(text)) {
      painPoints.push({ tool: 'dns', text, action: 'Add clearer DNS summary, resolver comparison, and risk hints.' })
    } else if (/SSL|証明書|期限|certificate|cert/i.test(text)) {
      painPoints.push({ tool: 'website-check', text, action: 'Highlight certificate expiry and TLS status in the first screen.' })
    } else if (/JSON|json|diff|schema|整形|修復/i.test(text)) {
      painPoints.push({ tool: 'json', text, action: 'Improve JSON diff/schema flow and add stronger examples.' })
    } else if (/WebSocket|websocket|接続|ログ/i.test(text)) {
      painPoints.push({ tool: 'websocket', text, action: 'Improve session history, export, and connection error explanations.' })
    }
  }

  return painPoints
}

async function saveSnapshot(date, data) {
  await mkdir(historyDir, { recursive: true })
  await writeFile(join(historyDir, `${date}.json`), `${JSON.stringify(data, null, 2)}\n`)
}

async function loadHistorySnapshots({ currentDate, days = 7 }) {
  try {
    const files = (await readdir(historyDir))
      .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
      .sort()
      .slice(-days)

    const snapshots = []
    for (const file of files) {
      const raw = await readFile(join(historyDir, file), 'utf8')
      const snapshot = JSON.parse(raw)
      snapshots.push(cleanMarketingData(snapshot))
    }

    if (!snapshots.some((snapshot) => snapshot.date === currentDate)) return snapshots
    return snapshots
  } catch {
    return []
  }
}

function sumByPath(snapshots) {
  const counts = new Map()
  for (const snapshot of snapshots) {
    for (const entry of snapshot.cloudflare?.paths || []) {
      counts.set(entry.path, (counts.get(entry.path) || 0) + Number(entry.visits || 0))
    }
  }
  return [...counts.entries()]
    .map(([path, visits]) => ({ path, visits }))
    .sort((a, b) => b.visits - a.visits)
}

function buildTrendSummary(currentDate, snapshots) {
  const current = snapshots.find((snapshot) => snapshot.date === currentDate) || snapshots[snapshots.length - 1]
  const previous = snapshots.filter((snapshot) => snapshot.date !== current?.date).at(-1)
  const currentVisits = (current?.cloudflare?.paths || []).reduce((sum, entry) => sum + Number(entry.visits || 0), 0)
  const previousVisits = (previous?.cloudflare?.paths || []).reduce((sum, entry) => sum + Number(entry.visits || 0), 0)
  const delta = currentVisits - previousVisits
  const deltaPercent = previousVisits ? Math.round((delta / previousVisits) * 100) : null
  const sevenDayPaths = sumByPath(snapshots).slice(0, 8)

  return {
    snapshotCount: snapshots.length,
    currentVisits,
    previousVisits,
    delta,
    deltaPercent,
    sevenDayPaths,
  }
}

function buildReport(date, data, rankedTopics, painPoints, trendSummary) {
  const topPaths = [...(data.cloudflare?.paths || [])]
    .sort((a, b) => Number(b.visits || 0) - Number(a.visits || 0))
    .slice(0, 8)

  const topPosts = [...(data.x?.posts || [])]
    .sort((a, b) => {
      const scoreA = Number(a.urlClicks || 0) * 3 + Number(a.replies || 0) * 5 + Number(a.likes || 0) + Number(a.reposts || 0) * 3
      const scoreB = Number(b.urlClicks || 0) * 3 + Number(b.replies || 0) * 5 + Number(b.likes || 0) + Number(b.reposts || 0) * 3
      return scoreB - scoreA
    })
    .slice(0, 5)

  return `# OpsKitPro Daily Marketing Report - ${date}

## Recommendation

Next topic: **${rankedTopics[0]?.key || 'opskitpro'}**

Reason: highest combined signal from X clicks/replies, comments, and Cloudflare path visits.

## Top X Posts

${topPosts.map((post) => `- ${post.url || '(no url)'}: ${post.urlClicks || 0} clicks, ${post.replies || 0} replies, ${post.likes || 0} likes, ${post.reposts || 0} reposts, ${post.impressions || 0} impressions`).join('\n') || '- No X post data.'}

## Top Paths

${topPaths.map((entry) => `- ${entry.path}: ${entry.visits} visits`).join('\n') || '- No Cloudflare path data.'}

## 7-Day Trend

- Snapshots: ${trendSummary.snapshotCount}
- Product visits today: ${trendSummary.currentVisits}
- Previous snapshot product visits: ${trendSummary.previousVisits}
- Delta: ${trendSummary.delta >= 0 ? '+' : ''}${trendSummary.delta}${trendSummary.deltaPercent === null ? '' : ` (${trendSummary.deltaPercent >= 0 ? '+' : ''}${trendSummary.deltaPercent}%)`}

Top product paths across available snapshots:
${trendSummary.sevenDayPaths.map((entry) => `- ${entry.path}: ${entry.visits} visits`).join('\n') || '- Not enough history yet.'}

## Ignored Noise Paths

${(data.cloudflare?.ignoredPaths || []).slice(0, 8).map((entry) => `- ${entry.path}: ${entry.visits} visits`).join('\n') || '- None.'}

## Topic Scores

${rankedTopics.map((topic) => `- ${topic.key}: ${topic.score}`).join('\n')}

## Pain Points

${painPoints.map((item) => `- [${item.tool}] ${item.text}\n  Action: ${item.action}`).join('\n') || '- No actionable pain points found.'}

## API Errors

${(data.apiErrors || []).map((error) => `- ${error}`).join('\n') || '- None.'}
`
}

function buildDrafts(rankedTopics) {
  return rankedTopics.slice(0, 3).map((topic, index) => ({
    rank: index + 1,
    topic: topic.key,
    text: topic.post,
  }))
}

async function appendBacklog(date, painPoints) {
  if (!painPoints.length) return
  const section = `\n## ${date}\n\n${painPoints.map((item) => `- [${item.tool}] ${item.action}\n  Source: ${item.text}`).join('\n')}\n`
  await appendFile(backlogPath, section)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const data = cleanMarketingData(await loadInput(args.input, args))
  const date = data.date || todayJst()
  data.date = date
  await saveSnapshot(date, data)
  const historySnapshots = await loadHistorySnapshots({ currentDate: date, days: 7 })
  const trendSummary = buildTrendSummary(date, historySnapshots)

  const rankedTopics = toolMap
    .map((topic) => ({ ...topic, score: scoreTopic(topic, data) }))
    .sort((a, b) => b.score - a.score)

  const painPoints = extractPainPoints(data)
  const report = buildReport(date, data, rankedTopics, painPoints, trendSummary)
  const drafts = buildDrafts(rankedTopics)

  await mkdir(generatedDir, { recursive: true })
  await writeFile(join(generatedDir, `${date}-report.md`), report)
  await writeFile(join(generatedDir, `${date}-drafts.json`), `${JSON.stringify(drafts, null, 2)}\n`)
  await appendBacklog(date, painPoints)

  if (args.publish) {
    throw new Error('Publish mode is not wired yet. Review generated drafts first, then connect x-cli posting explicitly.')
  }

  console.log(`Wrote marketing report and drafts for ${date}.`)
  console.log(`Top topic: ${rankedTopics[0]?.key || 'none'}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
