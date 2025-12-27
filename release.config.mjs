const npmPlugin = '@semantic-release/npm';
const githubPlugin = {
  path: '@semantic-release/github',
};
const changelogPlugin = {
  path: '@semantic-release/changelog',
  changelogFile: 'CHANGELOG.md',
};
const gitPlugin = {
  path: '@semantic-release/git',
  assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
  message:
    'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
};

export default {
  verifyConditions: [npmPlugin, githubPlugin],
  prepare: [changelogPlugin, npmPlugin, gitPlugin],
  publish: [npmPlugin, githubPlugin],
  success: [githubPlugin],
  fail: [githubPlugin],
  commitVersion: true,
  branches: ['main'],
};
