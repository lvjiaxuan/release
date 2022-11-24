import conventionalRecommendedBump from 'conventional-recommended-bump'
import fg from 'fast-glob'
import semver from 'semver'
import prompts from 'prompts'
import pc from 'picocolors'
import { type Options } from '@/config'
import { promises as fsp } from 'fs'

type BumpType = conventionalRecommendedBump.Callback.Recommendation.ReleaseType

export const getBumpType = () => new Promise<BumpType>((resolve, reject) =>
  conventionalRecommendedBump(
    { preset: 'conventionalcommits' },
    (error, recommendation) => {
      if (error) {
        reject(error)
        return
      }
      resolve(recommendation.releaseType!)
    }))

export const writePkgsVersion = (pkgPaths: string[], bumpVersion: string) =>
  Promise.all(pkgPaths.map(async pkgPath => {
    const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8')) as { version: string }
    pkg.version = bumpVersion
    return fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  }))

export const bump = async (options: Options) => {

  const packages: string[] = options.bump ?? options.bumpPrompt ?? []
  const isPrompt = !!options.bumpPrompt

  let packagesResolvePaths = await fg('**/package.json', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/public/**',
    ],
    onlyFiles: true,
  })

  if (packages.length != 0) {
    packagesResolvePaths = packagesResolvePaths.filter(path => {
      const pkgIndex = packages.findIndex(pkg => path.includes(`/${ pkg }/package.json`))
      if (pkgIndex > -1) {
        packages.splice(pkgIndex, 1)
        return true
      }
      return false
    })

  }

  console.log(`Left un-found packages: ${ pc.yellow(packages.toString()) }`)

  const currentVersion = await (async () => {
    const pkg = JSON.parse(await fsp.readFile('package.json', 'utf8').catch(() => '{}')) as { version: string } || { }
    return pkg.version || '0.0.0'
  })()

  let bumpVersion: string
  if (isPrompt) {
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

  await writePkgsVersion(packages, bumpVersion)

  return {
    bumpVersion,
    packagesResolvePaths,
  }
}
