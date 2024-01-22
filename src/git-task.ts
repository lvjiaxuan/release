import pc from 'picocolors'
import type { CliOption } from '.'
import { execCMD } from '.'

export async function execGitJobs(options: Pick<CliOption, 'commit' | 'tag' | 'push' | 'dry'>, commitTagName: string) {
  const { dry } = options

  console.log()
  if (typeof options.commit === 'string') {
    options.commit = options.commit.replace('{r}', commitTagName)
    console.log(pc.green('git add .'))
    !dry && await execCMD('git', ['add', '.'])
    console.log(pc.green(`git commit -m "${options.commit}"`))
    !dry && await execCMD('git', ['commit', '-m', options.commit])

    // @ts-expect-error `no-xxx` type
    if (options.tag !== false) {
      console.log(pc.green(`git tag ${commitTagName}`))
      !dry && await execCMD('git', ['tag', commitTagName])
    }
    else {
      console.log(pc.yellow('Skip Tag.'))
    }

    if (typeof options.push === 'string') {
      if (options.push !== 'tag') {
        console.log(pc.green('git push'))
        !dry && await execCMD('git', ['push'])
      }

      if (options.push !== 'branch') {
        console.log(pc.green('git push --tags'))
        !dry && await execCMD('git', ['push', '--tags'])
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
