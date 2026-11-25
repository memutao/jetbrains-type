#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`${relativePath}: ${error.message}`);
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value);
}

function assertWhen(when, label) {
  if (typeof when !== 'string' || when.length === 0) {
    failures.push(`${label}: when clause is empty.`);
    return;
  }
  let depth = 0;
  for (const character of when) {
    if (character === '(') depth++;
    if (character === ')') depth--;
    if (depth < 0) break;
  }
  check(depth === 0, `${label}: unbalanced parentheses in when clause: ${when}`);
  check(
    when.startsWith('config.jetbrainsType.keymapEnabled'),
    `${label}: when clause must be gated by config.jetbrainsType.keymapEnabled.`
  );
}

const manifest = readJson('package.json');
const keymapGroups = readJson('keymap/keybindings.json');

check(manifest.name === 'jetbrains-type', 'package.json name must be jetbrains-type.');
check(manifest.displayName === 'JetBrains Type', 'package.json displayName must be JetBrains Type.');
check(manifest.publisher === 'mutao', 'package.json publisher must be mutao.');
check(manifest.private === true, 'package.json must stay private (not an npm package).');
check(manifest.license === 'MIT', 'package.json license must be MIT.');
check(
  /^\^1\.\d+\.0$/.test(manifest.engines?.vscode || ''),
  'package.json engines.vscode must be a ^1.x.0 range.'
);
check(exists(manifest.main), 'package.json main entry does not exist.');
check(exists(manifest.icon), 'package.json icon does not exist.');
check(exists('README.md'), 'README.md is missing.');
check(exists('LICENSE'), 'LICENSE is missing.');
check(exists('KEYMAP.md'), 'KEYMAP.md is missing.');
check(exists('CHANGELOG.md'), 'CHANGELOG.md is missing.');
check(exists('THIRD_PARTY_NOTICES.md'), 'THIRD_PARTY_NOTICES.md is missing.');
check(exists('.vscodeignore'), '.vscodeignore is missing.');
check(
  manifest.repository?.url === 'https://github.com/memutao/jetbrains-type.git',
  'package.json repository URL is missing or unexpected.'
);
check(/^\d+\.\d+\.\d+$/.test(manifest.version || ''), 'package.json version must be semver.');

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
check(!readme.includes('/Users/'), 'README.md contains a local absolute path.');
const ignoreFile = fs.readFileSync(path.join(root, '.vscodeignore'), 'utf8');
for (const pattern of ['docs/**', 'product-icons/activity/**', 'product-icons/ui/**']) {
  check(ignoreFile.includes(pattern), `.vscodeignore must exclude ${pattern}.`);
}

