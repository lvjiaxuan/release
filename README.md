# lvr

<p align=center>Help me better to bump and generate changelog before github release in CI.</p>

## Say sth.

In my release flow, there are some steps such as:
1. (optional) Do a test firstly.
2. Bump.
3. Generate Changelog.
3. Commit / Tag.
4. Push origin.
5. Trigger CI jobs like github release(always) and publish stuff(depends).

Network IO is not my expectation, so this tool is meant to bump and generate changelog in local by my favorite way, rather than requesting a github release or GitHub REST API stuff directly😂.

## Usage

> First off: `npm i @antfu/ni -g`

Quick trial:
```bash
# as well as `nx lvr --bump --changelog`
nx lvr
```

Globally use. Installation:
```bash
pnpm i lvr -g
npm i lvr -g
```

More CLI options:
```bash
lvr -h
```

### Bump

Powered by [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump).

CLI Arguments:
- `--bump`, `-b` in short.
- `--bump-prompt`, `-p` in short.

```bash
# Bump root package.json version. If project is detected as a monorepo, it would synchronize root version to other package.json in subdirectories.
lvr -b

# In a detected Monorepo, it would bump specified package.json version in subdirectories.
lvr -b=pkg-a pkg-b

# Prompt version rather than basing on git metadata.
lvr -p
lvr -p=pkg-a pkg-b
```

> **Note**
> 
> Root's **package.json** is always included, which means it would keep latest version among its packages.

> TODO
> - [ ] **Pre-Release** powered by [semver](https://github.com/npm/node-semver).

### Changelog

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

CLI Arguments:
- `--changelog`, `-c` in short.

```bash
# Generate changelog for all tag.
lvr -c # lvr --changelog

# Generate changelog for tag range.
lvr -c=v1.0.1...v2.1.3
# For 2 latest tag.
lvr -c=2

# Generate for specified tag.
lvr -c=v0.0.2

# Generatec for latest tag only, which its notes is used to Release notes.
lvr -c=latest
```

### GitHub Release

Using [antfu/changelogithub](https://github.com/antfu/changelogithub).

```bash
# Add .github/workflows/changelogithub.yml
lvr --yml
```

## Configuration

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd. You can use either `lv.release.json`, `lv.release.{ts,js,mjs,cjs}`, `.lv.releaserc` or use the `lv.release` field in package.json.

<!-- eslint-skip -->
```ts
export type CliOptions = {
  /**
   * Dry run.
   *
   * @default false
   */
  dry?: boolean

  /**
   * Bump root package.json version. If is a monorepo, it would synchronize root version to other package.json in subdirectories.
   *
   * @default []
   */
  bump?: string[]

  /**
   * Prompt version rather than basing on git metadata.
   *
   * @default []
   */
  bumpPrompt?: string[]

  /**
   * Disable bump
   *
   * @default false
   */
  noBump?: boolean

  /**
   * Generate changelog for all tag.
   *
   * @default ''
   */
  changelog?: string

  /**
   * Disable generate Changelog
   *
   * @default false
   */
  noChangelog?: boolean

  /**
   * Add .github/workflows/changelogithub.yml
   *
   * @default false
   */
  yml?: boolean
}

export type MarkdownOptions = {
  /**
   * **Optional**
   * PAT is used for requesting author GitHub Link for more detailed changelog.
   */
  token?: string

  /**
   * **Optional**
   * Resolved by `git config --get remote.origin.url'` automatically for more detailed changelog.
   */
  github?: string

  types: Record<string, {
    title: string
  }>

  titles: {
    breakingChanges: string
    unParsedChanges: string
  }
}

export const MarkdownConfigDefaults: MarkdownOptions = {
  types: {
    feat: { title: '✨ Enhancements' },
    perf: { title: '⚡️ Performance' },
    fix: { title: '🐛 Fixes' },
    // refactor: { title: '♻️ Refactors' },
    docs: { title: '📝 Documentation' },
    // build: { title: '📦️ Build' },
    // chore: { title: '🧱 Chore' },
    // test: { title: '✅ Tests' },
    // style: { title: '🎨 Styles' },
    // ci: { title: '🤖 CI' },
    // release: { title: '🔖 Release' },
    // WIP: { title: '🚧 Work in Progress' },
  },
  titles: {
    breakingChanges: '🚨 Breaking Changes',
    unParsedChanges: '💥 Un-Parsed Changes',
  },
}
```

## Credit

- https://github.com/unjs/changelogen
- https://github.com/antfu/changelogithub
