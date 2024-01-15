# lvr

![actions](https://github.com/lvjiaxuan/release/actions/workflows/ci.yml/badge.svg) [![npm](https://img.shields.io/npm/v/lvr)](https://www.npmjs.com/package/lvr)

Do the releasing flows such as:
1. Bump version in different strategy. Support monorepo.
2. Generate `CHANGELOG.md` based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
3. Commit / Tag / Push.
4. Create a release and publish on GitHub Action might be more efficient.

## Features

1. One script usage, may be opinionated, meaning it is not very customizable.
2. Generate a tag range changelog.

## Usage

```sh
npx lvr

# Support the dry run to confirm what will be executed.
# npx lvr --dry
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
# If a monorepo, it would bump those changed packages by default.
# lvr bump
lvr b
```

#### options

```sh
# In a detected monorepo, it would bump all packages whether they are changed.
lvr b --all
```

```sh
# In a detected monorepo, `--pkg` helps to prompt which packages should be bumped.
lvr b --pkg
```

```sh
# Bump to the specified semver increment level rather than depending on `conventional-recommended-bump`.
lvr b --major
lvr b --major --all
lvr b --major --pkg
```
Semver increment level support:
- `--major`: bump as a semver-major version.
- `--minor`: bump as a semver-minor version.
- `--patch`: bump as a semver-patch version.
- `--premajor`: bump as a semver-premajor version, can set id with string.
- `--preminor`: bump as a semver-preminor version, can set id with string.
- `--prepatch`: bump as a semver-prepatch version, can set id with string.
- `--prerelease`: bump as a semver-prerelease version, can set id with string.

```sh
# In a detected monorepo, when releasing only one package, it specifies the tag name as `vx.x.x` instead of `abc@x.x.x`.
lvr b --main-pkg
```

### Changelog

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

```sh
# Generate CHANGELOG with all existing tags.
# lvr changelog
lvr c
```

#### options

```sh
# generate within a tag range.
lvr changelog --tag=v1.0.1...v2.1.3

# to last 2 tag.
lvr changelog --tag==2

# to a specified tag.
lvr changelog --tag=v0.0.2
```

```sh
# It means that CHANGELOG.md would contain more changes that were not be parsed by `conventional commits`.
# Disable by default.
lvr changelog --verbose
```

#### About author

To be able to generate the format of `@authorName` for the interaction in the GitHub's release note, I need to fetch the GitHub Rest API. However, it occurred to me that the API has a [rate limit](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) for an IP.

So we have to pass a [GitHub PAT](https://github.com/settings/tokens?type=beta) by `--token` when encountering this situation 😔.

Alternatively, we can also create a `.env.local` file which should be included in the `.gitignore` .
```env
GITHUB_TOKEN = your-github-pat
```

### Commit / Tag / Push

Enable `--commit` `--tag` `--push` when execute the `lvr` script without other command. (opt-out like `--no-push`, etc.)

> `--no-changelog` is considered to enable these git jobs in the same way, while `--no-bump` makes no sense to the further step.

```sh
# Use `Release {r}` as commit message by default.
# The `{r}` placeholder would be replaced by the committed tag name from bumped result.
# When multiple packages were released at same commit, the `human-id` library is used to generate words that serve as commit message and tag name.
# Customizable.
lvr --commit="R: {r}"
```

```sh
# Use the committed tag name from bumped result from package.json by default.
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

### Publish on CI

See [publish.ts](./src/command/publish.ts).

## Configuration

See [src/config.ts](./src/config.ts).

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd which has highest priority. You can use either `lvr.json`, `lvr.{ts,js,mjs,cjs}`, `.lvrrc` or use the `lvr` field in package.json.
