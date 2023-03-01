import pc from 'picocolors'
import type { CliOptions, MarkdownOptions } from './index'
import { addYml, bump, changelog, execGitJobs, sendRelease } from './index'


export default async (options: CliOptions & MarkdownOptions) => {
  try {
    // @ts-ignore
    if (options.debug) {
      console.log('\nOptions: ', options)
    }

    options.dry && console.log(pc.bold(pc.blue('\nDry run.\n')))

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
    if ((Object.hasOwn(options, 'bump') || Object.hasOwn(options, 'bumpPrompt')) && !Object.hasOwn(options, 'changelog')) {
      // Bump only. CliOptions
      console.log('Bump only.')
      bumpResult = await bump(options)
    } else if (!(Object.hasOwn(options, 'bump') || Object.hasOwn(options, 'bumpPrompt')) && Object.hasOwn(options, 'changelog')) {
      // Changelog only. CliOptions & MarkdownOptions
      console.log('Changelog only.')
      changelogResult = await changelog(options)
    } else {
      // Both
      isExecGitJobs = true
      options.bump = options.bump ?? []
      options.changelog = options.changelog ?? ''
      bumpResult = await bump(options)
      changelogResult = await changelog(options, bumpResult?.bumpVersion)
    }

    if (bumpResult) {
      console.log('\nBump result:', JSON.stringify(bumpResult, null, 2))
    }

    if (changelogResult) {
      // bumpResult && tag
      console.log('\nChangelog result:', `(${ changelogResult.md.slice(0, 200) })`)
    }

    if (isExecGitJobs) {
      await execGitJobs(options, bumpResult!.bumpVersion)
    }

    options.dry && console.log(pc.bold(pc.blue('\n\nDry run.')))

    process.exit(0)
  } catch (error) {
    console.log('\nOptions: ', options)
    console.log(error)
    console.log(`\n${ pc.bgRed('ERROR!') } Please check it.\n`)
    process.exit(1)
  }
}
