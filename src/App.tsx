import * as esbild from 'esbuild-wasm';
import React, { useEffect, useRef, useState } from 'react';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const serviceRef = useRef<esbild.Service | null>(null);

  useEffect(() => {
    const startService = async () => {
      serviceRef.current = await esbild.startService({
        worker: true,
        wasmURL: '/esbuild.wasm',
      });
    };
    startService();
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stop();
      }
    };
  }, []);

  const handleClick = async () => {
    if (serviceRef && serviceRef?.current) {
      const result = await serviceRef.current?.build({
        entryPoints: ['index.js'],
        bundle: true,
        write: false,
        plugins: [unpkgPathPlugin(), fetchPlugin(input)],
        define: { 'process.env.NODE_ENV': '"production"', global: 'window' },
      });

      setCode(result?.outputFiles[0].text);
    }
  };

  return (
    <div>
      <textarea value={input} onChange={(e) => setInput(e.target.value)}></textarea>
      <div>
        <button type="submit" onClick={handleClick}>
          Submit
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
};

export default App;
