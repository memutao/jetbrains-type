'use strict';

const crypto = require('node:crypto');
const vscode = require('vscode');

const EXTENSION_ID = 'mutao.jetbrains-type';
const THEME_LABEL = 'JetBrains Type New UI Dark';
const FILE_ICON_THEME_ID = 'jetbrains-type-file-icons';
const PRODUCT_ICON_THEME_ID = 'jetbrains-type-idea-icons';
const PREVIOUS_LOOK_KEY = 'jetbrainsType.previousLook';
const UI_SETTINGS_BACKUP_KEY = 'jetbrainsType.previousUiSettings';
const KEYMAP_SETTING = 'keymapEnabled';
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
  'workbench.list.smoothScrolling': true,
  'workbench.tree.indent': 20,
  'workbench.tree.renderIndentGuides': 'onHover',
  'workbench.editor.tabSizing': 'shrink',
  'workbench.editor.tabCloseButton': 'right',
  'workbench.editor.highlightModifiedTabs': true,
  'workbench.editor.enablePreview': false,
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
}

function deactivate() {
  if (cheatSheetPanel) {
    const panel = cheatSheetPanel;
    cheatSheetPanel = undefined;
    panel.dispose();
  }
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
    colorTheme: config.get('colorTheme'),
    iconTheme: config.get('iconTheme'),
    productIconTheme: config.get('productIconTheme')
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
      config.update('iconTheme', previous.iconTheme ?? null, vscode.ConfigurationTarget.Global),
      config.update(
        'productIconTheme',
        previous.productIconTheme ?? null,
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

async function openKeybindings() {
  try {
    await vscode.commands.executeCommand(
      'workbench.action.openGlobalKeybindings',
      `@ext:${EXTENSION_ID}`
    );
  } catch {
    await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
  }
}

async function toggleKeymap() {
  const config = typeConfig();
  const enabled = config.get(KEYMAP_SETTING, true);
  const inspected = config.inspect(KEYMAP_SETTING);
  const hasWorkspaceValue =
    inspected && inspected.workspaceValue !== undefined && vscode.workspace.workspaceFolders;
  const target = hasWorkspaceValue
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;

  try {
    await config.update(KEYMAP_SETTING, !enabled, target);
  } catch (error) {
    vscode.window.showErrorMessage(
      `JetBrains Type：切换快捷键开关失败。${error.message || error}`
    );
    return;
  }

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
    }
  }

  await context.globalState.update(UI_SETTINGS_BACKUP_KEY, undefined);

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
  panel.webview.html = buildCheatSheetHtml(keymapGroups, process.platform);
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

function buildCheatSheetHtml(groups, platform) {
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
          return `
            <article class="shortcut" data-search="${escapeHtml(search)}">
              <div class="action">
                <div class="title">${escapeHtml(group.title)}</div>
                ${group.note ? `<div class="note">${escapeHtml(group.note)}</div>` : ''}
                <div class="command">${escapeHtml(group.bindings.map((binding) => binding.command).join(' · '))}</div>
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
      --bg: #2b2b2b;
      --panel: #3c3f41;
      --panel-2: #313335;
      --border: #323232;
      --line: #45494a;
      --fg: #a9b7c6;
      --muted: #808080;
      --bright: #e6e1e1;
      --orange: #cc7832;
      --yellow: #ffc66d;
      --green: #6a8759;
      --blue: #6897bb;
      --purple: #9876aa;
      --accent: #4b6eaf;
      --error: #ff6b68;
      --mono: "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace;
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
      padding: 22px 28px 14px;
      background: linear-gradient(180deg, #3c3f41 0%, #3c3f41f2 78%, #3c3f4100 100%);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(10px);
    }
    .eyebrow {
      margin: 0 0 5px;
      color: var(--orange);
      font: 600 10px/1.4 var(--mono);
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      color: var(--bright);
      font-size: 22px;
      font-weight: 650;
      letter-spacing: -.015em;
    }
    .subtitle { margin: 5px 0 15px; color: var(--muted); }
    .subtitle strong { color: var(--blue); font-weight: 500; }
    .toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .search {
      flex: 1 1 300px;
      min-width: 220px;
      padding: 8px 11px;
      color: var(--bright);
      background: #2b2b2b;
      border: 1px solid var(--line);
      border-radius: 4px;
      font: 12px var(--mono);
      outline: none;
    }
    .search:focus { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .search::placeholder { color: #6b6b6b; }
    .hint { color: var(--muted); font-size: 11px; }
    .hint kbd { font-size: 10px; }
    .nav { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
    .nav-chip {
      color: var(--fg);
      text-decoration: none;
      background: #2b2b2b;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 2px 9px;
      font-size: 11px;
      transition: border-color .12s ease, color .12s ease;
    }
    .nav-chip span { color: var(--muted); margin-left: 3px; }
    .nav-chip:hover { border-color: var(--accent); color: var(--bright); }
    main { max-width: 1180px; margin: 0 auto; padding: 10px 28px 60px; }
    .section { margin-top: 26px; scroll-margin-top: 170px; }
    .section h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px;
      padding-bottom: 7px;
      color: var(--yellow);
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: .02em;
    }
    .section h2::before {
      content: "";
      width: 3px;
      height: 13px;
      background: var(--orange);
      border-radius: 2px;
    }
    .count {
      margin-left: auto;
      color: var(--muted);
      font: 10px var(--mono);
      font-weight: 400;
    }
    .rows { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
    .shortcut {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) auto;
      gap: 16px;
      align-items: center;
      padding: 10px 13px;
      background: var(--panel-2);
      border-bottom: 1px solid var(--border);
    }
    .shortcut:nth-child(even) { background: #2f3133; }
    .shortcut:last-child { border-bottom: 0; }
    .shortcut:hover { background: #373a3c; }
    .action { min-width: 0; }
    .title { color: var(--bright); font-weight: 500; }
    .note { margin-top: 2px; color: var(--muted); font-size: 11px; }
    .command {
      margin-top: 3px;
      overflow: hidden;
      color: #6f7376;
      font: 10px/1.4 var(--mono);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .keys { display: flex; gap: 18px; align-items: flex-start; }
    .key-group { display: flex; flex-direction: column; gap: 3px; }
    .platform-label {
      color: #6f7376;
      font: 9px/1.2 var(--mono);
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    kbd {
      display: inline-block;
      min-width: 18px;
      margin: 1px 2px 0 0;
      padding: 1px 5px;
      color: var(--bright);
      background: #2b2b2b;
      border: 1px solid #555;
      border-bottom-color: #666;
      border-radius: 3px;
      box-shadow: 0 1px 0 #191919;
      font: 11px/1.5 var(--mono);
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
      .command { display: none; }
    }
  </style>
</head>
<body>
  <header class="hero">
    <p class="eyebrow">JetBrains Type / Shortcut Reference</p>
    <h1>快捷键速查表</h1>
    <p class="subtitle">
      ${groups.length} 组操作，${totalBindings} 条底层绑定。当前平台：<strong>${escapeHtml(platform === 'darwin' ? 'macOS' : platform)}</strong>。
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
    主题固定为 JetBrains Type New UI Dark；字体、minimap、标签和树缩进等通过 “应用 JetBrains 风格界面设置” 配置。
  </footer>
  <script nonce="${nonce}">
    (() => {
      const input = document.getElementById('search');
      const rows = Array.from(document.querySelectorAll('.shortcut'));
      const sections = Array.from(document.querySelectorAll('.section'));
      const empty = document.getElementById('empty');

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
