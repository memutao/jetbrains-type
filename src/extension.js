'use strict';

const crypto = require('node:crypto');
const vscode = require('vscode');

const EXTENSION_ID = 'mutao.jetbrains-type';
const THEME_LABEL = 'JetBrains Type New UI Dark';
const FILE_ICON_THEME_ID = 'jetbrains-type-file-icons';
const PRODUCT_ICON_THEME_ID = 'jetbrains-type-idea-icons';
const PREVIOUS_LOOK_KEY = 'jetbrainsType.previousLook';
const PROMPTED_LOOK_KEY = 'jetbrainsType.hasPromptedLook';
const UI_SETTINGS_BACKUP_KEY = 'jetbrainsType.previousUiSettings';
const KEYMAP_SETTING = 'keymapEnabled';
const STATUS_BAR_SETTING = 'statusBarEnabled';
const FONT_DOWNLOAD_URL = 'https://www.jetbrains.com/lp/mono/';
const FONT_FAMILY = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const FONT_SETTING_KEYS = ['editor.fontFamily', 'editor.fontLigatures'];
const UI_SETTINGS = {
  'editor.fontFamily': FONT_FAMILY,
  'editor.fontLigatures': true,
  'editor.minimap.enabled': false,
  'editor.renderWhitespace': 'selection',
  'editor.cursorBlinking': 'smooth',
  'editor.smoothScrolling': true,
  'editor.stickyScroll.enabled': true,
  'workbench.list.smoothScrolling': true,
  'workbench.tree.indent': 20,
  'workbench.tree.renderIndentGuides': 'onHover',
  'workbench.editor.tabSizing': 'shrink',
  'workbench.editor.tabCloseButton': 'right',
  'workbench.editor.highlightModifiedTabs': true,
  'workbench.editor.enablePreview': false,
  'workbench.activityBar.location': 'default',
  'window.commandCenter': false,
  'workbench.layoutControl.enabled': false,
  'explorer.compactFolders': false,
  'editor.bracketPairColorization.enabled': false,
  'editor.guides.bracketPairs': 'active',
  'editor.occurrencesHighlight': 'singleFile',
  'editor.selectionHighlight': true
};

const keymapGroups = require('../keymap/keybindings.json');

const FONT_SETTINGS = Object.fromEntries(
  FONT_SETTING_KEYS.map((key) => [key, UI_SETTINGS[key]])
);

let cheatSheetPanel;
let statusBarItem;

const CATEGORY_ORDER = [
  '通用',
  '编辑',
  '搜索与替换',
  '导航',
  '代码智能',
  '构建与调试',
  '版本控制',
  '工具窗口',
  '资源管理器',
  '差异比较'
];

function activate(context) {
  const commands = [
    ['jetbrainsType.applyLook', () => applyLook(context)],
    ['jetbrainsType.revertLook', () => revertLook(context)],
    ['jetbrainsType.openKeybindings', () => openKeybindings()],
    ['jetbrainsType.showCheatSheet', () => showCheatSheet(context)],
    ['jetbrainsType.toggleKeymap', () => toggleKeymap()],
    ['jetbrainsType.applyUiSettings', () => applyUiSettings(context)],
    ['jetbrainsType.revertUiSettings', () => revertUiSettings(context)]
  ];

  for (const [id, handler] of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));
  }

  if (typeof vscode.window.createStatusBarItem === 'function') {
    const alignment = vscode.StatusBarAlignment?.Right ?? 2;
    statusBarItem = vscode.window.createStatusBarItem(alignment, 100);
    statusBarItem.command = 'jetbrainsType.toggleKeymap';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();
  }

  if (typeof vscode.workspace.onDidChangeConfiguration === 'function') {
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('jetbrainsType')) {
          updateStatusBar();
          syncCheatSheetKeymapState();
        }
      })
    );
  }

  void maybePromptInitialLook(context);
}

function deactivate() {
  if (cheatSheetPanel) {
    const panel = cheatSheetPanel;
    cheatSheetPanel = undefined;
    panel.dispose();
  }
  if (statusBarItem) {
    const item = statusBarItem;
    statusBarItem = undefined;
    item.dispose();
  }
}

