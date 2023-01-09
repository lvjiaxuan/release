import type { GitCommit, RawGitCommit, Reference } from 'changelogen'
import { partition } from '@antfu/utils'
import type { MarkdownOptions } from './index'
import { getCommitFormatTime } from './index'


function groupBy<T>(items: T[], key: string, groups: Record<string, T[]> = {}) {
  for (const item of items) {
    // @ts-ignore
    const v = item[key] as string
    groups[v] = groups[v] || []
    groups[v].push(item)
  }
  return groups
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function join(array?: string[], glue = ', ', finalGlue = ' and '): string {
  if (!array || array.length === 0)
    return ''

  if (array.length === 1)
    return array[0]

  if (array.length === 2)
    return array.join(finalGlue)

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `${ array.slice(0, -1).join(glue) }${ finalGlue }${ array.slice(-1) }`
}

function formatReferences(references: Reference[], github: string | undefined, type: 'issues' | 'hash'): string {
  const refs = references
    .filter(i => {
      if (type === 'issues')
        return i.type === 'issue' || i.type === 'pull-request'
      return i.type === 'hash'
    })
    .map(ref => {
      if (!github)
        return ref.value
      if (ref.type === 'pull-request' || ref.type === 'issue')
        return `[#${ ref.value.slice(1) }](https://github.com/${ github }/issues/${ ref.value.slice(1) })`
      return `[<samp>(${ ref.value.slice(0, 5) })</samp>](https://github.com/${ github }/commit/${ ref.value })`
    })

  const referencesString = join(refs).trim()

  if (type === 'issues')
    return referencesString && `in ${ referencesString }`
  return referencesString
}


function formatLine(commit: ResolvedCommits[number], options: MarkdownOptions) {
  const prRefs = formatReferences(commit.references, options.github, 'issues')
  const hashRefs = formatReferences(commit.references, options.github, 'hash')

  let authors = join([
    ...new Set(
      commit.resolvedAuthors
        ? commit.resolvedAuthors.map(i => i.login ? `@${ i.login }` : `**${ i.name }**`)
        : commit.authors?.map(i => `**${ i.name }**`),
    ),
  ])?.trim()
  if (authors) {
    authors = `by ${ authors }`
  }

  let refs = [ authors, prRefs, hashRefs ].filter(i => i.trim()).join(' ')

  if (refs)
    refs = `&nbsp;-&nbsp; ${ refs }`

  return [ commit.description, refs ].filter(i => i.trim()).join(' ')
}


function formatSection(commits: ResolvedCommits, sectionName: string, options: MarkdownOptions) {
  if (!commits.length)
    return []

  const lines: string[] = [
    '',
    `### &nbsp;&nbsp;&nbsp;${ sectionName.trim() }`,
    '',
  ]

  const scopes = groupBy(commits, 'scope')
  let useScopeGroup = true

  // group scopes only when one of the scope have multiple commits
  if (!Object.entries(scopes).some(([ k, v ]) => k && v.length > 1))
    useScopeGroup = false

  Object.keys(scopes).sort().forEach(scope => {
    let padding = ''
    let prefix = ''
    const scopeText = `**${ scope }**`
    if (scope && useScopeGroup) {
      lines.push(`- ${ scopeText }:`)
      padding = '  '
    }
    else if (scope) {
      prefix = `${ scopeText }: `
    }

    lines.push(
      ...scopes[scope]
        .reverse()
        .map(commit => `${ padding }- ${ prefix }${ formatLine(commit, options) }`),
    )
  })

  return lines
}

function formatUnParsedSection(commits: RawGitCommit[], options: MarkdownOptions) {
  if (!commits.length)
    return []

  const lines: string[] = [
    '',
    `### &nbsp;&nbsp;&nbsp;${ options.titles.unParsedChanges }`,
    '',
  ]

  lines.push(
    ...commits.reverse().map(commit => `- ${ commit.message }`),
  )

  return lines
}

type ResolvedCommits = (GitCommit & { resolvedAuthors?: {
  commits: string[]
  login?: string
  email: string
  name: string
}[] })[]
export async function generateMarkdown(options: MarkdownOptions & {
  parsedCommits: ResolvedCommits
  unParsedCommits: RawGitCommit[]
  from: string
  to: string
}) {
  const { parsedCommits: commits, unParsedCommits, from, to } = options

  const lines: string[] = [
    '',
    '',
    `## ${ to } <sub>(${ await getCommitFormatTime(to) })</sub>`,
  ]

  if (options.github) {
    lines.push(`[compare changes](https://github.com/${ options.github }/compare/${ from }...${ to })`)
  }

  const [ breaking, changes ] = partition(commits, c => c.isBreaking)

  lines.push(
    ...formatSection(breaking, options.titles.breakingChanges, options),
  )

  const group = groupBy(changes, 'type')
  for (const type of Object.keys(options.types)) {
    const items = group[type] || []
    lines.push(
      ...formatSection(items, options.types[type].title, options),
    )
  }

  lines.push(
    ...formatUnParsedSection(unParsedCommits, options),
  )

  return lines.join('\n').trimEnd()
}
