# JetBrains Type

> VS Code / Cursor 的 JetBrains New UI 深色整合扩展：New UI 主题、JetBrains 活动栏与文件图标、IDEA 符号图标、IntelliJ 快捷键，以及可逆的字体/界面设置。

- **扩展 ID**：`mutao.jetbrains-type`
- **目录名**：`jetbrains_type`
- **版本**：`0.4.0`
- **仓库**：https://github.com/memutao/jetbrains-type
- **范围**：源码托管在 GitHub，不发布到 Marketplace / Open VSX。

效果预览：`docs/preview.png`。Top 10 插件调研：`docs/UI_PLUGIN_RESEARCH.md`。

## 包含什么

| 能力 | 实现 |
| --- | --- |
| New UI 配色 | `JetBrains Type New UI Dark`，`#1E1F22` / `#2B2D30` 表面、`#3574F0` 强调色，覆盖工作台、语法/语义高亮、终端、Diff、调试、Git 装饰，以及 VS Code 1.146 的 Chat / Inline Chat / Testing / SCM Graph |
| 活动栏图标 | 优先使用 JetBrains New UI 官方工具窗口 SVG（Apache-2.0）：Project / Search / VCS / Run / Plugins / User / Settings；Chat 无对应图标，保留自绘 |
| 文件图标 | `JetBrains Type File Icons`，68 个 `languageIds`、184 个文件名、175 个扩展名、18 个特殊文件夹 |
| IDEA 符号图标 | `JetBrains Type UI Icons`，保留 Outline / 面包屑中的 class / method / field 图标 |
| 快捷键 | 88 组操作、97 条底层绑定，首装即生效；可在设置中整体关闭 |
| 一键应用 | 固定应用 New UI 主题、文件图标和产品图标；保存当前外观，支持恢复 |
| 界面设置 | 可选应用 JetBrains Mono 字体、连字、关闭 minimap、紧凑标签、树缩进、隐藏命令中心/布局按钮等；全部可备份/恢复 |
| 快捷键速查表 | 内置 Webview，按分类浏览、搜索，同时展示 macOS 与 Windows/Linux 按键 |

## 安装

### 从源码

```bash
git clone https://github.com/memutao/jetbrains-type.git
cd jetbrains-type
npm run check
npm run package
```

### 安装 VSIX

从 GitHub Releases 下载 `jetbrains-type-0.4.0.vsix`，或在源码目录构建后安装：

```bash
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" \
  --install-extension jetbrains-type-0.4.0.vsix --force
```

Cursor 同理：

```bash
"/Applications/Cursor.app/Contents/Resources/app/bin/cursor" \
  --install-extension jetbrains-type-0.4.0.vsix --force
```

安装后重载窗口。快捷键会立即参与按键解析，不需要额外激活。

如果之前装了其他 JetBrains keymap / 图标主题 / 旧版本扩展，建议先禁用或卸载，避免同一按键被多套规则竞争、或文件图标主题互相覆盖。

## 应用外观

运行：

```text
JetBrains Type: 应用外观（主题 + 图标）
```

会同时设置：

- `workbench.colorTheme` → `JetBrains Type New UI Dark`
- `workbench.iconTheme` → `jetbrains-type-file-icons`
- `workbench.productIconTheme` → `jetbrains-type-idea-icons`

应用前会记录当前主题和图标，之后可运行 **JetBrains Type: 恢复应用前的外观** 还原。该恢复不会改动快捷键开关或界面设置。

## 活动栏与图标

活动栏字体 `product-icons/jetbrains-type-activity-icons.woff` 现在优先由 **JetBrains New UI 官方工具窗口 SVG** 生成，源文件保留 Apache-2.0 版权头：

