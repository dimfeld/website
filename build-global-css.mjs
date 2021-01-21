import fs from 'fs';
import postcss from 'postcss';
import loadConfig from 'postcss-load-config';

const {readFile, unlink, writeFile} = fs.promises;

const main = async () => {
  let [sourcemap, postcssConfigPath, input, output] = process.argv.slice(2);
  let postcssConfig = await loadConfig({}, postcssConfigPath);

  if (sourcemap === 'true') sourcemap = true;
  else if (sourcemap === 'false') sourcemap = false;

  const pcss = await readFile(input);
  const result = await postcss(postcssConfig.plugins).process(pcss, {
    from: input,
    to: output,
    map: sourcemap ? {inline: sourcemap === 'inline'} : false,
  });

  await writeFile(output, result.css);

  if (result.map) await writeFile(output + '.map', result.map.toString());
  else {
    try {
      await unlink(output + '.map');
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }
};

main();
