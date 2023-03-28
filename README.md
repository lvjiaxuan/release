# lvr

<p align=center>Help me better to bump version and generate CHANGELOG.</p>

![actions](https://github.com/lvjiaxuan/release/actions/workflows/release.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/lvr)](https://www.npmjs.com/package/lvr)


## Feature

1. Bump version for some specific package.json in a monorepo.
2. Generate CHANGELOG within a specific version range.
3. Using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Say sth.

In my release flow, there are some steps in order such as:
1. perform some tests.
2. Bump version.
3. Generate CHANGELOG.
3. Commit / Tag.
4. Push to origin.
5. Trigger CI workflow that involves github release or publish stuff which are depended on.

More:
1. I want to only an one script to finish releasing, rather than such as an additional `git pull` manually.
2. I don't want to network fetching locally(like GitHub Rest API / npm publish, .etc), while in CI env is more efficient.
3. perform the heavy jobs like compile / build in CI env is more efficient.

As mentioned above, I have put the bump job and CHANGELOG generation in the local environment, eliminating the need for an additional `git pull`. This tool also supports for the release to be sent along with the notes from the previously generated CHANGELOG. Moreover, let's take advantage of CI workflow as much as possible to do other heavy job.

> The testing job, a heavy job which has to be performed at the very beginning in the local environment. Until now, I haven't found a better way.

## Usage

> First off: `npm i @antfu/ni -g`

Quick trial:
```bash
# As well as `nix lvr --bump --changelog --commit --tag --push``
nix lvr

# Maybe you want to confirm what will be executed.
# Please use Dry run.
nix lvr -d
```

Globally use. Installation:
```bash
pnpm i lvr -g
```

More CLI options:
```bash
lvr -h
```

### Bump only

Powered by [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump).

CLI Arguments:
- `--bump`, `-b` in short.
- `--bump-prompt`, `-p` in short.
- `--no-bump`, `--no-b` to disable. It seems useless.

```bash
# Bump root's package.json version.
# If project is detected as a monorepo, it would bump all version of other package.json in subdirectories.
lvr -b

# In a detected monorepo, it would only bump the specific package.json's version in subdirectories.
lvr -b=pkg-a pkg-b

# Prompt the version rather than basing on Conventional Commits.
lvr -p
lvr -p=pkg-a pkg-b
```

> **Note**
> 
> A monorepo is no need to specify a version prop in root's package.json.

### Changelog only

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

CLI Arguments:
- `--changelog`, `-c` in short.
- `--no-changelog`, `--no-c` to disable.

```bash
# Generate CHANGELOG for all existing tags.
lvr -c

# Within a tag range.
lvr -c=v1.0.1...v2.1.3

# For 2 last tag.
lvr -c=2

# For a specific tag.
lvr -c=v0.0.2

# For last tag only
lvr -c=last
```

#### About author

To generate more rich info in the CHANGELOG.md as same as release note, I utilize the GitHub Rest API to search for a valid author name. However, it is advised that the API has a [rate limit](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) for IP.

To solve this, it could pass a GitHub PAT by `--token` when encountering this situation 😔.

Alternatively, you can use [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the `.env.local` which should be included in the `.gitignore` .

#### `--verbose-change` argument

Disable by default.

It means that CHANGELOG would contain more changes which could not be parsed by conventional commits.

### Commit / Tag / Push

Enable `--commit` `--tag` `--push` by default when enable bump and changelog meanwhile. (opt-out by `--no-push`, etc.)

> `--no-changelog` is considered to enable these git jobs in the same way, while `--no-bump` makes no sense to the further step.

```bash
# Use `Release {v}` as commit message by default.
# The `{v}` would be replaced by the `bumpVersion` from bump job.
# In a monorepo, the `{v}` would reference to its last tag version.
lvr --commit="R: {v}"

# Use `bumpVersion` by default.
# In a monorepo, it would reference to its last tag version.
# Customizable as below.
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