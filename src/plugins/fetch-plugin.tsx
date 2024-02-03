import axios from 'axios';
import * as esbuild from 'esbuild-wasm';
import localforage from 'localforage';
const fileCache = localforage.createInstance({ name: 'fileStorage' });

export const fetchPlugin = (indexCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: indexCode,
          };
        }

        // const cachedData = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        // if (cachedData) return cachedData;

        const { data, request } = await axios.get(args.path);

        const loader = args.path.endsWith('.css') ? 'css' : 'jsx';

        const result: esbuild.OnLoadResult = {
          loader,
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        await fileCache.setItem(args.path, result);
        return result;
      });
    },
  };
};
