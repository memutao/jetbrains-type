'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

function createMock() {
  const state = {
    workbench: {
      colorTheme: 'Default Dark Modern',
      iconTheme: 'vs-seti',
      productIconTheme: 'codicon',
      'list.smoothScrolling': false,
      'editor.tabSizing': 'fit',
      'editor.tabCloseButton': 'left',
      'editor.highlightModifiedTabs': false,
      'editor.enablePreview': true
    },
    jetbrainsType: {
      keymapEnabled: true,
      statusBarEnabled: true
    },
    editor: {
      fontFamily: 'Menlo, monospace',
      fontLigatures: false,
      'minimap.enabled': true,
      renderWhitespace: 'none',
      cursorBlinking: 'blink',
      smoothScrolling: false,
      'bracketPairColorization.enabled': true,
      'guides.bracketPairs': false,
      occurrencesHighlight: 'singleFile',
      selectionHighlight: true
    },
    'workbench.tree': {
      indent: 8,
      renderIndentGuides: 'onHover'
    },
    explorer: {
      compactFolders: true
    }
  };
  const flatSettings = {
    'editor.fontFamily': 'Menlo, monospace',
    'editor.fontLigatures': false,
    'editor.minimap.enabled': true,
    'editor.renderWhitespace': 'none',
    'editor.cursorBlinking': 'blink',
    'editor.smoothScrolling': false,
    'editor.bracketPairColorization.enabled': true,
    'editor.guides.bracketPairs': false,
    'editor.occurrencesHighlight': 'singleFile',
    'editor.selectionHighlight': true,
    'workbench.list.smoothScrolling': false,
    'workbench.tree.indent': 8,
    'workbench.tree.renderIndentGuides': 'onHover',
    'workbench.editor.tabSizing': 'fit',
    'workbench.editor.tabCloseButton': 'left',
    'workbench.editor.highlightModifiedTabs': false,
    'workbench.editor.enablePreview': true,
    'explorer.compactFolders': true
  };
  const workspaceOverrides = new Map();
  const workspaceFolderOverrides = new Map();
  const updates = [];
  const messages = [];
  const errors = [];
  const executedCommands = [];
  const handlers = new Map();
  const panels = [];
  const statusBarItems = [];
  const configListeners = [];
  const globalState = new Map();
  let quickPickChoice;
  const openedUrls = [];

  const makeRootConfig = () => ({
    get(key, fallback) {
      return Object.prototype.hasOwnProperty.call(flatSettings, key)
        ? flatSettings[key]
        : fallback;
    },
    inspect(key) {
      return {
        key,
        defaultValue: undefined,
        globalValue: flatSettings[key],
        workspaceValue: workspaceOverrides.get(key),
        workspaceFolderValue: undefined
      };
    },
    async update(key, value) {
      if (value === undefined) delete flatSettings[key];
      else flatSettings[key] = value;
      updates.push({ section: '(root)', key, value });
    }
  });

  const makeConfig = (section, scope) => {
    const scopeKey = scope?.fsPath ?? scope;
    return {
    get(key, fallback) {
      const workspaceFolderValue = scopeKey
        ? workspaceFolderOverrides.get(`${scopeKey}:${section}.${key}`)
        : undefined;
      if (workspaceFolderValue !== undefined) return workspaceFolderValue;
      const workspaceValue = workspaceOverrides.get(`${section}.${key}`);
      if (workspaceValue !== undefined) return workspaceValue;
      const values = state[section] || {};
      return Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : fallback;
    },
    inspect(key) {
      const values = state[section] || {};
      return {
        key,
        defaultValue: section === 'jetbrainsType' ? true : undefined,
        globalValue: values[key],
        workspaceValue: workspaceOverrides.get(`${section}.${key}`),
        workspaceFolderValue: scopeKey
          ? workspaceFolderOverrides.get(`${scopeKey}:${section}.${key}`)
          : undefined
      };
    },
    async update(key, value, target) {
      if (target === 3 && scope) {
        const folderKey = `${scopeKey}:${section}.${key}`;
        if (value === undefined) workspaceFolderOverrides.delete(folderKey);
        else workspaceFolderOverrides.set(folderKey, value);
        updates.push({ section, key, value, target, scope: scopeKey });
        return;
      }
      if (target === 2) {
        if (value === undefined) workspaceOverrides.delete(`${section}.${key}`);
        else workspaceOverrides.set(`${section}.${key}`, value);
        updates.push({ section, key, value, target });
        return;
      }
      state[section] = state[section] || {};
      if (value === undefined) {
        delete state[section][key];
      } else {
        state[section][key] = value;
      }
      updates.push({ section, key, value, target });
    }
    };
  };

  const vscode = {
    ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
    StatusBarAlignment: { Left: 1, Right: 2 },
    ViewColumn: { Active: -1 },
    Uri: {
      joinPath(uri, ...parts) {
        return { fsPath: [uri.fsPath, ...parts].join('/') };
      },
      parse(value) {
        return { toString: () => value };
      }
    },
    env: {
      async openExternal(uri) {
        openedUrls.push(uri.toString());
        return true;
      }
    },
    commands: {
      registerCommand(id, handler) {
        handlers.set(id, handler);
        return { dispose() {} };
      },
      async executeCommand(id, ...args) {
        executedCommands.push({ id, args });
        return undefined;
      }
    },
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/tmp/project' } }],
      getConfiguration(section, scope) {
        return section ? makeConfig(section, scope) : makeRootConfig();
      },
      onDidChangeConfiguration(listener) {
        configListeners.push(listener);
        return { dispose() {} };
      }
    },
    window: {
      async showInformationMessage(message, ...items) {
        messages.push({ type: 'info', message, items });
        return undefined;
      },
      async showErrorMessage(message, ...items) {
        errors.push({ type: 'error', message, items });
        return undefined;
      },
      async showQuickPick(items) {
        if (typeof quickPickChoice === 'function') {
          return quickPickChoice(items);
        }
        return quickPickChoice;
      },
      createStatusBarItem(alignment, priority) {
        const item = {
          alignment,
          priority,
          text: '',
          tooltip: '',
          command: undefined,
          visible: false,
          disposed: false,
          show() {
            this.visible = true;
          },
          hide() {
            this.visible = false;
          },
          dispose() {
            this.disposed = true;
          }
        };
        statusBarItems.push(item);
        return item;
      },
      createWebviewPanel(viewType, title, column, options) {
        const disposeHandlers = [];
        const messageHandlers = [];
        const postedMessages = [];
        const panel = {
          viewType,
          title,
          column,
          options,
          webview: {
            cspSource: 'vscode-resource:',
            html: '',
            postedMessages,
            onDidReceiveMessage(handler) {
              messageHandlers.push(handler);
              return { dispose() {} };
            },
            async postMessage(message) {
              postedMessages.push(message);
              return true;
            },
            emitMessage(message) {
              return Promise.all(messageHandlers.map((handler) => handler(message)));
            }
          },
          iconPath: undefined,
          revealed: false,
          disposed: false,
          reveal(revealColumn) {
            this.revealed = true;
            this.revealedColumn = revealColumn;
          },
          onDidDispose(handler) {
            disposeHandlers.push(handler);
            return { dispose() {} };
          },
          dispose() {
            if (this.disposed) return;
            this.disposed = true;
            for (const handler of disposeHandlers) handler();
          }
        };
        panels.push(panel);
        return panel;
      }
    }
  };

  const context = {
    subscriptions: [],
    extensionUri: { fsPath: '/tmp/jetbrains_type' },
    globalState: {
      get(key, fallback) {
        return globalState.has(key) ? globalState.get(key) : fallback;
      },
      async update(key, value) {
        if (value === undefined) globalState.delete(key);
        else globalState.set(key, value);
      }
    }
  };

  return {
    vscode,
    context,
    state,
    workspaceOverrides,
    workspaceFolderOverrides,
    updates,
    messages,
    errors,
    executedCommands,
    handlers,
    panels,
    statusBarItems,
    configListeners,
    globalState,
    flatSettings,
    openedUrls,
    setQuickPickChoice(value) {
      quickPickChoice = value;
    }
  };
}

