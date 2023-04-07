import type { AllOption } from '.'
import { bump, changelog, execGitJobs } from '.'

export const lvr = async (options: AllOption) => {
  const commitTagName = await bump(options)

  await changelog(options, commitTagName)

  await execGitJobs(options, commitTagName)
}
