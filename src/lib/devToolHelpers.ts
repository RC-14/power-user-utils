import type { JSONValue } from './json';
import { qs, qsa, sendRuntimeMessage } from '/src/lib/utils';

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

let noAuth = false;

const pageContextUtils = {
  disableAuth: () => {
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
  enableAuth: () => {
    noAuth = false;
  },
  getPriviligedBgRun: () => {
    if (
      confirm(
        'Do you really want to allow the creation of a privileged bgRun wrapper?\n\n' +
          'This will give the context with access to the wrapper (and potentially the whole website) access to all browser extension exclusive APIs, which is extremely dangerous if they are used incorrectly or malicously.'
      )
    ) {
      // @ts-ignore
      const unsafeWindow = window.wrappedJSObject ?? window;

      return exportFunction(
        (func: string, params: JSONValue[]) => {
          console.warn(
            'A priviliged bgRun wrapper was called with the following arguments:',
            func,
            params,
            'Stringified: ' + JSON.stringify(func) + ' ' + JSON.stringify(params)
          );

          const promise = bgRun(func, params);
          return new window.Promise((resolve) =>
            promise
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

    throw new Error('Creation of a priviliged wrapper for bgRun was not authenticated.');
  },
  bgRun: (func: string, params: JSONValue[]): Promise<unknown> => {
    const strFunc = JSON.stringify(func);
    const strParams = JSON.stringify(params);

    if (
      !noAuth &&
      !confirm(
        'Do you want to allow this call to bgRun?\n\n' +
          "Don't accept if it wasn't made by you!\nIncorrect or malicious use of bgRun can be extremely dangerous!\n\n" +
          'Arguments to be passed to bgRun:\n\n' +
          strFunc +
          '\n\n' +
          strParams
      )
    ) {
      throw new Error('Call to bgRun was not authenticated.');
    }

    if (noAuth) {
      console.warn(
        'Authentication was not required for a call to bgRun whith the following arguments:',
        func,
        params,
        'Stringified: ' + strFunc + ' ' + strParams
      );
    }

    // @ts-ignore
    const unsafeWindow = window.wrappedJSObject ?? window;

    const promise = bgRun(func, params);
    return new window.Promise((resolve) =>
      promise
        .then((v) => {
          resolve(cloneInto(v, unsafeWindow));
        })
        .catch((e) => {
          resolve(cloneInto(e, unsafeWindow));
        })
    );
  },
};

addToGlobalThis('writeToPageContext', writeToPageContext);
addToGlobalThis('bgRun', bgRun);
addToGlobalThis('___puu', pageContextUtils);
addToGlobalThis('qs', qs);
addToGlobalThis('qsa', qsa);

writeToPageContext('___puu', pageContextUtils);
