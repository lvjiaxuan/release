import { execCMD } from '@/git'

describe('git', () => {
  // ...
  it('execCMD', async () => {
    // ...
    expect((await execCMD('git', [ 'status' ])).stdout)
      .toContain('nothing to commit, working tree clean')
  })
})
