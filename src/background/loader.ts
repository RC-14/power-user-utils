import { runtime, type Runtime } from 'webextension-polyfill';
import type { BackgroundFragment, InstalledHandler, StartupHandler } from '/src/lib/backgroundFragment';
import type { ExternalRuntimeMessageHandler, RuntimeMessageHandler } from '/src/lib/runtimeMessages';
import { RuntimeMessageSchema } from '/src/lib/runtimeMessages';
/*
 * Background fragments
 */
import bgRun from './bgRun';
import fullscreenOnStartup from './fullscreenOnStartup';
import pagePatches from './pagePatches';
import whoami from './whoami';

const fragments: Map<string, BackgroundFragment> = new Map();
fragments.set('bgRun', bgRun);
fragments.set('fullscreenOnStartup', fullscreenOnStartup);
fragments.set('pagePatches', pagePatches);
fragments.set('whoami', whoami);

/*
 * Register Handlers
 */

const installedHandlers = new Map<string, InstalledHandler>();
const startupHandlers = new Map<string, StartupHandler>();
const runtimeMessageHandlers = new Map<string, RuntimeMessageHandler>();
const externalRuntimeMessageHandlers = new Map<string, ExternalRuntimeMessageHandler>();

for (const id of fragments.keys()) {
  const fragment = fragments.get(id)!;

  if (fragment.startupHandler) startupHandlers.set(id, fragment.startupHandler);
  if (fragment.runtimeMessageHandler) runtimeMessageHandlers.set(id, fragment.runtimeMessageHandler);
  if (fragment.externalRuntimeMessageHandler) externalRuntimeMessageHandlers.set(id, fragment.externalRuntimeMessageHandler);
}

/*
 * Add Listeners
 */

runtime.onInstalled.addListener((details) => {
  for (const handler of installedHandlers.values()) {
    handler(details);
  }
});

runtime.onStartup.addListener(() => {
  for (const handler of startupHandlers.values()) {
    handler();
  }
});

runtime.onMessage.addListener(async (request: unknown, sender: Runtime.MessageSender) => {
  const { target, fragmentId, msg, data } = RuntimeMessageSchema.parse(request);

  if (target !== 'background') return;
  if (!runtimeMessageHandlers.has(fragmentId)) throw new Error(`No handler for: ${fragmentId}`);

  return await runtimeMessageHandlers.get(fragmentId)!(msg, data, sender);
});

runtime.onMessageExternal.addListener(async (message: unknown, sender: Runtime.MessageSender) => {
  let answer: unknown;

  for (const handler of externalRuntimeMessageHandlers.values()) {
    const result = handler(message, sender, answer);

    if (result) {
      if ('answer' in result) answer = result.answer;
      if (!result.continueProcessing) break;
    }
  }

  return answer;
});
