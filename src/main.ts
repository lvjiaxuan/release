import { type Options } from './config'
import { bump } from './options/bump'

export default (options: Options) => {
  // ...
  console.log(options)

  void bump(options)

}

