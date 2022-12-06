import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

/**
 * replaceOnCopyPlugin is an esbuild plugin. it loads files as utf-8 text
 * and replaces certain placeholders with their values computed on plugin setup.
 * the fileFilter is a regexp matching names or extensions of the files to process,
 * passed to esbuild's onLoad as is.
 *
 * the following placeholders are replaced:
 *
 * #[PKG_VERSION]# -> npm package version
 * #[GIT_COMMIT]#  -> short git commit at current HEAD
 */
export function replaceOnCopyPlugin(fileFilter) {
  return {
    name: 'replace-on-copy',
    setup(build) {
      const appVersion = sanitizedStr(process.env.npm_package_version);
      const gitHeadCommit = gitRevParse('HEAD');

      build.onLoad({filter: fileFilter}, async (args) => {
        const gitCommitHash = await gitHeadCommit;
        let text = await readFile(args.path, 'utf8');
        text = text.replaceAll('#[PKG_VERSION]#', appVersion);
        text = text.replaceAll('#[GIT_COMMIT]#', gitCommitHash);
        return {
          contents: text,
          loader: 'copy',
        }
      });
    }
  }
}

async function gitRevParse(rev) {
  rev = sanitizedStr(rev);
  const { stdout } = await execFileAsync('git', ['rev-parse', '--short', rev]);
  return sanitizedStr(stdout.trim());
}

function sanitizedStr(s) {
  const notOk = /[^0-9a-z \.@-]/ig;
  return s.replaceAll(notOk, '-');
}
