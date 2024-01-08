import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { notNullish } from '@antfu/utils'
import { ofetch } from 'ofetch'
import type { AuthorInfo, Commit } from 'changelogithub'
import pc from 'picocolors'
import semver from 'semver'
import cliProgress from 'cli-progress'
import { generateMarkdown, getCurrentGitBranch, getParsedCommits, getTags } from '..'
import type { AllOption, ChangelogOption } from '..'

async function resolveFormToList({ tags, from }: { tags?: string[] | number, from?: string } = { from: '' }) {
  const list: string[][] = []
  const allTags = await getTags()

  if (!tags) {
    tags = allTags
    tags[0] && list.unshift([from ?? '', tags[0]])
  }
  else if (Array.isArray(tags)) {
    const typeTags = tags
    const head = allTags.findIndex(i => i === typeTags[0])
    const tail = allTags.findIndex(i => i === typeTags[typeTags.length - 1])

    if (head > -1 && tail > -1)
      tags = allTags.filter((_, idx) => head - 1 <= idx && idx <= tail)
    else
      return []
  }
  else {
    if (tags >= allTags.length)
      list.unshift(['', allTags[0]])

    tags = allTags.slice(-tags - 1)
  }

  for (let i = 0, n = tags.length; i < n - 1; i++)
    list.push([tags[i], tags[i + 1]])

  return list.reverse()
}

async function verifyTags(tags: string[][], ignores?: (string | void)[]) {
  const existTags = await getTags()
  const flatTags = tags.flat().filter(tag => tag && !ignores?.includes(tag))
  return flatTags.every(tag => existTags.includes(tag))
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L50
const globalAuthorsCache = new Map<string, AuthorInfo>()
const globalAuthorsError = new Map<string, any>()
async function resolveAuthorInfo(options: ChangelogOption, info: AuthorInfo) {
  if (globalAuthorsCache.has(info.email))
    return globalAuthorsCache.get(info.email)!

  if (info.login) {
    globalAuthorsCache.set(info.email, info)
    return info
  }

  const headers: { [x: string]: string } = { accept: 'application/vnd.github+json' }
  options.token && (headers.authorization = `${options.token}`)

  /* eslint-disable ts/no-unsafe-assignment, ts/no-unsafe-member-access */
  try {
    const data = await ofetch (`https://api.github.com/search/users?q=${encodeURIComponent(info.email)}`, { headers })
    info.login = data.items[0].login
  }
  catch (e: any) {
    globalAuthorsError.set(info.name ?? info.email, e)
  }

  if (!info.login && info.commits.length && options.github) {
    for await (const commit of info.commits) {
      try {
        const data = await ofetch (`https://api.github.com/repos/${options.github}/commits/${commit}`, { headers })
        info.login = data.author.login
        globalAuthorsError.delete(info.name ?? info.email)
        break
      }
      catch (e: any) {
        globalAuthorsError.set(info.name ?? info.email, e)
        continue
      }
    }
  }
  /* eslint-enable ts/no-unsafe-assignment, ts/no-unsafe-member-access */

  globalAuthorsCache.set(info.email, info)
  return info
}

// https://github.com/antfu/changelogithub/blob/f6995c9cb4dda18a0fa21efe908a0ee6a1fc26b9/src/github.ts#L82
async function resolveCommitAuthors(commits: Commit[], options: ChangelogOption) {
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

    if (globalAuthorsCache.has(info.email))
      info.login = globalAuthorsCache.get(info.email)!.login

    return info
  }).filter(notNullish))
  const authors = Array.from(map.values())
  const resolved = await Promise.all(authors.map(info => resolveAuthorInfo(options, info)))

  const loginSet = new Set<string>()
  const nameSet = new Set<string>()
  return resolved
    .sort((a, b) => (a.login || a.name).localeCompare(b.login || b.name))
    .filter((i) => {
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

async function generate({ fromToList, titleMap, options }: {
  fromToList: string[][]
  titleMap: { [x: string]: string }
  options: AllOption
}) {
  let md = '# Changelog\n\n'
  if (fromToList.length > 1)
    md += `Tag ranges \`${fromToList[fromToList.length - 1][1]}...${titleMap[fromToList[0][1]] ? titleMap[fromToList[0][1]] : fromToList[0][1]}\` (${fromToList.length}).`
  else if (fromToList.length === 1)
    md += `Tag \`${titleMap[fromToList[0][1]] ? titleMap[fromToList[0][1]] : fromToList[0][1]}\`.`

  if (options.github)
    md += ` [All GitHub Releases](https://github.com/${options.github}/releases).`

  if (!options.verbose)
    delete options.types.__OTHER__

  const processBar = new cliProgress.SingleBar({
    format: pc.green(`Generating CHANGELOG.md |${pc.cyan('{bar}')}| {value}/{total}`),
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  processBar.start(fromToList.length, 0)

  for (const [from, to] of fromToList) {
    const parsedCommits = await getParsedCommits(from, to, Object.keys(options.types))

    await resolveCommitAuthors(parsedCommits, options)

    md += await generateMarkdown({
      ...options,
      parsedCommits,
      from,
      to,
      titleMap,
    })

    processBar.increment()
  }

  if (globalAuthorsError.size) {
    console.log(pc.yellow('\nFail to resolved these follow authors and fallback to origin name:'))
    for (const [name, error] of globalAuthorsError.entries())
      console.log(pc.gray(name), pc.gray((error as Error).message))
  }

  console.log(pc.green('\nContent preview:'))
  console.log(pc.gray(md.replaceAll(/\n|\r/g, '').slice(0, 400)))

  return md
}

export async function changelog(options: AllOption, tagForHead?: string) {
  console.log()

  // @ts-expect-error false if `--no-changelog`
  if (options?.changelog === false) {
    console.log(pc.yellow('No changelog.'))
    return
  }

  let fromToList: string[][] = []
  if (options.tag === '') {
    // All tags.
    fromToList = await resolveFormToList({ from: options.from })
  }
  else if (options.tag!.includes('...')) {
    // A tag range.
    const from2to = options.tag!.split('...') as [ string, string ]
    fromToList = await resolveFormToList({ tags: from2to })
  }
  else if (Number.isInteger(-options.tag!)) {
    // Few last few tags.
    fromToList = await resolveFormToList({ tags: +options.tag! })
  }
  else if (semver.valid(options.tag)) {
    // A specified tag.
    const tags = await getTags()
    const idx = tags.findIndex(i => i === options.tag)
    fromToList = [[idx > -1 ? tags[idx - 1] : '', options.tag!]]
  }

  const titleMap: { [x: string]: string } = {}
  let currentGitBranch: string | undefined
  if (tagForHead) {
    currentGitBranch = await getCurrentGitBranch()
    const lastTag = fromToList?.[0]?.[1]
    if (lastTag !== currentGitBranch) {
      fromToList.unshift([fromToList?.[0]?.[1] ?? '', currentGitBranch])
      titleMap[currentGitBranch] = tagForHead
    }
  }

  if (!fromToList.length || !await verifyTags(fromToList, [currentGitBranch, options.from])) {
    console.log(`\n${pc.bold(pc.yellow('Skip generate CHANGELOG.md'))} for the invalid tags:`)
    console.log(`[${pc.gray(fromToList.toString())}]`)
    return
  }

  const md = await generate({ fromToList, titleMap, options })

  if (process.env.NODE_ENV !== 'test' && !options.dry)
    fs.writeFileSync(path.resolve(options.cwd, 'CHANGELOG.md'), md, 'utf-8')

  return md
}