function updateStatusBar() {
  if (!statusBarItem) {
    return;
  }
  const config = typeConfig();
  const visible = config.get(STATUS_BAR_SETTING, true);
  if (!visible) {
    statusBarItem.hide();
    return;
  }
  const enabled = config.get(KEYMAP_SETTING, true);
  statusBarItem.text = enabled ? '$(keyboard) JB Keymap' : '$(keyboard) JB Off';
  statusBarItem.tooltip = enabled
    ? 'JetBrains Type：快捷键已启用（点击关闭）'
    : 'JetBrains Type：快捷键已关闭（点击启用）';
  statusBarItem.show();
}

function syncCheatSheetKeymapState() {
  if (!cheatSheetPanel) {
    return;
  }
  try {
    void cheatSheetPanel.webview.postMessage({
      type: 'keymapState',
      enabled: typeConfig().get(KEYMAP_SETTING, true)
    });
  } catch {
    // Ignore if webview is already disposing.
  }
}

async function maybePromptInitialLook(context) {
  if (
    context.globalState.get(PROMPTED_LOOK_KEY) ||
    context.globalState.get(PREVIOUS_LOOK_KEY)
  ) {
    return;
  }
  await context.globalState.update(PROMPTED_LOOK_KEY, true);
  if (currentLook().colorTheme === THEME_LABEL) {
    return;
  }
  void vscode.window
    .showInformationMessage(
      'JetBrains Type 已就绪（快捷键已默认启用）。是否立即应用 New UI 深色主题与 JetBrains 图标？',
      '立即应用外观',
      '快捷键速查表'
    )
    .then((choice) => {
      if (choice === '立即应用外观') {
        return applyLook(context);
      }
      if (choice === '快捷键速查表') {
        showCheatSheet(context);
      }
      return undefined;
    });
}

function workbenchConfig() {
  return vscode.workspace.getConfiguration('workbench');
}

function typeConfig() {
  return vscode.workspace.getConfiguration('jetbrainsType');
}

function currentLook() {
  const config = workbenchConfig();
  return {
    colorTheme: config.inspect('colorTheme')?.globalValue,
    iconTheme: config.inspect('iconTheme')?.globalValue,
    productIconTheme: config.inspect('productIconTheme')?.globalValue
  };
}

function hasWorkspaceOverride(config, key) {
  const inspected = config.inspect(key);
  return Boolean(
    inspected &&
      (inspected.workspaceValue !== undefined || inspected.workspaceFolderValue !== undefined)
  );
}

async function applyLook(context) {
  const config = workbenchConfig();
  const previous = context.globalState.get(PREVIOUS_LOOK_KEY);
  const look = currentLook();

  if (!previous) {
    await context.globalState.update(PREVIOUS_LOOK_KEY, {
      ...look,
      savedAt: new Date().toISOString()
    });
  }

  try {
    await Promise.all([
      config.update('colorTheme', THEME_LABEL, vscode.ConfigurationTarget.Global),
      config.update('iconTheme', FILE_ICON_THEME_ID, vscode.ConfigurationTarget.Global),
      config.update('productIconTheme', PRODUCT_ICON_THEME_ID, vscode.ConfigurationTarget.Global)
    ]);
  } catch (error) {
    vscode.window.showErrorMessage(`JetBrains Type：应用外观失败。${error.message || error}`);
    return;
  }

  const overridden = ['colorTheme', 'iconTheme', 'productIconTheme'].filter((key) =>
    hasWorkspaceOverride(config, key)
  );

  const message = overridden.length
    ? `外观已写入用户设置，但当前工作区覆盖了 ${overridden.join(' / ')}，请在 Workspace 设置中移除对应覆盖。`
    : `已应用 ${THEME_LABEL} 与 JetBrains 图标。快捷键已默认启用。`;

  void vscode.window
    .showInformationMessage(message, '打开快捷键', '快捷键速查表', '恢复原外观')
    .then((choice) => {
      if (choice === '打开快捷键') {
        return openKeybindings();
      }
      if (choice === '快捷键速查表') {
        showCheatSheet(context);
      }
      if (choice === '恢复原外观') {
        return revertLook(context);
      }
      return undefined;
    });
}

