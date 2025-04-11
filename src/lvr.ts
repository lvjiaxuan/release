import type { AllOptions } from '.'
import { bump, changelog, execGitJobs } from '.'

export async function lvr(options: AllOptions) {
  options.debug && console.log(options)

  const commitTagName = await bump(options)

  await changelog(options, commitTagName)

  await execGitJobs(options, commitTagName)
}
