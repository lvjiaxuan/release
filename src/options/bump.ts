import conventionalRecommendedBump from 'conventional-recommended-bump'
import semver from 'semver'
import prompts from 'prompts'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import type { BumpOption, CliOption, MarkdownOption } from '..'
import { cwd, getLastGitTag, getParsedCommits, isMonorepo, log, packages } from '..'

type BumpType = conventionalRecommendedBump.Callback.Recommendation.ReleaseType

const resolveBumpType = () => new Promise<BumpType>((resolve, reject) =>
  conventionalRecommendedBump(
    { preset: 'conventionalcommits', path: cwd },
    (error, recommendation) => {
      if (error) {
        reject(error)
        return
      }
      resolve(recommendation.releaseType!)
    }))

const resolveChangedPackagesSinceLastTag = async (options: MarkdownOption) => {
  const from = await getLastGitTag() ?? ''
  const to = 'HEAD'
  const commits = await getParsedCommits(from, to, Object.keys(options?.titles))
  const changedFile = [
    ...new Set(commits.reduce((preValue, value) => {
      preValue.push(
        ...value.body.trim()
          .split('\n')
          .filter(i => i !== '"' && Boolean(i))
          .map(i => i.replace(/[AMD]\t/, '')),
      )
      return preValue
    }, [] as string[])),
  ]

  return packages.filter(pkg => changedFile.some(file => file.startsWith(pkg)))
}

export const bump = async(options: BumpOption & CliOption & MarkdownOption) => {
  const bumpType = await resolveBumpType()
  const bumpPackages = isMonorepo ? await resolveChangedPackagesSinceLastTag(options) : packages

  const bumpVersionMap = new Map<string, string>()
  const bumpJson = await Promise.all(bumpPackages.map(async pkg => {
    const pkgJson = JSON.parse(await fsp.readFile(path.join(cwd, pkg), 'utf-8')) as { version: string }
    const currentVersion = pkgJson.version ?? '0.0.0'

    let bumpVersion: string
    if (bumpVersionMap.has(currentVersion)) {
      bumpVersion = bumpVersionMap.get(currentVersion)!
    } else {
      bumpVersion = semver.inc(currentVersion, bumpType)!
      bumpVersionMap.set(currentVersion, bumpVersion)
    }

    pkgJson.version = bumpVersion
    return {
      package: pkg,
      jsonStr: JSON.stringify(pkgJson, null, 2),
    }
  }))

  console.log(bumpJson)
  if (process.env.NODE_ENV !== 'test' && !options.dry) {
    // await Promise.all(bumpJson.map(async item => await fsp.writeFile(path.join(cwd, item.package), item.jsonStr, 'utf-8')))
  }
}
