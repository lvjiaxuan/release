import { version } from '../package.json'
import { hideBin } from 'yargs/helpers'
import resolveConfig, { type Options } from './config'
import yargs, { type Argv } from 'yargs'
import main from './main'

// yargs api refers to https://github.com/yargs/yargs/blob/main/docs/api.md
const args = yargs(hideBin(process.argv))
  .scriptName('lvr')
  .usage( // `[ ... ]` means optional / `< ... >` means required
    '$0 [options]',
    '`lvr` equals to `lvr --bump --changelog`',
    args => args as Argv<Options>,
    async args => main(await resolveConfig(args)),
  )
  .option('bump', {
    alias: 'b',
    array: true,
    // default: [],
    // defaultDescription: '[]',
    description: 'Bump version',
    group: 'Bump options:',
  })
  .option('bump-prompt', {
    array: true,
    // default: [],
    // defaultDescription: '[]',
    description: 'Select version.',
    group: 'Bump options:',
  })
  // .option('pre-release', {
  //   string: true,
  //   default: '',
  //   defaultDescription: '',
  //   description: 'Optionally, specify pre-release identifier',
  //   group: 'Bump options:',
  // })
  .option('no-bump', {
    boolean: true,
    default: true,
    defaultDescription: 'true',
    description: 'Disable bump',
    group: 'Bump options:',
  })
  .option('changelog', {
    alias: 'c',
    string: true,
    default: '"all"',
    defaultDescription: 'all',
    description: 'Generate Changelog',
    group: 'Changelog options:',
  })
  .option('no-changelog', {
    boolean: true,
    default: true,
    defaultDescription: 'true',
    description: 'Disable generate Changelog',
    group: 'Changelog options:',
  })
  .option('add-ci_yml', {
    boolean: true,
    default: true,
    defaultDescription: 'true',
    description: 'Add `.github/workflows/lvrelease.yml`',
  })
  // --help
  .help()
  .alias('h', 'help')
  // --version
  .version(version)
  .alias('v', 'version')
  // .parseSync()
  .argv
