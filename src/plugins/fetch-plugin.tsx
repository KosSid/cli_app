import axios from 'axios';
import * as esbuild from 'esbuild-wasm';
import localforage from 'localforage';
const fileCache = localforage.createInstance({ name: 'fileStorage' });

export const fetchPlugin = (indexCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /(^index\.js$)/ }, () => {
        return {
          loader: 'jsx',
          contents: indexCode,
        };
      });

      build.onLoad({ filter: /\.*/ }, async (args: esbuild.OnLoadArgs) => {
        const cachedData = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        if (cachedData) return cachedData;
        return null;
      });

      build.onLoad({ filter: /\.css$/ }, async (args: esbuild.OnLoadArgs) => {
        const { data, request } = await axios.get(args.path);

        const escaped = data
          .replace(/\n/g, '') // remove new line and make single line code
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/"/g, '\\"') // Escape double quotes
          .replace(/'/g, "\\'"); // Escape single quotes correctly

        const contents = `
        const style = document.createElement('style');
        style.innerText = '${escaped}';
        document.head.appendChild(style);
        `;

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        await fileCache.setItem(args.path, result);
        return result;
      });

      build.onLoad({ filter: /\.*/ }, async (args: esbuild.OnLoadArgs) => {
        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        await fileCache.setItem(args.path, result);
        return result;
      });
    },
  };
};
