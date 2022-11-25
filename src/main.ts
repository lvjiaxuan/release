import { type Options } from './config'
import { bump } from './options/bump'
import { changelog } from './options/changelog'

export default (options: Options) => {
  void bump(options)
  void changelog(options)
}

