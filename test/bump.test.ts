import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { $ } from 'execa'
import fs from 'fs-extra'

const fixturesDir = join(__dirname, 'fixtures')
const singleDir = join(fixturesDir, 'singlerepo')
const monoDir = join(fixturesDir, 'monorepo')

const single$ = $({ cwd: singleDir })
const mono$ = $({ cwd: monoDir })

async function clean() {
  await Promise.all([
    fs.remove(join(singleDir, '.git')),
    fs.remove(join(monoDir, '.git')),
    fs.remove(join(singleDir, 'package.json')),
  ])
}

beforeAll(async () => {
  await clean()
  await Promise.all([single$`git init`, mono$`git init`])
})

afterAll(async () => {
  await clean()
})

describe('single repo test', () => {
  it('base', async () => {
    await fs.writeJson(join(singleDir, 'package.json'), {
      name: 'singlerepo',
      version: '1.0.0',
    })

    await single$`git add .`
    await single$`git commit -m ${['feat: empty feat.']}`
    await single$`jiti ./../../../src/cli.ts b`

    const json = (await fs.readJson(join(singleDir, 'package.json'))) as string

    expect(json).toMatchInlineSnapshot(`
      {
        "name": "singlerepo",
        "version": "1.1.0",
      }
    `)
  }, 30 * 1000)
})