function loadExtension(mock) {
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'vscode') return mock.vscode;
    return originalLoad.call(this, request, parent, isMain);
  };
  const entry = require.resolve('../src/extension.js');
  delete require.cache[entry];
  try {
    return require(entry);
  } finally {
    Module._load = originalLoad;
  }
}

async function setup() {
  const mock = createMock();
  const extension = loadExtension(mock);
  extension.activate(mock.context);
  return { mock, extension };
}

test('注册全部命令', async () => {
  const { mock } = await setup();
  assert.deepEqual(
    [...mock.handlers.keys()].sort(),
    [
      'jetbrainsType.applyLook',
      'jetbrainsType.applyUiSettings',
      'jetbrainsType.openKeybindings',
      'jetbrainsType.revertLook',
      'jetbrainsType.revertUiSettings',
      'jetbrainsType.showCheatSheet',
      'jetbrainsType.toggleKeymap'
    ]
  );
});

test('应用外观：保存原外观并写入主题与图标', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.applyLook')();

  assert.deepEqual(mock.globalState.get('jetbrainsType.previousLook'), {
    colorTheme: 'Default Dark Modern',
    iconTheme: 'vs-seti',
    productIconTheme: 'codicon',
    savedAt: mock.globalState.get('jetbrainsType.previousLook').savedAt
  });
  assert.match(mock.globalState.get('jetbrainsType.previousLook').savedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(mock.state.workbench.colorTheme, 'JetBrains Type New UI Dark');
  assert.equal(mock.state.workbench.iconTheme, 'jetbrains-type-file-icons');
  assert.equal(mock.state.workbench.productIconTheme, 'jetbrains-type-idea-icons');
  assert.equal(mock.messages.at(-1).message.includes('已应用 JetBrains Type New UI Dark'), true);
});

