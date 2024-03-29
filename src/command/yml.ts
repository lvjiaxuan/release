import { promises as fsp } from 'node:fs'
import pc from 'picocolors'

export async function addYml(dryRun?: boolean) {
  const yml = `name: Release and Publish

on:
  push:
    tags:
      - v*

jobs:
  release:
    permissions:
      # Allow to create a release.
      contents: write
      # Fetch an OpenID Connect token.
      id-token: write
    uses: lvjiaxuan/github-action-templates/.github/workflows/lvr-release.yml@main
    secrets: inherit

  publish:
    uses: lvjiaxuan/github-action-templates/.github/workflows/pnpm-ni.yml@main
    with:
      install: true
      run_script: pnpm -r publish --access public --no-git-checks
    secrets: inherit

  cnpm_sync:
    needs: publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm install -g cnpm

      - run: cnpm sync @lvjiaxuan/eslint-config --sync-publish
`

  if (dryRun) {
    console.log(yml)
    return
  }

  await fsp.mkdir('.github/workflows/', { recursive: true })
  await fsp.writeFile('.github/workflows/lvr.yml', yml, { encoding: 'utf-8' })

  console.log(pc.green('Added .github/workflows/lvr.yml.'))
}
