import type { BackgroundFragment } from '/src/lib/backgroundFragment';

const fragment: BackgroundFragment = {
  runtimeMessageHandler: async (msg, data, sender) => {
    if (msg !== 'run') throw new Error('The only supported message type is "run". Got: "' + msg + '"');

    if (
      data === null ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      !('func' in data && 'params' in data) ||
      typeof data.func !== 'string' ||
      typeof data.params !== 'object' ||
      !Array.isArray(data.params)
    )
      throw new Error('Malformed message data.');

    try {
      const parts = data.func.split('.');
      const that = parts.slice(0, -1).reduce((acc: unknown, cur): unknown => {
        // @ts-ignore - Errors will be caught, and are intentionally allowed here
        return acc[cur];
      }, globalThis);

      // @ts-ignore - Same as above
      return await that[parts.at(-1)].call(that, ...data.params);
    } catch (e) {
      return e;
    }
  },
};

export default fragment;