test('恢复外观：还原主题、图标并清空记录', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.applyLook')();
  await mock.handlers.get('jetbrainsType.revertLook')();

  assert.equal(mock.state.workbench.colorTheme, 'Default Dark Modern');
  assert.equal(mock.state.workbench.iconTheme, 'vs-seti');
  assert.equal(mock.state.workbench.productIconTheme, 'codicon');
  assert.equal(mock.globalState.has('jetbrainsType.previousLook'), false);
  assert.match(mock.messages.at(-1).message, /已恢复应用前的外观/);
});

test('恢复外观：没有历史记录时给出提示', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.revertLook')();
  assert.match(mock.messages.at(-1).message, /没有保存过应用前的外观/);
});

test('恢复外观：保留 null 图标设置，undefined 则删除覆盖', async () => {
  const { mock } = await setup();
  delete mock.state.workbench.iconTheme;
  mock.state.workbench.productIconTheme = null;
  mock.globalState.set('jetbrainsType.previousLook', {
    colorTheme: 'Default Dark Modern',
    productIconTheme: null
  });

  await mock.handlers.get('jetbrainsType.revertLook')();

  assert.equal('iconTheme' in mock.state.workbench, false);
  assert.equal(mock.state.workbench.productIconTheme, null);
});

test('快捷键开关：可以关闭并重新启用', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.toggleKeymap')();
  assert.equal(mock.state.jetbrainsType.keymapEnabled, false);
  assert.match(mock.messages.at(-1).message, /已关闭 JetBrains 快捷键/);

  await mock.handlers.get('jetbrainsType.toggleKeymap')();
  assert.equal(mock.state.jetbrainsType.keymapEnabled, true);
  assert.match(mock.messages.at(-1).message, /已启用 JetBrains 快捷键/);
});

test('快捷键开关：同步更新 workspaceFolder 覆盖', async () => {
  const { mock } = await setup();
  const folderKey = '/tmp/project:jetbrainsType.keymapEnabled';
  mock.workspaceFolderOverrides.set(folderKey, true);

  await mock.handlers.get('jetbrainsType.toggleKeymap')();

  assert.equal(mock.workspaceFolderOverrides.get(folderKey), false);
  assert.equal(mock.state.jetbrainsType.keymapEnabled, false);
});

test('应用外观：工作区覆盖时给出警告', async () => {
  const { mock } = await setup();
  mock.workspaceOverrides.set('workbench.colorTheme', 'Workspace Theme');
  await mock.handlers.get('jetbrainsType.applyLook')();
  assert.match(mock.messages.at(-1).message, /工作区覆盖/);
  assert.match(mock.messages.at(-1).message, /colorTheme/);
});

test('打开快捷键设置：带上扩展过滤条件', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.openKeybindings')();
  assert.deepEqual(mock.executedCommands.at(-1), {
    id: 'workbench.action.openGlobalKeybindings',
    args: ['@ext:mutao.jetbrains-type']
  });
});

test('速查表：创建 Webview 并渲染分类、按键和 CSP', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.showCheatSheet')();

  assert.equal(mock.panels.length, 1);
  const panel = mock.panels[0];
  assert.equal(panel.viewType, 'jetbrainsType.cheatSheet');
  assert.equal(panel.webview.html.includes('快捷键速查表'), true);
  assert.equal(panel.webview.html.includes('项目视图'), true);
  assert.equal(panel.webview.html.includes('⌘1'), true);
  assert.equal(panel.webview.html.includes('Ctrl+Shift+A'), true);
  assert.equal(panel.webview.html.includes("Content-Security-Policy"), true);
  assert.equal(panel.webview.html.includes('id="cat-'), true);
  assert.equal(panel.iconPath.fsPath.endsWith('assets/icon.png'), true);
});

