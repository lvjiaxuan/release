import { hideBin } from 'yargs/helpers'
import yargs, { type Argv } from 'yargs'
import pc from 'picocolors'
import { version } from '../package.json'
import type { AllOption } from '.'
import { addYml, bump, changelog, lvr, resolveConfig, sendRelease } from '.'

// yargs api refers to https://github.com/yargs/yargs/blob/main/docs/api.md
void yargs(hideBin(process.argv))
  .scriptName('lvr')
  .usage(
    '$0 [options]',
    'Bump → CHANGELOG → Commit → Tag → Push',
    yargs => yargs as Argv<Partial<AllOption>>,
    async (args) => {
      args.dry && console.log(pc.bgCyan('Dry run\n'))
      console.log(`lvr version ${version}\n`)
      console.log(pc.cyan('Bump → CHANGELOG → Commit → Tag → Push'))
      // @ts-expect-error
      await lvr(await resolveConfig(args))
      args.dry && console.log(pc.bgCyan('\nDry run'))
    },
  ).command({
    command: 'bump [options]',
    aliases: 'b',
    describe: 'Bump only.',
    builder: y => y,
    handler: async (args) => {
      args.dry && console.log(pc.bgCyan('Dry run\n'))
      console.log(`lvr version ${version}\n`)
      console.log(pc.cyan('Run bump command.'))
      // @ts-expect-error
      await bump(await resolveConfig(args))
      args.dry && console.log(pc.bgCyan('\nDry run'))
    },
  }).command({
    command: 'changelog [options]',
    aliases: 'c',
    describe: 'Generate CHANGELOG only.',
    builder: y => y,
    handler: async (args) => {
      args.dry && console.log(pc.bgCyan('Dry run\n'))
      console.log(`lvr version ${version}\n`)
      console.log(pc.cyan('Run CHANGELOG command.'))
      // @ts-expect-error
      await changelog(await resolveConfig(args))
      args.dry && console.log(pc.bgCyan('\nDry run'))
    },
  }).command({
    command: 'yml',
    describe: 'Add a workflow file at `.github/workflows/lvr.yml`.',
    builder: y => y,
    handler: async (args) => {
      args.dry && console.log(pc.bgCyan('Dry run\n'))
      console.log(`lvr version ${version}\n`)
      await addYml(args.dry as boolean)
      args.dry && console.log(pc.bgCyan('\nDry run'))
    },
  }).command({
    command: 'release',
    describe: 'Create a new release on CI environment.',
    builder: y => y,
    handler: async () => {
      console.log(`lvr version ${version}\n`)
      await sendRelease()
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
  }).option('commit', {
    string: true,
    defaultDescription: 'Release {r}',
    description: 'Please refer to README.md.',
  }).option('tag', {
    string: true,
    default: '',
    description: 'Please refer to README.md.',
  }).option('push', {
    string: true,
    default: '',
    description: 'Please refer to README.md.',
  }).option('main-pkg', {
    boolean: true,
    description: 'Specify the package release format as `x.x.x` instead of `abc@x.x.x`.',
  })
  .recommendCommands()
  .help()
  .alias('h', 'help')
  .version('v', `Show version - \`${version}\``, version)
  .argv
