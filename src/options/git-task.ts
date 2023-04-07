import type { CliOption } from '..'
import { execCMD } from '..'
import pc from 'picocolors'

export const execGitJobs = async (options: Pick<CliOption, 'commit' | 'tag' | 'push' | 'dry'>, commitTagName: string) => {
  const { dry } = options

  console.log()
  if (typeof options.commit === 'string') {
    options.commit = options.commit.replace('{n}', commitTagName)
    console.log(pc.green('git add .'))
    !dry && await execCMD('git', [ 'add', '.' ])
    console.log(pc.green(`git commit -m "${ options.commit }"`))
    !dry && await execCMD('git', [ 'commit', '-m', options.commit ])

    if (typeof options.tag === 'string') {
      const tagName = options.tag ? options.tag : commitTagName
      console.log(pc.green(`git tag ${ tagName }`))
      !dry && await execCMD('git', [ 'tag', tagName ])
    } else {
      console.log(pc.yellow('Skip Tag.'))
    }

    if (typeof options.push === 'string') {
      if (options.push !== 'tag') {
        console.log(pc.green('git push'))
        !dry && await execCMD('git', [ 'push' ])
      }

      if (options.push !== 'branch') {
        console.log(pc.green('git push --tags'))
        !dry && await execCMD('git', [ 'push', '--tags' ])
      }
    } else {
      console.log(pc.yellow('Skip Push.'))
    }
  } else {
    console.log(pc.yellow('Skip Commit/Tag/Push.'))
  }
}
