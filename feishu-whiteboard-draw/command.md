---
description: 把结构化内容画成飞书原生可编辑画板（脑图/流程/架构/泳道/关系/时间线）
argument-hint: [飞书文档链接，或要画的内容/大纲]
---

调用 **feishu-whiteboard-draw** skill，把下面的内容画成飞书文档里的【原生可编辑画板】：

$ARGUMENTS

要求遵循该 skill 的三条铁律：
1. 节点用「形状自带 text」（rect/ellipse 等的 text 字段，富文本写多行），不要 frame+独立 text，更不要 SVG 死图；
2. 含文字节点 height 用 `fit-content`；
3. 树状/流程用 dagre 的 `layoutOptions.edges` 自动连线。
并按 skill 的 `references/docx-embedding.md` 流程在飞书文档里落地（注意假 block_id、空白画板插不进、用 seed-mermaid 拿真 token 等坑）。
