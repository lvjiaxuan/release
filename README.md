# lvr

![actions](https://github.com/lvjiaxuan/release/actions/workflows/ci.yml/badge.svg) [![npm](https://img.shields.io/npm/v/lvr)](https://www.npmjs.com/package/lvr)

Do the releasing flows such as:
1. Bump version, support monorepo in a strategy.
2. Generate `CHANGELOG.md` based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
3. Commit / Tag / Push.
4. Create a release and publish on GitHub Action might be more efficient.

## Features

1. One script usage, so it might be opinionated, which is not very customizable.
2. processing...

## Usage

```sh
# One script to release, including Bump \ CHANGELOG \ commit \ tag \ push
npx lvr

# Support the dry run to confirm what will be executed.
npx lvr --dry
npx lvr -d
```

Install globally.
```sh
npm i lvr -g
```

Check more CLI options.
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

# Bump to the specified semver increment level rather than depending on conventional-recommended-bump.
lvr bump --major
lvr bump --major --all
lvr bump --major --pkg
```
Semver increment level support:
- `--major`: bump as a semver-major version.
- `--minor`: bump as a semver-minor version.
- `--patch`: bump as a semver-patch version.
- `--premajor`: bump as a semver-premajor version, can set id with string.
- `--preminor`: bump as a semver-preminor version, can set id with string.
- `--prepatch`: bump as a semver-prepatch version, can set id with string.
- `--prerelease`: bump as a semver-prerelease version, can set id with string.

**Absolutely, these `bump` options can be used without the `bump` command during a release. The following `changelog` command is the same.**

> **Note**
>
> In a monorepo, the root pkg maybe no need to specify *package.json#version*. However, if there is actually a version field present, "bump" would calculate this root package.json when bumping the version.

#### Set a main package for a monorepo

```sh
lvr --main-pkg
```

In a monorepo, when releasing only one package, it specifies the tag name as `vx.x.x` instead of `abc@x.x.x`.

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

Alternatively, you can use [dotenv](https://github.com/motdotla/dotenv) to load additional `GITHUB_TOKEN` environment variable from the `.env.local` which should be included in the `.gitignore` .

### Commit / Tag / Push

Enable `--commit` `--tag` `--push` by default when enable bump and changelog meanwhile. (opt-out by `--no-push`, etc.)

> `--no-changelog` is considered to enable these git jobs in the same way, while `--no-bump` makes no sense to the further step.

```sh
# Use `Release {r}` as commit message by default.
# The `{r}` would be replaced by the bumped version from package.json.
# When multiple packages were released at same commit, the `human-id` library is used to generate words that serve as commit message and tag name.
# Customizable.
lvr --commit="R: {r}"

# Use bumped version from package.json by default.
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

### Send a GitHub Release on *GitHub Action*

See [yml.ts](./src/command/yml.ts). And modify on your own.

```sh
# Add a workflow file at `.github/workflows/lvr.yml`.
lvr yml
```

## Configuration

See [src/config.ts](./src/config.ts).

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd which has highest priority. You can use either `lvr.json`, `lvr.{ts,js,mjs,cjs}`, `.lvrrc` or use the `lvr` field in package.json.