const expectedThemes = [
  {
    label: 'JetBrains Type New UI Dark',
    path: 'themes/new-ui-dark-color-theme.json'
  }
];
const themeContributions = manifest.contributes?.themes || [];
check(
  themeContributions.length === expectedThemes.length,
  `manifest must contribute exactly ${expectedThemes.length} color themes.`
);
for (const expected of expectedThemes) {
  const contribution = themeContributions.find((theme) => theme.label === expected.label);
  check(Boolean(contribution), `color theme contribution is missing: ${expected.label}`);
  if (!contribution) continue;
  check(contribution.uiTheme === 'vs-dark', `${expected.label} must use vs-dark.`);
  check(contribution.path === `./${expected.path}`, `${expected.label} path mismatch.`);
  check(exists(contribution.path), `color theme file does not exist: ${contribution.path}`);
  const theme = readJson(contribution.path);
  check(theme.name === expected.label, `color theme name mismatch: ${theme.name}`);
  check(theme.type === 'dark', `${expected.label} type must be dark.`);
  check(
    typeof theme.colors === 'object' && Object.keys(theme.colors).length > 100,
    `${expected.label} has too few workbench colors.`
  );
  for (const [key, value] of Object.entries(theme.colors || {})) {
    check(isHexColor(value), `${expected.label} has invalid color ${key}=${value}`);
  }
  for (const key of [
    'chat.requestBackground',
    'chat.requestBubbleBackground',
    'inlineChat.background',
    'testing.coveredBackground',
    'scmGraph.historyItemHoverAdditionsForeground',
    'editorCommentsWidget.rangeBackground'
  ]) {
    check(Boolean(theme.colors?.[key]), `${expected.label} is missing required color ${key}.`);
  }
  check(
    Array.isArray(theme.tokenColors) && theme.tokenColors.length >= 50,
    `${expected.label} has too few token colors.`
  );
  for (const [index, rule] of (theme.tokenColors || []).entries()) {
    check(
      typeof rule.scope === 'string' || Array.isArray(rule.scope),
      `${expected.label} tokenColors[${index}] has no scope.`
    );
    if (rule.settings?.foreground) {
      check(
        isHexColor(rule.settings.foreground),
        `${expected.label} tokenColors[${index}] has invalid foreground.`
      );
    }
  }
  for (const [selector, value] of Object.entries(theme.semanticTokenColors || {})) {
    const color = typeof value === 'string' ? value : value?.foreground;
    if (color) {
      check(
        isHexColor(color),
        `${expected.label} semanticTokenColors.${selector} has invalid color.`
      );
    }
  }
}

const iconContribution = manifest.contributes?.iconThemes?.[0];
check(Boolean(iconContribution), 'manifest does not contribute a file icon theme.');
if (iconContribution) {
  check(iconContribution.id === 'jetbrains-type-file-icons', 'file icon theme id mismatch.');
  check(iconContribution.label === 'JetBrains Type File Icons', 'file icon theme label mismatch.');
  check(exists(iconContribution.path), 'file icon theme JSON does not exist.');
  const theme = readJson(iconContribution.path);
  const base = path.dirname(iconContribution.path);
  check(Object.keys(theme.iconDefinitions || {}).length >= 100, 'file icon theme has too few definitions.');
  for (const [name, definition] of Object.entries(theme.iconDefinitions || {})) {
    check(Boolean(definition.iconPath), `iconDefinitions.${name} has no iconPath.`);
    if (definition.iconPath) {
      check(
        exists(path.join(base, definition.iconPath)),
        `iconDefinitions.${name} points to a missing file: ${definition.iconPath}`
      );
    }
  }
  for (const mapping of ['fileNames', 'fileExtensions', 'folderNames', 'languageIds']) {
    for (const [name, icon] of Object.entries(theme[mapping] || {})) {
      check(
        Boolean(theme.iconDefinitions?.[icon]),
        `${mapping}.${name} references an unknown icon: ${icon}`
      );
    }
  }
  for (const key of ['file', 'folder']) {
    check(Boolean(theme[key]), `file icon theme is missing the default ${key} icon.`);
    check(Boolean(theme.iconDefinitions?.[theme[key]]), `default ${key} icon is not defined.`);
  }
}

