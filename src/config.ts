import { loadConfig } from 'unconfig'
import lodashMerge from 'lodash.merge'

export type Options = {

  /**
   * Bump root package.json version. If is a monorepo, it would synchronize root version to other package.json in subdirectories.
   *
   * @default []
   */
  bump?: string[]

  /**
   * Prompt version rather than basing on git metadata.
   *
   * @default []
   */
  bumpPrompt?: string[]
}

export const ConfigDefaults = {
  types: {
    feat: { title: '🚀 Enhancements', semver: 'minor' },
    perf: { title: '🔥 Performance', semver: 'patch' },
    fix: { title: '🐞 Fixes', semver: 'patch' },
    refactor: { title: '💅 Refactors', semver: 'patch' },
    docs: { title: '📖 Documentation', semver: 'patch' },
    build: { title: '📦 Build', semver: 'patch' },
    types: { title: '🌊 Types', semver: 'patch' },
    chore: { title: '🏡 Chore' },
    examples: { title: '🏀 Examples' },
    test: { title: '✅ Tests' },
    style: { title: '🎨 Styles' },
    ci: { title: '🤖 CI' },
  },
  cwd: null,
  github: '',
  from: '',
  to: '',
  output: 'CHANGELOG.md',
  scopeMap: {},
}

const resolveConfig = async <T extends Options>(options: T) => {
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

  if (!config.sources.length) {
    return options
  }

  console.log(`Config file found: ${ config.sources[0] }`, config.config)
  return lodashMerge(config.config, options)
}

export default resolveConfig
