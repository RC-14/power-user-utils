import { webRequest, type WebRequest } from 'webextension-polyfill';
import type { PagePatcher } from '/src/lib/pagePatches';

const urlToPatchesMap: Map<
  string,
  [{ searchValue: Parameters<string['replaceAll']>[0]; replacer: Parameters<string['replaceAll']>[1] | string }]
> = new Map();

// Inject code into assignments (can't change the value)
urlToPatchesMap.set('https://example.com/script.js', [
  {
    searchValue: /varB\s*=\s*varA\s*=/g,
    replacer:
      "/* Patched by RC-14's Page Patches */ " +
      '/* original: */ $& ' +
      '/* PATCH START */ new (class{set a(a){' +
      // Injected Code Start
      // Injected Code End
      '}})().a = /* PATCH END */',
  },
]);

const pagePatcher: PagePatcher = {
  beforeRequest: (details) => {
    const patches = urlToPatchesMap.get(details.url);
    if (patches === undefined) return undefined;

    const streamFilter = webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder('utf-8');
    const encoder = new TextEncoder();

    let rawResponse = new Uint8Array();

    streamFilter.ondata = (event) => {
      const tmp = new Uint8Array(event.data.byteLength + rawResponse.byteLength);
      tmp.set(rawResponse, 0);
      tmp.set(new Uint8Array(event.data), rawResponse.byteLength);
      rawResponse = tmp;
    };

    streamFilter.onstop = () => {
      let response = decoder.decode(rawResponse);

      // Only here to stop TS from complaining
      for (const patch of patches) {
        if (typeof patch.replacer === 'string') {
          response = response.replaceAll(patch.searchValue, patch.replacer);
        } else {
          response = response.replaceAll(patch.searchValue, patch.replacer);
        }
      }

      streamFilter.write(encoder.encode(response));

      streamFilter.close();
    };

    return undefined;
  },
};
export default pagePatcher;
