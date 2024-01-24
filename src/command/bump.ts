import fsp from 'node:fs/promises'
import path from 'node:path'
import conventionalRecommendedBump from 'conventional-recommended-bump'
import semver from 'semver'
import prompts from 'prompts'
import pc from 'picocolors'
import { humanId } from 'human-id'
import type { BumpOption, CliOption, MarkdownOption, ReleaseType } from '..'
import { getLastGitTag, getParsedCommits, isMonorepo, packages } from '..'

type Option = BumpOption & CliOption & MarkdownOption

async function resolveBumpType(options: Option): Promise<conventionalRecommendedBump.Recommendation & { preid?: string }> {
  let releaseType: ReleaseType | false = false
  ;(['major', 'minor', 'patch'] as const).forEach(i => Object.hasOwn(options, i) && (releaseType = i))

  let preid: string = ''
  ;(['prerelease', 'premajor', 'preminor', 'prepatch'] as const).forEach((i) => {
    if (Object.hasOwn(options, i)) {
      releaseType = i
      preid = options[i] ?? ''
    }
  })

  if (!releaseType) {
    return await conventionalRecommendedBump({
      preset: 'conventionalcommits',
      // @ts-expect-error missing gitRawCommitsOpts type
      gitRawCommitsOpts: options.from
        ? {
            from: options.from,
          }
        : {},
    })
  }

  return { releaseType, preid, reason: 'specified' }
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

  const preid = bumpType.preid

  const rootBumpVersion = await (async () => {
    if (bumpPackages.includes('package.json') && options.all) {
      const pkgJson = JSON.parse(await fsp.readFile(path.resolve(options.cwd, 'package.json'), 'utf-8')) as { version?: string, name: string }
      if (pkgJson.version)
        return semver.inc(pkgJson.version, bumpType.releaseType as ReleaseType, preid)!
    }
  })()

  const bumpVersionMap = new Map<string, string>()
  const pkgsJson = await Promise.all(bumpPackages.map(async (pkg) => {
    const pkgJson = JSON.parse(await fsp.readFile(path.resolve(options.cwd, pkg), 'utf-8')) as { version?: string, name: string }
    const currentVersion = pkgJson.version

    if (!currentVersion)
      return

    let bumpVersion: string
    if (rootBumpVersion) {
      bumpVersion = rootBumpVersion
    }
    else if (bumpVersionMap.has(currentVersion)) {
      bumpVersion = bumpVersionMap.get(currentVersion)!
    }
    else {
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
  }).filter(Boolean))

  if (isMonorepo)
    console.log(pc.green(`Detect as a monorepo. Bump ${pc.bold(options.all ? 'all' : 'changed')}(${pkgsJson.length}) packages to ${pc.bold(`${bumpType.releaseType}${'preid' in bumpType ? `=${bumpType.preid}` : ''}`)}, ${bumpType.reason}:`))
  else
    console.log(pc.green('Bump result:'))

  console.log(pkgsJson.map(i => `* ${i!.currentVersion} → ${i!.bumpVersion} ${i!.package}`).join('\n'))

  if (!options.dry)
    await Promise.all(pkgsJson.map(async item => await fsp.writeFile(path.resolve(options.cwd, item!.package), item!.jsonStr, 'utf-8')))

  let commitTagName: string

  if (rootBumpVersion)
    commitTagName = `v${rootBumpVersion}`
  else if (!isMonorepo)
    commitTagName = `v${pkgsJson[0]!.bumpVersion}`
  else if (pkgsJson.length > 1)
    commitTagName = humanId()
  else
    commitTagName = options.mainPkg ? `v${pkgsJson[0]!.bumpVersion}` : `${pkgsJson[0]!.json.name}@${pkgsJson[0]!.json.version}`

  console.log(pc.green(`\nCommit tag name: ${commitTagName}`))

  return commitTagName
}
