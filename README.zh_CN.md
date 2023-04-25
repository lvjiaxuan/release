# lvr

<p align=center>在本地上进行版本升级和生成 CHANGELOG。</p>

![actions](https://github.com/lvjiaxuan/release/actions/workflows/ci.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/lvr)](https://www.npmjs.com/package/lvr)

[English](./README.md) | 简体中文

## 特性

1. 在 monorepo 中仅放置一个根目录下的 CHANGELOG.md，以尊重整个 monorepo 的情况，并升级指定的包。

2. 生成特定版本范围内的 CHANGELOG.md。

3. 默认使用 [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)。

## 说点啥

在我的发布流程中，有一些按顺序执行的步骤：

1. 执行一些测试。

2. 升级版本号。

3. 生成 CHANGELOG.md 文件。

4. 提交 / 标记标签（commit/tag）。

5. 推送到远程仓库（push）。

6. 触发 CI 工作流，其中涉及测试/构建/发布等依赖项。

更多内容：

1、我希望只需要一个脚本就能完成发布，而不是像手动添加 `git pull` 这样额外操作。

2、我不想在本地获取网络资源（如 GitHub Rest API / npm publish 等），只需 `git push` 就可以了，在 CI 环境中效率更高。

3、将编译 / 构建等繁重的工作放在 CI 上更加高效。

如上所述，我已经将升级和 CHANGELOG 生成工作放在了本地环境中，消除了额外的 `git pull` 需求。此工具还支持将发布与先前生成的 CHANGELOG.md 中的注释一起发送。 此外，尽可能利用 CI 工作流来完成其他繁重任务。

> 测试应该是最开始执行的步骤。到目前为止，我还没有找到更好的处理方法。

## 使用

快速试用：

```sh

# 只需要一个脚本就能完成发布（包括 Bump\CHANGELOG\commit\tag\push）

npx lvr

# 支持干运行以确认要执行什么操作。

npx lvr -d

```

全局安装：

```sh

npm i lvr -g

```

更多 CLI 选项：

```sh
lvr -h
```

### 升级版本号（Bump）

由 [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) 和 [semver](https://github.com/npm/node-semver) 提供支持，默认使用 [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 预设。

```sh
# 升级根目录下 package.json 的版本号。
# 在检测到 monorepo 时，它会升级那些被修改过的包。
lvr bump

# 在检测到 monorepo 时，它会升级所有包。
lvr bump --all

# 在检测到 monorepo 时，“--pkg”提示要升级的软件包。
lvr bump --pkg

# 根据指定的 semver 增量级别进行升级，而不是依赖于 conventional-recommended-bump。
lvr bump --major
lvr bump --major --all
lvr bump --major --pkg
```

semver 增量支持：

- `--major`：作为一个 semver-major 版本进行提高。

- `--minor`：作为一个 semver-minor 版本进行提高。

- `--patch`：作为一个 semver-patch 版本进行提高。

- `--premajor`：以 semver-premajor 版本形式上调，可以使用字符串设置 ID。

- `--preminor`：以 semver-preminor 版本形式上调，可以使用字符串设置 ID。

- `--prepatch`：以 semver-prepatch 版本进行升级，可以使用字符串设置 ID。

- `--prerelease`：以 semver-prerelease 版本进行升级，可以使用字符串设置 ID。

**当发布时无需使用“bump”命令即可使用这些“bump”选项。以下的“changelog”是相同的。**

> **注意**

>

> 在 monorepo 中，可能不需要指定 *package.json#version*。但是，如果实际上存在版本字段，“bump”会在升级版本时计算此根 package.json。

### Changelog

由 [antfu/changelogithub](https://github.com/antfu/changelogithub) 和 [unjs/changelogen](https://github.com/unjs/changelogen) 提供支持。

```sh

# 生成包含所有现有标签的 CHANGELOG。

lvr changelog

# 在标签范围内。

lvr changelog --tag=v1.0.1...v2.1.3

# 对于最后两个标签。

lvr changelog --tag==2

# 对于指定的标记。

lvr changelog --tag=v0.0.2

# 这意味着 CHANGELOG.md 将包含更多未被常规提交解析的更改。

＃默认禁用。

 lvr changelog --verbose

```

#### 关于作者

为了在 CHANGELOG.md 中生成有效的作者 GitHub 名称，并与发布说明相同，我已经请求 GitHub Rest API 进行搜索。然而，请注意该 API 的 IP 有一个[速率限制](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting)。

为了解决这个问题，当遇到这种情况时，我必须通过 `--token` 传递 GitHub PAT 😔。

或者，您可以使用 [dotenv](https://github.com/motdotla/dotenv) 从 `.env.local` 中加载其他环境变量，并将其包含在 `.gitignore` 中。

### 提交 / 标记 / 推送

启用 `--commit` `--tag` `--push` 默认情况下同时启用 bump 和 changelog。 （通过“ --no-push”等退出）

> “ --no-changelog” 被认为以相同的方式启用这些 git 工作，“ --no-bump” 对进一步的步骤没有意义。

```sh

# 默认情况下使用“Release {r}”作为提交消息。

＃“{r}”将被替换为 package.json 中升级的版本。

＃当多个软件包在同一次提交中发布时，“human-id”库用于生成可作为提交消息和标记名称的单词。

＃可定制。

lvr --commit="R: {r}"

#默认情况下使用 package.json 中升级的版本。

＃可定制。

lvr --tag=BatMan

#默认情况下推送当前分支和新标签。

lvr --push

#仅推送当前分支。

lvr --push=branch

#仅推送新标签

 lvr --push=tag

```

> **注意**

> 不建议同时发布多个软件包，以确保简洁的提交消息和标记名称。

#### 为 monorepo 设置主要软件包

```sh

lvr --main-pkg

```

在 monorepo 中，当仅发布一个软件包时，它将指定软件包版本格式为 `x.x.x` 而不是 `abc@x.x.x`。

### 在 *GitHub Action* 上发送 GitHub 发布

请参见 [yml.ts](./src/command/yml.ts)。并根据自己的情况进行修改。

```sh

# 在 `.github/workflows/lvr.yml` 中添加工作流文件。

lvr yml

```

## 配置

请参见 [src/config.ts](./src/config.ts)。

配置由 [antfu/unconfig](https://github.com/antfu/unconfig) 从 cwd 加载，并具有最高优先级。您可以使用
