# @lvjiaxuan/release

<p align=center>Help me better to bump and generate changelog before github release in CI.</p>

## Say sth.

In my release flow, there are steps such as:
1. (optional) Do a test firstly.
2. Bump.
3. Changelog generate.
3. Commit / Tag.
4. Push origin.
5. Trigger CI jobs like github release(always) and publish stuff(depends).

So this tool is meant to bump and generate changelog with my favorite path, rather than making a github release directly😂.

## Usage

> Recommended first: `npm i @antfu/ni -g`

Basic:
```bash
nx @lvjiaxuan/release
# as well as `nx @lvjiaxuan/release --bump --changelog`
```

### Bump

Bump version which comes from [changelogen](https://github.dev/unjs/changelogen).

```bash
# Bump root package.json version. If is a monorepo, it would synchronize root version to other package.json in subdirectories.
nx @lvjiaxuan/release --bump

# For Monorepo, it would bump specified package.json version in subdirectories.
nx @lvjiaxuan/release --bump=pkg-a pkg-b

# Prompt version rather than basing on git metadata.
nx @lvjiaxuan/release --bump-prompt
nx @lvjiaxuan/release --bump-prompt=root pkg-a pkg-b
```

> TODO:
> - [ ] **Pre-Release** powered by [semver](https://github.com/npm/node-semver).

### Changelog

Powered by [antfu/changelogithub](https://github1s.com/antfu/changelogithub).

```bash
# Generate changelog for all tag.
nx @lvjiaxuan/release --changelog

# Generate changelog for tag range.
nx @lvjiaxuan/release --changelog=v1.0.1...v2.1.3
# For 2 latest tag.
nx @lvjiaxuan/release --changelog=2

# Generate changelog for latest tag only, which its notes is used to Release notes.
nx @lvjiaxuan/release --changelog=latest
```

### Add my `CI.yml`

```bash
nx @lvjiaxuan/release --add-ci_yml.
```

## Configuration

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd. You can use either `lv.release.json`, `lv.release.{ts,js,mjs,cjs}`, `.lv.releaserc` or use the `lv.release` field in package.json.

<!-- eslint-skip -->
```ts
// ...
```
## Refer

- https://github.dev/conventional-changelog/standard-version
- https://github.dev/unjs/changelogen
- https://github.dev/antfu/changelogithub
- https://github.dev/antfu/taze