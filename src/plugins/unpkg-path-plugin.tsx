import * as esbuild from 'esbuild-wasm';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // Handle root entry file of index.js
      build.onResolve({ filter: /(^index\.js$)/ }, () => {
        return { path: 'index.js', namespace: 'a' };
      });

      // Handle relative path in module like =>  ./ or ../
      build.onResolve({ filter: /^\.+\// }, async (args: esbuild.OnResolveArgs) => {
        return {
          namespace: 'a',
          path: new URL(args.path, 'https://www.unpkg.com' + args.resolveDir + '/').href,
        };
      });

      // Handle root main file of module
      build.onResolve({ filter: /\.*/ }, async (args: esbuild.OnResolveArgs) => {
        return { path: `https://www.unpkg.com/${args.path}`, namespace: 'a' };
      });
    },
  };
};
