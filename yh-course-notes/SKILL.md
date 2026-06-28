---
name: yh-course-notes
description: |
  Evan 的飞书课程笔记整理 skill（雅慧 AI 产品经理课系列）。当 Evan 给出一个 Obsidian 里的 ASR 转写链接 / 路径（常配一个装课程截图、课件的文件夹），并要"整理成飞书课程笔记""做成飞书笔记""把这节课整理一下""按我的格式整理"时触发。
  产出物是一篇飞书（Lark）云文档笔记，用 lark-cli 写入；需要图时调用 /feishu-whiteboard-draw 画原生可编辑画板。
  输入按三个槽位给：输出文档链接（必填）、ASR 录音 / 转写（选填）、原始课件（选填）；缺 ASR 或课件就先跟 Evan 要或确认有没有。
  即使 Evan 只丢来一个 ASR 链接说"整理笔记"，只要上下文是把课程转写沉淀成飞书笔记，就触发。触发命令：/yh-course-notes。
---

# yh-course-notes — Evan 的飞书课程笔记整理

把课程 **ASR 转写**（+ 截图 / 课件）整理成一篇**飞书云文档**笔记，风格严格对齐 Evan 已有的雅慧课程笔记。

> 参考样板笔记（风格基准）：`https://istir4q565.feishu.cn/wiki/W5COw79dBiwKWekAXGRcyOionyh`
> 这是"听课笔记 / 知识地图"风格，不是讲稿，也不是 AIPM 课件卡（不套元信息表 + 顶部脑图 + 词汇表那套模板）。

---

## 输入物（三个槽位）

Evan 每次按三个槽位给料，开工前先对齐齐不齐：

1. **必填：输出文档链接**——飞书 wiki / docx URL，笔记往这里写。**唯一必给项。** 先 fetch 判断是**新建**（空文档 / 只有占位标题）还是**补充已有**（已有正文，见步骤 2）。
2. **选填：ASR 录音 / 转写**——Obsidian 里的 `.md` 路径或链接。先用 Read 读全文（常 1000+ 行，分页读完，别只读开头）。
3. **选填：原始课件**——飞书文档 / 截图 / PPT 图（飞书课件常常整篇是截图）。读图链路见下方工作流。

> **缺槽位就主动开口。** 只给了输出链接、没给 ASR 或课件时，**先跟 Evan 要、或确认有没有**，别凭单一源就硬写。课件尤其常被事后补充 / 更新——定稿前再抓一次。

---

## 核心工作流

### 0. 对齐槽位
- 确认三槽位齐不齐；**缺 ASR / 课件就先跟 Evan 要或确认有没有**，别只凭一个源开写。

### 1. 读源
- Read ASR 全文（分页读完）。
- **读课件截图**（关键，别跳）：飞书课件多为整篇内嵌截图，**Read 打不开远程 authcode 图 URL，必须先下载**：
  ```bash
  lark-cli docs +fetch --api-version v2 --doc "<课件URL>" --detail with-ids --doc-format xml   # 拿 <img token="…">
  lark-cli docs +media-download --token "<img_token>" --output ./kj_img1 --as user             # 下到本地
  ```
  再用 Read 逐张看本地 PNG，把 ASR 口头说不清的结构（表格列名、架构层级、准确措辞）补全。
- **课件会更新**：第一次抓可能是空 / 半成品；**定稿前重新 fetch 一次课件**，别用旧缓存（踩过：漏掉了后补的整块"关键概念"）。
- 对齐：ASR 口语叙述 ↔ 截图结构化信息，互为补充。

### 2. 判断"新建"还是"补充已有"
- 拿输出链接 fetch：
  ```bash
  lark-cli docs +fetch --api-version v2 --doc "<输出URL>" --detail with-ids --doc-format xml
  ```
- **空文档 / 只有占位标题** → **新建**：按文档顺序 `append` 逐节填（append 能吃含表格的多块片段）。
- **已有正文** → **补充已有**：识别已有章节结构、已有 `<whiteboard token=...>`，**画板内容一律不动**（除非 Evan 明确要重画），只做**增量插入**（见步骤 4）。

### 3. 清洗 + 提炼
- 删掉所有口语：互动（"扣个一""懂的扣 1""大家懂吗"）、语气词、跑题闲聊、ASR 转写的错别字/谐音。
- 只留**可沉淀的精髓**：概念、定义、例子、SOP、面试题答案、避坑、岗位判断。
- 按下面的"块选择规律"组织。**深度对齐样板**：精炼、可扫读、bold 引导，不写大段散文。

### 4. 写入飞书（用 lark-cli，走 lark-doc skill）
- **铁律：绝不 `overwrite` 整篇。** 只用 block 级指令：`block_insert_after` / `block_replace` / `block_delete` / `append`。
- 标准套路：`docs +fetch --detail with-ids` 拿锚点 block_id → `block_insert_after --block-id <锚点> --content - < 片段.xml`。
- 插表格 / 复杂结构若被 `block_insert_after` 拒（`Nesting still failed`）：先 `append` 到末尾 → fetch 找新 block_id → `block_move_after` 移到锚点后。
- 详见 [`references/workflow.md`](references/workflow.md)。

### 5. 需要图 → 画板
- 任何"天然是空间 / 关系结构"的内容（架构、流程、脑图、泳道、时间线、对比矩阵图）→ 调用 **`/feishu-whiteboard-draw`** skill 画**原生可编辑画板**，不要用 SVG 死图。
- 画板要先在文档里有一个 `<whiteboard type="blank"></whiteboard>` 块，再让 feishu-whiteboard-draw 写入。

