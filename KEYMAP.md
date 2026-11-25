# JetBrains Type 快捷键总表

> 本文件由 `npm run sync` 从 `keymap/keybindings.json` 自动生成，请勿手工修改。

共 88 组快捷键、97 条底层绑定。

## 通用

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 查找操作 | `shift+cmd+a` | `ctrl+shift+a` | JetBrains 的 Find Action |
| 打开设置 | `cmd+,` | `ctrl+alt+s` |  |
| 切换配色方案 | `` ctrl+` `` | `` ctrl+` `` |  |
| 全部保存 | `cmd+s` | `ctrl+s` |  |
| 关闭当前编辑器 | `cmd+w` | `ctrl+f4` |  |
| 最大化编辑器组 | `cmd+shift+f12` | `ctrl+shift+f12` | 再次按下还原；不是全屏 |
| 切换全屏 | `ctrl+cmd+f` | `f11` |  |
| 最近文件 | `cmd+e` | `ctrl+e` |  |
| Quick Open 中切换候选 | `ctrl+tab` | `ctrl+tab` |  |

## 编辑

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 复制行或选区 | `cmd+d` | `ctrl+d` |  |
| 删除行 | `cmd+backspace` | `ctrl+y` |  |
| 智能换行 | `cmd+enter` | `ctrl+enter` |  |
| 向下新建行 | `shift+enter` | `shift+enter` |  |
| 向上新建行 | `cmd+alt+enter` | `ctrl+alt+enter` |  |
| 上移行 | `shift+alt+up` | `shift+ctrl+up` |  |
| 下移行 | `shift+alt+down` | `shift+ctrl+down` |  |
| 行注释 | `cmd+/` | `ctrl+/` |  |
| 块注释 | `cmd+alt+/` | `ctrl+shift+/` |  |
| 扩展选区 | `alt+up` | `ctrl+w` |  |
| 缩小选区 | `alt+down` | `ctrl+shift+w` |  |
| 选中所有出现 | `ctrl+cmd+g` | `ctrl+shift+alt+j` |  |
| 添加下一个出现 | `ctrl+g` | `alt+j` |  |
| 取消上一个出现 | `ctrl+shift+g` | `alt+shift+j` |  |
| 合并行 | `cmd+shift+j` | `ctrl+shift+j` |  |
| 折叠代码块 | `cmd+-` | `ctrl+-` |  |
| 展开代码块 | `cmd+=` | `ctrl+=` |  |
| 全部折叠 | `cmd+shift+-` | `ctrl+shift+-` |  |
| 全部展开 | `cmd+shift+=` | `ctrl+shift+=` |  |
| 格式化代码 | `cmd+alt+l` | `ctrl+alt+l` | 有选区时只格式化选区 |
| 优化导入 | `ctrl+alt+o` | `ctrl+alt+o` |  |
| 上下文操作 / 快速修复 | `alt+enter` | `alt+enter` |  |
| 参数信息 | `cmd+p` | `ctrl+p` |  |
| 基本补全 | `ctrl+space` | `ctrl+space` |  |
| 快速文档 | `f1` | `ctrl+q` | macOS 绑定 F1 |
| 快速定义 | `cmd+y` | `ctrl+shift+i` |  |
| 重命名符号 | `shift+f6` | `shift+f6` |  |
| 下一个问题 | `f2` | `f2` |  |
| 上一个问题 | `shift+f2` | `shift+f2` |  |

## 搜索与替换

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 查找 | `cmd+f` | `ctrl+f` |  |
| 替换 | `cmd+r` | `ctrl+r` |  |
| 在文件中查找 | `cmd+shift+f` | `ctrl+shift+f` |  |
| 在文件中替换 | `cmd+shift+r` | `ctrl+shift+r` |  |
| 查找下一个 | `cmd+g` | `f3` |  |
| 查找上一个 | `cmd+shift+g` | `shift+f3` |  |
| Quick Open 中下一个 | `cmd+e` | `ctrl+e` |  |
| 转到文件 | `cmd+shift+o` | `ctrl+shift+n` |  |
| 转到符号 | `cmd+alt+o` | `ctrl+alt+shift+n` |  |
| 转到类 | `cmd+o` | `ctrl+n` |  |
| 文件结构 | `cmd+f12` | `ctrl+f12` |  |
| 转到行 | `cmd+l` | `ctrl+g` |  |

