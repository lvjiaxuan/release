import pc from 'picocolors'
import { promises as fsp } from 'fs'
import { getCurrentGitBranch, getLastGitTag, getParsedCommits, getTags } from './../git'
import type { CliOptions, MarkdownOptions } from './../config'
import { generateMarkdown } from './../markdown'
import semver from 'semver'
import { $fetch } from 'ohmyfetch'
import { notNullish } from '@antfu/utils'
import type { AuthorInfo, Commit } from 'changelogithub'

type ChangelogOptions = CliOptions & MarkdownOptions

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L50
const resolveAuthorInfo = async (options: ChangelogOptions, info: AuthorInfo) => {
  if (info.login || !options.github)
    return info

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, require-atomic-updates, @typescript-eslint/no-unsafe-member-access */
  try {
    const data = await $fetch(`https://api.github.com/search/users?q=${ encodeURIComponent(info.email) }`, { headers: { accept: 'application/vnd.github+json' } })
    info.login = data.items[0].login
  }
  catch {}

  if (info.login)
    return info

  if (info.commits.length) {
    try {
      const data = await $fetch(`https://api.github.com/repos/${ options.github }/commits/${ info.commits[0] }`, { headers: { accept: 'application/vnd.github+json' } })
      info.login = data.author.login
    }
    catch {}
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, require-atomic-updates, @typescript-eslint/no-unsafe-member-access */

  return info
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L82
const resolveAuthors = async (commits: Commit[], options: ChangelogOptions) => {
  const map = new Map<string, AuthorInfo>()
  commits.forEach(commit => commit.resolvedAuthors = commit.authors.map((a, idx) => {
    if (!a.email || !a.name)
      return null
    if (!map.has(a.email)) {
      map.set(a.email, {
        commits: [],
        name: a.name,
        email: a.email,
      })
    }
    const info = map.get(a.email)!

    // record commits only for the first author
    if (idx === 0)
      info.commits.push(commit.shortHash)

    return info
  }).filter(notNullish))
  const authors = Array.from(map.values())
  const resolved = await Promise.all(authors.map(info => resolveAuthorInfo(options, info)))

  const loginSet = new Set<string>()
  const nameSet = new Set<string>()
  return resolved
    .sort((a, b) => (a.login || a.name).localeCompare(b.login || b.name))
    .filter(i => {
      if (i.login && loginSet.has(i.login))
        return false
      if (i.login) {
        loginSet.add(i.login)
      }
      else {
        if (nameSet.has(i.name))
          return false
        nameSet.add(i.name)
      }
      return true
    })
}

const resolveFormToList = async (tags?: string[]) => {
  const list: string[][] = []
  if (!tags) {
    tags = await getTags()
    tags[0] && list.unshift([ '', tags[0] ])
  }
  for (let i = 0, n = tags.length; i < n - 1; i++) {
    list.push([ tags[i], tags[i + 1] ])
  }
  return list.reverse()
}

const verifyTags = async (tags: string[][], ignore: string) => {
  const existTags = await getTags()
  const flatTags = tags.flat().filter(tag => tag && tag !== ignore)
  return flatTags.every(tag => existTags.includes(tag))
}


export const changelog = async (options: ChangelogOptions, newTag?: string) => {
  if (options.changelog === false) {
    console.log(`\n${ pc.bold(pc.yellow('Skip')) } generate CHANGELOG.md.`)
    return
  }

  let appendNewTag = true
  let fromToList: string[][] = []
  if (options.changelog === '') {
    // For all tags.
    fromToList = await resolveFormToList()
  } else if (options.changelog!.includes('...')) {
    // For a tag range.
    appendNewTag = false
    const from2to = options.changelog!.split('...') as [ string, string ]
    fromToList = await resolveFormToList(from2to)
  } else if (Number.isInteger(-options.changelog!)) {
    // For few latest tags.
    const tags = await getTags()
    fromToList = await resolveFormToList(tags.slice(-options.changelog! - 1))
  } else if (options.changelog === 'latest') {
    // For the latest tag.
    const [ latestTag, beforeLatestTag ] = await Promise.all([
      getLastGitTag(),
      getLastGitTag(-1),
    ])
    fromToList = [ [ beforeLatestTag, latestTag ] ]
  } else if (semver.valid(options.changelog)) {
    // For a specified tag.
    appendNewTag = false
    fromToList = [ [ '', options.changelog! ] ]
  }

  let currentGitBranch = ''
  if (appendNewTag && newTag) {
    currentGitBranch = await getCurrentGitBranch()
    fromToList.unshift([ fromToList?.[0]?.[1] ?? '', currentGitBranch ])
  }

  if (!fromToList.length || !await verifyTags(fromToList, currentGitBranch)) {
    console.log(`\n${ pc.bold(pc.yellow('Skip')) }. ${ pc.red('Illegal tags') } to generate changelog.`)
    return
  }

  const titleMap = { [currentGitBranch]: `v${ newTag! }` }

  let md = '# Changelog\n\n'
  if (fromToList.length > 1) {
    md += `Tag ranges \`${ fromToList[fromToList.length - 1][1] }...${ titleMap[fromToList[0][1]] ? titleMap[fromToList[0][1]] : fromToList[0][1] }\`.`
  } else if (fromToList.length === 1) {
    md += `Tag \`${ newTag! }\`.`
  }

  if (options.github) {
    md += ` [All GitHub Releases](https://github.com/${ options.github }/releases).`
  }

  if (!options.verboseChange) {
    delete options.types['__OTHER__']
  }

  /* eslint-disable no-await-in-loop */
  for (const [ from, to ] of fromToList) {
    const parsedCommits = await getParsedCommits(from, to, Object.keys(options.types))

    await resolveAuthors(parsedCommits, options)

    md += await generateMarkdown({
      ...options,
      parsedCommits,
      from,
      to,
      titleMap,
    })
  }
  /* eslint-enable no-await-in-loop */


  if (process.env.NODE_ENV !== 'test' && !options.dry) {
    await fsp.writeFile('CHANGELOG.md', md, 'utf8')
  }

  return { md }
}
