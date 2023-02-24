import { type GitCommit, type GitCommitAuthor, type RawGitCommit, type Reference, getGitDiff } from 'changelogen'
import pc from 'picocolors'

export const execCMD = async (cmd: string, args: string[]) => {
  const { execaSync } = await import('execa')
  return execaSync(cmd, args)
}

export const getTags = (() => {
  let cache: string[] = []
  let promise: (() => Promise<string[]>) | undefined = void 0

  if (!promise) {
    promise = async () => {
      if (!cache.length) {
        // eslint-disable-next-line require-atomic-updates
        cache = (await execCMD('git', [ '--no-pager', 'tag', '-l', '--sort=creatordate' ])).stdout.trim().split('\n')
      }
      return cache.filter(Boolean)
    }
  }

  return promise
})()

export async function getGitHubRepo() {
  try {
    const url = (await execCMD('git', [ 'config', '--get', 'remote.origin.url' ])).stdout.trim()
    const match = url.match(/github\.com[/:]([\w\d._-]+?)\/([\w\d._-]+?)(\.git)?$/i)
    if (!match) {
      console.log(`Can not parse GitHub repo from url ${ pc.bgCyan(url) }`)
      return ''
    }
    return `${ match[1] }/${ match[2] }`
  } catch {
    console.log(`Can not get GitHub repo from ${ pc.bgCyan('remote.origin.url') }.`)
  }
  return ''
}

export const getOldGitTag = async () => {
  const tags = await getTags()
  return tags[0]
}

export const getLastGitTag = async (delta = 0) => {
  const tags = await getTags()
  return tags[tags.length + delta - 1]
}

export const findTag = async (tag: string) => (await execCMD('git', [ 'tag', '-l', tag ])).stdout.trim()

export const getFirstGitCommit = async () => (await execCMD('git', [ 'rev-list', '--max-parents=0', 'HEAD' ])).stdout.trim()

export const getCurrentGitBranch = async () => (await execCMD('git', [ 'tag', '--points-at', 'HEAD' ])).stdout.trim()
    || (await execCMD('git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ])).stdout.trim()

export const getCommitFormatTime = async (commit: string) => {
  const time = await execCMD('git', [ 'log', '-1', '--format=%ai', commit ])
  return time.stdout.trim().slice(0, 10)
}

export const getParsedCommits = async (from: string, to: string, types: string[]) => {
  const ConventionalCommitRegex = /(?<type>[a-z]+)(\((?<scope>.+)\))?(?<breaking>!)?: (?<description>.+)/i
  const CoAuthoredByRegex = /Co-authored-by:\s*(?<name>.+)(<(?<email>.+)>)/gmi
  const PullRequestRE = /\([a-z ]*(#[0-9]+)\s*\)/gm
  const IssueRE = /(#[0-9]+)/gm

  const rawCommits = await getGitDiff(from, to)

  const parsedCommits = rawCommits.reduce((preValue, commit) => {

    const match = commit.message.match(ConventionalCommitRegex)

    const type = types.includes(match?.groups?.type as string) ? match?.groups!.type as string : '__OTHER__'
    const scope = match?.groups?.scope ?? ''
    const isBreaking = Boolean(match?.groups?.breaking ?? false)
    let description = type === '__OTHER__' ? commit.message : match?.groups!.description ?? commit.message

    // Extract references from message
    const references: Reference[] = []
    for (const m of description.matchAll(PullRequestRE)) {
      references.push({ type: 'pull-request', value: m[1] })
    }
    for (const m of description.matchAll(IssueRE)) {
      if (!references.find(i => i.value === m[1])) {
        references.push({ type: 'issue', value: m[1] })
      }
    }
    references.push({ value: commit.shortHash, type: 'hash' })

    // Remove references and normalize
    description = description.replace(PullRequestRE, '').trim()

    // Find all authors
    const authors: GitCommitAuthor[] = [ commit.author ]
    for (const match of commit.body.matchAll(CoAuthoredByRegex)) {
      authors.push({
        name: (match.groups?.name ?? '').trim(),
        email: (match.groups?.email ?? '').trim(),
      })
    }

    preValue.push({
      ...commit,
      authors,
      description,
      type,
      scope,
      references,
      isBreaking,
    })
    return preValue
  }, [] as GitCommit[])

  return parsedCommits
}
