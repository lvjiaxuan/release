import { version } from '../package.json'
import { hideBin } from 'yargs/helpers'
import resolveConfig, { type CliOptions } from './config'
import yargs, { type Argv } from 'yargs'
import main from './main'

void yargs(hideBin(process.argv))
  .scriptName('lvr')
  .command('$0', 'Bump → CHANGELOG → Commit → Tag → Push')
  .command({
    command: 'bump',
    aliases: 'b',
    describe: 'Run bump with `-h` for options',
    builder(yargs) {
      return yargs.option('all', {
        boolean: true,
        default: false,
        describe: 'Bump all packages.',
      }).option('pkg', {
        boolean: true,
        default: false,
        describe: 'Bump specific packages.',
      }).option('prompt', {
        boolean: true,
        default: false,
        describe: 'Prompt for version.',
      })
    },
    handler(args) {
      console.log(args)
    },
  })
  .command({
    command: 'changelog',
    aliases: 'c',
    describe: 'Generate CHANGELOG with all existing tags. Run changelog with `-h` for options.',
    builder(yargs) {
      return yargs.option('tag', {
        string: true,
        describe: 'Specify tags in CHANGELOG.md.',
      }).option('verbose', {
        boolean: true,
        default: false,
        describe: 'CHANGELOG.md would contain more changes which could not be parsed by conventional commits.',
      })
    },
    handler(args) {
      console.log(args)
    },
  })
  .option('yml', {
    boolean: true,
    default: false,
    description: 'Add a workflow file at `.github/workflows/lvr.yml`.',
  })
  .option('token', {
    string: true,
    description: 'Pass GitHub token for fetching author info.',
  })
  .option('commit', {
    string: true,
    defaultDescription: 'Release {r}',
    description: 'Please check README.md for detail.',
  })
  .option('tag', {
    string: true,
    description: 'Please check README.md for detail.',
  })
  .option('push', {
    string: true,
    defaultDescription: 'Push both branch and tag.',
    description: '`branch | tag` are optional.',
  })
  .recommendCommands()
  .help()
  .alias('h', 'help')
  .version(version)
  .alias('v', 'version')
  .argv

// yargs api refers to https://github.com/yargs/yargs/blob/main/docs/api.md
// void yargs(hideBin(process.argv))
//   .scriptName('lvr')
//   .usage( // `[ ... ]` means optional / `< ... >` means required
//     '$0 [options]',
//     '`lvr` equals to `lvr -b -c --commit --tag --push`',
//     args => args as Argv<CliOptions>,
//     async args => main(await resolveConfig(args)),
//   )
//   .option('release', {
//     boolean: true,
//     description: 'Create a release in GitHub Action only.',
//   })
//   .option('dry', {
//     alias: 'd',
//     boolean: true,
//     default: false,
//     description: 'Dry run.',
//   })
//   .option('bump', {
//     alias: 'b',
//     array: true,
//     description: 'Bump version.',
//     defaultDescription: 'For all packages.',
//     group: 'Bump options:',
//   })
//   .option('bump-prompt', {
//     alias: 'p',
//     array: true,
//     description: 'Prompt version.',
//     defaultDescription: 'For all packages.',
//     group: 'Bump options:',
//   })
//   .option('changelog', {
//     alias: 'c',
//     string: true,
//     defaultDescription: 'For all tags.',
//     description: 'Generate Changelog.',
//     group: 'Changelog options:',
//   })
//   .option('verbose-change', {
//     boolean: true,
//     description: 'CHANGELOG.md contains more changes.',
//   })
//   .option('yml', {
//     boolean: true,
//     description: 'Add .github/workflows/changelogithub.yml.',
//   })
//   // These three args are improper to be set default value.
//   // Because of the args from cwd owns highest priority which would overwrite config of files.
//   .option('commit', {
//     string: true,
//     defaultDescription: 'Release {v}',
//     description: 'Customizable commit message which its `{v}` is a version placeholder.',
//   })
//   .option('tag', {
//     string: true,
//     defaultDescription: '`bumpVersion`.',
//     description: 'Tag name.',
//   })
//   .option('push', {
//     string: true,
//     defaultDescription: 'Both branch and tag.',
//     description: 'Push branch and tag which are optional.',
//   })
//   .option('token', {
//     string: true,
//     description: 'A GitHub PAT for fetching author info.',
//   })
//   .help()
//   .alias('h', 'help')
//   .version(version)
//   .alias('v', 'version')
//   .argv
