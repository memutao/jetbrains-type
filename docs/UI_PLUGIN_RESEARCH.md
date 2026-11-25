# JetBrains UI 插件 Top 10 调研

> 数据快照：2026-10-28，VS Code Marketplace。安装量取 Marketplace API 的 `install` 统计；这里把“UI 优化”定义为配色、图标、字体和键位这类界面/交互层能力，排除了语言支持、AI、Git 客户端和泛主题包。

## 筛选方法

1. 在 Marketplace 搜索 `jetbrains`。
2. 按安装量排序，保留与 JetBrains **外观/交互**直接相关的插件。
3. 排除：
   - `Best Themes Redefined` 等与 JetBrains 无关的泛主题；
   - `Kotlin by JetBrains`、`C# by ReSharper` 等语言支持；
   - `AI Assistant by JetBrains`；
   - 安装量 10.3 万的 `expand-region`（它复刻的是结构性选区，不是 UI 外观）；
   - Git、changelist、search-everywhere 等单点效率工具（不在本次 UI 范围）。

说明：Marketplace 的搜索结果里还有很多安装量更低的 Darcula 复刻主题；下表只取 UI 类别下安装量最高的 10 个。

## Top 10

| # | 插件 | 安装量 | 评分 | 主要优点 | 本扩展的吸收方式 |
| --- | --- | ---: | ---: | --- | --- |
| 1 | [Darcula Theme](https://marketplace.visualstudio.com/items?itemName=rokoroku.vscode-theme-darcula)（rokoroku，MIT） | 935,547 | 4.76 | 经典 Darcula 配色，安装量最高；尽量沿用常见 TextMate scope，语言覆盖面广；主题文件小、无依赖 | 保留经典 Darcula 色板，作为默认主题；继续使用通用 scope，而不是只针对 Java |
| 2 | [JetBrains Icon Theme](https://marketplace.visualstudio.com/items?itemName=chadalen.vscode-jetbrains-icon-theme)（chadalen，MIT） | 374,625 | 5.0 | 2023 UI 图标质量高；提供 Dark/Light/Auto 多版本；150 个扩展名、87 个文件名映射 | 以 2023 Dark 为基础；**新增 languageIds 映射、184 个文件名、175 个扩展名**；保留后续扩展空间 |
| 3 | [JetBrains IDE Keymap](https://marketplace.visualstudio.com/items?itemName=isudox.vscode-jetbrains-keybindings)（isudox，MIT） | 322,694 | 4.81 | 150 条快捷键，覆盖编辑、导航、调试、VCS；把 JetBrains 习惯带进 VS Code | 重写并收敛为 88 组/97 条；移除失效命令和重复绑定；新增总开关，避免“装上就改坏键位” |
| 4 | [JetBrains Darcula Theme](https://marketplace.visualstudio.com/items?itemName=Anan.jetbrains-darcula-theme)（Anan，MIT） | 178,647 | 4.78 | 293 条 tokenColors，语法覆盖非常细；Darcula 基础色完整 | 对比其 scope 覆盖，补齐 Java、LaTeX、Markdown、SQL、YAML 等规则；保留独立整理的 JSON |
| 5 | [PyCharm Theme](https://marketplace.visualstudio.com/items?itemName=nicohlr.pycharm)（nicohlr，MIT） | 156,071 | 5.0 | 一次提供 Original / Dark / Night / Dark+ 四个变体；强调终端、Peek、侧边栏对比度 | 吸收“多外观变体”的产品思路：新增 New UI Dark，并提供配色切换命令与偏好设置 |
| 6 | [JetBrains Mono](https://marketplace.visualstudio.com/items?itemName=NarasimaPandiyan.jetbrainsmono)（NarasimaPandiyan，GPL-3.0） | 134,215 | 4.43 | 打包 JetBrains Mono 字体；提供激活/停用命令、字体目录和连字配置 | **不复制 GPL 字体或代码**；实现“仅字体/完整设置”命令，设置字体族和连字，并提供官方下载入口与设置备份 |
| 7 | [JetBrains Rider Dark Theme](https://marketplace.visualstudio.com/items?itemName=EdwinSulaiman.jetbrains-rider-dark-theme)（EdwinSulaiman，MIT） | 98,527 | 5.0 | 使用 Rider New UI 的现代表面色：`#1E1F22` / `#2B2D30`、`#3474F0` 强调色；语义高亮简洁 | 吸收为新主题 **JetBrains Type New UI Dark**：深色表面、蓝色 accent、紧凑 tab、单色括号 |
| 8 | [Jetbrains Fleet Theme](https://marketplace.visualstudio.com/items?itemName=MichaelZhou.fleet-theme)（MichaelZhou，MIT） | 89,045 | 5.0 | 267 个工作台颜色、247 条 token 规则、44 个语义 token；inlay hint、现代深色、多语言覆盖 | 补齐 `editorInlayHint.*`、`editorStickyScroll.*`、`editorGhostText.*`、`notebook.*` 等 UI 颜色，并扩充 Python/C/C++ 语义 token |
| 9 | [IntelliJ-ish Darcula Theme](https://marketplace.visualstudio.com/items?itemName=csantiago132.intellij-ish-darcula-theme)（csantiago132，MIT） | 57,403 | 5.0 | 明确以“提高对比度、降低侧边栏干扰、优化终端/Peek”为目标；小而完整 | 采用“可读性优先”的取舍：低对比侧边栏文字、明确的选区/搜索/Diff 颜色、终端 ANSI 独立配色 |
| 10 | [JetBrains IDEA Icons](https://marketplace.visualstudio.com/items?itemName=Mostik.JetBrainsIcons)（Mostik，无明确许可证） | 48,552 | 5.0 | 面向 Java / Maven / Gradle 的文件图标，IDEA 风格辨识度高 | **只参考映射思路**，不复制资源；自绘 Maven/Gradle 图标并补充 `.iml`、`pom.xml`、`build.gradle` 等映射 |

## 从 Top 10 看出的共性

1. **经典 Darcula 仍然最大**：前三名（含图标和 keymap）验证了“经典色板 + 完整图标 + 键位”是最高需求。
2. **多外观比单一外观更有吸引力**：PyCharm Theme 的四个变体说明用户愿意在同一入口里切换风格。
3. **New UI 是独立方向**：Rider/Fleet 的安装量证明 `#1E1F22` / `#2B2D30` / `#3574F0` 这套现代深色并不只是“换背景”。
4. **字体是单独的高需求**：JetBrains Mono 有 13.4 万安装；但它是 GPL-3.0，不能把字体和代码搬进 MIT 扩展。
5. **图标不只是“.java 一个图标”**：高安装图标主题都有大量扩展名/文件名映射，并开始支持 `languageIds` 和 Auto/Light 变体。
6. **设置需要可逆**：字体包提供激活/停用；主题用户也会同时改字体、缩进、minimap。只改不还原会造成负担。
7. **许可证差异很大**：Top 10 里既有 MIT，也有 GPL 和无明确许可证的项目；不能只看安装量。

## 0.4.1 当前实现

- **单一 New UI 主题**：保留 `JetBrains Type New UI Dark`，移除经典 Darcula 主题和主题选择命令，减少维护面。
- **活动栏图标**：优先使用 JetBrains New UI 官方工具窗口 SVG（Apache-2.0）生成独立 WOFF：Project、Search、VCS、Run、Plugin、User、Settings。只有 Chat 没有对应图标，继续自绘。
- **可选 UI 设置**：
  - 完整模式：字体族、连字、关闭 minimap、选区空白、平滑滚动、树缩进、tab 收缩、关闭预览、隐藏命令中心/布局按钮、单色括号等；
  - 仅字体模式：只改 `editor.fontFamily` / `editor.fontLigatures`；
  - 所有改动先备份，支持“恢复界面设置”。
- **字体体验**：建议安装 JetBrains Mono，提供官方下载入口；**不打包 GPL 字体资源**。
- **文件图标增强**：68 个 `languageIds`、184 个文件名、175 个扩展名、18 个文件夹名；沿用并扩展自绘 Maven/Gradle/TeX/AI 图标。
- **工作台颜色补齐**：inlay hint、sticky scroll、ghost text、notebook、indent guide 旧键、find match border、marker navigation、Chat/Inline Chat、Testing、SCM Graph、编辑器注释等。
- **语义高亮补齐**：Python/C/C++/CMake 等常用语义 token，以及 `class.builtin`、`function.builtin`、`variable.constant` 等。
- **保持键位克制**：不盲目复制 150 条旧绑定；继续使用 97 条经过验证的绑定，避免失效命令和冲突。
- **0.4.1 修正**：快捷键开关同步处理 workspaceFolder 覆盖；外观恢复区分 `null` 与 `undefined`；VSIX 排除文档与 SVG 源文件。
- **2025.3.5 校准**：本机 IntelliJ 2025.3.5 的 `expui` 活动栏 SVG 哈希未变；按其 `expUI_dark` scheme 校准行号、当前行、空白符、缩进线和 Git 新增色，并补充 VS Code 1.146 新颜色键。

## 没有吸收的部分

- **Light / Auto 图标主题**：本扩展当前定位为 New UI Dark 个人使用；如后续加入 Light，再补 Light 图标变体。
- **经典 Darcula 主题**：0.3.0 按要求移除，只保留 New UI 风格。
- **打包 JetBrains Mono**：字体包是 GPL-3.0，直接复制会改变整个扩展的许可证结构；改用设置和官方下载入口。
- **Mostik 的图标资源**：没有明确许可证，不能复制。
- **CSS 注入 / 修改 VS Code 安装文件**：部分“像素级复刻”插件依赖非官方 CSS 注入，升级后易失效且有安全风险；本扩展只使用官方 contribution points。
- **独立 Dashboard / Search Everywhere**：属于独立产品级功能，本次先聚焦主题、图标、字体和设置可逆性。

## 参考链接

- Marketplace 搜索：https://marketplace.visualstudio.com/search?term=jetbrains&target=VSCode
- 各插件安装量来自 Marketplace `extensionquery` API，快照日期 2026-10-28。
- 许可证与实现细节来自各插件 VSIX 内的 `package.json`、`LICENSE` 和 README。
- JetBrains New UI 图标调色板：https://github.com/kilo-org/kilocode/blob/main/.kilo/skills/icon-jetbrains/palette.md
- VS Code Theme Color 参考：https://code.visualstudio.com/api/references/theme-color
- VS Code 1.146 Release Notes：https://code.visualstudio.com/updates/v1_146
- JetBrains 2025.3 Keymap 文档：https://www.jetbrains.com/help/pycharm/2025.3/configuring-keyboard-and-mouse-shortcuts.html
