# Claude Skills

A personal collection of custom [Claude Code](https://docs.claude.com/claude-code) skills I use in daily AI product and content work.

## Overview

`claude-skills` is a working set of skills — each one a focused, trigger-based capability that extends Claude Code for a specific workflow. Skills live as folders with a `SKILL.md` manifest and are picked up automatically by Claude Code when their trigger conditions match.

This repo is a snapshot of what I actually use, not a generic library.

## Why it exists

Generic AI assistants are useful; ones that know your workflow are leverage. Rather than repeat the same prompts every time, I encode recurring tasks as skills so Claude Code invokes them automatically when the context fits.

Publishing them here doubles as:
1. A reference for others building their own Claude Code skill setups.
2. A record of how I'm structuring AI workflows in practice.

## Features

Five working skills:

### `doc-to-notes`
Turns a course document (`.docx`, `.pdf`) or a video transcript into a structured Markdown note, then files it into my Obsidian vault. Triggered by phrases like "整理成笔记" or by simply being handed a document.

### `video-to-article`
Converts a video transcript into a publish-ready long-form article in my writing voice, targeting platforms like 人人都是产品经理, WeChat, and Xiaohongshu. Pulls in my writing SOP before drafting.

### `khazix-writer`
A style-imitation skill for long-form WeChat articles in the voice of [数字生命卡兹克](https://mp.weixin.qq.com/). Useful as a reference for how to encode a detailed authorial voice as a Claude skill.

### `feishu-whiteboard-draw`
Turns structured content into a **native, editable whiteboard diagram inside a Feishu (Lark) doc** — mind maps, flowcharts, architecture diagrams, swimlanes, relationship graphs, timelines. The guarantee: nodes are real editable objects (shape and text are one piece), not a flat SVG image and not "box + floating text" layers. Captures the hard-won gotchas of embedding whiteboards in Feishu docs (fake block ids, blank boards that won't insert, seeding a mermaid board to obtain a writable token, SVG = static image) plus a native-node recipe, color palette, and a ready-to-use mind-map template. Depends on `lark-cli` + `@larksuite/whiteboard-cli`.

### `yh-course-notes`
Turns a course **ASR transcript** (plus screenshots / slide captures) into a **Feishu (Lark) cloud-doc note**, written with `lark-cli` and styled to match my existing 雅慧 AI-PM course notes. Encodes the block-selection rules I actually use — matrix → table; raw source / numbered SOP / interview-answer → code block (with caption); term → 📖 callout, tip → 💡 callout; parallel points → bold-led `ul/li`; spatial/relational structure → whiteboard (via `feishu-whiteboard-draw`). Keeps English jargon untranslated, strips spoken filler down to the essence, and never overwrites a doc wholesale (block-level edits only, never touches existing whiteboards). Triggered by handing over an Obsidian ASR link and asking to "整理成飞书课程笔记", or `/yh-course-notes`.

## Project Structure

```
.
├── doc-to-notes/
│   └── SKILL.md
├── feishu-whiteboard-draw/
│   ├── SKILL.md
│   ├── references/
│   └── templates/
├── khazix-writer/
│   ├── SKILL.md
│   └── references/
├── video-to-article/
│   └── SKILL.md
└── yh-course-notes/
    ├── SKILL.md
    ├── command.md
    └── references/
```

## Preview / Demo

These skills are designed to be installed into Claude Code, not run standalone. To try one:

1. Copy the skill folder into your local Claude Code skills directory.
2. Restart Claude Code.
3. Trigger it by context or by its slash command (e.g. `/doc-to-notes`).

## Tech Stack

- Claude Code skill format (`SKILL.md` with YAML frontmatter)
- Markdown-defined prompts and workflows
- Integrations with Obsidian (local vault) for `doc-to-notes` and `video-to-article`

## Author

**Evan** — AI Product Manager. I build these skills for my own workflow and share them because the format is worth more people seeing.
