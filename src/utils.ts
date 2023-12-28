import fs from 'node:fs'
import process from 'node:process'
import pc from 'picocolors'
import fg from 'fast-glob'

// export const log = (...args: string[]) => console.log(...args.map(i => `${ pc.cyan(i) }`))

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

export function colorizeVersionDiff(from: string, to: string, hightlightRange = true) {
  let leadingWildcard = ''
  let fromLeadingWildcard = ''

  // separate out leading ^ or ~
  if (/^[~^]/.test(to)) {
    leadingWildcard = to[0]
    to = to.slice(1)
  }
  if (/^[~^]/.test(from)) {
    fromLeadingWildcard = from[0]
    from = from.slice(1)
  }

  // split into parts
  const partsToColor = to.split('.')
  const partsToCompare = from.split('.')

  let i = partsToColor.findIndex((part, i) => part !== partsToCompare[i])
  i = i >= 0 ? i : partsToColor.length

  // major = red ~~(or any change before 1.0.0)~~
  // minor = cyan
  // patch = green
  const color = i === 0
    ? 'red'
    : i === 1
      ? 'cyan'
      : 'green'

  // if we are colorizing only part of the word, add a dot in the middle
  const middot = i > 0 && i < partsToColor.length ? '.' : ''

  const leadingColor = leadingWildcard === fromLeadingWildcard || !hightlightRange
    ? 'gray'
    : 'yellow'

  return pc[leadingColor](leadingWildcard)
    + partsToColor.slice(0, i).join('.')
    + middot
    + pc[color](partsToColor.slice(i).join('.')).trim()
}
