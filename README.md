# 新渊暗都 — SillyTavern 角色卡项目

> **项目目的**：验证 [tavern-cards](https://github.com/ai4rpg/tavern-cards) skill 的全流程自动化角色卡生成能力。

## 项目概述

"新渊暗都" 是一个完整的 SillyTavern 角色卡项目，包含：

- **27 条世界书条目**（世界观、地理、势力、NPC、事件、时间线）
- **MVU 变量系统**（主角/世界/任务/社交 四域）
- **EJS 动态加载**（区域/天数/势力条件触发）
- **四面板 UI**（角色创建 + 信息面板·世界/主角/任务/社交）
- **16 名 NPC**（含世界观预设和 AI 运行时生成）
- **11 个开场白**（单开场白+面板驱动模式）

## 技术栈

| 组件 | 说明 |
|------|------|
| 打包工具 | [tavern-cards-forge](https://github.com/ai4rpg/tavern-cards) CLI |
| 变量系统 | MVU (MagVarUpdate) + Zod Schema |
| 动态注入 | EJS `@@if` / `@@preprocessing` |
| 面板渲染 | HTML/CSS/JS 内联 via regex_scripts |
| 后处理 | post-pack.mjs (修复 tavern_helper 序列化) |

## 项目结构

```
cards/新渊暗都/
├── tavern-cards-state.json    ← 单一数据源（27条目 + 11开场白）
├── schema.ts                  ← 变量结构定义（Zod）
├── 新渊暗都.json               ← 打包输出（直接导入 SillyTavern）
├── post-pack.mjs              ← 后处理脚本
├── 创作规划.yaml               ← 项目规划文档
├── 世界书/
│   ├── 世界观/                ← 3条（城市设定/种族社会/力量体系）
│   ├── 扮演准则/              ← 1条（叙事风格+变量规则+身份锁定）
│   ├── 地理/                  ← 11条（4区域+3场景+4势力）
│   ├── NPC/                   ← 16条（4核心+5女性+4萝莉+3幼女）
│   ├── 事件/                  ← 2条（日常巡逻+主线阴谋）
│   ├── 时间线/                ← 1条
│   ├── EJS/                   ← 1条预处理
│   └── 变量/                  ← initvar+规则+格式+列表
├── 正则/
│   ├── 角色创建面板.html       ← 6步流程（势力→职业→种族→性别→信息→确认）
│   └── 信息面板.html           ← 4Tab（世界/主角/任务/社交）
├── 脚本/
│   ├── MVU.txt                ← MagVarUpdate 运行时
│   └── Zod.txt                ← Schema 注册
└── 开场白/
    └── 默认开场白.txt          ← 单开场白 + 角色创建面板占位
```

## 快速开始

```bash
# 1. 安装依赖
git clone https://github.com/ai4rpg/tavern-cards.git
cd tavern-cards && npm install

# 2. 初始化项目
node scripts/tavern-cards-forge.mjs init 新渊暗都 --mvu

# 3. 编写内容（世界书/面板/schema/规则...）
#    ...

# 4. 打包
node scripts/tavern-cards-forge.mjs pack 新渊暗都

# 5. 后处理（必跑！）
cd cards/新渊暗都 && node post-pack.mjs

# 6. 导入 SillyTavern
# 将 新渊暗都.json 导入 SillyTavern 角色卡
```

## 踩坑记录

详见 [SillyTavern角色卡工作流.md](./SillyTavern角色卡工作流.md#十一新渊暗都项目实战总结202606) 第十一节，核心要点：

1. **面板 HTML 必须 `replaceString` 内联**（`replace_file` 打包后丢失）
2. **JS 禁止箭头函数和 HTML 实体**（srcdoc 环境会解析 `>` 和 `&#39;`）
3. **tavern_helper.scripts 必须是数组**（forge pack 序列化 bug）
4. **Zod 脚本必须移除 `export type`**（浏览器不支持 TypeScript）
5. **`@@if` 条目不能跑 `configure`**（会吞掉条件语句）
6. **变量字段名变更必须全局同步**（schema/规则/面板/demo 四处联动）

## 许可

本项目为验证工具链流程而创建，内容设定可自由使用。
