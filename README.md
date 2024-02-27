# lvr

![actions](https://github.com/lvjiaxuan/release/actions/workflows/ci.yml/badge.svg) [![npm](https://img.shields.io/npm/v/lvr)](https://www.npmjs.com/package/lvr)

Perform jobs related to the release flows, such as:
1. Bump version.
2. Generate `CHANGELOG.md`.
3. Commit / Tag / Push.
4. Create a release and publish node packages.

## Features

1. One brief script is good to go, may be a little opinionated by default options.
2. Generate a tag-ranged `CHANGELOG.md`.
3. Publish job supports sync to cnpm.

## Usage

Perform Bump :point_right: CHANGELOG :point_right: Commit :point_right: Tag :point_right: Push in one script:
```sh
npx lvr
```

Use the dry run option to confirm what will be executed:
```sh
# npx lvr --dry-run
npx lvr -d
```

Install globally:
```sh
npm i lvr -g
```

More options detail:
```sh
lvr -h
```

### Commands used separately.

#### Bump

Powered by [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [semver](https://github.com/npm/node-semver). Using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) preset by default.

Bump `package.json` in the root:
```sh
# lvr bump
lvr b
```

> In a detected monorepo, it would bump those changed packages by default.

##### options

In a detected monorepo, it would bump all packages whether they are changed.
If the root package.json has the `version` field, packages would be bumped to the same version based on it.
```sh
lvr b --all
```

In a detected monorepo, `--pkg` helps to prompt which packages should be bumped:
```sh
lvr b --pkg
```

Bump to the specified semver increment level rather than depending on `conventional-recommended-bump`.
```sh
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

In a detected monorepo, when releasing only one package, it specifies the tag name as `vx.x.x` instead of `abc@x.x.x`:
```sh
lvr b --main-pkg
```

#### Changelog

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

Generate `CHANGELOG.md` with all existing tags:
```sh
# lvr changelog
lvr c
```

##### options

```sh
# within a tag range.
lvr changelog --tag=v1.0.1...v2.1.3

# to last 2 tag.
lvr changelog --tag==2

# to a specified tag.
lvr changelog --tag=v0.0.2
```

It means that the `CHANGELOG.md` would contain more commits that were not be parsed by `conventional commits`. Disable by default.
```sh
lvr changelog --verbose
```

> [!NOTE]
> **About author**
>
> To be able to generate the format of `@authorName` for the interaction in the GitHub's release note, I need to fetch the GitHub Rest API. However, it occurred to me that the API has a [rate limit](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) for an IP.
>
> So we have to pass a [GitHub PAT](https://github.com/settings/tokens?type=beta) by `--token` when encountering this situation 😔.
>
> Alternatively, we can also create a `.env.local` file which should be included in the `.gitignore` .
> ```env
> # .env.local
> GITHUB_TOKEN = your-github-pat
> ```

#### Commit / Tag / Push

Enable `--commit` `--tag` `--push` when execute the `lvr` script without other command. (opt-out like `--no-push`, etc.)

> `--no-changelog` is considered to enable these git jobs in the same way, while `--no-bump` makes no sense to the further step.

Use `Release {r}` as the default commit message. The placeholder `{r}` will be replaced by the tag name from the bumped result. If multiple packages are released in the same commit, the `human-id` library is utilized to create words for the commit message and tag name:
```sh
lvr --commit="R: {r}"
```

```sh
# Use the tag name from bumped result from package.json by default:
lvr --tag=BatMan

# Push current branch and new tag by default.
lvr --push

# Push current branch only.
lvr --push=branch

# Push new tag only
lvr --push=tag
```

> [!NOTE]
> It is not recommended to release more than one package at the same time in order to ensure a concise commit message and tag name.

### Send a GitHub Release on CI

See [yml.ts](./src/command/yml.ts) and modify on your own.

```sh
# Add a workflow file to `.github/workflows/lvr.yml`.
lvr yml
```

### Publish on CI

See [publish.ts](./src/command/publish.ts).

## Configuration

See [src/config.ts](./src/config.ts).

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd which has highest priority. You can use either `lvr.json`, `lvr.{ts,js,mjs,cjs}`, `.lvrrc` or use the `lvr` field in package.json.