async function revertLook(context) {
  const previous = context.globalState.get(PREVIOUS_LOOK_KEY);
  if (!previous) {
    vscode.window.showInformationMessage('JetBrains Type：没有保存过应用前的外观。');
    return;
  }

  const config = workbenchConfig();
  try {
    await Promise.all([
      config.update('colorTheme', previous.colorTheme, vscode.ConfigurationTarget.Global),
      config.update('iconTheme', previous.iconTheme, vscode.ConfigurationTarget.Global),
      config.update(
        'productIconTheme',
        previous.productIconTheme,
        vscode.ConfigurationTarget.Global
      )
    ]);
  } catch (error) {
    vscode.window.showErrorMessage(`JetBrains Type：恢复外观失败。${error.message || error}`);
    return;
  }

  await context.globalState.update(PREVIOUS_LOOK_KEY, undefined);
  vscode.window.showInformationMessage('JetBrains Type：已恢复应用前的外观。');
}

async function openKeybindings(query = `@ext:${EXTENSION_ID}`) {
  try {
    await vscode.commands.executeCommand(
      'workbench.action.openGlobalKeybindings',
      query
    );
  } catch {
    await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
  }
}

async function toggleKeymap() {
  const config = typeConfig();
  const enabled = config.get(KEYMAP_SETTING, true);
  const inspected = config.inspect(KEYMAP_SETTING);
  const target =
    inspected?.workspaceValue !== undefined
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;
  const folderConfigs = [];

  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const folderConfig = vscode.workspace.getConfiguration('jetbrainsType', folder.uri);
    const folderInspect = folderConfig.inspect(KEYMAP_SETTING);
    if (folderInspect?.workspaceFolderValue !== undefined) {
      folderConfigs.push(folderConfig);
    }
  }

  try {
    await config.update(KEYMAP_SETTING, !enabled, target);
    await Promise.all(
      folderConfigs.map((folderConfig) =>
        folderConfig.update(
          KEYMAP_SETTING,
          !enabled,
          vscode.ConfigurationTarget.WorkspaceFolder
        )
      )
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `JetBrains Type：切换快捷键开关失败。${error.message || error}`
    );
    return;
  }

  updateStatusBar();
  syncCheatSheetKeymapState();

  vscode.window.showInformationMessage(
    enabled
      ? 'JetBrains Type：已关闭 JetBrains 快捷键，VS Code 默认快捷键已恢复。'
      : 'JetBrains Type：已启用 JetBrains 快捷键。'
  );
}

function settingEntry(key) {
  return {
    config: vscode.workspace.getConfiguration(),
    name: key
  };
}

function settingHasWorkspaceOverride(key) {
  const { config, name } = settingEntry(key);
  const inspected = config.inspect(name);
  return Boolean(
    inspected &&
      (inspected.workspaceValue !== undefined || inspected.workspaceFolderValue !== undefined)
  );
}

async function backupUiSettings(context, keys) {
  const previous = context.globalState.get(UI_SETTINGS_BACKUP_KEY, {});
  const next = { ...previous };

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      continue;
    }
    const { config, name } = settingEntry(key);
    const inspected = config.inspect(name);
    next[key] = {
      hadGlobalValue: Boolean(inspected && inspected.globalValue !== undefined),
      globalValue: inspected ? inspected.globalValue : undefined
    };
  }

  await context.globalState.update(UI_SETTINGS_BACKUP_KEY, next);
}

async function applySettingValues(keys, values) {
  const overridden = [];
  const failed = [];

  for (const key of keys) {
    const { config, name } = settingEntry(key);
    if (settingHasWorkspaceOverride(key)) {
      overridden.push(key);
    }
    try {
      await config.update(name, values[key], vscode.ConfigurationTarget.Global);
    } catch {
      failed.push(key);
    }
  }

  return { overridden, failed };
}

