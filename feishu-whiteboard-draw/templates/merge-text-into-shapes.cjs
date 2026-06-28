/* 把 whiteboard-cli 导出的 openapi 里"漂浮的 text_shape"合并进它底下的 composite_shape，
   实现"框字一体"。只保留真正悬在空白处的 caption。
   用法: node merge-text-into-shapes.cjs <openapi.json> <merged.json>
   注意: 下面 CONTAINERS 的 (x,y) 锚点要按你自己图里"含子节点的容器/外框/band"的坐标改。 */
const fs = require('fs');
const IN = process.argv[2] || './openapi.json';
const OUT = process.argv[3] || './merged.json';
const env = JSON.parse(fs.readFileSync(IN, 'utf8'));
const nodes = env.data.result.nodes;

// 需要"标题置顶左对齐"的容器（含子节点的分组框/外框/band），按 (x,y) 锚点识别
const CONTAINERS = new Set([
  '30,40',      // 离线外框
  '40,650', '450,650', '840,650', '1200,650', // 路线 A/B/C/D
  '40,1176', '40,1336',  // 统一收口 / 前端 band
]);

const comps = nodes.filter(n => n.type === 'composite_shape');
const texts = nodes.filter(n => n.type === 'text_shape');
const removeIds = new Set();
let merged = 0, kept = 0;

for (const T of texts) {
  // 找正下方承载它的 composite：同 x、同宽，且 text 的 y 落在 composite 垂直范围内
  const host = comps.find(C =>
    C.x === T.x && C.width === T.width &&
    C.y <= T.y && T.y < C.y + C.height);
  if (!host) { kept++; continue; }  // 空白处 caption，保留为独立 text

  const isContainer = CONTAINERS.has(host.x + ',' + host.y);
  const tx = Object.assign({}, T.text);
  tx.vertical_align = isContainer ? 'top' : 'mid';
  tx.horizontal_align = isContainer ? 'left' : 'center';
  host.text = tx;          // 文字绑进形状（框字一体）
  removeIds.add(T.id);
  merged++;
}

env.data.result.nodes = nodes.filter(n => !removeIds.has(n.id));
fs.writeFileSync(OUT, JSON.stringify(env));
console.log('merged text into shapes:', merged, '| kept floating captions:', kept,
            '| remaining nodes:', env.data.result.nodes.length);
