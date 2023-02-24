import conventionalRecommendedBump from 'conventional-recommended-bump'
import fg from 'fast-glob'
import semver from 'semver'
import prompts from 'prompts'
import pc from 'picocolors'
import type { CliOptions } from './../config'
import { promises as fsp } from 'node:fs'

type BumpType = conventionalRecommendedBump.Callback.Recommendation.ReleaseType

const getBumpType = () => new Promise<BumpType>((resolve, reject) =>
  conventionalRecommendedBump(
    { preset: 'conventionalcommits' },
    (error, recommendation) => {
      if (error) {
        reject(error)
        return
      }
      resolve(recommendation.releaseType!)
    }))

const writePkgsVersion = (pkgPaths: string[], version: string) =>
  Promise.all(pkgPaths.map(async pkgPath => {
    const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8')) as { version: string }
    pkg.version = version
    return fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  }))

const resolveValidPackages = async (packages: string[]) => {
  let packagesResolvePaths = await fg('**/package.json', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/public/**',
      '**/test/**',
    ],
    onlyFiles: true,
  })

  if (packages.length != 0) {
    packagesResolvePaths = packagesResolvePaths.filter(path => {

      if (path === 'package.json') {
        return true
      }

      const pkgIndex = packages.findIndex(pkg => path.includes(`/${ pkg }/package.json`))
      if (pkgIndex > -1) {
        packages.splice(pkgIndex, 1)
        return true
      }
      return false
    })
  }

  return {
    packagesResolvePaths,
    unResolvedPkgs: packages,
  }
}


export const bump = async (options: CliOptions) => {
  if (options.bump?.[0] === false) {
    console.log(`\nBump ${ pc.bold(pc.yellow('skip')) }.`)
    return
  }

  let packages = options.bump! as string[]
  if (options.bumpPrompt) {
    packages = options.bumpPrompt
  }

  await fsp.stat('./package.json')

  const { packagesResolvePaths, unResolvedPkgs } = await resolveValidPackages(packages)

  const currentVersion = await (async () => {
    const pkg = JSON.parse(await fsp.readFile('package.json', 'utf8').catch(() => '{}')) as { version: string } || { }
    return pkg.version || '0.0.0'
  })()

  let bumpVersion: string
  if (options.bumpPrompt) {
    const res = await prompts({
      type: 'select',
      name: 'version',
      message: `Select a version(current version is ${ currentVersion }).`,
      choices: [ 'patch', 'minor', 'major' ].map(bumpType => {
        const version = semver.inc(currentVersion, bumpType as BumpType)!
        return {
          title: `${ bumpType } - ${ version }`,
          value: version,
        }
      }),
    })
    bumpVersion = res.version as string
  } else {
    bumpVersion = semver.inc(currentVersion, await getBumpType())!
  }

  if (process.env.NODE_ENV !== 'test' && !options.dry) {
    await writePkgsVersion(packagesResolvePaths, bumpVersion)
  }

  return {
    currentVersion,
    bumpVersion,
    packagesResolvePaths,
    unResolvedPkgs,
  }
}
