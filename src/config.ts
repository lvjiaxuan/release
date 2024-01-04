import path from 'node:path'
import process from 'node:process'
import { loadConfig } from 'unconfig'
import lodashMerge from 'lodash.merge'
import { getGitHubRepo } from '.'

const cwd = process.cwd()

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

export const MarkdownOptionDefaults: MarkdownOption = {
  types: {
    feat: { title: '✨ Enhancements' },
    perf: { title: '⚡️ Performance' },
    fix: { title: '🐛 Fixes' },
    // refactor: { title: '♻️ Refactors' },
    docs: { title: '📝 Documentation' },
    // build: { title: '📦️ Build' },
    // chore: { title: '🧱 Chore' },
    // test: { title: '✅ Tests' },
    // style: { title: '🎨 Styles' },
    // ci: { title: '🤖 CI' },
    // release: { title: '🔖 Release' },
    // WIP: { title: '🚧 Work in Progress' },
    __OTHER__: { title: '📌 Other Changes' },
  },
  titles: { breakingChanges: '💥 Breaking Changes' },
}

const CliOptionDefaults: CliOption = {
  commit: 'Release {r}',
  cwd,
  // tag: '',
  // push: '',
}

export type AllOption = BumpOption & ChangelogOption & CliOption & MarkdownOption

export async function resolveConfig<T extends AllOption>(options: T) {
  const config = await loadConfig<T>({
    sources: [
      // load from `lvr.xx`
      {
        files: 'lvr',
        // default extensions
        extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
      },
      {
        files: '.lvrrc',
        // default extensions
        extensions: [''],
      },
      // load `.lvrrc` field in `package.json` if no above config files found
      {
        files: 'package.json',
        extensions: [],
        // eslint-disable-next-line ts/no-unsafe-member-access
        rewrite: config => (config as any).lvr as T,
      },
      // ...
    ],
    // if false, the only the first matched will be loaded
    // if true, all matched will be loaded and deep merged
    merge: false,
  })

  let mergeOptions: T

  if (!config.sources.length) {
    mergeOptions = lodashMerge(CliOptionDefaults, MarkdownOptionDefaults, options)
  }
  else {
    console.log(`Config file found: ${config.sources[0]} \n`, config.config)
    mergeOptions = lodashMerge(CliOptionDefaults, MarkdownOptionDefaults, config.config, options)
  }

  if (!mergeOptions.github)
    mergeOptions.github = await getGitHubRepo()

  if (!mergeOptions.token) {
    const dotenv = await import('dotenv')
    dotenv.config({ path: path.resolve(cwd, '.env.local') })
    mergeOptions.token = process.env.GITHUB_TOKEN
  }

  return mergeOptions
}
