import { describe, expect, it } from 'vitest'
import { resolveChangelogSection } from '../src'

describe('`resolveChangelogSection` test cases', () => {
  it('single changelog', () => {
    const res = resolveChangelogSection(`# Changelog

    Tag \`v0.1.0\`. [All GitHub Releases](https://github.com/lvjiaxuan/transformer-attribute-values-group/releases).
    
    ## v0.1.0 <sub>(2023-04-19)</sub>
    [Compare changes](https://github.com/lvjiaxuan/transformer-attribute-values-group/compare/...v0.1.0)
    
    ### &nbsp;&nbsp;&nbsp;✨ Enhancements
    
    - let's group values! &nbsp;-&nbsp; by **lvjiaxuan** [<samp>(2a8b3)</samp>](https://github.com/lvjiaxuan/transformer-attribute-values-group/commit/2a8b3af)`)

    expect(res).toMatchInlineSnapshot(`
"[Compare changes](https://github.com/lvjiaxuan/transformer-attribute-values-group/compare/...v0.1.0)
    
    ### &nbsp;&nbsp;&nbsp;✨ Enhancements
    
    - let's group values! &nbsp;-&nbsp; by **lvjiaxuan** [<samp>(2a8b3)</samp>](https://github.com/lvjiaxuan/transformer-attribute-values-group/commit/2a8b3af)"
`)
  })

  it('test resolveChangelogSection with vx.x.x', () => {
    const res = resolveChangelogSection(`# Changelog

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

  it('test resolveChangelogSection with human-id', () => {
    const res = resolveChangelogSection(`# Changelog

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

  it('test resolveChangelogSection with pre-id', () => {
    const res = resolveChangelogSection(`# Changelog

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
