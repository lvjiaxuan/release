
export const getOldestTag = () => {
  // ...
  return '0.0.1'
}

export async function getLastGitTag(delta = 0) {
  // const tags = await execCommand('git', ['--no-pager', 'tag', '-l', '--sort=creatordate']).then(r => r.split('\n'))
  // return tags[tags.length + delta - 1]
}