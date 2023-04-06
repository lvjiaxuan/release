import { bump } from './../src'
import path from 'node:path'
import shell from 'shelljs'

describe.skip('nlx @lvjiaxuan/release --bump', () => {

  const cwd = path.join(__dirname, 'fixtures/monorepo')

  // Mock git metadata which respects Conventional Commits
  beforeAll(() => {
    jest.spyOn(console, 'log').mockReturnValue()
    jest.spyOn(console, 'info').mockReturnValue()
    jest.spyOn(console, 'warn').mockReturnValue()
    jest.spyOn(console, 'error').mockReturnValue()
    shell.cd(cwd)
    shell.exec('git init')
    shell.exec('git commit --allow-empty -m "initial commit"')
  })

  afterAll(() => shell.rm('-rf', '.git'))

  it('--bump=[]', async () => {

    shell.exec('git commit --allow-empty -m "fix: A fix commit."')
    const snap_1 = await bump({ bump: [] })
    expect(snap_1).toMatchInlineSnapshot(`
{
  "bumpVersion": "1.0.2",
  "currentVersion": "1.0.1",
  "packagesResolvePaths": [
    "package.json",
    "packages/bar/package.json",
    "packages/foo/package.json",
  ],
  "unResolvedPkgs": [],
}
`)

    shell.exec('git commit --allow-empty -m "feat: A feat commit."')
    const snap_2 = await bump({ bump: [] })
    expect(snap_2).toMatchInlineSnapshot(`
{
  "bumpVersion": "1.1.0",
  "currentVersion": "1.0.1",
  "packagesResolvePaths": [
    "package.json",
    "packages/bar/package.json",
    "packages/foo/package.json",
  ],
  "unResolvedPkgs": [],
}
`)

    shell.exec('git commit --allow-empty -m "fix!: A breaking fix commit."')
    const snap_3 = await bump({ bump: [] })
    expect(snap_3).toMatchInlineSnapshot(`
{
  "bumpVersion": "2.0.0",
  "currentVersion": "1.0.1",
  "packagesResolvePaths": [
    "package.json",
    "packages/bar/package.json",
    "packages/foo/package.json",
  ],
  "unResolvedPkgs": [],
}
`)
  }, 20000)


  it('--bump=foo fake', async () => {
    shell.exec('git commit --allow-empty -m "fix!: A breaking fix commit."')
    const snap = await bump({ bump: [ 'foo', 'fake' ] })
    expect(snap).toMatchInlineSnapshot(`
{
  "bumpVersion": "2.0.0",
  "currentVersion": "1.0.1",
  "packagesResolvePaths": [
    "package.json",
    "packages/foo/package.json",
  ],
  "unResolvedPkgs": [
    "fake",
  ],
}
`)
  })

  it('--no-bump', async () => {
    // @ts-ignore
    const snap = await bump({ bump: [ 'foo', 'fake' ], noBump: true })
    // eslint-disable-next-line @typescript-eslint/quotes
    expect(snap).toMatchInlineSnapshot(`undefined`)
  })

  it.todo('--bump-prompt')

})
