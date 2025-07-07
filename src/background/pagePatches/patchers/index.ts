import type { EventTypeToPatcherMapMap, PagePatcher } from '/src/lib/pagePatches';

const domainToPatcherMaps: EventTypeToPatcherMapMap = {
  beforeRequest: new Map(),
  beforeSendHeaders: new Map(),
  sendHeaders: new Map(),
  headersReceived: new Map(),
  beforeRedirect: new Map(),
  authRequired: new Map(),
  responseStarted: new Map(),
  completed: new Map(),
};

const toBeRegistered: [string, PagePatcher][] = [
  /*['example.com', example]*/
];

for (const pagePatcher of toBeRegistered) {
  if (pagePatcher[1].beforeRequest) domainToPatcherMaps.beforeRequest.set(pagePatcher[0], pagePatcher[1].beforeRequest);
  if (pagePatcher[1].beforeSendHeaders)
    domainToPatcherMaps.beforeSendHeaders.set(pagePatcher[0], pagePatcher[1].beforeSendHeaders);
  if (pagePatcher[1].sendHeaders) domainToPatcherMaps.sendHeaders.set(pagePatcher[0], pagePatcher[1].sendHeaders);
  if (pagePatcher[1].headersReceived) domainToPatcherMaps.headersReceived.set(pagePatcher[0], pagePatcher[1].headersReceived);
  if (pagePatcher[1].beforeRedirect) domainToPatcherMaps.beforeRedirect.set(pagePatcher[0], pagePatcher[1].beforeRedirect);
  if (pagePatcher[1].authRequired) domainToPatcherMaps.authRequired.set(pagePatcher[0], pagePatcher[1].authRequired);
  if (pagePatcher[1].responseStarted) domainToPatcherMaps.responseStarted.set(pagePatcher[0], pagePatcher[1].responseStarted);
  if (pagePatcher[1].completed) domainToPatcherMaps.completed.set(pagePatcher[0], pagePatcher[1].completed);
}

export default domainToPatcherMaps;
