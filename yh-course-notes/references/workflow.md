# lark-cli 写入工作流（细节 + 避坑）

所有命令以 `--as user` 身份执行（写 Evan 自己的文档）。深层参数以 `lark-doc` skill 为准，这里只列本场景高频套路。

---

## 0. 前置
- 读 `lark-shared` skill（认证、`--as user`、exit 10 高风险门禁）。
- 代理告警 `proxy detected` 是正常的，过滤即可（`| grep -v "proxy detected"`）。

## 1. 读已有笔记（补充场景）
```bash
lark-cli docs +fetch --api-version v2 --doc "<URL>" --detail with-ids --doc-format xml
```
- `--detail with-ids` 拿到每个 block 的 `id`，后续插入要用它当锚点。
- 文档很长时用 `--scope outline` 先看目录，或 `--scope keyword --keyword "X|Y"` 定位某节。
- 记下所有 `<whiteboard id=... token=...>`——**这些一律不动**。

## 2. 增量插入（核心，绝不 overwrite）
把每段补充写成一个 `.xml` 片段文件，再插到指定锚点后：
```bash
lark-cli docs +update --api-version v2 --doc "<URL>" --command block_insert_after \
  --block-id "<锚点block_id>" --content - < /tmp/片段.xml
```
- `--content -` 从 stdin 读，避免 shell 转义地狱。
- 默认 `--doc-format xml`。
- 一个片段可含多个连续 block。

其他 block 级指令：
- `block_replace --block-id <id>`：替换单个 block（改写某段）。
- `block_delete --block-id <id1,id2>`：删除（慎用，Evan 一般只让"补"不让"删"）。
- `append`（= `block_insert_after --block-id -1`）：追加到文档末尾。

## 3. 插表格 / 复杂结构被拒时
`block_insert_after` 对**含 `<table>` 的内容**可能报 `degrade_code=1010, Nesting still failed`。两步法绕过：
```bash
# Step 1 追加到末尾
lark-cli docs +update --api-version v2 --doc "<URL>" --command append --content - < /tmp/表格.xml
# Step 2 fetch 找到新表格的 block_id
lark-cli docs +fetch --api-version v2 --doc "<URL>" --detail with-ids --scope keyword --keyword "表格里某个独特词"
# Step 3 移到目标锚点后
lark-cli docs +update --api-version v2 --doc "<URL>" --command block_move_after \
  --block-id "<锚点>" --src-block-ids "<新表格block_id>"
```

## 4. 画板
- 文档里先放空白画板块：
  ```bash
  lark-cli docs +update --api-version v2 --doc "<URL>" --command block_insert_after \
    --block-id "<锚点>" --content '<whiteboard type="blank"></whiteboard>'
  ```
  从响应 `data.new_blocks[].block_token`（`block_type==whiteboard`）拿到 token。
- 然后调用 **`/feishu-whiteboard-draw`**，把这个 token 交给它，画原生可编辑节点。
- **改已有画板**：先 `lark-cli whiteboard +query --whiteboard-token <token> --output_as raw --as user` 拉实时版本，定向改目标节点，再 `+update --input_format raw --overwrite`。绝不从本地旧源重生成覆盖（会吃掉 Evan 的手改）。

## 5. 校验
```bash
lark-cli docs +fetch --api-version v2 --doc "<URL>" --scope keyword \
  --keyword "新内容关键词1|关键词2" --doc-format markdown
```
确认新块就位、位置对、原文未动。

---

## 新建笔记骨架（非补充场景）
```bash
lark-cli docs +create --api-version v2 --content '<title>标题</title><h1>第一大节</h1>...'
```
或先建空文档 / 在知识库节点下建，再用 `append` + `block_insert_after` 逐块填。具体建在哪个 wiki 节点、用 docx 还是 wiki，按 Evan 当次指示。

---

## XML 片段速查（对齐笔记风格）
```xml
<!-- 加粗引导列表 -->
<ul><li><b>关键词：</b>解释</li></ul>

<!-- 术语 callout -->
<callout emoji="📖" background-color="rgb(245,246,247)" border-color="rgb(254,212,164)"><p><b>术语</b></p></callout>

<!-- 提示 callout -->
<callout emoji="💡" background-color="rgb(245,246,247)" border-color="rgb(254,212,164)"><p><b>提示</b></p><ul><li>...</li></ul></callout>

<!-- SOP / 原始素材代码块 -->
<pre caption="命名" lang="Plain Text"><code>01 第一步<br/>1.1 子项<br/><br/>02 第二步</code></pre>

<!-- 表格：无任何 background-color，表头只加粗 -->
<table><colgroup><col width="120"/><col width="300"/></colgroup>
<thead><tr><th><b>列1</b></th><th><b>列2</b></th></tr></thead>
<tbody><tr><td>a</td><td>b</td></tr></tbody></table>

<!-- 分隔 -->
<hr/>
```
转义：标签不转义；文本里的 `&`→`&amp;`、`<`→`&lt;`、`>`→`&gt;`、换行→`<br/>`。
