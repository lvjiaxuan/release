import pc from 'picocolors'
import { promises as fsp } from 'fs'
import { getCurrentGitBranch, getLastGitTag, getParsedCommits, getTags } from '@/git'
import type { CliOptions, MarkdownOptions } from '@/config'
import { generateMarkdown } from '@/markdown'
import semver from 'semver'
import { resolveAuthors } from 'changelogithub'

const resolveFormToList = async (tags?: string[]) => {
  const list: string[][] = []
  if (!tags) {
    tags = await getTags()
    list.unshift([ '', tags[0] ])
  }
  for (let i = 0, n = tags.length; i < n - 1; i++) {
    list.push([ tags[i], tags[i + 1] ])
  }
  return list.reverse()
}

export const changelog = async (options: CliOptions & MarkdownOptions) => {
  if (options.noChangelog) {
    console.log(`\nGenerate changelog ${ pc.bold(pc.yellow('skip')) }.`)
    return
  }

  let fromToList: string[][] = []
  if (options.changelog === '') {
    fromToList = await resolveFormToList()
  } else if (options.changelog!.includes('...')) {
    const from2to = options.changelog!.split('...') as [ string, string ]
    fromToList = await resolveFormToList(from2to)
  } else if (Number.isInteger(-options.changelog!)) {
    const tags = await getTags()
    fromToList = await resolveFormToList(tags.slice(-options.changelog! - 1))
  } else if (semver.valid(options.changelog)) {
    const tags = await getTags()
    if (!tags.includes(options.changelog!)) {
      throw new Error(`Inexistent tag ${ pc.bgYellow(`${ options.changelog! }`) }`)
    }
    fromToList = [ [ '', options.changelog! ] ]
  } else if (options.changelog === 'latest') {
    const [ latestTag, beforeLatestTag ] = await Promise.all([
      getLastGitTag(),
      getLastGitTag(-1),
    ])
    fromToList = [ [ beforeLatestTag, latestTag ] ]
  }

  let md = '# Changelog\n\n'
  md += `Tag range \`${ fromToList[fromToList.length - 1][1] }...${ fromToList[0][1] }\`.`

  if (options.github) {
    md += ` [All GitHub Releases]( https://github.com/${ options.github }/releases)`
  }

  // fromToList.unshift([ 'v2.0.7', await getCurrentGitBranch() ])

  /* eslint-disable no-await-in-loop */
  for (const [ from, to ] of fromToList) {
    const { parsedCommits, unParsedCommits } = await getParsedCommits(from, to)

    if (options.token) {
      await resolveAuthors(parsedCommits, {
        token: options.token,
        github: options.github,
      })
    }

    md += await generateMarkdown({
      ...options,
      parsedCommits,
      unParsedCommits,
      from,
      to,
    })
  }
  /* eslint-enable no-await-in-loop */


  if (process.env.NODE_ENV !== 'test' && !options.dry) {
    await fsp.writeFile('CHANGELOG.md', md, 'utf8')
  }

  return { md }
}