test('速查表：HTML 会转义用户可见文本', async () => {
  const { extension } = await setup();
  const groups = [
    {
      category: '测试',
      title: '<script>alert(1)</script>',
      key: 'ctrl+a',
      mac: 'cmd+a',
      bindings: [{ command: 'test.command', when: 'editorFocus' }]
    }
  ];
  const html = extension._buildCheatSheetHtml(groups, 'darwin');
  assert.equal(html.includes('<script>alert(1)</script>'), false);
  assert.equal(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true);
});

test('界面设置：完整模式应用并备份，随后可恢复', async () => {
  const { mock } = await setup();
  mock.setQuickPickChoice({ id: 'full' });
  await mock.handlers.get('jetbrainsType.applyUiSettings')();

  assert.equal(mock.flatSettings['editor.fontFamily'], "'JetBrains Mono', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace");
  assert.equal(mock.flatSettings['editor.fontLigatures'], true);
  assert.equal(mock.flatSettings['editor.minimap.enabled'], false);
  assert.equal(mock.flatSettings['editor.stickyScroll.enabled'], true);
  assert.equal(mock.flatSettings['workbench.activityBar.location'], 'default');
  assert.equal(mock.flatSettings['workbench.tree.indent'], 20);
  assert.equal(mock.flatSettings['workbench.editor.tabSizing'], 'shrink');
  assert.equal(mock.flatSettings['editor.bracketPairColorization.enabled'], false);
  assert.equal(mock.flatSettings['explorer.compactFolders'], false);
  assert.match(mock.messages.at(-1).message, /已应用 JetBrains 风格 UI 设置/);

  const backup = mock.globalState.get('jetbrainsType.previousUiSettings');
  assert.equal(backup['editor.fontFamily'].hadGlobalValue, true);
  assert.equal(backup['editor.fontFamily'].globalValue, 'Menlo, monospace');
  assert.equal(backup['editor.minimap.enabled'].globalValue, true);

  await mock.handlers.get('jetbrainsType.revertUiSettings')();
  assert.equal(mock.flatSettings['editor.fontFamily'], 'Menlo, monospace');
  assert.equal(mock.flatSettings['editor.fontLigatures'], false);
  assert.equal(mock.flatSettings['editor.minimap.enabled'], true);
  assert.equal(mock.flatSettings['workbench.tree.indent'], 8);
  assert.equal(mock.flatSettings['workbench.editor.tabSizing'], 'fit');
  assert.equal(mock.flatSettings['explorer.compactFolders'], true);
  assert.equal(mock.globalState.has('jetbrainsType.previousUiSettings'), false);
  assert.match(mock.messages.at(-1).message, /已恢复应用前的界面设置/);
});

test('界面设置：仅字体模式不修改布局', async () => {
  const { mock } = await setup();
  mock.setQuickPickChoice({ id: 'font' });
  await mock.handlers.get('jetbrainsType.applyUiSettings')();

  assert.equal(mock.flatSettings['editor.fontLigatures'], true);
  assert.match(mock.flatSettings['editor.fontFamily'], /JetBrains Mono/);
  assert.equal(mock.flatSettings['editor.minimap.enabled'], true);
  assert.equal(mock.flatSettings['workbench.tree.indent'], 8);
  const backup = mock.globalState.get('jetbrainsType.previousUiSettings');
  assert.deepEqual(Object.keys(backup).sort(), ['editor.fontFamily', 'editor.fontLigatures']);
});

test('界面设置：工作区覆盖时提示', async () => {
  const { mock } = await setup();
  mock.workspaceOverrides.set('editor.fontFamily', 'Workspace Font');
  mock.setQuickPickChoice({ id: 'full' });
  await mock.handlers.get('jetbrainsType.applyUiSettings')();
  assert.match(mock.messages.at(-1).message, /工作区覆盖了 editor\.fontFamily/);
});

test('恢复界面设置：没有备份时给出提示', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.revertUiSettings')();
  assert.match(mock.messages.at(-1).message, /没有保存过界面设置/);
});

test('打开字体下载页：使用 JetBrains 官方地址', async () => {
  const { mock, extension } = await setup();
  // Trigger the action from the UI settings notification.
  mock.setQuickPickChoice({ id: 'font' });
  await mock.handlers.get('jetbrainsType.applyUiSettings')();
  const info = mock.messages.at(-1);
  assert.ok(info.items.includes('打开字体下载页'));
});

