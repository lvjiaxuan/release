import pc from 'picocolors'
import fg from 'fast-glob'

export const log = (...args: string[]) => console.log(...args.map(i => `${ pc.cyan(i) }`))

export const cwd = process.cwd()

export const packages = fg.sync('**/package.json', {
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/public/**',
    '**/test/**',
  ],
  cwd,
  onlyFiles: true,
})

export const isMonorepo = packages.length > 1
