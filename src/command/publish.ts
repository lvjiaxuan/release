import process from 'node:process'
import path from 'node:path'
import fsp from 'node:fs/promises'
import p from 'picocolors'
import { info, setOutput } from '@actions/core'
import type { PublishOption } from '..'
import { $$ } from '..'

export async function publish(options: PublishOption) {
  const cwd = process.cwd()

  const isWorkspace = await (async () => {
    try {
      await fsp.access(path.join(cwd, 'pnpm-workspace.yaml'), fsp.constants.F_OK)
      return true
    }
    catch {}
    return false
  })()

  setOutput('isWorkspace', isWorkspace)

  const publishArgs = ['--no-git-checks']
  if (isWorkspace) {
    publishArgs.unshift('--report-summary')
    publishArgs.unshift('-r')
  }

  info(p.blue(`pnpm publish ${publishArgs.join(' ')}\n`))
  await $$`pnpm publish ${publishArgs}`

  if (options.syncCnpm) {
    let publishedNames: string[] = []

    if (isWorkspace) {
      const summaryJson = JSON.parse(
        await fsp.readFile(path.join(cwd, 'pnpm-publish-summary.json'), 'utf-8'),
      ) as {
        publishedPackages: {
          name: string
          version: string
        }[]
      }

      publishedNames = summaryJson.publishedPackages.map(item => item.name)
    }
    else {
      const pkgJson = JSON.parse(
        await fsp.readFile(path.join(cwd, 'package.json'), 'utf-8'),
      ) as { name: string }

      publishedNames = [pkgJson.name]
    }

    info(p.blue('pnpm i cnpm -g\n'))
    await $$`pnpm i cnpm -g`

    info(p.blue(`cnpm sync ${publishedNames.join(' ')} --sync-publish\n`))
    await $$`cnpm sync ${publishedNames.join(' ')} --sync-publish`
  }
}
