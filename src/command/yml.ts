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
      contents: write
      id-token: write
    uses: lvjiaxuan/github-action-templates/.github/workflows/lvr-release.yml@main
    secrets: inherit

  publish:
    uses: lvjiaxuan/github-action-templates/.github/workflows/lvr-publish.yml@main
    with:
      sync_cnpm: true
    secrets: inherit`

  if (dryRun) {
    console.log(yml)
    return
  }

  await fsp.mkdir('.github/workflows/', { recursive: true })
  await fsp.writeFile('.github/workflows/lvr.yml', yml, { encoding: 'utf-8' })

  console.log(pc.green('Added .github/workflows/lvr.yml.'))
}
