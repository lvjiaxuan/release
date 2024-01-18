import { promises as fsp } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { getOctokit } from '@actions/github'
import { error, info, setFailed, warning } from '@actions/core'
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

  await octokit.rest.repos.createRelease(releaseBody)
    .then((res) => {
      info(p.green(`Successfully created a release: ${res.data.html_url} .`))
    }).catch((err: any) => {
      // eslint-disable-next-line ts/no-unsafe-member-access
      if (err.status === 422 && err.data.errors[0].code === 'already_exists') {
        info(p.yellow(`The tag name \`${tag}\` of release already exists. So update it.`))

        return octokit.rest.repos.getReleaseByTag({
          owner,
          repo,
          tag: tag!,
        })
      }
      setFailed(`Fail to release. ${err}`)
      process.exit(1)
    }).then((res) => {
      if (res) {
        const { data: { id } } = res
        return octokit.rest.repos.updateRelease({
          release_id: id,
          ...releaseBody,
        })
      }
    }).then((res) => {
      if (res)
        info(p.green(`Successfully updated a release: ${res.data.html_url} .`))
    }).catch((err: any) => {
      if (err) {
        setFailed(`Fail to release. ${err}`)
        // eslint-disable-next-line ts/no-unsafe-argument
        error(JSON.parse(err))
      }
    })

  process.exit(0)
}
