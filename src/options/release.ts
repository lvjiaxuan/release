/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
import { $fetch } from 'ohmyfetch'
import p from 'picocolors'
import { promises as fsp } from 'node:fs'
import path from 'node:path'

const resolveTagSection = async () => {
  const CHANGELOG_PATH = path.join(process.cwd(), 'CHANGELOG.md')

  await fsp.stat(CHANGELOG_PATH)

  const content = await fsp.readFile(CHANGELOG_PATH, { encoding: 'utf-8' })
  const match = content.match(/(?<notes>## v0\.1\.3[\s\S]+?(?=## v))/)
  const notes = match?.groups?.notes
  if (notes) {
    return notes
  }

  throw new Error('Can not resolve release notes on CHANGELOG.md.')
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L7
export const sendRelease = async () => {
  if (process.env.CI !== 'CI') {
    console.log(p.yellow('Not in CI workflow. Skip release.'))
    return
  }

  const { GITHUB_ACTION_REPOSITORY: repository, GITHUB_BASE_REF: tag, GITHUB_TOKEN: token } = process.env

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

  const body = {
    body: await resolveTagSection(),
    name: tag,
    tag_name: tag,
  }

  console.log(p.cyan(method === 'POST' ? 'Creating release notes...' : 'Updating release notes...'))

  const res = await $fetch(url, {
    method,
    body: JSON.stringify(body),
    headers,
  })

  console.log(p.green(`Released on ${ res.html_url }`))
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
