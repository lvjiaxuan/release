import { version } from '../package.json'
import { hideBin } from 'yargs/helpers'
import yargs, { type Argv } from 'yargs'
import main from './main'
import type { BumpOption, ChangelogOption, CliOption } from './config'

// yargs api refers to https://github.com/yargs/yargs/blob/main/docs/api.md
void yargs(hideBin(process.argv))
  .scriptName('lvr')
  .usage(
    '$0 [options]',
    'Bump → CHANGELOG → Commit → Tag → Push',
    yargs => yargs satisfies Argv<BumpOption | ChangelogOption | CliOption>,
    args => console.log(args),
  ).command({
    command: 'bump [options]',
    aliases: 'b',
    describe: 'Bump only.',
    builder: y => y,
    handler(args) {
      // console.log(2, args)
    },
  }).command({
    command: 'changelog [options]',
    aliases: 'c',
    describe: 'Generate CHANGELOG only.',
    builder: y => y,
    handler(args) {
      // console.log(3, args)
    },
  }).option('all', {
    boolean: true,
    default: false,
    describe: 'Bump for all packages.',
    group: 'bump',
  }).option('pkg', {
    boolean: true,
    default: false,
    describe: 'Bump for specific packages.',
    group: 'bump',
  }).option('prompt', {
    boolean: true,
    default: false,
    describe: 'Prompt for the bump version.',
    group: 'bump',
  }).option('tag', {
    string: true,
    describe: 'Specify which tags to be contained.',
    group: 'changelog',
  }).option('verbose', {
    boolean: true,
    default: false,
    describe: 'Contain the unparsed changes.',
    group: 'changelog',
  }).option('token', {
    string: true,
    description: 'A GitHub token for fetching author info.',
    group: 'changelog',
  }).option('dry', {
    alias: 'd',
    boolean: true,
    default: false,
    description: 'Dry run.',
  }).option('yml', {
    boolean: true,
    default: false,
    description: 'Add a workflow file at `.github/workflows/lvr.yml`.',
  }).option('commit', {
    string: true,
    defaultDescription: 'Release {r}',
    description: 'Please refer to README.md.',
  }) .option('tag', {
    string: true,
    description: 'Please refer to README.md.',
  }).option('push', {
    string: true,
    defaultDescription: 'Push both branch and tag.',
    description: 'Either `branch` or `tag`.',
  }).option('main-pkg', {
    string: true,
    description: 'Specify the package release format as `x.x.x`, rather than `abc@x.x.x`.',
  })
  .recommendCommands()
  .help()
  .alias('h', 'help')
  .version(version)
  .alias('v', 'version')
  .argv
