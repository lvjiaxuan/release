import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'
import { $ } from 'execa'
import { info } from '@actions/core'
import p from 'picocolors'
import type { PublishOption } from '..'

const cwd = process.cwd()

export async function publish(options: PublishOption) {
  const $$ = $({ stdio: 'inherit' })

  info(p.blue('pnpm publish -r --report-summary --no-git-checks'))
  await $$`pnpm publish -r --report-summary --no-git-checks`

  if (options.syncCnpm) {
    const summaryStr = await fs.readFile(path.join(cwd, 'pnpm-publish-summary.json'))
    const summaryJson = JSON.parse(summaryStr.toString()) as {
      publishedPackages: {
        name: string
        version: string
      }[]
    }

    const publishedNames = summaryJson.publishedPackages.map(item => item.name)
    if (publishedNames.length) {
      info(p.blue('pnpm i cnpm -g'))
      await $$`pnpm i cnpm -g`
      info(p.blue(`cnpm sync ${publishedNames.join(' ')} --sync-publish`))
      await $$`cnpm sync ${publishedNames.join(' ')} --sync-publish`
    }
  }
}
