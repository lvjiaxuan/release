import { promises as fsp } from 'node:fs'
import pc from 'picocolors'

export const addYml = async (isDry?: boolean) => {
  const yml = `name: Release

on:
  push:
    tags:
      - '*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 16.x

      - run: npx lvr --release
        env:
          GITHUB_TOKEN: \${{secrets.GITHUB_TOKEN}}`


  if (isDry) {
    console.log(yml)
    return
  }


  await fsp.mkdir('.github/workflows/', { recursive: true })
  await fsp.writeFile('.github/workflows/lvr.yml', yml, { encoding: 'utf-8' })

  console.log(pc.green('Added .github/workflows/lvr-release.yml.'))
}
