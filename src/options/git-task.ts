import type { CliOptions } from '../index'
import { execCMD } from '../index'

export const execGitJobs = async (options: Pick<CliOptions, 'commit' | 'tag' | 'push' | 'dry'>, bumpVersion: string) => {
  const { dry } = options

  console.log()
  if (typeof options.commit === 'string') {
    options.commit = options.commit.replace('{v}', 'v' + bumpVersion)
    console.log('git add .')
    !dry && await execCMD('git', [ 'add', '.' ])
    console.log(`git commit -m ${ options.commit }`)
    !dry && await execCMD('git', [ 'commit', '-m', options.commit ])

    if (typeof options.tag === 'string') {
      const tagName = options.tag ? options.tag : 'v' + bumpVersion
      console.log(`git tag ${ tagName }`)
      !dry && await execCMD('git', [ 'tag', tagName ])
    } else {
      console.log('Skip Tag.')
    }

    if (typeof options.push === 'string') {
      if (options.push !== 'tag') {
        console.log('git push')
        !dry && await execCMD('git', [ 'push' ])
      }

      if (options.push !== 'branch') {
        console.log('git push --tags')
        !dry && await execCMD('git', [ 'push', '--tags' ])
      }
    } else {
      console.log('Skip Push.')
    }
  } else {
    console.log('Skip Commit/Tag/Push.')
  }
}
