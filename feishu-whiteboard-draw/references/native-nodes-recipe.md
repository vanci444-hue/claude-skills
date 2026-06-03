# 原生节点配方

目标：每个框是**一个原生可编辑对象**，框与文字一体。

## 1. 形状自带 text（核心）
基础形状 `rect / ellipse / cylinder / diamond / triangle / trapezoid` 都有 `text` 字段：

```json
{ "type": "rect", "id": "memory",
  "width": 170, "height": "fit-content",
  "fillColor": "#DBE4FF", "borderColor": "#3B5BDB", "borderWidth": 2, "borderRadius": 12,
  "textColor": "#1C3FAA", "textAlign": "center", "verticalAlign": "middle",
  "text": [ { "content": "记忆性\n", "bold": true, "fontSize": 15 },
            { "content": "它记得你", "fontSize": 12 } ] }
```

- `text` 可为纯字符串，或 `WBTextRun[]` 富文本：`{ content, bold?, italic?, fontSize? }`。多行用 `\n`，不同行不同字号就拆成多个 run。
- `textColor` 是节点级（作用于整段）。要分行变色，靠 run 级样式有限，必要时退而用同色系。
- ❌ 千万别用 `frame` 套 `text` 子节点来拼"卡片"——那是浮字，不是原生框内字。

## 2. 多行文字别截断
含文字节点 `height: "fit-content"`。Shape 强制内边距：rect/ellipse/diamond/triangle 上下左右各 12px（fit-content 会自动补偿）。

## 3. 树状/流程：dagre 自动布线
一个 `layout:"dagre"` 的 frame，父子关系写进 `layoutOptions.edges`，引擎自动排版 + 生成贝塞尔连线。横向树用 `rankdir:"LR"`，纵向用 `"TB"`。`edges` 只写在最外层根 dagre。
- 间距：`nodesep`（同级间距）、`ranksep`（层间距），偏紧就调大。
- 自由摆放/连线穿越分组：见 `lark-whiteboard/references/connectors.md` 与 schema 的 `isCluster`。

## 4. 配色档（默认经典色板，可按需换）
分层/分类配色，层级用"主色边框 + 浅色填充"区分：

| 用途 | 主色(边框/中心填充) | 浅色(叶子填充) | 文字 |
|---|---|---|---|
| 中心/强调 | `#5F3DC4`(实心紫) | — | `#FFFFFF` |
| 蓝组 | `#3B5BDB` | `#DBE4FF` | `#1C3FAA` |
| 橙组 | `#E8590C` | `#FFE8CC` | `#B34700` |
| 绿组 | `#2F9E44` | `#D3F9D8` | `#1E6B2E` |
| 红组 | `#E03131` | `#FFE3E3` | `#B02525` |
| 灰/中性 | `#868E96` | `#F1F3F5` | `#343A40` |

中心节点用实心深色+白字最醒目；二级用白底+粗色边框(borderWidth 3)；叶子用浅色填充弱一档。层级感来自"大小 + 颜色深浅 + 列位置"。

## 5. 渲染自查清单
- [ ] 每个含字节点是"形状自带 text"，不是 frame+text
- [ ] 含字节点 height = `fit-content`
- [ ] 所有节点有边框（borderWidth ≥ 2），文字在底色上清晰
- [ ] connector / dagre edges 正确，无交叉
- [ ] 预览 PNG 文字无截断、无溢出

## 6. raw 层手改注意（一般不用，除非微调）
DSL→raw 后若要手改 JSON：
- `vertical_align` 用 `mid`（不是 DSL 的 `middle`），否则 400。
- `+update --input_format raw` 吃**完整 envelope**（`{code,data,result}`），不是裸 nodes 数组。
- `+query --output_as image` 的目录参数是 `--output`，不是 `--output_dir`。
- 优先改 DSL 重新转，别长期维护手改的 raw。
