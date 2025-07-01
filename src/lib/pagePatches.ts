import type { WebRequest } from 'webextension-polyfill';

export type EventNames =
  | 'beforeRequest'
  | 'beforeSendHeaders'
  | 'sendHeaders'
  | 'headersReceived'
  | 'beforeRedirect'
  | 'authRequired'
  | 'responseStarted'
  | 'completed';

export type EventNameToEventType<T extends EventNames> = {
  beforeRequest: WebRequest.OnBeforeRequestEvent;
  beforeSendHeaders: WebRequest.OnBeforeSendHeadersEvent;
  sendHeaders: WebRequest.OnSendHeadersEvent;
  headersReceived: WebRequest.OnHeadersReceivedEvent;
  beforeRedirect: WebRequest.OnBeforeRedirectEvent;
  authRequired: WebRequest.OnAuthRequiredEvent;
  responseStarted: WebRequest.OnResponseStartedEvent;
  completed: WebRequest.OnCompletedEvent;
}[T];

export type EventNameToDetailsType<T extends EventNames> = {
  beforeRequest: WebRequest.OnBeforeRequestDetailsType;
  beforeSendHeaders: WebRequest.OnBeforeSendHeadersDetailsType;
  sendHeaders: WebRequest.OnSendHeadersDetailsType;
  headersReceived: WebRequest.OnHeadersReceivedDetailsType;
  beforeRedirect: WebRequest.OnBeforeRedirectDetailsType;
  authRequired: WebRequest.OnAuthRequiredDetailsType;
  responseStarted: WebRequest.OnResponseStartedDetailsType;
  completed: WebRequest.OnCompletedDetailsType;
}[T];

export type PatchHandler<T extends EventNames> = (
  details: EventNameToDetailsType<T>
) => WebRequest.BlockingResponseOrPromiseOrVoid;

export type PagePatcher = {
  beforeRequest?: PatchHandler<'beforeRequest'>;
  beforeSendHeaders?: PatchHandler<'beforeSendHeaders'>;
  sendHeaders?: PatchHandler<'sendHeaders'>;
  headersReceived?: PatchHandler<'headersReceived'>;
  beforeRedirect?: PatchHandler<'beforeRedirect'>;
  authRequired?: PatchHandler<'authRequired'>;
  responseStarted?: PatchHandler<'responseStarted'>;
  completed?: PatchHandler<'completed'>;
};

export type DomainToPatcherMap<T extends EventNames> = Map<string, PatchHandler<T>>;

export type EventTypeToPatcherMapMap = {
  beforeRequest?: DomainToPatcherMap<'beforeRequest'>;
  beforeSendHeaders?: DomainToPatcherMap<'beforeSendHeaders'>;
  sendHeaders?: DomainToPatcherMap<'sendHeaders'>;
  headersReceived?: DomainToPatcherMap<'headersReceived'>;
  beforeRedirect?: DomainToPatcherMap<'beforeRedirect'>;
  authRequired?: DomainToPatcherMap<'authRequired'>;
  responseStarted?: DomainToPatcherMap<'responseStarted'>;
  completed?: DomainToPatcherMap<'completed'>;
};
