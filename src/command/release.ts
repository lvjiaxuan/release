import { promises as fsp } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { getOctokit } from '@actions/github'
import { info, setFailed, warning } from '@actions/core'

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

  warning('Failed to resolve release notes on CHANGELOG.md. Callback to "".')

  return ''
}

export async function sendRelease() {
  const { CI, GITHUB_REPOSITORY: repository, GITHUB_REF_NAME: tag, GITHUB_TOKEN: token } = process.env

  const [owner, repo] = repository!.split('/')

  const octokit = getOctokit(token!)

  if (CI !== 'true') {
    warning('Not in CI env. Skip release.')
    return
  }

  if (!token) {
    warning('No token in env. Skip release.')
    return
  }

  const CHANGELOG_PATH = path.resolve(cwd, 'CHANGELOG.md')
  await fsp.stat(CHANGELOG_PATH)
  const changelogContent = await fsp.readFile(CHANGELOG_PATH, { encoding: 'utf-8' })
  const releaseBody = {
    owner,
    repo,
    body: resolveChangelogSection(changelogContent),
    name: tag!,
    tag_name: tag!,
  }

  const createRes = await octokit.rest.repos.createRelease(releaseBody)

  if (createRes.status !== 201) {
    // @ts-expect-error Validation Failed
    // eslint-disable-next-line ts/no-unsafe-member-access
    if (createRes.data.errors[0].code === 'already_exists') {
      info('The `tag_name` of release already exists. So update it.`')
      const { data: { id } } = await octokit.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag: tag!,
      })

      await octokit.rest.repos.updateRelease({
        release_id: id,
        ...releaseBody,
      })
      info('Successfully updated a release.')
    }
    else {
      setFailed(`Fail with ${JSON.stringify(createRes.data)}`)
    }
  }
  else {
    info('Successfully created a release.')
  }
}
