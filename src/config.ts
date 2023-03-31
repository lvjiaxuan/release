import { loadConfig } from 'unconfig'
import lodashMerge from 'lodash.merge'
import { getGitHubRepo } from './git'
import path from 'node:path'

export type BumpOption = {
  all?: boolean
  pkg?: boolean
  prompt?: boolean
}

export type ChangelogOption = {
  tag?: string
  verbose?: boolean
  token?: string
}

export type CliOption = {
  yml?: boolean
  commit?: string
  tag?: string
  push?: string
  dry?: boolean
}

export type MarkdownOptions = {
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

const MarkdownOptionDefaults: MarkdownOptions = {
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
  tag: '',
  push: '',
}

const resolveConfig = async <T extends BumpOption & ChangelogOption & CliOption>(options: T) => {
  const config = await loadConfig<T>({
    sources: [
      // load from `lv.release.xx`
      {
        files: 'lv.release',
        // default extensions
        extensions: [ 'ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', '' ],
      },
      {
        files: 'lv.releaserc',
        // default extensions
        extensions: [ '' ],
      },
      // load `lv.release` field in `package.json` if no above config files found
      {
        files: 'package.json',
        extensions: [],
        /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
        // @ts-ignore
        rewrite: config => config.lv?.release,
        /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
      },
      // ...
    ],
    // if false, the only the first matched will be loaded
    // if true, all matched will be loaded and deep merged
    merge: false,
  })

  let mergeOptions: T & MarkdownOptions

  if (!config.sources.length) {
    mergeOptions = lodashMerge(CliOptionDefaults, MarkdownOptionDefaults, options)
  } else {
    console.log(`Config file found: ${ config.sources[0] } \n`, config.config)
    mergeOptions = lodashMerge(CliOptionDefaults, MarkdownOptionDefaults, config.config, options)
  }

  if (!mergeOptions.github){
    mergeOptions.github = await getGitHubRepo()
  }

  if (!mergeOptions.token) {
    const dotenv = await import('dotenv')
    dotenv.config({ path: path.join(process.cwd(), '.env.local') })
    mergeOptions.token = process.env.GITHUB_TOKEN
  }

  return mergeOptions
}

export default resolveConfig
