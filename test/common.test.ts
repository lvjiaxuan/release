import { resolveTagSection } from './../src'

describe('common', () => {

  it('test resolveTagSection with vx.x.x', () => {

    const res = resolveTagSection(`# Changelog

Tag ranges \`v0.0.2...ColdRocketsPost\` (52). [All GitHub Releases](https://github.com/lvjiaxuan/eslint-config/releases).

## ColdRocketsPost <sub>(2023-04-10)</sub>
[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.4...main)

### &nbsp;&nbsp;&nbsp;🐛 Fixes

- add processor, close #8 &nbsp;-&nbsp; by @lvjiaxuan in [#8](https://github.com/lvjiaxuan/eslint-config/issues/8) [<samp>(b5716)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/b5716fd)

## v0.11.4 <sub>(2023-03-29)</sub>
[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.3...v0.11.4)

### &nbsp;&nbsp;&nbsp;✨ Enhancements

- lock file &nbsp;-&nbsp; by @lvjiaxuan [<samp>(d4a0c)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/d4a0cc4)`)

    expect(res).toMatchInlineSnapshot(`
"[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.4...main)

### &nbsp;&nbsp;&nbsp;🐛 Fixes

- add processor, close #8 &nbsp;-&nbsp; by @lvjiaxuan in [#8](https://github.com/lvjiaxuan/eslint-config/issues/8) [<samp>(b5716)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/b5716fd)"
`)
  })


  it('test resolveTagSection with human-id', () => {

    const res = resolveTagSection(`# Changelog

Tag ranges \`v0.0.2...v0.12.1\` (52). [All GitHub Releases](https://github.com/lvjiaxuan/eslint-config/releases).

## v0.12.1 <sub>(2023-04-10)</sub>
[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.4...main)

### &nbsp;&nbsp;&nbsp;🐛 Fixes

- add processor, close #8 &nbsp;-&nbsp; by @lvjiaxuan in [#8](https://github.com/lvjiaxuan/eslint-config/issues/8) [<samp>(b5716)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/b5716fd)

## v0.11.4 <sub>(2023-03-29)</sub>
[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.3...v0.11.4)

### &nbsp;&nbsp;&nbsp;✨ Enhancements

- lock file &nbsp;-&nbsp; by @lvjiaxuan [<samp>(d4a0c)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/d4a0cc4)`)

    expect(res).toMatchInlineSnapshot(`
"[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.4...main)

### &nbsp;&nbsp;&nbsp;🐛 Fixes

- add processor, close #8 &nbsp;-&nbsp; by @lvjiaxuan in [#8](https://github.com/lvjiaxuan/eslint-config/issues/8) [<samp>(b5716)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/b5716fd)"
`)
  })


  it('test resolveTagSection with pre-id', () => {

    const res = resolveTagSection(`# Changelog

Tag ranges \`v0.0.2...v0.11.11-beta.1\` (52). [All GitHub Releases](https://github.com/lvjiaxuan/eslint-config/releases).

## v0.11.11-beta.1 <sub>(2023-04-10)</sub>
[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.4...main)

### &nbsp;&nbsp;&nbsp;🐛 Fixes

- add processor, close #8 &nbsp;-&nbsp; by @lvjiaxuan in [#8](https://github.com/lvjiaxuan/eslint-config/issues/8) [<samp>(b5716)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/b5716fd)

## v0.11.4 <sub>(2023-03-29)</sub>
[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.3...v0.11.4)

### &nbsp;&nbsp;&nbsp;✨ Enhancements

- lock file &nbsp;-&nbsp; by @lvjiaxuan [<samp>(d4a0c)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/d4a0cc4)`)

    expect(res).toMatchInlineSnapshot(`
"[Compare changes](https://github.com/lvjiaxuan/eslint-config/compare/v0.11.4...main)

### &nbsp;&nbsp;&nbsp;🐛 Fixes

- add processor, close #8 &nbsp;-&nbsp; by @lvjiaxuan in [#8](https://github.com/lvjiaxuan/eslint-config/issues/8) [<samp>(b5716)</samp>](https://github.com/lvjiaxuan/eslint-config/commit/b5716fd)"
`)
  })
})
