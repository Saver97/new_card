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

### 方式一：使用 ZCode（推荐）

本项目完全通过 [ZCode](https://github.com/ai4rpg/tavern-cards) 对话式 AI 编程助手生成，无需手写代码：

```bash
# 1. 在 ZCode 中加载 tavern-cards skill
#    skill 目录: C:\Users\Agent\.zcode\skills\tavern-cards

# 2. 对话式创建项目
#    用户: "创建一个叫 新渊暗都 的角色卡，现代都市+黑暗风格+多种族共存..."
#    ZCode 自动执行:
#      - forge init 新渊暗都 --mvu
#      - 编写 27 条世界书条目
#      - 生成 schema.ts + initvar.yaml + 变量更新规则.yaml
#      - 编写角色创建面板 + 信息面板 HTML/JS
#      - 配置正则脚本 + EJS 动态加载
#      - forge pack + post-pack 后处理

# 3. 导入 SillyTavern
#    将 cards/新渊暗都/新渊暗都.json 导入 SillyTavern 角色卡
```

**ZCode 工作流要点**：
- 所有条目通过 `forge patch` 注册到 `tavern-cards-state.json`
- 面板 HTML 通过 `replaceString` 内联到正则脚本
- 变量结构通过 `schema.ts` 定义，`validate-mvu` 校验
- 每次 `forge pack` 后必须运行 `post-pack.mjs`

### 方式二：手动 CLI

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

## 实战案例

本项目由以下需求驱动，由 ZCode 全自动完成（零手写代码）：

> 1. 现代都市+黑暗风格+多种种族共存。
> 2. 有一部分人会产生异能，强弱不定都有弱点，觉醒时可能死亡，女性成功觉醒概率更高。
> 3. 生物强化与义体强化覆盖灵能飞升、基因飞升和机械飞升三条路线。
> 4. 至少四方势力：官方、绝对反派、零散势力（类似绝区零的市长派/称颂会/狡兔屋）。
> 5. 角色创建面板——覆盖姓名/种族/年龄/职业（按势力设计）/性别/势力（可选反派）。每个势力+性别有独立开场，传说种族有特殊开场，种族与势力间有限制联动。
> 6. 信息面板——世界/主角/任务/社交四 Tab。
> 7. 世界面板——时间（月·日·星期 hh:mm:ss，起始 UTC）、地点、经过天数、都市流言。
> 8. 主角面板——基础信息（姓名/出身/职业/种族/种族特性/能力/金钱）+ 着装（外套/上衣/下装/内衣/内裤/鞋子/饰品，内衣女性必填男性可空）。
> 9. 任务面板——当前任务/子任务/已获取线索，`{{任务名}}完成` 或 `{{任务名}}放弃` 自动清理。
> 10. 社交面板——首次遇到的世界书 NPC 自动加入，含基础信息、着装、外貌身材、好感度、看法。

最终产出：27 条世界书条目 + 16 名 NPC + MVU 四域变量 + 四面板 UI + EJS 动态加载，详见[工作流文档](./SillyTavern角色卡工作流.md)。

## 许可

本项目为验证工具链流程而创建，内容设定可自由使用。
