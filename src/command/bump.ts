import { promises as fsp } from 'node:fs'
import { colorizeVersionDiff, getLastGitTag, getParsedCommits, isMonorepo, packages } from '..'
import type { BumpOption, CliOption, MarkdownOption } from '..'
import conventionalRecommendedBump, { type ReleaseType } from 'conventional-recommended-bump'
import semver from 'semver'
import prompts from 'prompts'
import pc from 'picocolors'
import humanId from 'human-id'
import path from 'node:path'

type Option = BumpOption & CliOption & MarkdownOption

const resolveBumpType = (options: Option) => new Promise<{ level: ReleaseType, preid?: string }>((resolve, reject) => {
  let level
  ;[ 'major', 'minor', 'patch' ].forEach(i => options[i as keyof Option] && (level = i))

  let preid
  ;[ 'prerelease', 'premajor', 'preminor', 'prepatch' ].forEach(i => {
    if (Object.hasOwn(options, i)) {
      level = i
      preid = options[i as keyof Option]
    }
  })

  if (!level) {
    conventionalRecommendedBump(
      { preset: { name: 'conventionalcommits' } },
      (error, recommendation) => {
        if (error) {
          reject(error)
          return
        }
        resolve({ level: recommendation.releaseType })
      })
  } else {
    resolve({ level, preid })
  }
})

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

  return packages.filter(pkg => changedFile.some(file => file.startsWith(path.dirname(pkg))))
}

const resolveBumpPackages = (options: Option) => {
  if (isMonorepo && options.pkg) {
    console.log()
    return prompts({
      type: 'multiselect',
      name: 'pkgs',
      message: 'Pick packages to bump.',
      choices: packages.map(i => ({ title: i, value: i })),
      min: 1,
    }).then(res => res.pkgs as string[])
  } else if (!isMonorepo || options.all) {
    return packages
  }
  return resolveChangedPackagesSinceLastTag(options)
}

export const bump = async(options: Option) => {
  console.log()

  const [ bumpType, bumpPackages ] = await Promise.all([
    resolveBumpType(options),
    resolveBumpPackages(options),
  ])

  const bumpVersionMap = new Map<string, string>()
  const pkgsJson = await Promise.all(bumpPackages.map(async pkg => {
    const pkgJson = JSON.parse(await fsp.readFile(pkg, 'utf-8')) as { version: string; name: string }
    const currentVersion = pkgJson.version ?? '0.0.0'

    let bumpVersion: string
    if (bumpVersionMap.has(currentVersion)) {
      bumpVersion = bumpVersionMap.get(currentVersion)!
    } else {
      bumpVersion = semver.inc(currentVersion, bumpType.level, bumpType.preid)!
      bumpVersionMap.set(currentVersion, bumpVersion)
    }

    pkgJson.version = bumpVersion
    return {
      package: pkg,
      currentVersion,
      bumpVersion: pkgJson.version,
      json: pkgJson,
      jsonStr: JSON.stringify(pkgJson, null, 2),
    }
  }))

  if (isMonorepo) {
    console.log(pc.green(`Detect as a monorepo. Bump ${ pc.bold(options.all ? 'all' : 'changed') }(${ pkgsJson.length }) packages as ${ pc.bold(`${ bumpType.level }${ bumpType.preid ? `=${ bumpType.preid }` : '' }`) }:`))
  } else {
    console.log(pc.green('Bumped result:'))
  }

  console.log(pkgsJson.map(i => `- ${ i.currentVersion } → ${ colorizeVersionDiff(i.currentVersion, i.bumpVersion) } (${ i.package })`).join('\n'))

  if (process.env.NODE_ENV !== 'test' && !options.dry) {
    await Promise.all(pkgsJson.map(async item => await fsp.writeFile(item.package, item.jsonStr, 'utf-8')))
  }

  if (!isMonorepo) {
    return 'v' + pkgsJson[0].bumpVersion
  }

  if (pkgsJson.length > 1) {
    return humanId()
  }

  return options.mainPkg ? 'v' + pkgsJson[0].bumpVersion : pkgsJson[0].json.name + '@' + pkgsJson[0].json.version
}
