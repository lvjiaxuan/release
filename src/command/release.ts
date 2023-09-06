/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
import { $fetch } from 'ohmyfetch'
import { promises as fsp } from 'node:fs'
import p from 'picocolors'
import path from 'node:path'

const cwd = process.cwd()

export const resolveChangelogSection = (content: string) => {
  try {
    content += '## v'
    const match = content.match(/(?<notes>(?<=## (v\d+\.\d+\.\d+|[A-Za-z]+).+<\/sub>)[\s\S]+?(?=## \w))/)
    const notes = match?.groups?.notes.trim()
    if (notes) {
      return notes
    }

  } catch (error) {
    throw error as Error
  }

  throw new Error('Failed to resolve release notes on CHANGELOG.md .')
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L7
export const sendRelease = async () => {
  const { CI, GITHUB_REPOSITORY: repository, GITHUB_REF_NAME: tag, GITHUB_TOKEN: token } = process.env

  if (CI !== 'true') {
    console.log(p.yellow('Not in CI env. Skip release.'))
    return
  }

  if (!token) {
    console.log(p.yellow('No token in env. Skip release.'))
    return
  }

  const headers = { accept: 'application/vnd.github+json', authorization: `token ${ token }` }
  let url = `https://api.github.com/repos/${ repository }/releases`
  let method = 'POST'

  try {
    const exists = await $fetch(`https://api.github.com/repos/${ repository }/releases/tags/${ tag }`, { headers })
    if (exists.url) {
      url = exists.url
      method = 'PATCH'
    }
  }
  catch {}

  const CHANGELOG_PATH = path.resolve(cwd, 'CHANGELOG.md')
  await fsp.stat(CHANGELOG_PATH)
  const changelogContent = await fsp.readFile(CHANGELOG_PATH, { encoding: 'utf-8' })

  const body = {
    body: resolveChangelogSection(changelogContent),
    name: tag,
    tag_name: tag,
  }

  console.log(p.cyan(method === 'POST' ? 'Creating a release...' : 'Updating the release notes...'))

  const res = await $fetch(url, {
    method,
    body: JSON.stringify(body),
    headers,
  })

  console.log(p.green(`Released on ${ res.html_url }`))
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