async function applyUiSettings(context) {
  const mode = await vscode.window.showQuickPick(
    [
      {
        id: 'full',
        label: '完整 UI 设置（推荐）',
        description: '字体、连字、关闭 minimap、紧凑标签、树缩进、单色括号等',
        detail: '所有改动都会先备份，可通过“恢复界面设置”还原。'
      },
      {
        id: 'font',
        label: '仅字体与连字',
        description: '只应用 JetBrains Mono 字体族和 editor.fontLigatures',
        detail: '适合已经安装 JetBrains Mono 字体、但暂时不想改布局的用户。'
      }
    ],
    {
      placeHolder: '选择要应用的 JetBrains 风格设置',
      ignoreFocusOut: true
    }
  );

  if (!mode) {
    return;
  }

  const keys = mode.id === 'font' ? FONT_SETTING_KEYS : Object.keys(UI_SETTINGS);
  const values = mode.id === 'font' ? FONT_SETTINGS : UI_SETTINGS;

  await backupUiSettings(context, keys);
  const { overridden, failed } = await applySettingValues(keys, values);

  const warnings = [];
  if (overridden.length > 0) {
    warnings.push(`工作区覆盖了 ${overridden.join(' / ')}`);
  }
  if (failed.length > 0) {
    warnings.push(`写入失败：${failed.join(' / ')}`);
  }

  const baseMessage =
    mode.id === 'font'
      ? '已应用 JetBrains Mono 字体设置。若系统未安装该字体，会自动回退到其他等宽字体。'
      : '已应用 JetBrains 风格 UI 设置。建议安装 JetBrains Mono 以启用完整连字效果。';
  const message = warnings.length > 0 ? `${baseMessage}（${warnings.join('；')}）` : baseMessage;

  void vscode.window
    .showInformationMessage(message, '恢复原设置', '打开字体下载页')
    .then((choice) => {
      if (choice === '恢复原设置') {
        return revertUiSettings(context);
      }
      if (choice === '打开字体下载页') {
        return openFontDownload();
      }
      return undefined;
    });
}

async function revertUiSettings(context) {
  const previous = context.globalState.get(UI_SETTINGS_BACKUP_KEY);
  if (!previous || typeof previous !== 'object' || Object.keys(previous).length === 0) {
    vscode.window.showInformationMessage('JetBrains Type：没有保存过界面设置。');
    return;
  }

  const allowedKeys = new Set(Object.keys(UI_SETTINGS));
  const failed = [];
  const remainingBackup = {};
  for (const [key, saved] of Object.entries(previous)) {
    if (!allowedKeys.has(key)) {
      continue;
    }
    const { config, name } = settingEntry(key);
    try {
      await config.update(
        name,
        saved.hadGlobalValue ? saved.globalValue : undefined,
        vscode.ConfigurationTarget.Global
      );
    } catch {
      failed.push(key);
      remainingBackup[key] = saved;
    }
  }

  await context.globalState.update(
    UI_SETTINGS_BACKUP_KEY,
    Object.keys(remainingBackup).length > 0 ? remainingBackup : undefined
  );

  if (failed.length > 0) {
    vscode.window.showErrorMessage(
      `JetBrains Type：部分界面设置恢复失败：${failed.join(' / ')}`
    );
    return;
  }
  vscode.window.showInformationMessage('JetBrains Type：已恢复应用前的界面设置。');
}

async function openFontDownload() {
  try {
    await vscode.env.openExternal(vscode.Uri.parse(FONT_DOWNLOAD_URL));
  } catch {
    vscode.window.showInformationMessage(`请手动打开字体下载页：${FONT_DOWNLOAD_URL}`);
  }
}

