import { webRequest, type WebRequest } from 'webextension-polyfill';
import eventTypeToPatcherMapMap from './patchers';
import type { BackgroundFragment } from '/src/lib/backgroundFragment';
import type {
  DomainToPatcherMap,
  EventNames,
  EventNameToDetailsType,
  EventNameToEventType,
  PatchHandler,
} from '/src/lib/pagePatches';

const getExtraInfoSpecForEvent = <T extends EventNames>(
  event: EventNameToEventType<T>
):
  | WebRequest.OnBeforeRequestOptions[]
  | WebRequest.OnBeforeSendHeadersOptions[]
  | WebRequest.OnSendHeadersOptions[]
  | WebRequest.OnHeadersReceivedOptions[]
  | WebRequest.OnBeforeRedirectOptions[]
  | WebRequest.OnAuthRequiredOptions[]
  | WebRequest.OnResponseStartedOptions[]
  | WebRequest.OnCompletedOptions[]
  | [] => {
  switch (event) {
    case webRequest.onBeforeRequest:
      return ['blocking', 'requestBody'];

    case webRequest.onBeforeSendHeaders:
      return ['blocking', 'requestHeaders'];

    case webRequest.onSendHeaders:
      return ['requestHeaders'];

    case webRequest.onHeadersReceived:
      return ['blocking', 'responseHeaders'];

    case webRequest.onBeforeRedirect:
      return ['responseHeaders'];

    case webRequest.onAuthRequired:
      return ['asyncBlocking'];

    case webRequest.onResponseStarted:
      return ['responseHeaders'];

    case webRequest.onCompleted:
      return ['responseHeaders'];

    default:
      return [];
  }
};

const registerListener = <T extends EventNames>(event: EventNameToEventType<T>, domainToPatcherMap: DomainToPatcherMap<T>) =>
  event.addListener(
    // @ts-ignore TS sadly fucks up the types and their recognition so badly that this is necessary
    async (details: EventNameToDetailsType<T>, asyncCallback: (res: WebRequest.BlockingResponse) => void | undefined) => {
      const url = new URL(details.url);

      const hostDomain = url.hostname.split('.').slice(-2).join('.');
      const patcher = domainToPatcherMap.get(hostDomain);
      const result = patcher ? await patcher(details) : undefined;

      if (asyncCallback) {
        asyncCallback(result ?? {});
        return;
      }
      return result;
    },
    { urls: ['<all_urls>'] },
    getExtraInfoSpecForEvent(event)
  );

registerListener(webRequest.onBeforeRequest, eventTypeToPatcherMapMap.beforeRequest);
registerListener(webRequest.onBeforeSendHeaders, eventTypeToPatcherMapMap.beforeSendHeaders);
registerListener(webRequest.onSendHeaders, eventTypeToPatcherMapMap.sendHeaders);
registerListener(webRequest.onHeadersReceived, eventTypeToPatcherMapMap.headersReceived);
registerListener(webRequest.onBeforeRedirect, eventTypeToPatcherMapMap.beforeRedirect);
registerListener(webRequest.onAuthRequired, eventTypeToPatcherMapMap.authRequired);
registerListener(webRequest.onResponseStarted, eventTypeToPatcherMapMap.responseStarted);
registerListener(webRequest.onCompleted, eventTypeToPatcherMapMap.completed);

Object.defineProperty(globalThis, 'pagePatches', {
  configurable: false,
  enumerable: true,
  writable: false,
  value: {
    addPatchForDomain: <T extends EventNames>(domain: string, type: T, patcher: PatchHandler<T>) => {
      if (!(typeof domain === 'string' && typeof type === 'string' && typeof patcher === 'function'))
        throw new Error('Malformed arguments: wrong type');
      if (
        ![
          'beforeRequest',
          'beforeSendHeaders',
          'sendHeaders',
          'headersReceived',
          'beforeRedirect',
          'authRequired',
          'responseStarted',
          'completed',
        ].includes(type)
      )
        throw new Error("Malformed arguments: type isn't a valid event name");

      // @ts-ignore part 2 of the above mentioned type problems
      eventTypeToPatcherMapMap[type].set(domain, patcher);
    },
    hasPatchForDomain: (domain: string, type?: EventNames) => {
      if (!(typeof domain === 'string' && (type == undefined || typeof type === 'string')))
        throw new Error('Malformed arguments: wrong type');
      if (
        typeof type === 'string' &&
        ![
          'beforeRequest',
          'beforeSendHeaders',
          'sendHeaders',
          'headersReceived',
          'beforeRedirect',
          'authRequired',
          'responseStarted',
          'completed',
        ].includes(type)
      )
        throw new Error("Malformed arguments: type isn't a valid event name or undefined");

      if (type != undefined) {
        return eventTypeToPatcherMapMap[type].has(domain);
      }

      let result: boolean = false;
      for (const type of [
        'beforeRequest',
        'beforeSendHeaders',
        'sendHeaders',
        'headersReceived',
        'beforeRedirect',
        'authRequired',
        'responseStarted',
        'completed',
      ] as const) {
        result = result || eventTypeToPatcherMapMap[type].has(domain);
      }
      return result;
    },
    getAllPatches: () => ({
      beforeRequest: Object.fromEntries(eventTypeToPatcherMapMap['beforeRequest'].entries()),
      beforeSendHeaders: Object.fromEntries(eventTypeToPatcherMapMap['beforeSendHeaders'].entries()),
      sendHeaders: Object.fromEntries(eventTypeToPatcherMapMap['sendHeaders'].entries()),
      headersReceived: Object.fromEntries(eventTypeToPatcherMapMap['headersReceived'].entries()),
      beforeRedirect: Object.fromEntries(eventTypeToPatcherMapMap['beforeRedirect'].entries()),
      authRequired: Object.fromEntries(eventTypeToPatcherMapMap['authRequired'].entries()),
      responseStarted: Object.fromEntries(eventTypeToPatcherMapMap['responseStarted'].entries()),
      completed: Object.fromEntries(eventTypeToPatcherMapMap['completed'].entries()),
    }),
    removePatchForDomain: (domain: string, type?: EventNames) => {
      if (!(typeof domain === 'string' && (type == undefined || typeof type === 'string')))
        throw new Error('Malformed arguments: wrong type');
      if (
        typeof type === 'string' &&
        ![
          'beforeRequest',
          'beforeSendHeaders',
          'sendHeaders',
          'headersReceived',
          'beforeRedirect',
          'authRequired',
          'responseStarted',
          'completed',
        ].includes(type)
      )
        throw new Error("Malformed arguments: type isn't a valid event name or undefined");

      if (type != undefined) {
        return eventTypeToPatcherMapMap[type].delete(domain);
      }

      let result: boolean = false;
      for (const type of [
        'beforeRequest',
        'beforeSendHeaders',
        'sendHeaders',
        'headersReceived',
        'beforeRedirect',
        'authRequired',
        'responseStarted',
        'completed',
      ] as const) {
        result = result || eventTypeToPatcherMapMap[type].delete(domain);
      }
      return result;
    },
  },
});

const fragment: BackgroundFragment = {};
export default fragment;
