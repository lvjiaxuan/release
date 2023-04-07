import type { AllOption } from '.'
import { bump, changelog, execGitJobs } from '.'

export const lvr = async (options: AllOption) => {
  const bumpResult = await bump(options)
  const commitTagName = bumpResult.toString()

  await changelog(options, commitTagName)

  await execGitJobs(options, commitTagName)
}
