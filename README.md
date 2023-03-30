> :warning: It has some confusions in how to release a monorepo. For now, it doesn't make sense to bump the version for a few of specific package within a monorepo. However, I will figure it out at a later time.

# lvr

<p align=center>Bump and generate CHANGELOG on local.</p>

![actions](https://github.com/lvjiaxuan/release/actions/workflows/release.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/lvr)](https://www.npmjs.com/package/lvr)

## Feature

1. Bump specific packages within a monorepo, while placing only one CHANGELOG.md for the entire monorepo at the root.
2. Generate CHANGELOG.md within a specific version range.
3. Using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) by default.

## Say sth.

In my release flow, there are some steps in order such as:
1. perform some tests.
2. Bump version.
3. Generate CHANGELOG.md file.
3. Commit / Tag.
4. Push to origin.
5. Trigger CI workflow that involves build/release/publish stuff which are depended on.

More:
1. I want to only an one script to finish releasing, rather than such as an additional `git pull` manually.
2. I don't want to network fetching locally(like GitHub Rest API / npm publish, .etc), while in CI env is more efficient.
3. Perform the heavy jobs like compile / build on CI is more efficient.

As mentioned above, I have put the bump job and CHANGELOG generation on the local environment, eliminating the need for an additional `git pull`. This tool also supports for the release to be sent along with the notes from the previously generated CHANGELOG. Moreover, let's take advantage of CI workflow as much as possible to do other heavy job.

> The testing job should be performed at the very beginning. Until now, I haven't found a better way to deal with it.

## Usage

> First off: `npm i @antfu/ni -g`

Quick trial.
```bash
# One script to Bump\CHANGELOG\commit\tag\push
nix lvr

# Support the dry run to confirm what will be executed.
nix lvr -d
```

Install on global.
```bash
pnpm i lvr -g
```

More CLI options.
```bash
lvr -h
```

### Bump

Powered by [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump). Using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) preset by default.


```bash
# Bump root's package.json version.
# In a detected monorepo, it would bump those packages which are changed.
lvr bump

# In a detected monorepo, it would bump all packages.
lvr bump --all

# In a detected monorepo, `--pkg` could specify which packages to be bumped.
lvr bump --pkg

# Prompt the version rather than basing on Conventional Commits.
lvr bump --prompt
lvr bump --prompt --all
lvr bump --prompt --pkg
```

> **Note**
> 
> A monorepo is no need to specify a version prop in root's package.json.

### Changelog only

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

```bash
# Generate CHANGELOG for all existing tags.
lvr changelog

# Within a tag range.
lvr changelog --tag=v1.0.1...v2.1.3

# For 2 last tag.
lvr changelog --tag==2

# For a specific tag.
lvr changelog --tag=v0.0.2

# For last tag only
lvr changelog --tag=last
```

#### About author

To generate valid author GitHub name in the CHANGELOG.md as same as release note, I have request the GitHub Rest API to search it. However, it is advised that the API has a [rate limit](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) for IP.

To solve this, I have to pass a GitHub PAT by `--token` when encountering this situation 😔.

Alternatively, you can use [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the `.env.local` which should be included in the `.gitignore` .

#### `--verbose-change` argument

Disable by default.

It means that CHANGELOG would contain more changes which could not be parsed by conventional commits.

### Commit / Tag / Push

Enable `--commit` `--tag` `--push` by default when enable bump and changelog meanwhile. (opt-out by `--no-push`, etc.)

> `--no-changelog` is considered to enable these git jobs in the same way, while `--no-bump` makes no sense to the further step.

```bash
# Use `Release {r}` as commit message by default.
# The `{r}` would be replaced by the bumped version from package.json.
# In a monorepo, the `{r}` is likely `a@x.x.x,b@y.y.y` by default.
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

### Send a GitHub Release by *GitHub Action*

See [yml.ts](./src/options/yml.ts).

```bash
# Add .github/workflows/lvr-release.yml
lvr --yml
```

## Configuration

See [src/config.ts](./src/config.ts).

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd which has highest priority. You can use either `lv.release.json`, `lv.release.{ts,js,mjs,cjs}`, `.lv.releaserc` or use the `lv.release` field in package.json.