const productContribution = manifest.contributes?.productIconThemes?.[0];
check(Boolean(productContribution), 'manifest does not contribute a product icon theme.');
if (productContribution) {
  check(productContribution.id === 'jetbrains-type-idea-icons', 'product icon theme id mismatch.');
  check(productContribution.label === 'JetBrains Type UI Icons', 'product icon theme label mismatch.');
  check(exists(productContribution.path), 'product icon theme JSON does not exist.');
  const theme = readJson(productContribution.path);
  const base = path.dirname(productContribution.path);
  check(Array.isArray(theme.fonts) && theme.fonts.length > 0, 'product icon theme has no fonts.');
  for (const font of theme.fonts || []) {
    check(Boolean(font.id), 'product icon theme font has no id.');
    for (const src of font.src || []) {
      check(Boolean(src.path), 'product icon theme font source has no path.');
      if (src.path) {
        const fontPath = path.join(base, src.path);
        check(exists(fontPath), `product icon theme font is missing: ${src.path}`);
        if (exists(fontPath)) {
          check(fs.statSync(path.join(root, fontPath)).size > 0, `product icon theme font is empty: ${src.path}`);
        }
      }
    }
  }
  check(
    Object.keys(theme.iconDefinitions || {}).length >= 20,
    'product icon theme has too few icon definitions.'
  );
  const fontIds = new Set((theme.fonts || []).map((font) => font.id));
  check(fontIds.has('jetbrains-type-idea-icons'), 'symbol icon font is missing.');
  check(fontIds.has('jetbrains-type-activity-icons'), 'activity icon font is missing.');
  const activitySources = ['project.svg', 'search.svg', 'vcs.svg', 'run.svg', 'plugin.svg', 'user.svg', 'settings.svg'];
  for (const source of activitySources) {
    const sourcePath = path.join('product-icons', 'activity', source);
    check(exists(sourcePath), `JetBrains activity icon source is missing: ${source}`);
    if (exists(sourcePath)) {
      const text = fs.readFileSync(path.join(root, sourcePath), 'utf8');
      check(/Apache (License )?2\.0/.test(text), `JetBrains activity icon source has no Apache-2.0 header: ${source}`);
    }
  }
  const uiSources = [
    'chevron-right.svg',
    'chevron-down.svg',
    'chevron-up.svg',
    'chevron-left.svg',
    'close.svg',
    'add.svg',
    'git-commit.svg',
    'debug-restart.svg',
    'debug-step-over.svg',
    'debug-step-into.svg',
    'debug-step-out.svg',
    'debug-pause.svg',
    'debug-stop.svg',
    'debug-continue.svg'
  ];
  for (const source of uiSources) {
    const sourcePath = path.join('product-icons', 'ui', source);
    check(exists(sourcePath), `JetBrains UI icon source is missing: ${source}`);
    if (exists(sourcePath)) {
      const text = fs.readFileSync(path.join(root, sourcePath), 'utf8');
      check(/Apache (License )?2\.0/.test(text), `JetBrains UI icon source has no Apache-2.0 header: ${source}`);
    }
  }
  for (const [name, definition] of Object.entries(theme.iconDefinitions || {})) {
    check(Boolean(definition.fontCharacter), `product icon definition ${name} has no fontCharacter.`);
    if (definition.fontId) {
      check(fontIds.has(definition.fontId), `product icon definition ${name} uses unknown fontId ${definition.fontId}.`);
    }
    if (definition.fontColor) {
      check(isHexColor(definition.fontColor), `product icon definition ${name} has invalid fontColor.`);
    }
  }
}

function expandKeybindings(groups) {
  const gate = 'config.jetbrainsType.keymapEnabled';
  const result = [];
  for (const [index, group] of groups.entries()) {
    check(Boolean(group.category), `keymap[${index}] has no category.`);
    check(Boolean(group.title), `keymap[${index}] has no title.`);
    check(typeof group.key === 'string' && group.key.length > 0, `keymap[${index}] has no key.`);
    check(typeof group.mac === 'string' && group.mac.length > 0, `keymap[${index}] has no mac key.`);
    check(Array.isArray(group.bindings) && group.bindings.length > 0, `keymap[${index}] has no bindings.`);
    for (const binding of group.bindings || []) {
      check(Boolean(binding.command), `keymap[${index}] has a binding without command.`);
      const when = binding.when ? `${gate} && (${binding.when})` : gate;
      assertWhen(when, `${group.title} (${binding.command})`);
      const entry = {
        key: binding.key || group.key,
        mac: binding.mac || group.mac,
        command: binding.command,
        when
      };
      if (binding.args !== undefined) entry.args = binding.args;
      result.push(entry);
    }
  }
  return result;
}

