import { promises as fsp } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { ofetch } from 'ofetch'
import p from 'picocolors'

const cwd = process.cwd()

export function resolveChangelogSection(content: string) {
  try {
    content += '## v'
    const match = content.match(/(?<notes>(?<=## (v\d+\.\d+\.\d+|[A-Za-z]+).+<\/sub>)[\s\S]+?(?=## \w))/)
    const notes = match?.groups?.notes.trim()
    if (notes)
      return notes
  }
  catch {
  }

  console.log(p.yellow('Failed to resolve release notes on CHANGELOG.md. Callback to "".'))

  return ''
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L7
export async function sendRelease() {
  const { CI, GITHUB_REPOSITORY: repository, GITHUB_REF_NAME: tag, GITHUB_TOKEN: token } = process.env

  if (CI !== 'true') {
    console.log(p.yellow('Not in CI env. Skip release.'))
    return
  }

  if (!token) {
    console.log(p.yellow('No token in env. Skip release.'))
    return
  }

  const headers = { accept: 'application/vnd.github+json', authorization: `token ${token}` }
  let url = `https://api.github.com/repos/${repository}/releases`
  let method = 'POST'

  /* eslint-disable ts/no-unsafe-assignment, ts/no-unsafe-member-access */
  try {
    const exists = await ofetch(`https://api.github.com/repos/${repository}/releases/tags/${tag}`, { headers })
    if (exists.url) {
      url = exists.url
      method = 'PATCH'
    }
  }
  catch {}
  /* eslint-enable ts/no-unsafe-assignment, ts/no-unsafe-member-access */

  const CHANGELOG_PATH = path.resolve(cwd, 'CHANGELOG.md')
  await fsp.stat(CHANGELOG_PATH)
  const changelogContent = await fsp.readFile(CHANGELOG_PATH, { encoding: 'utf-8' })

  const body = {
    body: resolveChangelogSection(changelogContent),
    name: tag,
    tag_name: tag,
  }

  console.log(p.cyan(method === 'POST' ? 'Creating a release...' : 'Updating the release notes...'))

  /* eslint-disable ts/no-unsafe-assignment, ts/no-unsafe-member-access */
  const res = await ofetch(url, {
    method,
    body: JSON.stringify(body),
    headers,
  })

  console.log(p.green(`Released on ${res.html_url}`))
  /* eslint-enable ts/no-unsafe-assignment, ts/no-unsafe-member-access */
}
