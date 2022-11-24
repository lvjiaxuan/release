import { getBumpType } from './../src'
import shell from 'shelljs'

describe.skip('nx @lvjiaxuan/release --bump', () => {

  // Mock git metadata which respects Conventional Commits
  beforeAll(() => {
    shell.cd('test/fixtures/monorepo')
    shell.rm('-rf', '.git')
    shell.exec('git init')
    shell.exec('git config commit.gpgSignt false')
    shell.exec('git config core.autocrlf false')
    shell.exec('git commit --allow-empty -m "initial commit"')
  })

  afterAll(() => {
    // shell.cd('test/fixtures/monorepo')
    shell.rm('-rf', '.git')
  })

  it('getBumpType test', async () => {
    shell.exec('git commit --allow-empty -m "fix: A breaking fix commit."')
    const version_1 = await getBumpType()
    expect(version_1).toBe('patch')

    shell.exec('git commit --allow-empty -m "feat: A feature commit."')
    const version_2 = await getBumpType()
    expect(version_2).toBe('minor')

    shell.exec('git commit --allow-empty -m "chore!: A chore with breaking commit."')
    const version_3 = await getBumpType()
    expect(version_3).toBe('major')
  }, 10000)

})
