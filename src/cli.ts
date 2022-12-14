import { version } from '../package.json'
import { hideBin } from 'yargs/helpers'
import resolveConfig, { type CliOptions } from './config'
import yargs, { type Argv } from 'yargs'
import main from './main'

// yargs api refers to https://github.com/yargs/yargs/blob/main/docs/api.md
void yargs(hideBin(process.argv))
  .scriptName('lvr')
  .usage( // `[ ... ]` means optional / `< ... >` means required
    '$0 [options]',
    '`lvr` equals to `lvr -b -c`',
    args => args as Argv<CliOptions>,
    async args => main(await resolveConfig(args)),
  )
  .options('dry', {
    alias: 'd',
    boolean: true,
    default: false,
    description: 'Dry run.',
  })
  .option('bump', {
    alias: 'b',
    array: true,
    default: [],
    description: 'Bump version.',
    defaultDescription: 'empty means all pkgs.',
    group: 'Bump options:',
  })
  .option('bump-prompt', {
    alias: 'p',
    array: true,
    description: 'Prompt version.',
    defaultDescription: 'empty means all pkgs.',
    group: 'Bump options:',
  })
  .option('no-bump', {
    alias: 'nb',
    boolean: true,
    default: false,
    description: 'Disable bump.',
    group: 'Bump options:',
  })
  .option('changelog', {
    alias: 'c',
    string: true,
    default: '',
    defaultDescription: 'empty means all tags.',
    description: 'Generate Changelog.',
    group: 'Changelog options:',
  })
  .option('no-changelog', {
    alias: 'nc',
    boolean: true,
    default: false,
    description: 'Disable generate Changelog.',
    group: 'Changelog options:',
  })
  .option('yml', {
    boolean: true,
    default: false,
    description: 'Add .github/workflows/changelogithub.yml.',
  })
  .option('commit', {
    string: true,
    default: 'Release {v}',
    description: 'Commit message which is customizable.\n`{v}` equal to new version.',
  })
  .option('tag', {
    string: true,
    default: '',
    defaultDescription: '`bumpVersion`',
    description: 'Tag name.'
  })
  .option('push', {
    string: true,
    default: '',
    defaultDescription: 'empty means both branch and tag',
    description: 'Push branch and tag which are optional.',
  })
  .option('no-commit', {
    boolean: true,
    default: false,
  })
  .option('no-tag', {
    boolean: true,
    default: false,
  })
  .option('no-push', {
    boolean: true,
    default: false,
  })
  .help()
  .alias('h', 'help')
  .version(version)
  .alias('v', 'version')
  .argv
