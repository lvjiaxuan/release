import { promises as fsp } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import conventionalRecommendedBump from 'conventional-recommended-bump'
import semver from 'semver'
import prompts from 'prompts'
import pc from 'picocolors'
import { humanId } from 'human-id'
import type { BumpOption, CliOption, MarkdownOption, ReleaseType } from '..'
import { colorizeVersionDiff, getLastGitTag, getParsedCommits, isMonorepo, packages } from '..'

type Option = BumpOption & CliOption & MarkdownOption

async function resolveBumpType(options: Option) {
  let releaseType: ReleaseType = 'patch'
  ;(['major', 'minor', 'patch'] as const).forEach(i => Object.hasOwn(options, i) && (releaseType = i))

  let preid: string = ''
  ;(['prerelease', 'premajor', 'preminor', 'prepatch'] as const).forEach((i) => {
    if (Object.hasOwn(options, i)) {
      releaseType = i
      preid = options[i]!
    }
  })

  if (releaseType === 'patch') {
    return await conventionalRecommendedBump({
      preset: 'conventionalcommits',
      // @ts-expect-error missing
      gitRawCommitsOpts: options.from
        ? {
            from: options.from,
          }
        : {},
    })
  }
  else { return { releaseType, preid } }
}

async function resolveChangedPackagesSinceLastTag(options: Option) {
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

function resolveBumpPackages(options: Option) {
  if (isMonorepo && options.pkg) {
    console.log()
    return prompts({
      type: 'multiselect',
      name: 'pkgs',
      message: 'Pick packages to bump.',
      choices: packages.map(i => ({ title: i, value: i })),
      min: 1,
    }).then(res => res.pkgs as string[])
  }
  else if (!isMonorepo || options.all) {
    return packages
  }
  return resolveChangedPackagesSinceLastTag(options)
}

export async function bump(options: Option) {
  console.log()

  const [bumpType, bumpPackages] = await Promise.all([
    resolveBumpType(options),
    resolveBumpPackages(options),
  ])

  const bumpVersionMap = new Map<string, string>()
  const pkgsJson = await Promise.all(bumpPackages.map(async (pkg) => {
    const pkgJson = JSON.parse(await fsp.readFile(path.resolve(options.cwd, pkg), 'utf-8')) as { version: string, name: string }
    const currentVersion = pkgJson.version ?? '0.0.0'

    let bumpVersion: string
    if (bumpVersionMap.has(currentVersion)) {
      bumpVersion = bumpVersionMap.get(currentVersion)!
    }
    else {
      const preid = 'preid' in bumpType ? bumpType.preid : undefined
      bumpVersion = semver.inc(currentVersion, bumpType.releaseType as ReleaseType, preid)!
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

  if (isMonorepo)
    console.log(pc.green(`Detect as a monorepo. Bump ${pc.bold(options.all ? 'all' : 'changed')}(${pkgsJson.length}) packages as ${pc.bold(`${bumpType.releaseType}${'preid' in bumpType ? `=${bumpType.preid}` : ''}`)}:`))
  else
    console.log(pc.green('Bumped result:'))

  console.log(pkgsJson.map(i => `- ${i.currentVersion} → ${colorizeVersionDiff(i.currentVersion, i.bumpVersion)} (${i.package})`).join('\n'))

  if (process.env.NODE_ENV !== 'test' && !options.dry)
    await Promise.all(pkgsJson.map(async item => await fsp.writeFile(path.resolve(options.cwd, item.package), item.jsonStr, 'utf-8')))

  if (!isMonorepo)
    return `v${pkgsJson[0].bumpVersion}`

  if (pkgsJson.length > 1)
    return humanId()

  return options.mainPkg ? `v${pkgsJson[0].bumpVersion}` : `${pkgsJson[0].json.name}@${pkgsJson[0].json.version}`
}
