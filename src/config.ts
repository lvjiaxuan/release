import path from 'node:path'
import process from 'node:process'
import { loadConfig } from 'unconfig'
import lodashMerge from 'lodash.merge'
import pc from 'picocolors'
import { getGitHubRepo } from '.'
import type { AllOption, ChangelogOption, CliOption, MarkdownOption } from '.'

export const cwd = process.cwd()

const ChangelogOptionDefaults: ChangelogOption = {
  // tag: '10',
}

const MarkdownOptionDefaults: MarkdownOption = {
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
}

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
        rewrite: config => (config as { lvr: T }).lvr,
      },
      // ...
    ],
    // if false, the only the first matched will be loaded
    // if true, all matched will be loaded and deep merged
    merge: false,
  })

  let mergeOptions: T

  if (!config.sources.length) {
    mergeOptions = lodashMerge(Object.create(null) as T, options, CliOptionDefaults, MarkdownOptionDefaults, ChangelogOptionDefaults)
  }
  else {
    console.log(pc.green(`\nConfig file found: ${config.sources[0]}:\n`), pc.gray(JSON.stringify(config.config)))
    mergeOptions = lodashMerge(Object.create(null), options, CliOptionDefaults, MarkdownOptionDefaults, ChangelogOptionDefaults, config.config) as T
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