| 活动栏 | JetBrains 源文件 | 字形 |
| --- | --- | --- |
| Project | `expui/toolwindows/project.svg` | 文件夹 |
| Search | `expui/toolwindows/find.svg` | 放大镜 |
| Source Control | `expui/toolwindows/vcs.svg` | 分支节点 |
| Run | `expui/toolwindows/run.svg` | 播放三角 |
| Extensions | `expui/nodes/plugin.svg` | JetBrains 插件插头 |
| Accounts | `expui/general/user.svg` | 用户剪影 |
| Manage | `expui/general/settings.svg` | 齿轮 |
| Chat | 自绘 | 对话气泡（JetBrains 没有对应活动栏图标） |

源文件位于 `product-icons/activity/`。它们通过产品图标主题的 `fontId` 和 `fontCharacter` 映射到：

```text
explorer-view-icon
search-view-icon
source-control-view-icon
run-view-icon
extensions-view-icon
accounts-view-bar-icon
settings-view-bar-icon
chat / comment-discussion
```

同时保留原有 IDEA 符号图标字体，用于 Outline、面包屑和符号搜索。

## 文件图标

基于 [chadalen/vscode-jetbrains-icon-theme](https://github.com/cadamsdev/vscode-jetbrains-icon-theme) 的 2023 UI 图标集，并做了本地化补充：

| 类型 | 映射示例 |
| --- | --- |
| Java / Kotlin | `.java`、`.kt`、`.kts`、`.iml`、`.ipr` |
| Maven / Gradle | `pom.xml`、`build.gradle`、`settings.gradle`、`gradlew` |
| LaTeX | `.tex`、`.cls`、`.sty`、`.bib`、`.bst` |
| 文档 | `README.md`、`CHANGELOG.md`、`LICENSE`、`.pdf` |
| AI 配置 | `AGENTS.md`、`CLAUDE.md`、`.cursorrules`、`.claude/`、`.cursor/` |
| 容器 | `Dockerfile`、`docker-compose.yml`、`compose.yaml` |

图标定义在 `icons/jetbrains-type-icon-theme.json`，SVG 位于 `icons/files/`。

## 界面设置

运行 **JetBrains Type: 应用 JetBrains 风格界面设置**，选择：

1. **完整 UI 设置**：字体、连字、关闭 minimap、选区空白、平滑滚动、树缩进、标签收缩、关闭预览标签、隐藏命令中心/布局按钮、单色括号等；
2. **仅字体与连字**：只改 `editor.fontFamily` 和 `editor.fontLigatures`。

完整模式包含：

```text
editor.fontFamily                    JetBrains Mono + 系统等宽字体回退
editor.fontLigatures                 true
editor.minimap.enabled               false
editor.renderWhitespace              selection
editor.cursorBlinking                smooth
editor.smoothScrolling               true
workbench.list.smoothScrolling       true
workbench.tree.indent                20
workbench.tree.renderIndentGuides    onHover
workbench.editor.tabSizing           shrink
workbench.editor.tabCloseButton      right
workbench.editor.enablePreview       false
window.commandCenter                 false
workbench.layoutControl.enabled      false
explorer.compactFolders              false
editor.bracketPairColorization       false
editor.guides.bracketPairs           active
```

应用前会备份原始值；运行 **JetBrains Type: 恢复界面设置** 还原。

字体不会随扩展打包（上游 JetBrains Mono 字体包是 GPL-3.0）；未安装时会回退到 `SF Mono`、Menlo 或 Consolas。可从命令通知里的 **打开字体下载页** 获取官方字体。

## 快捷键

默认启用。所有绑定都通过 `config.jetbrainsType.keymapEnabled` 条件控制：

```text
设置 → 搜索 jetbrainsType.keymapEnabled → 取消勾选
```

或运行 **JetBrains Type: 启用 / 关闭 JetBrains 快捷键**。

### 常用对照

| 操作 | macOS | Windows / Linux |
| --- | --- | --- |
| 查找操作 | `Shift+Cmd+A` | `Ctrl+Shift+A` |
| 转到文件 | `Cmd+Shift+O` | `Ctrl+Shift+N` |
| 转到符号 | `Cmd+Alt+O` | `Ctrl+Alt+Shift+N` |
| 转到类 | `Cmd+O` | `Ctrl+N` |
| 最近文件 | `Cmd+E` | `Ctrl+E` |
| 查找 / 替换 | `Cmd+F` / `Cmd+R` | `Ctrl+F` / `Ctrl+R` |
| 在文件中查找 | `Cmd+Shift+F` | `Ctrl+Shift+F` |
| 复制行 | `Cmd+D` | `Ctrl+D` |
| 删除行 | `Cmd+Backspace` | `Ctrl+Y` |
| 扩展 / 缩小选区 | `Option+↑` / `Option+↓` | `Ctrl+W` / `Ctrl+Shift+W` |
| 格式化 | `Cmd+Alt+L` | `Ctrl+Alt+L` |
| 快速修复 | `Option+Enter` | `Alt+Enter` |
| 重命名 | `Shift+F6` | `Shift+F6` |
| 查找用法 | `Option+F7` | `Alt+F7` |
| 提交 | `Cmd+K` | `Ctrl+K` |
| 项目视图 | `Cmd+1` | `Alt+1` |
| 终端 | `Option+F12` | `Alt+F12` |
| 隐藏当前工具窗口 | `Shift+Esc` | `Shift+Esc` |
| 最大化编辑器组 | `Cmd+Shift+F12` | `Ctrl+Shift+F12` |

完整快捷键表见 `KEYMAP.md`。

### 有意的取舍

- **`Cmd+K` 是提交**：会覆盖 `Cmd+K` 开头的 chord；可在 Keyboard Shortcuts 中删除 `git.commit` 绑定。
- **`F2` 是下一个问题**；重命名使用 `Shift+F6`。
- **`Cmd+O` 是转到类**；打开文件使用 `Cmd+Shift+O`。
- **`Cmd+T` 是更新项目**；转到符号使用 `Cmd+Alt+O`。
- **`Cmd+[` / `Cmd+]` 是后退 / 前进**；缩进使用 `Tab` / `Shift+Tab`。
- **`F1` 在编辑器内是快速文档**；命令面板使用 `Shift+Cmd+A`。
- `Ctrl+Space`、`Ctrl+←/→` 可能与 macOS 系统快捷键冲突，可在系统设置或 Keyboard Shortcuts 中调整。

## Top 10 调研摘要

| # | 插件 | 安装量 | 吸收点 |
| --- | --- | ---: | --- |
| 1 | Darcula Theme（rokoroku，MIT） | 935,547 | 经典 Darcula 色板与通用 scope |
| 2 | JetBrains Icon Theme（chadalen，MIT） | 374,625 | 2023 UI 文件图标基础集 |
| 3 | JetBrains IDE Keymap（isudox，MIT） | 322,694 | 经修复和收敛的 IntelliJ 键位 |
| 4 | JetBrains Darcula Theme（Anan，MIT） | 178,647 | 细粒度 token 覆盖 |
| 5 | PyCharm Theme（nicohlr，MIT） | 156,071 | 多外观思路；最终收口为单一 New UI |
| 6 | JetBrains Mono（NarasimaPandiyan，GPL-3.0） | 134,215 | 字体/连字设置入口；不复制 GPL 资源 |
| 7 | JetBrains Rider Dark Theme（EdwinSulaiman，MIT） | 98,527 | New UI 深色表面与蓝色 accent |
| 8 | Jetbrains Fleet Theme（MichaelZhou，MIT） | 89,045 | Inlay Hint、语义 token、现代 workbench 颜色 |
| 9 | IntelliJ-ish Darcula Theme（csantiago132，MIT） | 57,403 | 对比度、终端/Peek 可读性 |
| 10 | JetBrains IDEA Icons（Mostik，无明确许可证） | 48,552 | 仅参考 Java/Maven/Gradle 映射思路，不复制资源 |

完整分析见 `docs/UI_PLUGIN_RESEARCH.md`。

## 目录结构

```text
jetbrains_type/
├── assets/                 # 扩展图标
├── docs/                   # 调研报告与预览图
├── icons/
│   ├── files/              # 文件/文件夹 SVG
│   └── jetbrains-type-icon-theme.json
├── keymap/
│   └── keybindings.json    # 快捷键源数据
├── product-icons/          # IDEA 符号 + JetBrains 活动栏 SVG 与字体
├── scripts/
│   ├── sync-keybindings.js
│   └── validate.js
├── src/extension.js        # 外观/设置/速查表/快捷键开关
├── test/                   # 单元测试与集成测试
├── themes/new-ui-dark-color-theme.json
├── package.json
└── KEYMAP.md
```

### 修改快捷键

只改 `keymap/keybindings.json`，然后执行：

```bash
npm run sync
npm run check
```

`sync` 会加上 `config.jetbrainsType.keymapEnabled` 门控、展开到 `package.json`，并重新生成 `KEYMAP.md`。

### 检查与打包

```bash
npm run check
npm run package
```

检查内容包括主题、图标、字体、快捷键同步、命令/设置、许可证和 16 个单元测试。

## 与参考插件的关系

- [JetBrains Icon Theme](https://marketplace.visualstudio.com/items?itemName=chadalen.vscode-jetbrains-icon-theme)（chadalen，MIT）：文件图标基础集。
- [JetBrains IDE Keymap](https://marketplace.visualstudio.com/items?itemName=isudox.vscode-jetbrains-keybindings)（isudox，MIT）：快捷键参考，重写并修复失效命令。
- [JetBrains Idea Product Icon Theme](https://marketplace.visualstudio.com/items?itemName=ardonplay.jetbrains-idea-product-icon-theme)（ardonplay，MIT）：符号图标字体。
- **JetBrains IntelliJ Community 的 New UI 图标**（Apache-2.0）：Project / Search / VCS / Run / Plugin / User / Settings 活动栏图标，源文件见 `product-icons/activity/`。
- Anan / Rider / Fleet / PyCharm 等：配色、New UI 表面和 token 覆盖参考；没有复制其主题 JSON 或图片资源。
- Mostik：仅参考文件映射，不复制资源。

活动栏的 Chat 气泡、Maven/Gradle/TeX/AI 等补充文件图标为本项目自绘。详情见 `THIRD_PARTY_NOTICES.md`。JetBrains、IntelliJ IDEA 等名称和图标是 JetBrains s.r.o. 的商标；本项目与 JetBrains 无关联，仅供个人本地使用。

## 常见问题

**应用后颜色没变？**

检查工作区 `.vscode/settings.json` 是否覆盖了 `workbench.colorTheme`、`workbench.iconTheme` 或 `workbench.productIconTheme`。

**为什么只有一个主题？**

0.4.0 继续对齐 JetBrains New UI：活动栏优先使用官方 SVG，并补齐 VS Code 1.146 的 Chat、Inline Chat、Testing、SCM Graph 等颜色。若要浅色主题需要单独补一套 New UI Light 配色与文件图标。

**活动栏图标没有变化？**

确认 `workbench.productIconTheme` 为 `jetbrains-type-idea-icons`，然后重载窗口。若其他产品图标主题还在生效，VS Code 只会使用一个。

**界面设置改乱了怎么办？**

运行 **JetBrains Type: 恢复界面设置**。应用前已保存原始值。

**快捷键没生效？**

确认 `jetbrainsType.keymapEnabled` 为 `true`，并检查是否有其他 keymap 扩展在竞争同一按键。

**如何彻底移除？**

```bash
code --uninstall-extension mutao.jetbrains-type
```

然后重载窗口。卸载不会自动恢复主题、图标或界面设置，建议先运行两个恢复命令。

## License

MIT © 2026 mutao。第三方许可见 `THIRD_PARTY_NOTICES.md`。