function showCheatSheet(context) {
  if (cheatSheetPanel) {
    try {
      cheatSheetPanel.reveal(vscode.ViewColumn.Active);
      syncCheatSheetKeymapState();
      return;
    } catch {
      // The panel may have been disposed by the window while this reference
      // was still pending cleanup; fall through and create a fresh one.
      cheatSheetPanel = undefined;
    }
  }

  const panel = vscode.window.createWebviewPanel(
    'jetbrainsType.cheatSheet',
    'JetBrains Type · 快捷键速查表',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: false
    }
  );

  try {
    panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'icon.png');
  } catch {
    // iconPath is cosmetic; ignore failures on older VS Code versions.
  }

  cheatSheetPanel = panel;
  const enabled = typeConfig().get(KEYMAP_SETTING, true);
  panel.webview.html = buildCheatSheetHtml(keymapGroups, process.platform, enabled);

  if (typeof panel.webview.onDidReceiveMessage === 'function') {
    panel.webview.onDidReceiveMessage((message) => {
      if (!message || typeof message !== 'object') {
        return;
      }
      if (message.type === 'toggleKeymap') {
        void toggleKeymap();
        return;
      }
      if (message.type === 'openKeybinding' && typeof message.command === 'string' && message.command) {
        void openKeybindings(message.command);
      }
    });
  }

  panel.onDidDispose(() => {
    if (cheatSheetPanel === panel) {
      cheatSheetPanel = undefined;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const MAC_SYMBOLS = {
  cmd: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  enter: '↩',
  backspace: '⌫',
  delete: '⌦',
  escape: 'Esc',
  tab: '⇥',
  space: 'Space',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  pageup: 'PgUp',
  pagedown: 'PgDn'
};

const WIN_NAMES = {
  cmd: 'Win',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  backspace: 'Backspace',
  delete: 'Delete',
  escape: 'Esc',
  tab: 'Tab',
  space: 'Space',
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
  pageup: 'PgUp',
  pagedown: 'PgDn'
};

function keyToken(token, platform) {
  const lower = token.toLowerCase();
  if (platform === 'darwin') {
    return MAC_SYMBOLS[lower] || (/^f\d{1,2}$/.test(lower) ? lower.toUpperCase() : lower.length === 1 ? lower.toUpperCase() : lower);
  }
  return WIN_NAMES[lower] || (/^f\d{1,2}$/.test(lower) ? lower.toUpperCase() : lower.length === 1 ? lower.toUpperCase() : lower);
}

function formatCombo(combo, platform) {
  const parts = String(combo).trim().split('+').filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  return parts.map((part) => keyToken(part, platform)).join(platform === 'darwin' ? '' : '+');
}

function keycaps(combo, platform, label) {
  const chord = String(combo).trim().split(/\s+/).filter(Boolean);
  const html = chord
    .map((part) => `<kbd>${escapeHtml(formatCombo(part, platform))}</kbd>`)
    .join('<span class="chord">then</span>');
  return `<span class="key-group"><span class="platform-label">${escapeHtml(label)}</span>${html}</span>`;
}

function buildCheatSheetHtml(groups, platform, keymapEnabled = true) {
  const nonce = createNonce();
  const categoryOrder = [
    ...CATEGORY_ORDER,
    ...groups.map((group) => group.category).filter((category) => !CATEGORY_ORDER.includes(category))
  ].filter((category, index, array) => array.indexOf(category) === index);

  const totalBindings = groups.reduce((count, group) => count + group.bindings.length, 0);
  const sections = categoryOrder
    .map((category) => {
      const items = groups.filter((group) => group.category === category);
      if (items.length === 0) {
        return '';
      }
      const rows = items
        .map((group) => {
          const search = [
            group.title,
            group.category,
            group.note || '',
            group.key,
            group.mac,
            ...group.bindings.map((binding) => binding.command)
          ]
            .join(' ')
            .toLowerCase();
          const primaryCommand = group.bindings[0]?.command || '';
          const commandLabel = group.bindings.map((binding) => binding.command).join(' · ');
          return `
            <article class="shortcut" data-search="${escapeHtml(search)}">
              <div class="action">
                <div class="title">${escapeHtml(group.title)}</div>
                ${group.note ? `<div class="note">${escapeHtml(group.note)}</div>` : ''}
                <button class="command-btn" type="button" data-command="${escapeHtml(primaryCommand)}" title="在快捷键设置中定位该命令">${escapeHtml(commandLabel)}</button>
              </div>
              <div class="keys">${keycaps(group.mac, 'darwin', 'macOS')}${keycaps(group.key, 'win32', 'Win / Linux')}</div>
            </article>`;
        })
        .join('');

      return `
        <section class="section" id="cat-${encodeURIComponent(category)}" data-category="${escapeHtml(category)}">
          <h2>${escapeHtml(category)}<span class="count">${items.length}</span></h2>
          <div class="rows">${rows}</div>
        </section>`;
    })
    .join('');

  const nav = categoryOrder
    .filter((category) => groups.some((group) => group.category === category))
    .map((category) => {
      const count = groups.filter((group) => group.category === category).length;
      return `<a href="#cat-${encodeURIComponent(category)}" class="nav-chip">${escapeHtml(category)} <span>${count}</span></a>`;
    })
    .join('');

  const statusText = keymapEnabled ? '快捷键：已启用' : '快捷键：已关闭';
  const statusClass = keymapEnabled ? 'badge active' : 'badge inactive';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
  <title>JetBrains Type · 快捷键速查表</title>
  <style nonce="${nonce}">
    :root {
      color-scheme: dark;
      --bg: #1e1f22;
      --panel: #2b2d30;
      --panel-2: #222428;
      --panel-alt: #26282e;
      --border: #393b40;
      --line: #43454a;
      --fg: #bcbec4;
      --muted: #7a7e85;
      --bright: #dfe1e5;
      --orange: #cf8e6d;
      --yellow: #d6ae58;
      --green: #6aab73;
      --blue: #56a8f5;
      --purple: #b589ec;
      --accent: #3574f0;
      --sel: #2e436e;
      --error: #ff6b68;
      --mono: "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      font-size: 13px;
      line-height: 1.55;
    }
    .hero {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 20px 28px 14px;
      background: linear-gradient(180deg, #2b2d30 0%, #2b2d30f5 84%, #2b2d30e8 100%);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(12px);
    }
    .hero-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .eyebrow {
      margin: 0 0 4px;
      color: var(--blue);
      font: 600 10px/1.4 var(--mono);
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      color: var(--bright);
      font-size: 21px;
      font-weight: 650;
      letter-spacing: -.015em;
    }
    .status-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font: 500 11px/1.3 var(--mono);
      border: 1px solid var(--line);
      background: var(--bg);
      color: var(--fg);
    }
    .badge::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--muted);
    }
    .badge.active {
      border-color: #3574f066;
      background: #25324d;
      color: var(--bright);
    }
    .badge.active::before { background: var(--green); }
    .badge.inactive {
      border-color: #d6ae5855;
      background: #3d322380;
      color: var(--yellow);
    }
    .badge.inactive::before { background: var(--yellow); }
    .toggle-btn {
      padding: 5px 11px;
      border-radius: 6px;
      border: 1px solid var(--accent);
      background: var(--accent);
      color: #ffffff;
      font: 500 11px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      transition: background .12s ease, border-color .12s ease;
    }
    .toggle-btn:hover { background: #467ff2; border-color: #467ff2; }
    .subtitle { margin: 5px 0 14px; color: var(--muted); }
    .subtitle strong { color: var(--blue); font-weight: 500; }
    .toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .search {
      flex: 1 1 300px;
      min-width: 220px;
      padding: 8px 11px;
      color: var(--bright);
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: 6px;
      font: 12px var(--mono);
      outline: none;
    }
    .search:focus { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .search::placeholder { color: #6f737a; }
    .hint { color: var(--muted); font-size: 11px; }
    .hint kbd { font-size: 10px; }
    .nav { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
    .nav-chip {
      color: var(--fg);
      text-decoration: none;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 2px 10px;
      font-size: 11px;
      transition: border-color .12s ease, color .12s ease, background .12s ease;
    }
    .nav-chip span { color: var(--muted); margin-left: 3px; }
    .nav-chip:hover { border-color: var(--accent); background: var(--sel); color: #ffffff; }
    main { max-width: 1180px; margin: 0 auto; padding: 10px 28px 60px; }
    .section { margin-top: 26px; scroll-margin-top: 176px; }
    .section h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px;
      padding-bottom: 7px;
      color: var(--bright);
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: .02em;
    }
    .section h2::before {
      content: "";
      width: 3px;
      height: 13px;
      background: var(--accent);
      border-radius: 2px;
    }
    .count {
      margin-left: auto;
      color: var(--muted);
      font: 10px var(--mono);
      font-weight: 400;
    }
    .rows { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--panel); }
    .shortcut {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) auto;
      gap: 16px;
      align-items: center;
      padding: 10px 14px;
      background: var(--panel-2);
      border-bottom: 1px solid var(--border);
      transition: background .1s ease;
    }
    .shortcut:nth-child(even) { background: var(--panel-alt); }
    .shortcut:last-child { border-bottom: 0; }
    .shortcut:hover { background: #2b2d30; }
    .action { min-width: 0; }
    .title { color: var(--bright); font-weight: 500; }
    .note { margin-top: 2px; color: var(--muted); font-size: 11px; }
    .command-btn {
      margin-top: 4px;
      padding: 0;
      border: 0;
      background: transparent;
      max-width: 100%;
      overflow: hidden;
      color: #6f737a;
      font: 10px/1.4 var(--mono);
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
    }
    .command-btn:hover { color: var(--blue); text-decoration: underline; }
    .keys { display: flex; gap: 18px; align-items: flex-start; }
    .key-group { display: flex; flex-direction: column; gap: 3px; }
    .platform-label {
      color: #6f737a;
      font: 9px/1.2 var(--mono);
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    kbd {
      display: inline-block;
      min-width: 20px;
      margin: 1px 2px 0 0;
      padding: 2px 6px;
      color: var(--bright);
      background: var(--panel);
      border: 1px solid var(--line);
      border-bottom-color: #5a5d63;
      border-radius: 4px;
      box-shadow: 0 1px 0 #141517;
      font: 11px/1.45 var(--mono);
      text-align: center;
      white-space: nowrap;
    }
    .chord { margin: 0 4px; color: var(--muted); font-size: 10px; }
    .empty {
      margin: 40px 0;
      color: var(--muted);
      text-align: center;
      font: 12px var(--mono);
    }
    footer {
      max-width: 1180px;
      margin: 0 auto;
      padding: 18px 28px 40px;
      color: var(--muted);
      border-top: 1px solid var(--border);
      font-size: 11px;
    }
    footer code { color: var(--green); font-family: var(--mono); }
    [hidden] { display: none !important; }
    @media (max-width: 760px) {
      .hero { padding: 18px 16px 12px; }
      main, footer { padding-left: 16px; padding-right: 16px; }
      .shortcut { grid-template-columns: 1fr; gap: 7px; }
      .keys { gap: 22px; }
      .command-btn { display: none; }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="hero-top">
      <div>
        <p class="eyebrow">JetBrains Type / New UI Dark · Shortcut Reference</p>
        <h1>快捷键速查表</h1>
      </div>
      <div class="status-wrap">
        <span id="keymap-badge" class="${statusClass}">${escapeHtml(statusText)}</span>
        <button id="toggle-keymap" class="toggle-btn" type="button">切换开关</button>
      </div>
    </div>
    <p class="subtitle">
      ${groups.length} 组操作，${totalBindings} 条底层绑定。当前平台：<strong>${escapeHtml(platform === 'darwin' ? 'macOS' : platform)}</strong>。点击任意命令 ID 可直达快捷键设置。
    </p>
    <div class="toolbar">
      <input id="search" class="search" type="search" placeholder="搜索操作、命令或按键…" autocomplete="off" spellcheck="false" />
      <span class="hint">按 <kbd>/</kbd> 聚焦搜索</span>
    </div>
    <nav class="nav">${nav}</nav>
  </header>
  <main>
    <div id="empty" class="empty" hidden>没有匹配的快捷键。</div>
    ${sections}
  </main>
  <footer>
    快捷键总开关：设置 <code>jetbrainsType.keymapEnabled</code>。关闭后立即恢复 VS Code 默认快捷键。
    主题固定为 JetBrains Type New UI Dark；字体、minimap、标签、Sticky Scroll 和树缩进等通过 “应用 JetBrains 风格界面设置” 配置。
  </footer>
  <script nonce="${nonce}">
    (() => {
      const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
      const input = document.getElementById('search');
      const rows = Array.from(document.querySelectorAll('.shortcut'));
      const sections = Array.from(document.querySelectorAll('.section'));
      const empty = document.getElementById('empty');
      const badge = document.getElementById('keymap-badge');
      const toggleBtn = document.getElementById('toggle-keymap');

      const applyFilter = () => {
        const query = input.value.trim().toLowerCase();
        let visible = 0;
        for (const row of rows) {
          const show = !query || row.dataset.search.includes(query);
          row.hidden = !show;
          if (show) visible++;
        }
        for (const section of sections) {
          section.hidden = !section.querySelector('.shortcut:not([hidden])');
        }
        empty.hidden = visible !== 0;
      };

      input.addEventListener('input', applyFilter);
      if (toggleBtn && vscodeApi) {
        toggleBtn.addEventListener('click', () => {
          vscodeApi.postMessage({ type: 'toggleKeymap' });
        });
      }
      for (const btn of document.querySelectorAll('.command-btn')) {
        btn.addEventListener('click', () => {
          const command = btn.getAttribute('data-command');
          if (command && vscodeApi) {
            vscodeApi.postMessage({ type: 'openKeybinding', command });
          }
        });
      }
      window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg && msg.type === 'keymapState' && badge) {
          badge.textContent = msg.enabled ? '快捷键：已启用' : '快捷键：已关闭';
          badge.className = msg.enabled ? 'badge active' : 'badge inactive';
        }
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === '/' && document.activeElement !== input) {
          event.preventDefault();
          input.focus();
        }
        if (event.key === 'Escape' && document.activeElement === input) {
          input.value = '';
          applyFilter();
          input.blur();
        }
      });
    })();
  </script>
</body>
</html>`;
}

function createNonce() {
  return crypto.randomBytes(16).toString('hex');
}

exports.activate = activate;
exports.deactivate = deactivate;
exports._buildCheatSheetHtml = buildCheatSheetHtml;