## 导航

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 转到声明 | `cmd+b` | `ctrl+b` |  |
| 转到实现 | `cmd+alt+b` | `ctrl+alt+b` |  |
| 后退 | `cmd+[` | `ctrl+alt+left` |  |
| 前进 | `cmd+]` | `ctrl+alt+right` |  |
| 最近编辑位置 | `cmd+shift+backspace` | `ctrl+shift+backspace` |  |
| 上一个编辑器 | `ctrl+left` | `ctrl+left` |  |
| 下一个编辑器 | `ctrl+right` | `ctrl+right` |  |
| 上一个拆分编辑器组 | `shift+alt+tab` | `shift+alt+tab` |  |
| 下一个拆分编辑器组 | `alt+tab` | `alt+tab` |  |

## 代码智能

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 查找用法 | `alt+f7` | `alt+f7` |  |
| 调用层次 | `ctrl+alt+h` | `ctrl+alt+h` |  |
| 重构菜单 | `ctrl+alt+shift+t` | `ctrl+alt+shift+t` |  |
| 提取方法 / 变量 | `ctrl+alt+m` | `ctrl+alt+m` |  |

## 构建与调试

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 构建项目 | `cmd+f9` | `ctrl+f9` |  |
| 运行 | `ctrl+alt+r` | `shift+f10` | 使用当前启动配置 |
| 调试 | `ctrl+alt+d` | `shift+f9` |  |
| 停止调试 | `cmd+f2` | `ctrl+f2` |  |
| 继续 | `f9` | `f9` |  |
| 单步跳过 | `f8` | `f8` |  |
| 单步进入 | `f7` | `f7` |  |
| 单步退出 | `shift+f8` | `shift+f8` |  |
| 运行到光标 | `alt+f9` | `alt+f9` |  |
| 计算表达式 | `alt+f8` | `alt+f8` |  |
| 切换断点 | `cmd+f8` | `ctrl+f8` |  |

## 版本控制

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 提交 | `cmd+k` | `ctrl+k` | 只提交已暂存的更改 |
| 推送 | `cmd+shift+k` | `ctrl+shift+k` |  |
| 更新项目 | `cmd+t` | `ctrl+t` |  |

## 工具窗口

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 项目视图 | `cmd+1` | `alt+1` | 聚焦时再按一次可隐藏 |
| 搜索视图 | `cmd+3` | `alt+3` | 聚焦时再按一次可隐藏 |
| 运行与调试视图 | `cmd+5` | `alt+5` | 聚焦时再按一次可隐藏 |
| 源代码管理视图 | `cmd+9` | `alt+9` | 聚焦时再按一次可隐藏 |
| 问题面板 | `cmd+6` | `alt+6` | 聚焦时再按一次可隐藏 |
| 终端 | `alt+f12` | `alt+f12` | 终端已聚焦时再按一次可隐藏 |
| 隐藏当前工具窗口 | `shift+escape` | `shift+escape` | 适用于终端、侧边栏和面板 |

## 资源管理器

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 打开高亮文件 | `enter` | `enter` |  |
| 重命名文件 | `shift+f6` | `shift+f6` |  |

## 差异比较

| 操作 | macOS | Windows / Linux | 说明 |
| --- | --- | --- | --- |
| 下一个差异 | `f7` | `f7` |  |
| 上一个差异 | `shift+f7` | `shift+f7` |  |

## 关闭快捷键

在设置中把 `jetbrainsType.keymapEnabled` 设为 `false`，即可恢复 VS Code 默认快捷键。

