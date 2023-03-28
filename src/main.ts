import pc from 'picocolors'
import type { CliOptions, MarkdownOptions } from './index'
import { addYml, bump, changelog, execCMD, execGitJobs, sendRelease } from './index'

const isOnlyBump = (options: CliOptions) => {
  // lvr -b
  const onlyBump = (Object.hasOwn(options, 'bump') || Object.hasOwn(options, 'bumpPrompt')) && !Object.hasOwn(options, 'changelog')
  // lvr --no-b
  const releaseWithoutBump = Object.hasOwn(options, 'bump') && options.bump?.[0] === false
  return onlyBump && !releaseWithoutBump
}

const isOnlyChangelog = (options: CliOptions) => {
  // lvr -c
  const onlyChangelog = !(Object.hasOwn(options, 'bump') || Object.hasOwn(options, 'bumpPrompt')) && Object.hasOwn(options, 'changelog')
  // lvr --no-c
  const releaseWithoutChangelog = options.changelog === false
  return onlyChangelog && !releaseWithoutChangelog
}

export default async (options: CliOptions & MarkdownOptions) => {
  try {
    // @ts-ignore
    if (options.debug) {
      console.log('\nOptions: ', options)
    }

    options.dry && console.log(pc.bold(pc.blue('\nDry run.\n')))

    if (!(await execCMD('git', [ 'status' ])).stdout.includes('nothing to commit, working tree clean')) {
      console.log(`${ pc.yellow('\nWorking tree is not clean.') }`)
      return
    }

    let bumpResult: Awaited<ReturnType<typeof bump>>
    let changelogResult: Awaited<ReturnType<typeof changelog>>

    // --release
    if (options.release) {
      await sendRelease()
      return process.exit(0)
    }

    // --yml
    if (options.yml) {
      await addYml(options.dry)
      return process.exit(0)
    }

    let isExecGitJobs = false
    if (isOnlyBump(options)) {
      // Bump only. CliOptions
      console.log('Bump only.')
      bumpResult = await bump(options)
    } else if (isOnlyChangelog(options)) {
      // Changelog only. CliOptions & MarkdownOptions
      console.log('Changelog only.')
      changelogResult = await changelog(options)
    } else {
      // Both
      options.bump = options.bump ?? []
      options.changelog = options.changelog ?? ''
      bumpResult = await bump(options)
      isExecGitJobs = !!bumpResult
      changelogResult = await changelog(options, bumpResult?.bumpVersion)
    }

    if (bumpResult) {
      console.log('\nBump result:', JSON.stringify(bumpResult, null, 2))
    }

    if (changelogResult) {
      // bumpResult && tag
      console.log('\nChangelog result:', `(${ changelogResult.md.replaceAll(/\n|\r/g, '').slice(0, 300) })`)
    }

    if (isExecGitJobs) {
      await execGitJobs(options, bumpResult!.bumpVersion)
    }

    options.dry && console.log(pc.bold(pc.blue('\n\nDry run.')))

    process.exit(0)
  } catch (error) {
    console.log('\nOptions: ', options)
    console.log(error)
    console.log(`\n\n${ pc.bgRed('ERROR!') } Please check it.\n`)
    process.exit(1)
  }
}
