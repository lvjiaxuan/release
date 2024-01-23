import fs from 'node:fs'
import process from 'node:process'
import fg from 'fast-glob'
import { $ } from 'execa'

export const $$ = $({ stdio: 'inherit' })

export const packages = (() => {
  const _ = fg.sync('**/package.json', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/public/**',
      '**/test/**',
    ],
    cwd: process.cwd(),
    onlyFiles: true,
  })
  if (_.includes('package.json')) {
    const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf-8')) as { version?: string }
    if (!pkgJson.version)
      return _.filter(i => i !== 'package.json')
  }

  return _
})()

export const isMonorepo = packages.length > 1
