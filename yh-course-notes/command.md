---
description: 把课程 ASR 转写（+截图/课件）整理成对齐雅慧课笔记风格的飞书云文档笔记
argument-hint: [Obsidian ASR 转写链接/路径；可选：素材文件夹、已有飞书笔记链接]
---

调用 **yh-course-notes** skill，把下面的输入整理成一篇飞书（Lark）课程笔记：

$ARGUMENTS

执行要点（细节以 skill 的 SKILL.md / references 为准）：
1. 先 Read 全部源：ASR 转写（分页读完）、素材文件夹里的截图/课件；给了飞书链接就先 `docs +fetch --detail with-ids` 拿现状再增量改。
2. 删尽口语，只留可沉淀的精髓；英文术语保留不译（query、bad case、EDD、slot、Agent、RAG…）。
3. 按块选择规律组织：矩阵→表格；原始素材/SOP清单/面试答案→代码块(带 caption)；术语→📖 callout，提示→💡 callout；并列要点→加粗 ul/li；空间/关系结构→画板（调 `/feishu-whiteboard-draw`）。
4. 用 lark-cli 写入，**只做 block 级操作，绝不 overwrite 整篇，不碰已有画板**；表格不加背景色，用原生 ul/li。
5. 写完用 `docs +fetch --scope keyword` 抽查新内容就位、原文未动。
