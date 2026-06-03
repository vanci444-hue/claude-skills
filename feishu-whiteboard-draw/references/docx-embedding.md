# 在飞书文档里增 / 换 / 删一张画板块

`lark-whiteboard` skill 默认你已经有 `board_token`。但很多时候起点是**一篇飞书文档**，你得先把画板块搞进文档、拿到能写入的 token。这一步坑最多，单独成文。

所有命令前缀 `LARK_CLI_NO_PROXY=1`（如有代理），统一带 `--api-version v2 --as user`。

---

## 坑 0：插入命令返回的 block_id 是「临时假 id」
`docs +update --command block_insert_after/append` 返回的 `new_blocks[].block_id`（常见 `doxcn...` 前缀）**不是真正落库的 id**。真实 id/token 必须重新 fetch：

```bash
lark-cli docs +fetch --api-version v2 --doc "<doc>" --detail with-ids --scope section --start-block-id "<某标题id>"
```

**血泪教训**：曾用插入响应的假 id 当锚点连环失败、报 `degrade_code=1011`，误以为是 SVG/mermaid 格式不被支持，其实只是锚点失效。**任何"拿 token / 删块 / 以它为锚点再插入"前，先 fetch 取真实 id。**

---

## 坑 1：空白画板插不进去
```xml
<whiteboard type="blank"></whiteboard>
```
→ 失败：`degrade_code=1011, Instruction produced no document changes`。飞书把"无渲染内容的块"判为"无变更"，直接拒绝。
同理失败的还有：docx-mermaid 里写 `mindmap` / `classDef` / `subgraph` / `<br/>`（飞书 docx-mermaid 解析不了 → 空 → 1011）。

## 坑 2：拿到一个「真·原生画板 token」的正确套路
既然空白画板插不进，就插一个**最小可渲染的 mermaid 画板**当容器：

```bash
cat > /tmp/seed.xml <<'EOF'
<whiteboard type="mermaid">
graph LR
  A[占位] --> B[占位]
</whiteboard>
EOF
lark-cli docs +update --api-version v2 --doc "<doc>" --command block_insert_after \
  --block-id "<真实锚点id>" --doc-format xml --content - --as user < /tmp/seed.xml
```
成功后**重新 fetch** 拿到这个画板的真实 token，再用 DSL→raw 覆盖重绘（见 SKILL.md Step 3）。覆盖后它就是你要的原生彩色可编辑画板，位置不变。

## 坑 3：SVG 画板 = 静态死图
```xml
<whiteboard type="svg">...</whiteboard>
```
能插入、渲染也好看，但它是**一张矢量图**：文字是浮层、节点不可单独拖动/改字。**要可编辑就别用 SVG**，走 DSL 原生节点。SVG 只适合"就要一张固定好看的图、不需要再改"的场景。

---

## 增 / 换 / 删 速查
| 目的 | 做法 |
|---|---|
| 文档末尾加图 | `docs +update --command append` 插 seed mermaid 画板 → fetch 取 token → DSL 重绘 |
| 指定位置加图 | `block_insert_after --block-id <真实id>` 插 seed → fetch token → DSL 重绘 |
| 换掉已有画板的内容 | fetch 取该画板 token → 直接 DSL→raw `+update --overwrite` 重绘（块不动、token 不变） |
| 删除画板块 | fetch 取**真实** block_id → `docs +update --command block_delete --block-id <id1,id2>` |
| 调整画板顺序 | `block_move_after`（仅同文档内） |

## 插入位置选取
- 插入锚点先 `docs +fetch --scope section/outline --detail with-ids` 看清块序列，挑一个**确实存在**的块当 `--block-id`。
- 标题块、已有画板块都是稳妥锚点；不要拿"刚插入返回的假 id"当锚点。
