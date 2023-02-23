import { promises as fsp } from 'node:fs'

export const addYml = async (isAdd: boolean) => {

  if (!isAdd) {
    return
  }

  const yml = `name: Release

on:
  push:
    tags:
      - 'v*'

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
          GITHUB_TOKEN: \${{secrets.GITHUB_TOKEN}}
`
  await fsp.mkdir('.github/workflows/', { recursive: true })
  await fsp.writeFile('.github/workflows/lvr-release.yml', yml, { encoding: 'utf-8' })

  console.log('.github/workflows/lvr-release.yml added.')
}
