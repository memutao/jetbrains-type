#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packagePath = path.join(root, 'package.json');
const sourcePath = path.join(root, 'keymap', 'keybindings.json');
const docsPath = path.join(root, 'KEYMAP.md');

const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const groups = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

if (!Array.isArray(groups) || groups.length === 0) {
  throw new Error('keymap/keybindings.json must contain a non-empty array.');
}

const gate = 'config.jetbrainsType.keymapEnabled';
const keybindings = [];
const seen = new Set();
const categories = [];

for (const [groupIndex, group] of groups.entries()) {
  if (!group || typeof group !== 'object') {
    throw new Error(`Group ${groupIndex} is not an object.`);
  }
  if (!group.category || !group.title) {
    throw new Error(`Group ${groupIndex} is missing category or title.`);
  }
  if (!Array.isArray(group.bindings) || group.bindings.length === 0) {
    throw new Error(`Group ${groupIndex} (${group.title}) has no bindings.`);
  }
  if (!group.key || !group.mac) {
    throw new Error(`Group ${groupIndex} (${group.title}) is missing key/mac.`);
  }

  if (!categories.includes(group.category)) {
    categories.push(group.category);
  }

  for (const binding of group.bindings) {
    if (!binding.command) {
      throw new Error(`Group ${group.title} has a binding without command.`);
    }
    const key = binding.key || group.key;
    const mac = binding.mac || group.mac;
    const when = binding.when ? `${gate} && (${binding.when})` : gate;
    const dedupeKey = `${key}|${mac}|${when}`;
    if (seen.has(dedupeKey)) {
      throw new Error(`Duplicate keybinding for ${group.title}: ${dedupeKey}`);
    }
    seen.add(dedupeKey);

    const entry = { key, mac, command: binding.command, when };
    if (binding.args !== undefined) {
      entry.args = binding.args;
    }
    keybindings.push(entry);
  }
}

manifest.contributes.keybindings = keybindings;
fs.writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);

const esc = (value) => String(value).replace(/\|/g, '\\|');
const code = (value) => { const text = esc(value); return text.includes('`') ? `\`\` ${text} \`\`` : `\`${text}\``; };
const lines = [
  '# JetBrains Type 快捷键总表',
  '',
  '> 本文件由 `npm run sync` 从 `keymap/keybindings.json` 自动生成，请勿手工修改。',
  '',
  `共 ${groups.length} 组快捷键、${keybindings.length} 条底层绑定。`,
  '',
];

for (const category of categories) {
  lines.push(`## ${category}`, '', '| 操作 | macOS | Windows / Linux | 说明 |', '| --- | --- | --- | --- |');
  for (const group of groups.filter((item) => item.category === category)) {
    lines.push(`| ${esc(group.title)} | ${code(group.mac)} | ${code(group.key)} | ${esc(group.note || '')} |`);
  }
  lines.push('');
}

lines.push('## 关闭快捷键', '', '在设置中把 `jetbrainsType.keymapEnabled` 设为 `false`，即可恢复 VS Code 默认快捷键。', '');
fs.writeFileSync(docsPath, `${lines.join('\n')}\n`);

console.log(`Synced ${groups.length} groups / ${keybindings.length} keybindings.`);
