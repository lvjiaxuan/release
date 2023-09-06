declare module 'conventional-recommended-bump' {
  // 在这里编写模块的声明
  export type ReleaseType = 'major' | 'minor' | 'patch'
  export default function(
    options: { preset: { name: string } | string },
    cb: (error: any, recommendation: { releaseType: ReleaseType }) => void
  ): void
}
