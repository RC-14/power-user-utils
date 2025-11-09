import type { Downloads } from 'webextension-polyfill';
import type { JSONObject, JSONValue } from './json';
import { getNodePath, isElementEditable, qs, qsa, sendRuntimeMessage, stringifyNode } from '/src/lib/utils';

declare global {
  function cloneInto<T extends unknown>(
    obj: T,
    targetScope: object,
    options?: { cloneFunctions?: boolean; wrapReflectors?: boolean }
  ): T;
  function exportFunction<T extends Function>(
    func: T,
    targetScope: object,
    options?: { defineAs?: string; allowCrossOriginArguments?: boolean }
  ): T;
}

const addToGlobalThis = (key: string, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    configurable: false,
    enumerable: false,
    writable: false,
    value,
  });
};

const writeToPageContext = (key: string, value: object) => {
  // @ts-ignore
  const unsafeWindow: Window = window.wrappedJSObject ?? window;

  Object.defineProperty(unsafeWindow, key, {
    configurable: false,
    enumerable: false,
    writable: false,

    value: 'cloneInto' in globalThis ? cloneInto(value, unsafeWindow, { cloneFunctions: true }) : value,
  });
};

const bgRun = async (func: string, params: JSONValue[]) => {
  if (func == null || params == null) throw new Error('2 Arguments required.');
  if (typeof func !== 'string') throw new Error('Argument 1 is not a String.');
  if (typeof params !== 'object' || !Array.isArray(params)) throw new Error('Argument 1 is not an Array.');

  return await sendRuntimeMessage('background', 'bgRun', 'run', { func, params });
};

const whoami = async () => await sendRuntimeMessage('background', 'whoami', 'whoami');

const download = async (downloadOptions: Downloads.DownloadOptionsType) => {
  // stop ts from complaining - I don't know what else to do here
  const options = downloadOptions as Downloads.DownloadOptionsType & JSONObject;

  if (options.saveAs == null) options.saveAs = false;

  const info = await whoami();
  if (
    info != null &&
    typeof info === 'object' &&
    !Array.isArray(info) &&
    info.tab != null &&
    typeof info.tab === 'object' &&
    !Array.isArray(info.tab)
  ) {
    if (options.cookieStoreId == null && typeof info.tab.cookieStoreId === 'string')
      options.cookieStoreId = info.tab.cookieStoreId;
    if (options.incognito == null && typeof info.tab.incognito === 'boolean') options.incognito = info.tab.incognito;
  }

  if (options.url.startsWith('blob:')) {
    options.url = await new Promise(async (resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') throw new Error("Result of blob: to data: URL conersion isn't a String.");
        resolve(reader.result);
      };
      reader.readAsDataURL(await fetch(options.url).then((r) => r.blob()));
    });
  }

  if (!options.url.startsWith('data:')) return await bgRun('browser.downloads.download', [options]);

  return await bgRun('eval', [
    `(async options => {
    const byteString = atob(options.url.split(',')[1]);
    const type = options.url.split(',')[0].split(':')[1].split(';')[0];
    const arrBuf = new ArrayBuffer(byteString.length);
    const intArr = new Uint8Array(arrBuf);
    for (let i = 0; i < byteString.length; i++) intArr[i] = byteString.charCodeAt(i);

    options.url = URL.createObjectURL(new Blob([arrBuf], { type }));
    return await browser.downloads.download(options);
  })(${JSON.stringify(options)})`,
  ]);
};

let noAuth = false;

const makeAuthenticatedFunc =
  (name: string, func: Function) =>
  (...args: unknown[]) => {
    const strArgs = args.map((v) => JSON.stringify(v));

    if (
      !noAuth &&
      !confirm(
        'Do you want to allow this call to ' +
          name +
          '?\n\n' +
          "Don't accept if it wasn't made by you!\nIncorrect or malicious use can be extremely dangerous!\n\n" +
          'Arguments to be passed to ' +
          name +
          ':\n\n' +
          strArgs.join('\n\n')
      )
    ) {
      throw new Error('Call to ' + name + ' was not authenticated.');
    }

    if (noAuth) {
      console.warn(
        'Authentication was not required for a call to ' + name + ' whith the following arguments:',
        ...args,
        'Stringified: ' + strArgs.join(' ')
      );
    }

    // @ts-ignore
    const unsafeWindow = window.wrappedJSObject ?? window;

    const result = func(...args);
    if (!(result instanceof Promise || result instanceof window.Promise)) return cloneInto(result, unsafeWindow);

    return new window.Promise((resolve) =>
      result
        .then((v) => {
          resolve(cloneInto(v, unsafeWindow));
        })
        .catch((e) => {
          resolve(cloneInto(e, unsafeWindow));
        })
    );
  };

const makePrivilegedWrapperGetter = (name: string, func: Function) => () => {
  if (
    confirm(
      'Do you really want to allow the creation of a privileged ' +
        name +
        ' wrapper?\n\n' +
        'Always assume that this may be used to take over your entire browser!'
    )
  ) {
    // @ts-ignore
    const unsafeWindow = window.wrappedJSObject ?? window;

    return exportFunction(
      (...args: unknown[]) => {
        console.warn(
          'A priviliged ' + name + ' wrapper was called with the following arguments:',
          ...args,
          'Stringified: ' + args.map((v) => JSON.stringify(v)).join(' ')
        );

        const result = func(...args);
        if (!(result instanceof Promise || result instanceof window.Promise)) return cloneInto(result, unsafeWindow);

        return new window.Promise((resolve) =>
          result
            .then((v) => {
              resolve(cloneInto(v, unsafeWindow));
            })
            .catch((e) => {
              resolve(cloneInto(e, unsafeWindow));
            })
        );
      },
      unsafeWindow,
      { allowCrossOriginArguments: true }
    );
  }

  throw new Error('Creation of a priviliged wrapper for ' + name + ' was not authenticated.');
};

const privilegedPageContextUtils = Object.entries({
  bgRun: bgRun,
  whoami: whoami,
  download: download,
}).reduce(
  (finalObject, entry) => {
    finalObject[entry[0]] = makeAuthenticatedFunc(entry[0], entry[1]);
    finalObject[
      'getPriviliged' +
        entry[0]
          .split('')
          .map((c, i) => (i === 0 ? c.toUpperCase() : c))
          .join('')
    ] = makePrivilegedWrapperGetter(entry[0], entry[1]);
    return finalObject;
  },
  {} as Record<string, Function>
);

const pageContextUtils = {
  _disableAuth: () => {
    if (
      confirm(
        'Do you really want to disable authentication prompts?\n\n' +
          'This will give the website access to all browser extension exclusive APIs, which is extremely dangerous if they are used incorrectly or malicously.'
      )
    ) {
      noAuth = true;
      return;
    }
    throw new Error('Disabling authentication was not authenticated.');
  },
  _enableAuth: () => {
    noAuth = false;
  },
  _priv: privilegedPageContextUtils,
  isElementEditable,
  stringifyNode,
  getNodePath,
};

addToGlobalThis('writeToPageContext', writeToPageContext);
addToGlobalThis('___puu', pageContextUtils);
addToGlobalThis('bgRun', bgRun);
addToGlobalThis('getNodePath', getNodePath);
addToGlobalThis('isElementEditable', isElementEditable);
addToGlobalThis('qs', qs);
addToGlobalThis('qsa', qsa);
addToGlobalThis('stringifyNode', stringifyNode);

writeToPageContext('___puu', pageContextUtils);
