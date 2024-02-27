import pc from 'picocolors'
import type { CliOption } from '.'
import { $$ } from '.'

export async function execGitJobs(options: Pick<CliOption, 'commit' | 'tag' | 'push' | 'dryRun'>, commitTagName: string) {
  const { dryRun } = options

  console.log()
  if (typeof options.commit === 'string') {
    options.commit = options.commit.replace('{r}', commitTagName)
    console.log(pc.green('git add .'))
    !dryRun && await $$`git add .`
    console.log(pc.green(`git commit -m "${options.commit}"`))
    !dryRun && await $$`git commit -m ${options.commit}`

    // @ts-expect-error `no-xxx` type
    if (options.tag !== false) {
      console.log(pc.green(`git tag ${commitTagName}`))
      !dryRun && await $$`git tag ${commitTagName}`
    }
    else {
      console.log(pc.yellow('Skip Tag.'))
    }

    if (typeof options.push === 'string') {
      if (options.push !== 'tag') {
        console.log(pc.green('git push'))
        !dryRun && await $$`git push`
      }

      if (options.push !== 'branch') {
        console.log(pc.green('git push --tags'))
        !dryRun && await $$`git push --tags`
      }
    }
    else {
      console.log(pc.yellow('Skip Push.'))
    }
  }
  else {
    console.log(pc.yellow('Skip Commit/Tag/Push.'))
  }
}
