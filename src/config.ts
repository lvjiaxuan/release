import { loadConfig } from 'unconfig'
import lodashMerge from 'lodash.merge'
import { getGitHubRepo } from './git'
import * as dotenv from 'dotenv'

export type CliOptions = {
  /**
   * Dry run.
   *
   * @default false
   */
  dry?: boolean

  /**
   * Bump root package.json version. If is a monorepo, it would synchronize root version to other package.json in subdirectories.
   */
  bump?: string[]

  /**
   * Prompt version rather than basing on git metadata.
   */
  bumpPrompt?: string[]

  /**
   * Disable bump
   */
  noBump?: boolean

  /**
   * Generate changelog for all tag.
   */
  changelog?: string

  /**
   * Disable generate Changelog
   */
  noChangelog?: boolean

  /**
   * Add .github/workflows/changelogithub.yml
   *
   * @default false
   */
  yml?: boolean

  /**
   * Use `Release {v}` as commit message by default.
   * The `{v}` would be replaced by `bumpVersion`.
   *
   * @default "Release {v}"
   */
  commit?: string

  /**
   * Use `bumpResult.bumpVersion` by default.
   * Customizable.
   *
   * @default `bumpResult.bumpVersion`
   */
  tag?: string

  /**
   * Push current branch and new tag.
   *
   * @default ''
   */
  push?: '' | 'tag' | 'branch'

  noCommit?: boolean
  noTag?: boolean
  noPush?: boolean
}

export type MarkdownOptions = {
  /**
   * **Optional**
   * PAT is used for requesting author GitHub Link for more detailed changelog.
   */
  token?: string

  /**
   * **Optional**
   * Resolved by `git config --get remote.origin.url'` automatically for more detailed changelog.
   */
  github?: string

  types: Record<string, {
    title: string
  }>
  titles: {
    breakingChanges: string
    unParsedChanges: string
  }
}

export const MarkdownConfigDefaults: MarkdownOptions = {
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
  },
  titles: {
    breakingChanges: '🚨 Breaking Changes',
    unParsedChanges: '💥 Un-Parsed Changes',
  },
}


const resolveConfig = async <T extends CliOptions>(options: T) => {
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
    mergeOptions = lodashMerge(options, MarkdownConfigDefaults)
  } else {
    console.log(`Config file found: ${ config.sources[0] }`, config.config)
    mergeOptions = lodashMerge(config.config, options, MarkdownConfigDefaults)
  }

  if (!mergeOptions.github){
    mergeOptions.github = await getGitHubRepo()
  }

  dotenv.config({ path: '.env.local' })
  mergeOptions.token = process.env.GITHUB_TOKEN

  return mergeOptions
}

export default resolveConfig
