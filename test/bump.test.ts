import { bump } from './../src'
import shell from 'shelljs'

describe('nx @lvjiaxuan/release --bump', () => {

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
    const snap_1 = await bump({ bump: [] })
    expect(JSON.stringify(snap_1)).toMatchInlineSnapshot('"{"bumpVersion":"1.0.2","packagesResolvePaths":["package.json","packages/bar/package.json","packages/foo/package.json"]}"')

    // shell.exec('git commit --allow-empty -m "feat: A feature commit."')
    // const {
    //   bumpVersion: bumpVersion_2,
    //   packagesResolvePaths: packagesResolvePaths_2,
    // } = await bump({ bump: [] })
    // expect({ bumpVersion_2, packagesResolvePaths_2 }).toMatchInlineSnapshot()

    // shell.exec('git commit --allow-empty -m "chore!: A chore with breaking commit."')
    // const {
    //   bumpVersion: bumpVersion_3,
    //   packagesResolvePaths: packagesResolvePaths_3,
    // } = await bump({ bump: [] })
    // expect({ bumpVersion_3, packagesResolvePaths_3 }).toMatchInlineSnapshot()
  }, 10000)

})