test('速查表：复用单面板，关闭后可重新创建', async () => {
  const { mock } = await setup();
  await mock.handlers.get('jetbrainsType.showCheatSheet')();
  await mock.handlers.get('jetbrainsType.showCheatSheet')();

  assert.equal(mock.panels.length, 1);
  assert.equal(mock.panels[0].revealed, true);
  assert.equal(mock.panels[0].disposed, false);

  mock.panels[0].dispose();
  await mock.handlers.get('jetbrainsType.showCheatSheet')();
  assert.equal(mock.panels.length, 2);
  assert.equal(mock.panels[1].disposed, false);
});

test('停用扩展会清理打开的速查表面板与状态栏', async () => {
  const { mock, extension } = await setup();
  await mock.handlers.get('jetbrainsType.showCheatSheet')();
  assert.equal(mock.panels[0].disposed, false);
  assert.equal(mock.statusBarItems[0].disposed, false);
  extension.deactivate();
  assert.equal(mock.panels[0].disposed, true);
  assert.equal(mock.statusBarItems[0].disposed, true);
});

test('首次激活仅提示一次应用外观，后续激活不重复提示', async () => {
  const { mock, extension } = await setup();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(mock.globalState.get('jetbrainsType.hasPromptedLook'), true);
  assert.equal(
    mock.messages.some((item) => item.message.includes('是否立即应用 New UI 深色主题')),
    true
  );

  const countBefore = mock.messages.length;
  extension.activate(mock.context);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(mock.messages.length, countBefore);
});

test('应用外观：仅记录全局值，不被工作区覆盖污染', async () => {
  const { mock } = await setup();
  mock.workspaceOverrides.set('workbench.colorTheme', 'Workspace Only Theme');
  delete mock.state.workbench.iconTheme;

  await mock.handlers.get('jetbrainsType.applyLook')();

  const saved = mock.globalState.get('jetbrainsType.previousLook');
  assert.equal(saved.colorTheme, 'Default Dark Modern');
  assert.equal(saved.iconTheme, undefined);

  await mock.handlers.get('jetbrainsType.revertLook')();
  assert.equal(mock.state.workbench.colorTheme, 'Default Dark Modern');
  assert.equal('iconTheme' in mock.state.workbench, false);
});

test('恢复界面设置：部分失败时保留失败项备份以便重试', async () => {
  const { mock } = await setup();
  const originalGetConfig = mock.vscode.workspace.getConfiguration;
  mock.globalState.set('jetbrainsType.previousUiSettings', {
    'editor.fontFamily': { hadGlobalValue: true, globalValue: 'Menlo' },
    'editor.minimap.enabled': { hadGlobalValue: true, globalValue: true }
  });
  mock.vscode.workspace.getConfiguration = (section, scope) => {
    const cfg = originalGetConfig(section, scope);
    if (section) return cfg;
    return {
      ...cfg,
      async update(key, value, target) {
        if (key === 'editor.minimap.enabled') {
          throw new Error('simulated write error');
        }
        return cfg.update(key, value, target);
      }
    };
  };

  await mock.handlers.get('jetbrainsType.revertUiSettings')();

  assert.equal(mock.flatSettings['editor.fontFamily'], 'Menlo');
  assert.equal(mock.errors.length, 1);
  assert.match(mock.errors[0].message, /editor\.minimap\.enabled/);
  assert.deepEqual(mock.globalState.get('jetbrainsType.previousUiSettings'), {
    'editor.minimap.enabled': { hadGlobalValue: true, globalValue: true }
  });
});

test('状态栏与速查表联动：切换开关与跳转单条快捷键', async () => {
  const { mock } = await setup();
  const bar = mock.statusBarItems[0];
  assert.equal(bar.visible, true);
  assert.match(bar.text, /JB Keymap/);

  await mock.handlers.get('jetbrainsType.showCheatSheet')();
  const panel = mock.panels[0];
  assert.equal(panel.webview.html.includes('#1e1f22'), true);
  assert.equal(panel.webview.html.includes('快捷键：已启用'), true);

  await panel.webview.emitMessage({ type: 'toggleKeymap' });
  assert.equal(mock.state.jetbrainsType.keymapEnabled, false);
  assert.match(bar.text, /JB Off/);
  assert.deepEqual(panel.webview.postedMessages.at(-1), {
    type: 'keymapState',
    enabled: false
  });

  await panel.webview.emitMessage({
    type: 'openKeybinding',
    command: 'workbench.action.showCommands'
  });
  assert.deepEqual(mock.executedCommands.at(-1), {
    id: 'workbench.action.openGlobalKeybindings',
    args: ['workbench.action.showCommands']
  });

  mock.state.jetbrainsType.statusBarEnabled = false;
  for (const listener of mock.configListeners) {
    listener({ affectsConfiguration: (section) => section === 'jetbrainsType' });
  }
  assert.equal(bar.visible, false);
});
