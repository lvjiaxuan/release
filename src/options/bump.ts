import conventionalRecommendedBump from 'conventional-recommended-bump'
import semver from 'semver'
import prompts from 'prompts'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import type { BumpOption, CliOption, MarkdownOption } from '..'
import { colorizeVersionDiff, getLastGitTag, getParsedCommits, isMonorepo, packages } from '..'
import pc from 'picocolors'

type BumpType = conventionalRecommendedBump.Callback.Recommendation.ReleaseType
type Option = BumpOption & CliOption & MarkdownOption

const resolveBumpType = () => new Promise<BumpType>((resolve, reject) =>
  conventionalRecommendedBump(
    { preset: 'conventionalcommits' },
    (error, recommendation) => {
      if (error) {
        reject(error)
        return
      }
      resolve(recommendation.releaseType!)
    }))

const resolveChangedPackagesSinceLastTag = async (options: Option) => {
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

export const bump = async(options: Option) => {
  const [ bumpType, changedPackages ] = await Promise.all([
    resolveBumpType(),
    (() => {
      if (isMonorepo && options.pkg) {
        return prompts({
          type: 'multiselect',
          name: 'pkgs',
          message: 'Pick packages to bump.',
          choices: packages.map(i => ({ title: i, value: i })),
          min: 1,
        }).then(res => res.pkgs as string[])
      } else if (!isMonorepo || options.all) {
        return packages
      } else {
        return resolveChangedPackagesSinceLastTag(options)
      }
    })(),
  ])

  const bumpVersionMap = new Map<string, string>()
  const pkgsJson = await Promise.all(changedPackages.map(async pkg => {
    const pkgJson = JSON.parse(await fsp.readFile(pkg, 'utf-8')) as { version: string }
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
      currentVersion,
      bumpVersion: pkgJson.version,
      jsonStr: JSON.stringify(pkgJson, null, 2),
    }
  }))

  if (isMonorepo) {
    console.log(`\nDetect as a monorepo. Bump ${ pc.bold(options.all ? 'all' : 'changed') }(${ pkgsJson.length }) packages:`)
  }

  console.log(pkgsJson.map(i => `- ${ i.currentVersion } → ${ colorizeVersionDiff(i.currentVersion, i.bumpVersion) } (${ i.package })`).join('\n'))

  if (process.env.NODE_ENV !== 'test' && !options.dry) {
    // await Promise.all(bumpJson.map(async item => await fsp.writeFile(item.package, item.jsonStr, 'utf-8')))
  }
}
