import pc from 'picocolors'
import type { CliOptions, MarkdownOptions } from './index'
import { bump, changelog, execCMD } from './index'
import { promises as fsp } from 'node:fs'

async function addYml(isAdd: boolean) {

  if (!isAdd) {
    return
  }

  const yml = `name: Release by Changelogithub

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
        with:
          node-version: 16.x

      - run: npx changelogithub # or changelogithub@0.12 if ensure the stable result
        env:
          GITHUB_TOKEN: \${{secrets.GITHUB_TOKEN}}
`
  await fsp.mkdir('.github/workflows/', { recursive: true })
  await fsp.writeFile('.github/workflows/changelogithub.yml', yml, { encoding: 'utf-8' })

  console.log('.github/workflows/changelogithub.yml added.')
}

async function execGitJobs(options: Pick<CliOptions, 'commit' | 'tag' | 'push' | 'noCommit' | 'noTag' | 'noPush' | 'dry'>, bumpVersion: string) {

  const { dry } = options

  console.log()
  if (!options.noCommit) {
    options.commit = options.commit!.replace('{v}', 'v' + bumpVersion)
    console.log('git add .')
    !dry && await execCMD('git', [ 'add', '.' ])
    console.log(`git commit -m ${ options.commit }`)
    !dry && await execCMD('git', [ 'commit', '-m', options.commit ])

    if (!options.noTag) {
      const tagName = options.tag ? options.tag : 'v' + bumpVersion
      console.log(`git tag ${ tagName }`)
      !dry && await execCMD('git', [ 'tag', tagName ])
    } else {
      console.log('Skip Tag.')
    }

    if (!options.noPush) {
      if (options.push !== 'tag') {
        console.log('git push')
        !dry && await execCMD('git', [ 'push' ])
      }

      if (options.push !== 'branch') {
        console.log('git push --tags')
        !dry && await execCMD('git', [ 'push', '--tags' ])
      }
    } else {
      console.log('Skip Push.')
    }
  } else {
    console.log('Skip Commit/Tag/Push.')
  }
}


export default async (options: CliOptions & MarkdownOptions) => {
  try {
    options.dry && console.log(pc.bold(pc.blue('Dry run.\n')))

    let bumpResult: Awaited<ReturnType<typeof bump>>
    let changelogResult: Awaited<ReturnType<typeof changelog>>

    if (options.yml) {
      void addYml(true)
    }

    if (Object.hasOwn(options, 'bump') && !Object.hasOwn(options, 'changelog')) {
      // bump only. CliOptions
      console.log('Bump only.')
      bumpResult = await bump(options)
    } else if (!Object.hasOwn(options, 'bump') && Object.hasOwn(options, 'changelog')) {
      // changelog only. CliOptions & MarkdownOptions
      console.log('Changelog only.')
      changelogResult = await changelog(options)
    } else {
      // both
      options.bump = []
      options.changelog = ''
      bumpResult = await bump(options)
      changelogResult = await changelog(options, bumpResult?.bumpVersion)
    }

    if (bumpResult) {
      console.log('\nBump result:', JSON.stringify(bumpResult, null, 2))
    }

    if (changelogResult) {
      // bumpResult && tag
      console.log('\nChangelog result:', changelogResult.md.slice(13, 42))
    }

    if (bumpResult) {
      await execGitJobs(options, bumpResult.bumpVersion)
    }

    options.dry && console.log(pc.bold(pc.blue('\nDry run.\n')))

    process.exit(0)
  } catch (error) {
    console.log(`\n${ pc.bgRed('ERROR!') } Please check it.\n`)
    console.log(error)
    console.log('\noptions: ', options)
    process.exit(1)
  }
}
