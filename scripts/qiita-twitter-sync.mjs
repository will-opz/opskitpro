import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import yaml from 'js-yaml'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = dirname(__dirname)
const qiitaRoot = join(repoRoot, 'qiita')
const statePath = join(process.env.HOME || '/Users/will', '.cache', 'opskitpro', 'qiita-twitter-sync-state.json')
const xCli = process.env.X_CLI_PATH || `${process.env.HOME || '/Users/will'}/.local/bin/x-cli`

function loadDotEnvFile(filePath) {
  try {
    return readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

function applyEnvFile(raw) {
  if (!raw) return
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex <= 0) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

async function ensureXEnv() {
  const required = ['X_API_KEY', 'X_API_SECRET', 'X_BEARER_TOKEN', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET']
  if (required.every((key) => process.env[key])) return

  const candidates = [
    join(process.env.HOME || '/Users/will', '.hermes', '.env'),
    join(process.env.HOME || '/Users/will', '.config', 'x-cli', '.env'),
  ]

  for (const candidate of candidates) {
    const raw = await loadDotEnvFile(candidate)
    if (raw) applyEnvFile(raw)
  }

  const missing = required.filter((key) => !process.env[key])
  if (missing.length) {
    throw new Error(`Missing env vars for X: ${missing.join(', ')}`)
  }
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Missing YAML frontmatter')
  }
  const data = yaml.load(match[1]) || {}
  return { frontmatter: data, body: match[2], rawFrontmatter: match[1] }
}

function dumpFrontmatter(data) {
  return `---\n${yaml.dump(data, { lineWidth: 120, noRefs: true, sortKeys: false }).trimEnd()}\n---`
}

async function listMarkdownFiles(dir) {
  const { readdir, stat } = await import('node:fs/promises')
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const fileStat = await stat(fullPath)
      files.push({ path: fullPath, mtimeMs: fileStat.mtimeMs })
    }
  }
  return files
}

function normalizeDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildTweet(post) {
  const title = String(post.frontmatter.title || post.frontmatter.qiita_title || post.slug).trim()
  const url = String(post.frontmatter.qiita_url || '').trim()
  const tags = ['#Qiita', '#OpsKitPro']
  const base = `${title}\n${url}\n${tags.join(' ')}`.trim()
  if (base.length <= 280) return base

  const maxTitleLength = Math.max(40, 280 - url.length - tags.join(' ').length - 3)
  const shortenedTitle = title.length > maxTitleLength ? `${title.slice(0, maxTitleLength - 1).trimEnd()}…` : title
  return `${shortenedTitle}\n${url}\n${tags.join(' ')}`.trim()
}

async function loadState() {
  try {
    const raw = await readFile(statePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function saveState(state) {
  await mkdir(dirname(statePath), { recursive: true })
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`)
}

async function updateArticleFile(filePath, frontmatter, body, tweetUrl) {
  const nextFrontmatter = {
    ...frontmatter,
    twitter_posted_at: new Date().toISOString(),
    twitter_url: tweetUrl || frontmatter.twitter_url || null,
  }
  const content = `${dumpFrontmatter(nextFrontmatter)}\n\n${body.replace(/^\n+/, '')}`
  await writeFile(filePath, content)
}

async function main() {
  await ensureXEnv()
  const files = await listMarkdownFiles(qiitaRoot)
  const posts = []

  for (const file of files) {
    const raw = await readFile(file.path, 'utf8')
    try {
      const parsed = parseFrontmatter(raw)
      const published = parsed.frontmatter.published === true || parsed.frontmatter.published === 'true'
      const url = parsed.frontmatter.qiita_url
      const postedAt = parsed.frontmatter.twitter_posted_at
      const publishedAt = normalizeDate(parsed.frontmatter.published_at)
      if (!published || !url || postedAt) continue
      posts.push({
        filePath: file.path,
        slug: relative(qiitaRoot, file.path).replace(/\\/g, '/').replace(/\.md$/, ''),
        publishedAt: publishedAt || new Date(file.mtimeMs),
        frontmatter: parsed.frontmatter,
        body: parsed.body,
      })
    } catch {
      continue
    }
  }

  posts.sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime())

  const state = await loadState()
  const statePublishedAt = state?.lastProcessedPublishedAt ? new Date(state.lastProcessedPublishedAt) : null
  const stateUrl = state?.lastProcessedQiitaUrl || null

  let queue = posts
  if (!statePublishedAt && !stateUrl) {
    queue = posts.length ? [posts[posts.length - 1]] : []
  } else if (statePublishedAt) {
    queue = posts.filter((post) => post.publishedAt > statePublishedAt)
  }

  if (!queue.length) {
    console.log('No new Qiita articles to sync to X.')
    return
  }

  for (const post of queue) {
    const tweet = buildTweet(post)
    console.log(`Posting ${post.frontmatter.title || post.slug} -> X`)
    const result = await execFileAsync(xCli, ['tweet', 'post', tweet], {
      env: process.env,
      maxBuffer: 1024 * 1024,
    })

    const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`
    const urlMatch = combinedOutput.match(/https:\/\/x\.com\/[^\s]+\/status\/\d+/)
    const tweetUrl = urlMatch ? urlMatch[0] : null

    await updateArticleFile(post.filePath, post.frontmatter, post.body, tweetUrl)
    await saveState({
      lastProcessedPublishedAt: post.publishedAt.toISOString(),
      lastProcessedQiitaUrl: String(post.frontmatter.qiita_url || ''),
      lastTweetUrl: tweetUrl,
      lastTweetAt: new Date().toISOString(),
      lastSourceFile: relative(qiitaRoot, post.filePath),
    })

    console.log(`Synced: ${post.frontmatter.title || post.slug}`)
    if (tweetUrl) console.log(tweetUrl)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
