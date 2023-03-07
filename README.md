# lvr

<p align=center>Help me better to bump version and generate CHANGELOG.</p>

## Say sth.

In my release flow, there are some steps in order such as:
1. (optional) Do some test .
2. Bump version.
3. Generate CHANGELOG.
3. Commit / Tag.
4. Push to origin.
5. Trigger CI workflow that includes github release or publish stuff which are depended.

*Requesting GitHub Rest API locally is not my purpose for reasons such as the network likely being instable and requiring a explicit token for authentication, etc. So this tool just to **Bump**  and **Generate CHANGELOG** on local. I prefer to put the release job on CI workflow.*

## Usage

> First off: `npm i @antfu/ni -g`

Quick trial:
```bash
# As well as `nix lvr --bump --changelog --commit --tag --push``
nix lvr

# Maybe you want to check what will execute in advance.
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
# Bump root's package.json version. If project is detected as a monorepo, it would synchronize workspace root's version to other package.json in subdirectories.
lvr -b

# In a detected monorepo, it would bump specified package.json version in subdirectories.
lvr -b=pkg-a pkg-b

# Prompt version rather than basing on git metadata by default.
lvr -p
lvr -p=pkg-a pkg-b
```

> **Note** Workspace root's **package.json** is always included, which means it would keep latest version from its packages.

### Changelog only

Powered by [antfu/changelogithub](https://github.com/antfu/changelogithub) and [unjs/changelogen](https://github.com/unjs/changelogen).

CLI Arguments:
- `--changelog`, `-c` in short.
- `--no-changelog`, `--no-c` to disable.

```bash
# Generate changelog for all existing tags.
lvr -c

# For a tag range.
lvr -c=v1.0.1...v2.1.3

# For 2 latest tag.
lvr -c=2

# For a specified tag.
lvr -c=v0.0.2

# For latest tag only
lvr -c=latest
```

#### About author

To generate more rich info in the CHANGELOG and release note, I utilize the GitHub API to search for a valid author name. However, be advised that the API has a [rate limit](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) for IP.

To bypass this, it is recommended to include a GitHub PAT by passing `--token` when encountering this case 😔.

Alternatively, It uses [dotenv](https://github.com/motdotla/dotenv) o load additional environment variables from the `.env.local` which should be included in the `.gitignore` .

#### `--verbose-change` argument

Disable by default.

It means that CHANGELOG would contain more changes which could not be parsed by conventional commits.

### Commit / Tag / Push

Enable `--commit` `--tag` `--push` by default when enable bump and changelog meanwhile. (opt-out by `--no-push`, etc.)

> `--no-changelog` is considered to enable git jobs in the same way, while `--no-bump` makes no sense to further step.

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

See [yml.ts](./src/options/yml.ts).

```bash
# Add .github/workflows/lvr-release.yml
lvr --yml
```

## Configuration

See [src/config.ts](./src/config.ts).

Configuration is loaded by [antfu/unconfig](https://github.com/antfu/unconfig) from cwd which has highest priority. You can use either `lv.release.json`, `lv.release.{ts,js,mjs,cjs}`, `.lv.releaserc` or use the `lv.release` field in package.json.

## Credits

- [unjs/changelogen](https://github.com/unjs/changelogen)
- [antfu/changelogithub](https://github.com/antfu/changelogithub)

# TODO

- [ ] Do a confirm before doing execution.
- [ ] Pre-Release.