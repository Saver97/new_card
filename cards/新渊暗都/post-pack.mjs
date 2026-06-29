#!/usr/bin/env node
/**
 * 新渊暗都 post-pack 后处理脚本
 * 修复 forge pack 的已知问题：
 * 1. tavern_helper 被错误序列化为数组，需转回对象
 *
 * 用法: node post-pack.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardPath = path.join(__dirname, '新渊暗都.json');

if (!fs.existsSync(cardPath)) {
  console.error('❌ 找不到卡片文件:', cardPath);
  process.exit(1);
}

const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
let fixed = false;

// === 修复1: tavern_helper 数组转对象 ===
const th = card.data?.extensions?.tavern_helper;
if (Array.isArray(th)) {
  console.log('🔧 修复 tavern_helper: Array → Object');
  const fixedTh = { scripts: {}, variables: {} };

  th.forEach(([key, value]) => {
    if (key === 'scripts') {
      if (Array.isArray(value)) {
        value.forEach((script, i) => {
          fixedTh.scripts[String(i)] = script;
        });
      } else {
        fixedTh.scripts = value;
      }
    } else if (key === 'variables') {
      fixedTh.variables = value || {};
    }
  });

  card.data.extensions.tavern_helper = fixedTh;
  fixed = true;
  console.log('   scripts keys:', Object.keys(fixedTh.scripts));
}

if (fixed) {
  fs.writeFileSync(cardPath, JSON.stringify(card, null, 2), 'utf8');
  console.log('✅ 后处理完成，卡片已修复');
} else {
  console.log('✅ 无需修复，卡片结构正常');
}
