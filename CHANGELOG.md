# Changelog

## 0.4.1 — 2026-11-25

- 修复 `toggleKeymap` 忽略 `workspaceFolder` 覆盖的问题，并同步更新文件夹级设置。
- 修复 `revertLook` 把缺失图标设置写成 `null` 的问题：现在保留 `null`，缺失值用 `undefined` 删除覆盖。
- 新增 workspaceFolder 切换和 `null`/`undefined` 外观恢复测试；完整 UI 测试覆盖彩虹括号关闭。
- 从 VSIX 排除 `docs/**` 与 `product-icons/activity/**`，减小安装包体积；README 文档链接改为 GitHub。
- 校验脚本增加 README 本地路径、仓库 URL、版本格式、字体非空和 VSIX 排除项检查。


## 0.4.0 — 2026-11-14

- 对齐本机 JetBrains 2025.3.5 New UI：补齐 VS Code 1.146 的 Chat、Inline Chat、Testing、SCM Graph 和编辑器注释/粘性滚动颜色。
- 按 IntelliJ `expUI_dark` 方案校准行号、当前行、光标、空白符、缩进参考线和 Git 新增色。
- UI 设置新增隐藏命令中心与布局按钮，更接近 JetBrains 主窗口。
- 活动栏 SVG 与当前 JetBrains 版本哈希一致，无需替换。
- 新增主题颜色回归校验，版本升至 0.4.0。

## 0.3.1 — 2026-11-14

- 活动栏图标改为优先复用 JetBrains New UI 官方工具窗口 SVG（Apache-2.0）：Project、Search、VCS、Run、Plugin、User、Settings。
- 只有 Chat 没有对应的 JetBrains 活动栏图标，继续使用自绘对话气泡。
- 新增 `product-icons/activity/` SVG 源文件和 Apache-2.0 版权头；重新生成活动栏 WOFF。
- README、调研报告和第三方声明同步更新。

## 0.3.0 — 2026-10-28

- 精简为单一 JetBrains New UI 风格：移除经典 Darcula 主题、`jetbrainsType.preferredTheme` 和“切换配色”命令。
- 新增自绘 JetBrains 活动栏图标字体：Project / Search / Branch / Run / Plugins / Account / Settings / Chat。
- 产品图标主题新增第二个字体，并映射 `explorer-view-icon`、`search-view-icon`、`source-control-view-icon`、`run-view-icon`、`extensions-view-icon`、`accounts-view-bar-icon`、`settings-view-bar-icon`。
- 产品图标主题更名为 `JetBrains Type UI Icons`，同时保留 IDEA 符号图标。
- 命令数精简为 7 个；外观应用固定使用 New UI 主题。
- 预览图收口为单张 `docs/preview.png`。
- 单元测试精简为 16 个，并同步更新真实 VS Code 集成测试。


## 0.2.1 — 2026-10-28

- 修复速查表 Webview 关闭后仍被 `context.subscriptions` 持有、反复打开会累积面板和 60KB HTML 的内存问题。
- 速查表改为单实例：重复执行命令时复用并 reveal 已有面板；关闭扩展时主动 dispose。
- CSP nonce 改用 `crypto.randomBytes`，不再使用 `Math.random`。
- 合并重复的主题标签映射，派生字体设置子集，移除未使用的 `webview` 参数。
- `revertUiSettings` 只处理当前已知设置键，避免异常/历史备份写入任意配置。
- 快捷键开关写入增加错误处理；面板 reveal 失败的竞态会回收后重建。
- 移除 `activationEvents` 中冗余的 `onCommand`（VS Code 1.85+ 会根据 `contributes.commands` 自动激活）。
- 单元测试增至 18 个，新增单面板复用、关闭重建和停用清理测试。


## 0.2.0 — 2026-10-28

- 新增 `JetBrains Type New UI Dark` 主题：`#1E1F22` / `#2B2D30` 表面、`#3574F0` accent，并切换到 New UI Darcula 语法色。
- 新增 `jetbrainsType.preferredTheme` 与 “切换 Darcula / New UI 配色” 命令；应用外观时按偏好选择主题。
- 新增 “应用 JetBrains 风格界面设置”：完整模式 / 仅字体模式，应用前备份，可恢复。
- 新增 JetBrains Mono 字体推荐与官方下载入口；不打包 GPL 字体资源。
- 文件图标新增 68 个 `languageIds`、更多文件名/扩展名映射（总计 184 个文件名、175 个扩展名、18 个文件夹）。
- 补齐 inlay hint、sticky scroll、ghost text、notebook、indent guide、find match border 等工作台颜色。
- 补齐 Python/C/C++/CMake 等语义 token，以及 `class.builtin`、`function.builtin`、`variable.constant` 等。
- 新增 `docs/UI_PLUGIN_RESEARCH.md`：按安装量分析 Top 10 JetBrains UI 插件及许可证边界。
- 扩展命令增至 8 个，单元测试增至 16 个。


## 0.1.0 — 2026-10-28

- 初始本地版本。
- 新增 `JetBrains Type Darcula` 配色主题。
- 新增 `JetBrains Type File Icons`：基于 JetBrains 2023 深色图标，补充 Maven、Gradle、LaTeX/BibTeX、PDF 和 AI 配置图标。
- 新增 `JetBrains Type IDEA Icons` 产品图标主题。
- 新增 88 组、97 条 IntelliJ 风格快捷键，可通过 `jetbrainsType.keymapEnabled` 整体开关。
- 新增应用/恢复外观命令、快捷键设置入口和内置速查表。
- 新增资源校验、快捷键清单同步和扩展单元测试。
