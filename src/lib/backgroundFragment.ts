import type { Runtime } from 'webextension-polyfill';
import type { ExternalRuntimeMessageHandler, RuntimeMessageHandler } from './runtimeMessages';

export type InstalledHandler = (details: Runtime.OnInstalledDetailsType) => void;
export type StartupHandler = () => void;

export interface BackgroundFragment {
  installedHandler?: InstalledHandler;
  startupHandler?: StartupHandler;
  runtimeMessageHandler?: RuntimeMessageHandler;
  externalRuntimeMessageHandler?: ExternalRuntimeMessageHandler;
}
