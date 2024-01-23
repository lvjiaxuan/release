import process from 'node:process'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { $ } from 'execa'
import fs from 'fs-extra'

const fixturesDir = join(__dirname, 'fixtures')
const singleDir = join(fixturesDir, 'singlerepo')
const monoDir = join(fixturesDir, 'monorepo')

const single$ = $({ cwd: singleDir })
const mono$ = $({ cwd: monoDir })

beforeAll(async () => {

  const singleInit = async () => {
    await fs.remove(join(singleDir, '.git')),
    await single$`git init`
  }

  const monoInit = async () => {
    await fs.remove(join(monoDir, '.git')),
    await mono$`git init`
  }

  await Promise.all([singleInit(), monoInit()])
})

afterAll(async () => {
  await Promise.all([
    fs.remove(join(singleDir, '.git')),
    fs.remove(join(monoDir, '.git')),
  ])
})

it('single test',async () => {
  await fs.writeJson(join(singleDir, 'package.json'), {
    name: 'singlerepo',
    version: '1.0.0',
  })

  expect(1).equals(1)
}, 10 * 1000)