const expectedKeybindings = expandKeybindings(keymapGroups);
try {
  assert.deepEqual(manifest.contributes?.keybindings, expectedKeybindings);
} catch (error) {
  failures.push('package.json keybindings are out of sync with keymap/keybindings.json. Run npm run sync.');
}

check(expectedKeybindings.length >= 80, 'too few keybindings.');
const commands = new Set(expectedKeybindings.map((binding) => binding.command));
check(commands.has('workbench.action.showCommands'), 'Find Action binding is missing.');
check(commands.has('editor.action.rename'), 'Rename binding is missing.');
check(commands.has('git.commit'), 'Git commit binding is missing.');
check(commands.has('workbench.action.terminal.focus'), 'Terminal binding is missing.');

for (const binding of expectedKeybindings) {
  check(!binding.command.startsWith('-'), `negative binding is not expected: ${binding.command}`);
  check(
    typeof binding.key === 'string' && /^[a-z0-9+`\-=,./;'[\]\\]+$/i.test(binding.key),
    `unexpected key syntax: ${binding.key}`
  );
  check(
    typeof binding.mac === 'string' && /^[a-z0-9+`\-=,./;'[\]\\]+$/i.test(binding.mac),
    `unexpected mac key syntax: ${binding.mac}`
  );
}

const seenWin = new Set();
const seenMac = new Set();
for (const binding of expectedKeybindings) {
  const winSignature = `${binding.key}|${binding.when}`;
  const macSignature = `${binding.mac}|${binding.when}`;
  check(!seenWin.has(winSignature), `duplicate Windows/Linux keybinding: ${winSignature}`);
  check(!seenMac.has(macSignature), `duplicate macOS keybinding: ${macSignature}`);
  seenWin.add(winSignature);
  seenMac.add(macSignature);
}

for (const command of manifest.contributes?.commands || []) {
  check(Boolean(command.command && command.title), 'every command must have an id and title.');
  check(
    !command.category || !String(command.title).startsWith(`${command.category}:`),
    `command title duplicates its category: ${command.command}`
  );
}

const commandIds = new Set((manifest.contributes?.commands || []).map((command) => command.command));
for (const id of [
  'jetbrainsType.applyLook',
  'jetbrainsType.revertLook',
  'jetbrainsType.openKeybindings',
  'jetbrainsType.showCheatSheet',
  'jetbrainsType.toggleKeymap',
  'jetbrainsType.applyUiSettings',
  'jetbrainsType.revertUiSettings'
]) {
  check(commandIds.has(id), `manifest is missing command: ${id}`);
}

const configKey = manifest.contributes?.configuration?.properties?.['jetbrainsType.keymapEnabled'];
check(Boolean(configKey), 'jetbrainsType.keymapEnabled setting is missing.');
check(configKey?.default === true, 'jetbrainsType.keymapEnabled must default to true.');
check(configKey?.type === 'boolean', 'jetbrainsType.keymapEnabled must be a boolean.');

const statusBarKey = manifest.contributes?.configuration?.properties?.['jetbrainsType.statusBarEnabled'];
check(Boolean(statusBarKey), 'jetbrainsType.statusBarEnabled setting is missing.');
check(statusBarKey?.default === true, 'jetbrainsType.statusBarEnabled must default to true.');
check(statusBarKey?.type === 'boolean', 'jetbrainsType.statusBarEnabled must be a boolean.');

check(exists('docs/UI_PLUGIN_RESEARCH.md'), 'docs/UI_PLUGIN_RESEARCH.md is missing.');

if (failures.length > 0) {
  console.error(`Validation failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const iconTheme = readJson(iconContribution.path);
console.log('Validation passed.');
console.log(`- ${Object.keys(iconTheme.iconDefinitions).length} file icons`);
console.log(`- ${manifest.contributes.keybindings.length} keybindings in ${keymapGroups.length} groups`);
console.log(`- ${manifest.contributes.themes.length} color themes, ${manifest.contributes.productIconThemes.length} product icon theme`);
