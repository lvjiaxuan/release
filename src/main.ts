import pc from 'picocolors'
import type { CliOptions, MarkdownOptions } from './index'
import { bump, changelog } from './index'
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


export default async (options: CliOptions & MarkdownOptions) => {
  try {

    options.dry && console.log(pc.bold(pc.blue('Dry run.\n')))

    const [ bumpResult, changelogResult ] = await Promise.all([
      bump(options), // CliOptions
      changelog(options), // CliOptions & MarkdownOptions
      addYml(options.yml!),
    ])

    if (!options.noBump) {
      console.log()
      console.log('Bump result: ', JSON.stringify(bumpResult, null, 2))
    }

    if (!options.noChangelog) {
      console.log()
      console.log(changelogResult?.md.slice(12, 50))
    }

    process.exit(0)
  } catch (error) {
    console.log(`\n${ pc.bgRed('ERROR!') } Please check it.\n`)
    console.log(error)
    console.log('\noptions: ', options)
    process.exit(1)
  }
}