### 6. 校验
- `docs +fetch --scope keyword --keyword "新内容关键词|..."` 抽查新块就位、原文未动。

---

## 块选择规律（这是本 skill 的核心，详版见 [`references/note-style.md`](references/note-style.md)）

| 块 | 什么时候用 |
|---|---|
| **H1** | 大模块 / 课程的"幕"（如：产品&行业&变化、岗位解析、职业发展、求职面试、大厂vs小厂、拓展、作业） |
| **H2 / H3 / H4** | 模块下主题 / 细分点，跟着课程逻辑层层下钻 |
| **hr** | 每个大节（H1/H2 级）结束后一条分隔线 |
| **p** | 概念定义、过渡说明、单句结论 |
| **ul/li（加粗引导）** | 并列要点、特征、清单（`<li><b>持续进化：</b>……</li>`） |
| **表格** | 真·矩阵——每行字段一致的多属性对比 / 枚举（传统vsAI、阶段→角色、L1-L5、薪资、公众号、工具表） |
| **代码块 `<pre caption=...>`** | ① 要**逐字保留**的原始素材（JD 原文）；② 带编号层级的 **SOP 清单**（01 / 1.1）；③ 面试题的"标准答案"要点。配 `caption` 命名 |
| **callout 📖** | 单个**术语 / 知识点卡 / 概念占位**（解决方案、产品运营、FDE） |
| **callout 💡** | **提示 / 经验 / 避坑**（养龙虾自动化订阅、友情提示） |
| **whiteboard** | 天然空间 / 关系结构（→ /feishu-whiteboard-draw） |
| **bookmark** | 外链（小红书、aibase 等） |
| **img** | 课件原图截图（不适合重画成画板的，直接贴原图） |

**一句话判别：**
- 是行列矩阵 → **表格**
- 是"需要原样保留的一段文本 / 编号清单 / 原始素材" → **代码块**
- 是"想被高亮的一个术语 / 一条提示" → **callout**（术语 📖 / 提示 💡）
- 是并列要点解释 → **ul/li 加粗引导**
- 是空间 / 关系图 → **画板**

---

## 内容节奏与深度

- **跟课程逻辑线推进**；一个知识点的标准展开套路：`概念(p) → 要点(ul) → 例子(p/callout) → 结构化(表格) → 可视化(画板)`，不必每个都全，按内容轻重取舍。
- **学生听课笔记视角**：精炼、可扫读，bold 引导关键词，不堆砌。
- **英文术语保留不译**：query、bad case、EDD、slot、Agent、RAG、MCP、Human-in-the-loop、MaaS、Fine-tuning、ROI、JD… ASR 里的谐音错字要还原成正确英文。
- **🌟** 标在高价值章节标题后（如"数据飞轮 🌟""核心能力全景图 🌟"）。
- **"面试题答案""SOP / 清单"用代码块固化**，方便整段背 / 抄。
- 口语、互动、闲聊全删；只要精髓。

---

## 硬规则（违反会被 Evan 点名批评，全部来自历史 feedback）

1. **绝不 `overwrite` 整篇飞书文档。** fetch→本地编辑→overwrite 的时间窗会静默覆盖 Evan 的网页端并发编辑且不可恢复。一律 block 级操作。
2. **不碰任何已有画板。** 画板内容是 Evan 定的；要改也必须先 `whiteboard +query --output_as raw` 拉实时版本再定向小改，绝不从本地源全量 overwrite。
3. **表格 `<th>/<td>/<tr>` 一律不加 `background-color`。** 深色模式下浅底色看不清。只用 `<b>` 加粗、行内 emoji、谨慎的 `<span text-color>`。颜色由 Evan 自己标。
4. **列表用原生 `<ul>/<li>`**，不在 `<p>` 里手敲 "• / · / -"。
5. **这类"听课笔记"默认不套课件模板**（元信息表 + 顶部脑图 + 词汇表）——那是 AIPM 课件卡的格式。除非 Evan 明确要求。
6. **所有标题用飞书原生 heading（h1–h9）+ 默认自动序号。** 走飞书自动编号：首个 H1 `seq="1" seq-level="auto"`，其余所有标题 `seq="auto" seq-level="auto"`；**标题文字里绝不手敲「一、/ 1.1」**；层级连续别跳级（H1→H2→H3，子节是二级就用 H2，别 H1 下直接接 H3，否则自动编号会怪）。增量插入的新标题同样带 `seq="auto"`。详见 [`references/workflow.md`](references/workflow.md)「标题原生序号」。
7. **章节之间必须有 `<hr/>` 分割线。** 每个大节（H1、大 H2）结束后一条 hr，给文档"呼吸感"。
8. **`ok:true` ≠ 成功。** 写操作后必看 `data.document.result` 和 `warnings`（degrade_code），别只看外层 `ok`——尤其 `block_replace`（曾返回 ok 实则 failed）。**文档页 `<title>` 块改不动**（degrade 2001），要改标题让 Evan 网页端手改。
9. 所有 lark-cli 操作前先读 [`lark-shared`](../lark-shared/SKILL.md)（认证、`--as user`、高风险门禁）。

---

## 依赖

- **lark-cli** + **lark-doc** skill — 飞书文档读写（block 级）
- **lark-whiteboard** skill — 画板 DSL 底层
- **feishu-whiteboard-draw** skill — 在文档里落地原生可编辑画板（`/feishu-whiteboard-draw`）
- **lark-cli `docs +media-download`** — 把课件内嵌截图下到本地（authcode 远程图 Read 打不开，必须先下载）
- Read 工具 — 读 Obsidian ASR + 本地课件截图 PNG
