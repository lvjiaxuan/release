import { version } from '../package.json'
import { hideBin } from 'yargs/helpers'
import yargs, { type Argv, type CommandModule } from 'yargs'
import type { AllOption, BumpOption, ChangelogOption, CliOption } from './'
import { bump, resolveConfig } from './'
import pc from 'picocolors'

// yargs api refers to https://github.com/yargs/yargs/blob/main/docs/api.md
void yargs(hideBin(process.argv))
  .scriptName('lvr')
  .usage(
    '$0 [options]',
    'Bump → CHANGELOG → Commit → Tag → Push',
    yargs => yargs satisfies Argv<Partial<AllOption>>,
    args => {
      console.log(pc.cyan('Run release command.'))
      // ...
    },
  ).command({
    command: 'bump [options]',
    aliases: 'b',
    describe: 'Bump only.',
    builder: y => y,
    handler: async args => {
      console.log(pc.cyan('Run bump command.'))
      // @ts-ignore
      void bump(await resolveConfig(args))
    },
  }).command({
    command: 'changelog [options]',
    aliases: 'c',
    describe: 'Generate CHANGELOG only.',
    builder: y => y,
    handler(args) {
      console.log(pc.cyan('Run CHANGELOG command.'))
      // console.log(3, args)
    },
  }).option('all', {
    boolean: true,
    describe: 'Bump for all packages.',
    group: 'Bump:',
  }).option('pkg', {
    boolean: true,
    describe: 'Bump for the specified packages by prompts.',
    group: 'Bump:',
  }).option('major', {
    boolean: true,
    describe: 'Bump as a semver-major version.',
    group: 'Bump:',
  }).option('minor', {
    boolean: true,
    describe: 'Bump as a semver-minor version.',
    group: 'Bump:',
  }).option('patch', {
    boolean: true,
    describe: 'Bump as a semver-patch version.',
    group: 'Bump:',
  }).option('premajor', {
    string: true,
    describe: 'Bump as a semver-premajor version, can set id with string.',
    group: 'Bump:',
  }).option('preminor', {
    string: true,
    describe: 'Bump as a semver-preminor version, can set id with string.',
    group: 'Bump:',
  }).option('prepatch', {
    string: true,
    describe: 'Bump as a semver-prepatch version, can set id with string.',
    group: 'Bump:',
  }).option('prerelease', {
    string: true,
    describe: 'Bump as a semver-prerelease version, can set id with string.',
    group: 'Bump:',
  }).option('tag', {
    string: true,
    describe: 'Specify which tags to be contained.',
    group: 'CHANGELOG:',
  }).option('verbose', {
    boolean: true,
    describe: 'Contain the unparsed changes.',
    group: 'CHANGELOG:',
  }).option('token', {
    string: true,
    description: 'A GitHub token for fetching author info.',
    group: 'CHANGELOG:',
  }).option('dry', {
    alias: 'd',
    boolean: true,
    description: 'Dry run.',
  }).option('yml', {
    boolean: true,
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
    description: 'branch | tag.',
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
