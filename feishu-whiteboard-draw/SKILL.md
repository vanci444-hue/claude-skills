---
name: feishu-whiteboard-draw
description: 把结构化内容画成飞书（Lark）文档里的【原生可编辑画板】——思维导图、流程图、架构图、泳道、关系图、时间线等任意图形。当用户要在飞书文档里新增/替换一张图、做脑图/流程图/架构图、或抱怨"画板里文字没在框里 / 想在飞书里手动拖动节点"时使用。核心保证：节点是原生可编辑对象（框与文字一体），不是 SVG 死图，不是"框+浮字"两层。依赖 lark-cli + @larksuite/whiteboard-cli；底层 DSL 语法以已安装的 lark-whiteboard skill 为准，本 skill 补的是"在文档里落地原生画板"的全链路与避坑。
---

# feishu-whiteboard-draw

在**飞书文档里**生成/替换一张**原生可编辑**的画板图（任意图形，不限脑图）。

> 这个 skill 是 `lark-whiteboard` 的"应用层"。`lark-whiteboard` 教你**给定 board_token 怎么用 DSL 画**；本 skill 教你**在一篇飞书文档里，怎么把画板块插进去 / 换掉 / 拿到能写入的 token**，以及怎么保证产出是**原生可编辑节点**而不是死图。深层 DSL 语法（schema/layout/style/connectors）一律去读 `lark-whiteboard/references/`，不在这里重复。

## 何时用
- 用户给一篇飞书文档，要在里面**加一张图**（脑图/流程/架构/泳道/关系/时间线…）。
- 用户嫌现有图**"文字没在框里""不能在飞书里拖动/改字"**——要原生可编辑节点。
- 要把一段结构化大纲、对比表、层级关系**可视化**成飞书图。

## 不要用
- 只是想要一张静态图片插文档 → 那用 `<img>` 或 SVG 更简单。
- 已经有 board_token、只是纯画图、不涉及文档块操作 → 直接用 `lark-whiteboard` 即可。

---

## 🔑 三条铁律（这三条是本 skill 的存在意义）

### 铁律 1：文字必须"挂在形状上"，不能"frame 套 text 子节点"
飞书原生"框里有字"的唯一正确写法 = **基础形状自带 `text` 字段**：

```json
{ "type": "rect", "width": 170, "height": "fit-content",
  "fillColor": "#DBE4FF", "borderColor": "#3B5BDB", "borderWidth": 2, "borderRadius": 12,
  "textColor": "#1C3FAA",
  "text": [ { "content": "记忆性\n", "bold": true, "fontSize": 15 },
            { "content": "它记得你", "fontSize": 12 } ] }
```

❌ **错误写法**：`frame` 容器里放两个 `text` 子节点当一个"卡片"。这会被渲染成**框 + 两段浮在上面的独立文字**，用户双击发现框和字是分开的对象——这正是踩过的坑。
✅ 一个 `rect`（或 ellipse/diamond/…）+ 它自己的 `text`（用 `WBTextRun[]` 富文本写多行/多字号）= 一个原生可编辑节点，框字一体、随框移动。

### 铁律 2：含文字节点 `height` 用 `"fit-content"`
写死数值会截断文字。Shape 有强制内边距（rect 上下左右各 12px），fit-content 会自动补偿。

### 铁律 3：连线交给 dagre `edges` 自动布线，别手算坐标
树状/流程图用一个 `layout:"dagre"` 的 frame，把父子关系写进 `layoutOptions.edges`，引擎自动排版 + 生成连线。`edges` 只写在**最外层根 dagre**里。

---

## 端到端流程

### Step 0 · 确认依赖（不用问用户）
```bash
npx -y @larksuite/whiteboard-cli@^0.2.11 -v
```

### Step 1 · 拿到一个能写入的 board_token
分两种情况：

**A. 文档里已有目标画板** → 直接 `docs +fetch --detail with-ids` 拿到 `<whiteboard token="...">` 的 token。
> ⚠️ **block_id 陷阱**：`docs +update` 插入命令**返回的 block_id 是临时假 id**，和真正落库的 id 不一致。任何后续操作（拿 token、删除、再插入做锚点）**必须重新 `docs +fetch` 取真实 id/token**，不要用插入响应里的 id。

**B. 要在文档里新建一张画板** → 见 [`references/docx-embedding.md`](references/docx-embedding.md)。关键坑：
- **空白画板 `<whiteboard type="blank">` 插不进去**（飞书判"无内容=无变更"，报 `degrade_code=1011`）。
- 正确套路：先插一个**最小可渲染的 mermaid 画板**（`graph LR\n A-->B`）拿到真 token，再用 DSL 覆盖重绘。
- 锚点要用 `docs +fetch` 取到的**真实** block_id，别用插入返回的假 id。

### Step 2 · 写 DSL（含颜色），渲染自查
- 节点用"形状自带 text"（铁律 1）；布局 dagre/flex 见 `lark-whiteboard/references/layout.md`；配色见 `style.md`。
- 模板起步：[`templates/mindmap.dsl.json`](templates/mindmap.dsl.json)。
- 预览：`npx -y @larksuite/whiteboard-cli@^0.2.11 -i diagram.json -o diagram.png`，看文字是否在框内、无截断、连线无交叉。

