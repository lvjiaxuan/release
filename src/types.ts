import type conventionalRecommendedBump from 'conventional-recommended-bump'

export type ReleaseType = conventionalRecommendedBump.Recommendation.ReleaseType | 'prerelease' | 'premajor' | 'preminor' | 'prepatch'

export interface BumpOption {
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

export interface ChangelogOption {
  tag?: string
  verbose?: boolean
  token?: string
  github?: string
}

export interface CliOption {
  yml?: boolean
  commit?: string
  tag?: string
  push?: string
  dry?: boolean
  mainPkg?: boolean
  cwd: string
  debug?: boolean
  from?: string
}

export interface MarkdownOption {
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

export type AllOption = BumpOption & ChangelogOption & CliOption & MarkdownOption
