import type { Runtime } from 'webextension-polyfill';
import z from 'zod';
import { JSONValueSchema } from './json';

export const RuntimeMessageSchema = z.object({
  target: z.enum(['content', 'popup', 'sidebar', 'page', 'devtools', 'options', 'background']),
  fragmentId: z.string().min(1),
  msg: z.string().nullable(),
  data: JSONValueSchema.optional(),
});

export type RuntimeMessage = z.infer<typeof RuntimeMessageSchema>;

export type RuntimeMessageHandler = (
  msg: RuntimeMessage['msg'],
  data: RuntimeMessage['data'],
  sender: Runtime.MessageSender
) => void | RuntimeMessage['data'] | Promise<void | RuntimeMessage['data']>;

export type ExternalRuntimeMessageHandler = (
  msg: unknown,
  sender: Runtime.MessageSender,
  currentAnswer?: unknown
) => void | { continueProcessing: boolean; answer?: unknown };
