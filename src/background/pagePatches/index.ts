import { webRequest, type WebRequest } from 'webextension-polyfill';
import eventTypeToPatcherMapMap from './patchers';
import type { BackgroundFragment } from '/src/lib/backgroundFragment';
import type { DomainToPatcherMap, EventNames, EventNameToDetailsType, EventNameToEventType } from '/src/lib/pagePatches';

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
      return ['blocking', 'asyncBlocking'];

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
    (details: EventNameToDetailsType<T>) => {
      const url = new URL(details.url);

      const hostDomain = url.hostname.split('.').slice(-2).join('.');
      const patcher = domainToPatcherMap.get(hostDomain);
      if (typeof patcher !== 'function') return undefined;

      return patcher(details);
    },
    { urls: ['<all_urls>'] },
    getExtraInfoSpecForEvent(event)
  );

if (eventTypeToPatcherMapMap.beforeRequest) {
  registerListener(webRequest.onBeforeRequest, eventTypeToPatcherMapMap.beforeRequest);
}
if (eventTypeToPatcherMapMap.beforeSendHeaders) {
  registerListener(webRequest.onBeforeSendHeaders, eventTypeToPatcherMapMap.beforeSendHeaders);
}
if (eventTypeToPatcherMapMap.sendHeaders) {
  registerListener(webRequest.onSendHeaders, eventTypeToPatcherMapMap.sendHeaders);
}
if (eventTypeToPatcherMapMap.headersReceived) {
  registerListener(webRequest.onHeadersReceived, eventTypeToPatcherMapMap.headersReceived);
}
if (eventTypeToPatcherMapMap.beforeRedirect) {
  registerListener(webRequest.onBeforeRedirect, eventTypeToPatcherMapMap.beforeRedirect);
}
if (eventTypeToPatcherMapMap.authRequired) {
  registerListener(webRequest.onAuthRequired, eventTypeToPatcherMapMap.authRequired);
}
if (eventTypeToPatcherMapMap.responseStarted) {
  registerListener(webRequest.onResponseStarted, eventTypeToPatcherMapMap.responseStarted);
}
if (eventTypeToPatcherMapMap.completed) {
  registerListener(webRequest.onCompleted, eventTypeToPatcherMapMap.completed);
}

const fragment: BackgroundFragment = {};
export default fragment;
