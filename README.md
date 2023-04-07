> :boom: Refactoring WIP.

# lvr

<p align=center>Bump and generate CHANGELOG locally.</p>

![actions](https://github.com/lvjiaxuan/release/actions/workflows/release.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/lvr)](https://www.npmjs.com/package/lvr)

## Feature

1. Bump the specified packages within a monorepo, while placing only one CHANGELOG.md which respects the entire monorepo at the root.
2. Generate CHANGELOG.md within a specified version range.
3. Using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) by default.

## Say sth.

In my release flow, there are some steps in order such as:
1. perform some tests.
2. Bump version.
3. Generate CHANGELOG.md file.
4. Commit / Tag.
5. Push to origin.
6. Trigger CI workflow that involves tests / build / release / publish stuff which are depended on.

More:
1. I want to only an one script to finish releasing, rather than such as an additional `git pull` manually.
2. I don't want to network fetching locally(like GitHub Rest API / npm publish, .etc), while in CI env is more efficient.
3. Perform the heavy jobs like compile / build on CI is more efficient.

As mentioned above, I have put the bump job and CHANGELOG generation on the local environment, eliminating the need for an additional `git pull`. This tool also supports for the release to be sent along with the notes from the previously generated CHANGELOG. Moreover, let's take advantage of CI workflow as much as possible to do other heavy job.

> The testing job should be performed at the very beginning. Until now, I haven't found a better way to deal with it.

## Usage

Quick trial.
```sh
# One script to release, including Bump\CHANGELOG\commit\tag\push
npx lvr

# Support the dry run to confirm what will be executed.
npx lvr -d
```

Install on global.
```sh
npm i lvr -g
```

More CLI options.
```sh
lvr -h
```

### Bump

Powered by [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [semver](https://github.com/npm/node-semver). Using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) preset by default.


```sh
# Bump root's package.json version.
# In a detected monorepo, it would bump those packages which are changed.
lvr bump

# In a detected monorepo, it would bump all packages.
lvr bump --all

# In a detected monorepo, `--pkg` prompts which packages to be bumped.
lvr bump --pkg

# Bump by the specified semver increment level rather than depending on conventional-recommended-bump.
lvr bump --major
lvr bump --major --all
lvr bump --major --pkg
```
Semver increment level support:
- `--major`: Bump as a semver-major version.
- `--minor`: Bump as a semver-minor version.
- `--patch`: Bump as a semver-patch version.
- `--premajor`: Bump as a semver-premajor version, can set id with string.
- `--preminor`: Bump as a semver-preminor version, can set id with string.
- `--prepatch`: Bump as a semver-prepatch version, can set id with string.
- `--prerelease`: Bump as a semver-prerelease version, can set id with string.

**Absolutely, these `bump` options can be used without the `bump` command during a release. The following `changelog` is the same.**

> **Note**
> 
> In a monorepo, maybe no need to specify *package.json#version*. However, if there is actually a version field present, "bump" would calculate this root package.json when bumping the version.

### Changelog

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

```sh
# Generate CHANGELOG with all existing tags.
lvr changelog

# Within a tag range.
lvr changelog --tag=v1.0.1...v2.1.3

# For 2 last tag.
lvr changelog --tag==2

# For a specified tag.
lvr changelog --tag=v0.0.2

# It means that CHANGELOG.md would contain more changes which were not be parsed by conventional commits.
# Disable by default.
lvr changelog --verbose
```

#### About author

To generate valid author GitHub name in the CHANGELOG.md as same as release note, I have request the GitHub Rest API to search it. However, it is advised that the API has a [rate limit](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) for IP.

To solve this, I have to pass a GitHub PAT by `--token` when encountering this situation 😔.

Alternatively, you can use [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the `.env.local` which should be included in the `.gitignore` .

### Commit / Tag / Push

Enable `--commit` `--tag` `--push` by default when enable bump and changelog meanwhile. (opt-out by `--no-push`, etc.)

> `--no-changelog` is considered to enable these git jobs in the same way, while `--no-bump` makes no sense to the further step.

```sh
# Use `Release {n}` as commit message by default.
# The `{n}` would be replaced by the bumped version from package.json.
# In a monorepo, the `{n}` is likely `a@x.x.x,b@y.y.y` by default.
# Customizable.
lvr --commit="R: {v}"

# Use bumped version from package.json by default.
# In a monorepo, it is likely `a@x.x.x,b@y.y.y` by default.
# Customizable.
lvr --tag=BatMan

# Push current branch and new tag by default.
lvr --push

# Push current branch only.
lvr --push=branch

# Push new tag only
lvr --push=tag
```

> **Note**
> It is not recommended to release more than one package at the same time in order to ensure a concise commit message and tag name.

#### Set a main package for a monorepo

```sh
lvr --main-pkg=abc
```

In a monorepo, it can specify the package release format as `x.x.x`, rather than `abc@x.x.x`.

### Send a GitHub Release on *GitHub Action*

See [yml.ts](./src/options/yml.ts).

```sh
# Add .github/workflows/lvr.yml
lvr --yml
```

## Configuration

See [src/config.ts](./src/config.ts).

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd which has highest priority. You can use either `lv.release.json`, `lv.release.{ts,js,mjs,cjs}`, `.lv.releaserc` or use the `lv.release` field in package.json.
