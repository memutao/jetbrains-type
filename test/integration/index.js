'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');

const EXTENSION_ID = 'mutao.jetbrains-type';

const progressPath = '/tmp/jbtype-integration-progress.txt';
function progress(message) {
  fs.appendFileSync(progressPath, `${new Date().toISOString()} ${message}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return;
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function run() {
  try {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension, `Extension not found: ${EXTENSION_ID}`);
  progress('extension found');
  await extension.activate();
  progress('extension activated');

  const manifest = extension.packageJSON;
  assert.equal(manifest.displayName, 'JetBrains Type');
  assert.deepEqual(
    manifest.contributes.themes.map((theme) => theme.label),
    ['JetBrains Type New UI Dark']
  );
  assert.equal(manifest.contributes.iconThemes[0].label, 'JetBrains Type File Icons');
  assert.equal(manifest.contributes.productIconThemes[0].label, 'JetBrains Type UI Icons');
  assert.equal(manifest.contributes.keybindings.length, 97);

  for (const relativePath of [
    ...manifest.contributes.themes.map((theme) => theme.path),
    manifest.contributes.iconThemes[0].path,
    manifest.contributes.productIconThemes[0].path,
    'keymap/keybindings.json',
    'assets/icon.png',
    'docs/UI_PLUGIN_RESEARCH.md'
  ]) {
    assert.ok(
      fs.existsSync(path.join(extension.extensionPath, relativePath)),
      `Missing extension file: ${relativePath}`
    );
  }

  const commands = await vscode.commands.getCommands(true);
  for (const command of [
    'jetbrainsType.applyLook',
    'jetbrainsType.revertLook',
    'jetbrainsType.openKeybindings',
    'jetbrainsType.showCheatSheet',
    'jetbrainsType.toggleKeymap',
    'jetbrainsType.applyUiSettings',
    'jetbrainsType.revertUiSettings'
  ]) {
    assert.ok(commands.includes(command), `Command not registered: ${command}`);
  }

  const readKeymapEnabled = () =>
    vscode.workspace.getConfiguration('jetbrainsType').get('keymapEnabled');
  assert.equal(readKeymapEnabled(), true);

  const readWorkbench = () => vscode.workspace.getConfiguration('workbench');
  const readLook = () => {
    const config = readWorkbench();
    return {
      colorTheme: config.get('colorTheme'),
      iconTheme: config.get('iconTheme'),
      productIconTheme: config.get('productIconTheme')
    };
  };

  const before = readLook();
  progress(`before=${JSON.stringify(before)}`);
  await readWorkbench().update(
    'colorTheme',
    'Default Light Modern',
    vscode.ConfigurationTarget.Global
  );
  await waitFor(
    () => vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light,
    5000,
    'the default light theme'
  );

  progress('applying look');
  await vscode.commands.executeCommand('jetbrainsType.applyLook');
  progress(`after apply=${JSON.stringify(readLook())} kind=${vscode.window.activeColorTheme.kind}`);
  await waitFor(
    () =>
      readLook().colorTheme === 'JetBrains Type New UI Dark' &&
      readLook().iconTheme === 'jetbrains-type-file-icons' &&
      readLook().productIconTheme === 'jetbrains-type-idea-icons',
    5000,
    'the JetBrains Type look to be written'
  );
  await waitFor(
    () => vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark,
    5000,
    'the New UI color theme to activate'
  );

  progress('opening cheat sheet');
  await vscode.commands.executeCommand('jetbrainsType.showCheatSheet');
  progress('cheat sheet opened');
  await sleep(300);

  await vscode.commands.executeCommand('jetbrainsType.toggleKeymap');
  assert.equal(readKeymapEnabled(), false);
  await vscode.commands.executeCommand('jetbrainsType.toggleKeymap');
  assert.equal(readKeymapEnabled(), true);

  progress('reverting look');
  await vscode.commands.executeCommand('jetbrainsType.revertLook');
  progress(`after revert=${JSON.stringify(readLook())}`);
  await waitFor(
    () =>
      readLook().colorTheme === 'Default Light Modern' &&
      readLook().iconTheme === before.iconTheme &&
      readLook().productIconTheme === before.productIconTheme,
    5000,
    'the previous look to be restored'
  );

  fs.writeFileSync('/tmp/jbtype-integration-result.txt', 'PASS\n');
  progress('PASS');
  console.log('JetBrains Type integration test passed.');
  } catch (error) {
    progress(`FAIL: ${error.stack || error}`);
    throw error;
  }
}

module.exports = { run };