### Step 3 · 转 raw → **合并文字（必做！）** → 写入（覆盖式）

> 🔴 **铁律 4（实测 whiteboard-cli 0.2.11）：`--to openapi` 会把每个"形状自带 text"拆成「空 text 的 composite_shape + 独立 text_shape」**，直接写进飞书就是"框 + 浮在上面的字"（点框文字不跟着动；宽横条的浮字还会被底色盖住变空框）。**所以不能直接 pipe，必须先把 openapi 落盘、后处理合并、再写入。**

```bash
# 1) 导出 openapi 到文件（不要直接 pipe）
npx -y @larksuite/whiteboard-cli@^0.2.11 -i diagram.json --to openapi --format json > openapi.json
# 2) 合并：把漂浮 text_shape 并回它底下的 composite_shape.text，删掉浮字
#    用本 skill 自带脚本（先按你图里"含子节点的容器/外框/band"坐标改脚本顶部 CONTAINERS 锚点）
node templates/merge-text-into-shapes.cjs openapi.json merged.json
# 3) 写入合并后的 raw
cat merged.json | lark-cli whiteboard +update --whiteboard-token <board_token> \
      --source - --input_format raw --idempotent-token <时间戳> --as user --overwrite
```

**合并逻辑**（脚本 [`templates/merge-text-into-shapes.cjs`](templates/merge-text-into-shapes.cjs)）：读 `openapi.json` 的 `data.result.nodes`；对每个 `text_shape T`，找同 `x`、同 `width`、且 `T.y` 落在某 `composite_shape C` 垂直范围内的 C → 把 `T.text` 整个拷进 `C.text`（保留 rich_text 双行样式），按角色覆盖对齐（含子节点的容器/外框/band 标题→ `vertical_align:top, horizontal_align:left`；普通框/横条→ `mid/center`），并删掉 T；匹配不到的 text_shape = 真正悬在空白处的 caption，保留。**脚本顶部 `CONTAINERS` 的 (x,y) 锚点需按当前图里"含子节点的容器/外框/band"实际坐标改。**

### Step 4 · 回查
```bash
lark-cli whiteboard +query --whiteboard-token <token> --output_as raw --as user   # 看节点结构
lark-cli whiteboard +query --whiteboard-token <token> --output_as image --output ./verify.png --as user
```
**自检关键（看 raw，别只看渲染图——浮字渲染出来也"看着对"）**：业务框应**全部 `composite_shape.text.text` 非空**；独立 `text_shape` 只应剩"真正悬在空白处的说明 caption"（如区块大标题、注释小字），数量等于这些 caption 数。若业务框的 composite 是空 text、文字都散在独立 text_shape 里 → Step 3 的合并没做或没生效，回去修 post.cjs。

---

## ⚠️ 避坑速查
| 症状 / 场景 | 原因 | 对策 |
|---|---|---|
| 插入命令返回的 block_id 后续用不了 | 返回的是临时假 id | 用 `docs +fetch --detail with-ids` 取真实 id/token |
| 空白画板插不进（1011） | 飞书判"无变更" | 先插最小 mermaid 画板拿 token，再 DSL 重绘 |
| 文字浮在框上、不可一起编辑 | ①用了 frame+text 子节点；②`--to openapi` 把形状 text 拆成独立 text_shape | ①改成形状自带 `text`（铁律 1）；②Step 3 必做合并后处理（铁律 4） |
| 宽横条/band 写进去是空框、字不见了 | openapi 拆出的浮字被横条底色盖住 | Step 3 合并后处理把字绑回 composite（铁律 4） |
| 文字被截断 | height 写死 | `height: "fit-content"` |
| docx 里嵌 mermaid 不能上色/不支持 mindmap/classDef/`<br/>` | 飞书 docx-mermaid 渲染能力有限 | 走 DSL→raw 路线，别指望 docx-mermaid 控样式 |
| SVG 画板看着对但不能拖/改 | SVG 是静态矢量图 | 要可编辑就走 DSL 原生节点，不要用 `<whiteboard type="svg">` |
| 手改 raw 时 `vertical_align` 报 400 | raw 用 `mid`，DSL 才用 `middle` | DSL 写 `middle`，转换器自动转 `mid`；只在手改 raw 时注意 |
| `+update` 报格式错 | raw 要的是完整 envelope（含 code/data/result），不是裸 nodes | 直接 pipe whiteboard-cli 的输出，别自己截取 |

## 参考
- [`references/docx-embedding.md`](references/docx-embedding.md) — 在飞书文档里增/换/删一张画板块的全部坑
- [`references/native-nodes-recipe.md`](references/native-nodes-recipe.md) — 原生节点配方：形状自带 text、富文本多行、配色档、dagre 树模板
- [`templates/mindmap.dsl.json`](templates/mindmap.dsl.json) — 可直接改用的三层思维导图 DSL
- 深层 DSL 语法 → 已安装的 `lark-whiteboard` skill 的 `references/`（schema / layout / style / connectors / typography）
