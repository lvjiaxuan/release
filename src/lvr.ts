import type { AllOption } from '.'
import { bump, changelog, execGitJobs } from '.'

export async function lvr(options: AllOption) {

  options.debug && console.log(options)

  const commitTagName = await bump(options)

  await changelog(options, commitTagName)

  await execGitJobs(options, commitTagName)
}
