export type ReleaseType = 'major' | 'minor' | 'patch' | 'prerelease' | 'premajor' | 'preminor' | 'prepatch'

export interface BumpOptions {
  all?: boolean
  pkg?: boolean
  prompt?: boolean
  major?: boolean
  minor?: boolean
  patch?: boolean
  premajor?: string
  preminor?: string
  prepatch?: string
  prerelease?: string
}

export interface ChangelogOptions {
  tag?: string
  verbose?: boolean
  token?: string
  github?: string
  strictAuthor?: boolean
}

export interface CliOptions {
  yml?: boolean
  commit?: string
  tag?: string | number
  push?: string
  dryRun?: boolean
  mainPkg?: boolean
  cwd: string
  debug?: boolean
  from?: string
}

export interface MarkdownOptions {
  /**
   * **Optional**
   * Resolved by `git config --get remote.origin.url'` for generating a detailed CHANGELOG.md.
   */
  github?: string

  types: Record<string, {
    title: string
  }>

  titles: {
    breakingChanges: string
  }
}

export interface PublishOption {
  syncCnpm?: boolean
}

export type AllOptions = BumpOptions & ChangelogOptions & CliOptions & MarkdownOptions
