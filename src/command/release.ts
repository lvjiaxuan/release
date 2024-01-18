import { promises as fsp } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { getOctokit } from '@actions/github'
import { endGroup, info, setFailed, startGroup, warning } from '@actions/core'
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

  warning('Failed to resolve release notes on CHANGELOG.md. Callback to "".\n')

  return ''
}

export async function sendRelease() {
  const { CI, GITHUB_REPOSITORY: repository, GITHUB_REF_NAME: tag, GITHUB_TOKEN: token } = process.env

  const [owner, repo] = repository!.split('/')

  const octokit = getOctokit(token!)

  if (CI !== 'true') {
    warning('Not in CI env. Skip release.\n')
    return
  }

  if (!token) {
    warning('No token in env. Skip release.\n')
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
      info(p.green(`Successfully created a release: ${res.data.html_url} .\n`))
    }).catch((err: any) => {
      startGroup('Create release error.')
      info(JSON.stringify(err))
      endGroup()

      // eslint-disable-next-line ts/no-unsafe-member-access, ts/no-unsafe-call
      if (err.response.status === 422 && err.response.data.errors.some((e: any) => e.code === 'already_exists')) {
        info(p.yellow(`The tag name \`${tag}\` of release already exists. So update it.\n`))

        return octokit.rest.repos.getReleaseByTag({
          owner,
          repo,
          tag: tag!,
        })
      }
      return Promise.reject(err)
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
      if (err)
        setFailed(`Fail to release with ${err}\n`)
    })
}
