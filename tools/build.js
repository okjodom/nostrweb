import esbuild from 'esbuild';
import config from '../esbuildconf.js';

(async () => {
  config.options.metafile = true;
  let res = await esbuild.build(config.options);
  let text = await esbuild.analyzeMetafile(res.metafile);
  console.log(text);
})();
