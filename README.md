# lvr

<p align=center>Help me better to bump and generate changelog.</p>

## Say sth.

In my release flow, there are some steps in order such as:
1. (optional) Do a test .
2. Bump.
3. Generate changelog.
3. Commit / Tag.
4. Push origin.
5. Trigger CI jobs like github release or publish stuff which are depended.

Network IO is not my expectation, so this tool is meant to bump and generate changelog in local by my favorite path, instead of requesting a github release or other GitHub REST API stuff directly😂.

## Usage

> First off: `npm i @antfu/ni -g`

Quick trial:
```bash
# as well as `nx lvr --bump --changelog --commit --tag --push``
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

### Bump only

Powered by [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump).

CLI Arguments:
- `--bump`, `-b` in short.
- `--bumpPrompt`, `-p` in short.

```bash
# Bump root package.json version. If project is detected as a monorepo, it would synchronize root version to other package.json in subdirectories.
lvr -b

# In a detected Monorepo, it would bump specified package.json version in subdirectories.
lvr -b=pkg-a pkg-b

# Prompt version rather than basing on git metadata by default.
lvr -p
lvr -p=pkg-a pkg-b
```

> **Note**
> 
> Root's **package.json** is always included, which means it would keep latest version from its packages.

> TODO
> - [ ] **Pre-id** powered by [semver](https://github.com/npm/node-semver).

### Changelog only

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

CLI Arguments:
- `--changelog`, `-c` in short.

```bash
# Generate changelog for all tags.
lvr -c # lvr --changelog

# For a tag range.
lvr -c=v1.0.1...v2.1.3

# For 2 latest tag.
lvr -c=2

# For a specified tag.
lvr -c=v0.0.2

# Generatec for latest tag only, which its notes is used to Release notes.
lvr -c=latest
```

### Commit / Tag / Push

Enable `--commit` `--tag` `--push` by default. (opt-out by `--noPush`, etc.)

```bash
# Use `Release {v}` as commit message by default.
# The `{v}` would be replaced by `bumpVersion`.
lvr --commit="R: {v}"

# Use `bumpVersion` by default.
# Customizable.
lvr --tag=BatMan

# Push current branch and new tag by default.
lvr --push

# Push current branch only.
lvr --push=branch

# Push new tag only
lvr --push=tag
```

### GitHub Release by *GitHub Action*

Using [antfu/changelogithub](https://github.com/antfu/changelogithub).

```bash
# Add .github/workflows/changelogithub.yml
lvr --yml
```

## Configuration

Check [src/config.ts](./src/config.ts).

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd. You can use either `lv.release.json`, `lv.release.{ts,js,mjs,cjs}`, `.lv.releaserc` or use the `lv.release` field in package.json.

## Credits

- [changelogen](https://github.com/unjs/changelogen)
- [changelogithub](https://github.com/antfu/changelogithub)

---

# TODO

- [ ] Do a confirm before acting.
- [ ] Beautify terminal output.