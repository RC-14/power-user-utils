import type { BackgroundFragment } from '/src/lib/backgroundFragment';

const fragment: BackgroundFragment = {
  runtimeMessageHandler: async (msg, data, sender) => {
    if (msg !== 'whoami') throw new Error('The only supported message type is "whoamo". Got: "' + msg + '"');

    return {
      frameId: sender.frameId,
      id: sender.id,
      tab:
        sender.tab == null
          ? undefined
          : {
              active: sender.tab.active,
              cookieStoreId: sender.tab.cookieStoreId,
              groupId: sender.tab.groupId,
              hidden: sender.tab.hidden,
              id: sender.tab.id,
              incognito: sender.tab.incognito,
              index: sender.tab.index,
              openerTabId: sender.tab.openerTabId,
              successorTabId: sender.tab.successorTabId,
              title: sender.tab.title,
              url: sender.tab.url,
              windowId: sender.tab.windowId,
            },
      url: sender.url,
      userScriptWorldId: sender.userScriptWorldId,
    };
  },
};

export default fragment;
