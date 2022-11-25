import { generate } from 'changelogithub'
import { type Options } from '@/config'

export const changelog = (options: Options) => {
  // ...

  // 1. 生成所有 tag 的 changelog
  /**
   * - getOldestTag
   * - getLatestTag
   */

  // 2. 匹配指定 tag range
  /**
   * - 输入验证，是否从小到大；是否存在
   */

  // 3. 匹配 最近 n 个 latest tag

  // 4. 匹配 latest 硬编码为最新tag

}
