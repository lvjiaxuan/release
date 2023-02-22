import pc from 'picocolors'
import type { CliOptions, MarkdownOptions } from './index'
import { addYml, bump, changelog, execGitJobs } from './index'


export default async (options: CliOptions & MarkdownOptions) => {
  try {
    options.dry && console.log(pc.bold(pc.blue('Dry run.\n')))

    let bumpResult: Awaited<ReturnType<typeof bump>>
    let changelogResult: Awaited<ReturnType<typeof changelog>>

    // --yml
    if (options.yml) {
      void addYml(true)
      return
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
      options.bump = []
      options.changelog = ''
      bumpResult = await bump(options)
      changelogResult = await changelog(options, bumpResult?.bumpVersion)
    }

    if (bumpResult) {
      console.log('\nBump result:', JSON.stringify(bumpResult, null, 2))
    }

    if (changelogResult) {
      // bumpResult && tag
      console.log('\nChangelog result:', changelogResult.md.slice(0, 200))
    }

    if (isExecGitJobs) {
      await execGitJobs(options, bumpResult!.bumpVersion)
    }

    options.dry && console.log(pc.bold(pc.blue('\nDry run.\n')))

    process.exit(0)
  } catch (error) {
    console.log('\noptions: ', options)
    console.log(error)
    console.log(`\n${ pc.bgRed('ERROR!') } Please check it.\n`)
    process.exit(1)
  }
}
