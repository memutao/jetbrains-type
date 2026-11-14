# Activity bar icon sources

The activity-bar font `../jetbrains-type-activity-icons.woff` is generated from the SVGs in this directory.

## JetBrains New UI icons

These files are taken from the IntelliJ Platform New UI (`expui`) icon set. Each source file retains its JetBrains copyright and Apache License 2.0 header:

| File | JetBrains source | VS Code mapping |
| --- | --- | --- |
| `project.svg` | `expui/toolwindows/project.svg` | Explorer |
| `search.svg` | `expui/toolwindows/find.svg` | Search |
| `vcs.svg` | `expui/toolwindows/vcs.svg` | Source Control |
| `run.svg` | `expui/toolwindows/run.svg` | Run and Debug |
| `plugin.svg` | `expui/nodes/plugin.svg` | Extensions |
| `user.svg` | `expui/general/user.svg` | Accounts |
| `settings.svg` | `expui/general/settings.svg` | Manage |

Full license text: `../../third_party/Apache-2.0.txt`.

## Original icon

| File | Reason | License |
| --- | --- | --- |
| `chat.svg` | JetBrains does not provide a matching activity-bar Chat icon | MIT, same as this project |

The font is monochrome. Stroke-based SVGs are expanded to filled outlines and filled SVGs are combined into single-color glyphs before generating the WOFF.
