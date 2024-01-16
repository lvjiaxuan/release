import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'
import { $ } from 'execa'
import { setFailed } from '@actions/core'
import type { PublishOption } from '..'

const cwd = process.cwd()

const publishSummaryPath = path.join(cwd, 'pnpm-publish-summary.json')

async function tryReadFile(retryTimes = 3, interval = 100) {
  let countTimes = 0

  async function main() {
    try {
      countTimes++
      return (await fs.readFile(publishSummaryPath)).toString()
    }
    catch (err: any) {
      // eslint-disable-next-line ts/no-unsafe-member-access
      if (err.code === 'ENOENT' && countTimes < retryTimes) {
        await new Promise(r => setTimeout(r, interval))
        return main()
      }

      setFailed(`Fail to read \`pnpm-publish-summary.json\` with ${err}.`)
    }

    return '{publishedPackages:[]}'
  }

  return main()
}

export async function publish(options: PublishOption) {
  const $$ = $({ stdout: process.stdout })

  const publishArgs = [options.recursive ? '-r' : '', '--no-git-checks', '--report-summary'].filter(Boolean)
  await $$`pnpm publish ${publishArgs}`

  if (options.syncCnpm) {
    const summaryStr = await tryReadFile()
    const summaryJson = JSON.parse(summaryStr.toString()) as {
      publishedPackages: {
        name: string
        version: string
      }[]
    }

    const publishedNames = summaryJson.publishedPackages.map(item => item.name)
    if (publishedNames.length) {
      await $$`pnpm i cnpm -g`
      await $$`cnpm sync ${publishedNames.join(' ')} --sync-publish`
    }
  }
}
