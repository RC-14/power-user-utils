import type { EventTypeToPatcherMapMap, PagePatcher } from '/src/lib/pagePatches';

const domainToPatcherMaps: EventTypeToPatcherMapMap = {};

const toBeRegistered: [string, PagePatcher][] = [
  /*['example.com', example]*/
];

for (const pagePatcher of toBeRegistered) {
  if (pagePatcher[1].beforeRequest) {
    if (!domainToPatcherMaps.beforeRequest) domainToPatcherMaps.beforeRequest = new Map();
    domainToPatcherMaps.beforeRequest.set(pagePatcher[0], pagePatcher[1].beforeRequest);
  }
  if (pagePatcher[1].beforeSendHeaders) {
    if (!domainToPatcherMaps.beforeSendHeaders) domainToPatcherMaps.beforeSendHeaders = new Map();
    domainToPatcherMaps.beforeSendHeaders.set(pagePatcher[0], pagePatcher[1].beforeSendHeaders);
  }
  if (pagePatcher[1].sendHeaders) {
    if (!domainToPatcherMaps.sendHeaders) domainToPatcherMaps.sendHeaders = new Map();
    domainToPatcherMaps.sendHeaders.set(pagePatcher[0], pagePatcher[1].sendHeaders);
  }
  if (pagePatcher[1].headersReceived) {
    if (!domainToPatcherMaps.headersReceived) domainToPatcherMaps.headersReceived = new Map();
    domainToPatcherMaps.headersReceived.set(pagePatcher[0], pagePatcher[1].headersReceived);
  }
  if (pagePatcher[1].beforeRedirect) {
    if (!domainToPatcherMaps.beforeRedirect) domainToPatcherMaps.beforeRedirect = new Map();
    domainToPatcherMaps.beforeRedirect.set(pagePatcher[0], pagePatcher[1].beforeRedirect);
  }
  if (pagePatcher[1].authRequired) {
    if (!domainToPatcherMaps.authRequired) domainToPatcherMaps.authRequired = new Map();
    domainToPatcherMaps.authRequired.set(pagePatcher[0], pagePatcher[1].authRequired);
  }
  if (pagePatcher[1].responseStarted) {
    if (!domainToPatcherMaps.responseStarted) domainToPatcherMaps.responseStarted = new Map();
    domainToPatcherMaps.responseStarted.set(pagePatcher[0], pagePatcher[1].responseStarted);
  }
  if (pagePatcher[1].completed) {
    if (!domainToPatcherMaps.completed) domainToPatcherMaps.completed = new Map();
    domainToPatcherMaps.completed.set(pagePatcher[0], pagePatcher[1].completed);
  }
}

export default domainToPatcherMaps;
