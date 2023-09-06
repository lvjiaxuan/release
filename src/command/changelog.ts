import type { AllOption, ChangelogOption } from '..'
import { generateMarkdown, getCurrentGitBranch, getParsedCommits, getTags } from '..'
import { notNullish } from '@antfu/utils'
import { $fetch } from 'ohmyfetch'
import type { AuthorInfo, Commit } from 'changelogithub'
import fs from 'node:fs'
import pc from 'picocolors'
import semver from 'semver'

const resolveFormToList = async (tags?: string[] | number) => {
  const list: string[][] = []
  const allTags = await getTags()

  if (!tags) {
    tags = allTags
    tags[0] && list.unshift([ '', tags[0] ])

  } else if (Array.isArray(tags)) {

    // @ts-ignore
    const head = allTags.findIndex(i => i === tags[0])
    // @ts-ignore
    const tail = allTags.findIndex(i => i === tags[tags.length - 1])

    if (head > -1 && tail > -1) {
      tags = allTags.filter((_, idx) => head - 1 <= idx && idx <= tail)
    } else {
      return []
    }
  } else {
    if (tags >= allTags.length) {
      list.unshift([ '', allTags[0] ])
    }

    tags = allTags.slice(-tags - 1)
  }

  for (let i = 0, n = tags.length; i < n - 1; i++) {
    list.push([ tags[i], tags[i + 1] ])
  }
  return list.reverse()
}

const verifyTags = async (tags: string[][], ignore?: string) => {
  const existTags = await getTags()
  const flatTags = tags.flat().filter(tag => tag && tag !== ignore)
  return flatTags.every(tag => existTags.includes(tag))
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L50
let skipFurtherFetch = false
let skipMessage = ''
const globalAuthorCache = new Map<string, AuthorInfo>()
const resolveAuthorInfo = async (options: ChangelogOption, info: AuthorInfo) => {
  if (globalAuthorCache.has(info.email)) {
    return globalAuthorCache.get(info.email)!
  }

  if (info.login || skipFurtherFetch) {
    globalAuthorCache.set(info.email, info)
    return info
  }

  const headers: { [x: string]: string } = { accept: 'application/vnd.github+json' }
  options.token && (headers.authorization = `token ${ options.token }`)

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, require-atomic-updates, @typescript-eslint/no-unsafe-member-access */
  try {
    const data = await $fetch(`https://api.github.com/search/users?q=${ encodeURIComponent(info.email) }`, { headers })
    info.login = data.items[0].login
    skipFurtherFetch = false
  }
  catch (e: any) {
    skipFurtherFetch = true
    skipMessage = e.message
  }

  if (info.login) {
    globalAuthorCache.set(info.email, info)
    return info
  }

  if (info.commits.length && options.github) {
    try {
      const data = await $fetch(`https://api.github.com/repos/${ options.github }/commits/${ info.commits[0] }`, { headers })
      info.login = data.author.login
      skipFurtherFetch = false
    }
    catch (e: any) {
      skipFurtherFetch = true
      skipMessage = e.message
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, require-atomic-updates, @typescript-eslint/no-unsafe-member-access */

  if (skipFurtherFetch) {
    console.log(pc.red(skipMessage))
    console.log(pc.yellow('Failed to resolve author info, fallback to the origin data.'))
  }

  globalAuthorCache.set(info.email, info)
  return info
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L82
const resolveAuthors = async (commits: Commit[], options: ChangelogOption) => {
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

    if (globalAuthorCache.has(info.email)) {
      info.login = globalAuthorCache.get(info.email)!.login
    }

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

export const changelog = async (options: AllOption, tagForHead?: string) => {
  console.log()
  console.log(`${ pc.green('Generated ./CHANGELOG.md\'s content preview:') }`)

  let fromToList: string[][] = []
  if (!Object.hasOwn(options, 'tag')) {
    // All tags.
    fromToList = await resolveFormToList()
  } else if (options.tag!.includes('...')) {
    // A tag range.
    const from2to = options.tag!.split('...') as [ string, string ]
    fromToList = await resolveFormToList(from2to)
  } else if (Number.isInteger(-options.tag!)) {
    // Few last few tags.
    fromToList = await resolveFormToList(+options.tag!)
  } else if (semver.valid(options.tag)) {
    // A specified tag.
    const tags = await getTags()
    const idx = tags.findIndex(i => i === options.tag)
    fromToList = [ [ idx > -1 ? tags[idx - 1] : '', options.tag! ] ]
  }

  const titleMap: { [x: string]: string } = {}
  let currentGitBranch: string | undefined
  if (tagForHead) {
    currentGitBranch = await getCurrentGitBranch()
    const lastestTag = fromToList?.[0]?.[1]
    if (lastestTag !== currentGitBranch) {
      fromToList.unshift([ fromToList?.[0]?.[1] ?? '', currentGitBranch ])
      titleMap[currentGitBranch] = tagForHead
    }
  }

  if (!fromToList.length || !await verifyTags(fromToList, currentGitBranch)) {
    console.log(`\n${ pc.bold(pc.yellow('Skip CHANGELOG')) }. Found the ${ pc.red('illegal tags') } to generate CHANGELOG.`)
    return
  }

  let md = '# Changelog\n\n'
  if (fromToList.length > 1) {
    md += `Tag ranges \`${ fromToList[fromToList.length - 1][1] }...${ titleMap[fromToList[0][1]] ? titleMap[fromToList[0][1]] : fromToList[0][1] }\` (${ fromToList.length }).`
  } else if (fromToList.length === 1) {
    md += `Tag \`${ titleMap[fromToList[0][1]] ? titleMap[fromToList[0][1]] : fromToList[0][1] }\`.`
  }

  if (options.github) {
    md += ` [All GitHub Releases](https://github.com/${ options.github }/releases).`
  }

  if (!options.verbose) {
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

  console.log(`${ pc.gray(md.replaceAll(/\n|\r/g, '').slice(0, 800)) }`)

  if (process.env.NODE_ENV !== 'test' && !options.dry) {
    fs.writeFileSync('CHANGELOG.md', md, 'utf-8')
  }

  return md
}
