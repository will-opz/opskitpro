import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import yaml from 'js-yaml'

function parseArgs(argv) {
  const args = new Map()
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith('--')) continue
    const key = value.slice(2)
    const next = argv[index + 1]
    if (next && !next.startsWith('--')) {
      args.set(key, next)
      index += 1
    } else {
      args.set(key, true)
    }
  }
  return args
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Missing YAML frontmatter')
  }
  return {
    frontmatter: yaml.load(match[1]) || {},
    body: match[2].replace(/^\n+/, ''),
  }
}

function dumpFrontmatter(data) {
  return `---\n${yaml.dump(data, { lineWidth: 120, noRefs: true, sortKeys: false }).trimEnd()}\n---`
}

function normalizeTitle(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '')
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((tag) => String(tag || '').trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((name) => ({ name, versions: [] }))
}

async function qiitaFetch(path, options = {}) {
  const token = process.env.QIITA_TOKEN
  if (!token) {
    throw new Error('Missing QIITA_TOKEN')
  }

  const response = await fetch(`https://qiita.com/api/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message = data?.message || data?.error || text || response.statusText
    throw new Error(`Qiita API ${response.status}: ${message}`)
  }
  return data
}

async function main() {
  const args = parseArgs(process.argv)
  const fileArg = args.get('file')
  if (!fileArg) {
    throw new Error('Usage: node scripts/qiita-publish.mjs --file qiita/main-blog/example.md')
  }

  const filePath = resolve(fileArg)
  const raw = await readFile(filePath, 'utf8')
  const { frontmatter, body } = parseFrontmatter(raw)
  const title = normalizeTitle(frontmatter.title || frontmatter.qiita_title)
  const tags = normalizeTags(frontmatter.tags)

  if (!title) throw new Error('Missing title')
  if (!body.trim()) throw new Error('Missing body')
  if (!tags.length) throw new Error('Missing tags')
  if (frontmatter.published === true || frontmatter.published === 'true' || frontmatter.qiita_url || frontmatter.qiita_id) {
    throw new Error('Article already looks published; refusing to duplicate it')
  }

  await qiitaFetch('/authenticated_user')
  const existingItems = await qiitaFetch('/authenticated_user/items?page=1&per_page=100')
  const duplicate = existingItems.find((item) => normalizeTitle(item.title) === title)
  if (duplicate) {
    throw new Error(`Duplicate title already published: ${duplicate.url}`)
  }

  const created = await qiitaFetch('/items', {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      tags,
      private: false,
      tweet: false,
    }),
  })

  const publishedAt = new Date().toISOString()
  const nextFrontmatter = {
    ...frontmatter,
    title,
    published: true,
    published_at: publishedAt,
    qiita_url: created.url,
    qiita_id: created.id,
  }

  await writeFile(filePath, `${dumpFrontmatter(nextFrontmatter)}\n\n${body}`)
  console.log(JSON.stringify({
    title,
    url: created.url,
    id: created.id,
    published_at: publishedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
