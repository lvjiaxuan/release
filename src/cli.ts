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
    '`lvr` equals to `lvr -b -c --commit --tag --push`',
    args => args as Argv<CliOptions>,
    async args => main(await resolveConfig(args)),
  )
  .option('release', {
    boolean: true,
    description: 'Create a release in GitHub Action only.',
  })
  .option('dry', {
    alias: 'd',
    boolean: true,
    default: false,
    description: 'Dry run.',
  })
  .option('bump', {
    alias: 'b',
    array: true,
    description: 'Bump version.',
    defaultDescription: 'For all packages.',
    group: 'Bump options:',
  })
  .option('bumpPrompt', {
    alias: 'p',
    array: true,
    description: 'Prompt version.',
    defaultDescription: 'For all packages.',
    group: 'Bump options:',
  })
  .option('noBump', {
    alias: 'nb',
    boolean: true,
    description: 'Disable bump.',
    group: 'Bump options:',
  })
  .option('changelog', {
    alias: 'c',
    string: true,
    defaultDescription: 'For all tags.',
    description: 'Generate Changelog.',
    group: 'Changelog options:',
  })
  .option('noChangelog', {
    alias: 'nc',
    boolean: true,
    description: 'Disable generate Changelog.',
    group: 'Changelog options:',
  })
  .option('yml', {
    boolean: true,
    description: 'Add .github/workflows/changelogithub.yml.',
  })
  .option('commit', {
    string: true,
    description: 'Commit message which is customizable.\n`{v}` equal to new version.',
  })
  .option('tag', {
    string: true,
    defaultDescription: '`bumpVersion`.',
    description: 'Tag name.',
  })
  .option('push', {
    string: true,
    defaultDescription: 'Both branch and tag.',
    description: 'Push branch and tag which are optional.',
  })
  .option('noCommit', { boolean: true })
  .option('noTag', { boolean: true })
  .option('noPush', { boolean: true })
  .help()
  .alias('h', 'help')
  .version(version)
  .alias('v', 'version')
  .argv
