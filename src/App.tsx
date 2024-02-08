import * as esbild from 'esbuild-wasm';
import React, { useEffect, useRef, useState } from 'react';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const serviceRef = useRef<esbild.Service | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const startService = async () => {
      serviceRef.current = await esbild.startService({
        worker: true,
        wasmURL: 'https://www.unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
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
    if (iframeRef && iframeRef.current) iframeRef.current.srcdoc = html;
    if (serviceRef && serviceRef?.current) {
      const result = await serviceRef.current?.build({
        entryPoints: ['index.js'],
        bundle: true,
        write: false,
        plugins: [unpkgPathPlugin(), fetchPlugin(input)],
        define: { 'process.env.NODE_ENV': '"production"', global: 'window' },
      });

      iframeRef.current?.contentWindow?.postMessage(result?.outputFiles[0].text, '*');
    }
  };

  const html = `
  <html>
    <head></head>
    <body>
      <div id="root">
        <script>
          window.addEventListener('message', (e) => {
            try{
              eval(e.data)
            } catch (error) {
              document.getElementById('root').innerHTML = '<div><h2>Runtime Error:</h2><h4 style="color: red;">' + error + '</h4></div>';
              console.error(error)
            }
            
          }, false)
        </script>
      </div>
    </body>
  </html>
  `;

  return (
    <div>
      <textarea
        style={{ width: '500px', height: '300px' }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button type="submit" onClick={handleClick}>
          Submit
        </button>
      </div>
      <iframe
        title="code-preveiw"
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts"
      ></iframe>
    </div>
  );
};

export default App;
