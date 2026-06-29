# SillyTavern 角色卡项目 · 抽象工作流

---

## 一、信息来源 → 条目化

```
原始素材（Wiki/Fandom/设定集/官方资料）
        │
        ▼
  世界书 YAML 条目
  ├── 世界观核心    常驻（constant）
  ├── 地图/区域     关键词触发（selective）
  ├── 阵营/势力     关键词触发
  ├── 关键人物      关键词触发
  ├── 剧情/事件     关键词触发
  ├── 扮演准则      常驻
  └── 时间线        常驻
```

**铁律**：所有条目必须基于原始素材，禁止自行编造。

---

## 二、创意设计 → 代码落地

```
设计草稿（审阅文档）
        │
   讨论迭代确认
        │
        ▼
  写回面板 HTML / JS
        │
  schema.ts + initvar.yaml（×2 副本）
        │
  变量更新规则.yaml（×2 副本）
```

**原则**：先文档审阅，确认后才编码。面板的唯一编辑源是 `正则/` 目录（不是 `面板/`）。

### 2.1 变量系统的双重副本

项目维护两套变量文件——一套在 `世界书/变量/`（供 forge 打包），一套在 `世界书/MVU/`（供 MVU 运行时解析）。改任何变量必须**两份同步**：

| 文件 | `世界书/变量/` | `世界书/MVU/` |
|------|---------------|--------------|
| 初始变量 | `initvar.yaml` | `初始变量.yaml` |
| 更新规则 | `变量更新规则.yaml` | `变量更新规则.yaml` |
| 输出格式 | `变量输出格式.txt` | `变量输出格式.yaml` |

**漏改任何一份 → 运行时变量与打包结果不一致。**

### 2.2 面板变更的影响范围

修改一个面板功能（如增减字段），影响链：

```
面板 HTML/JS（显示+逻辑）
    ↓
schema.ts（变量结构）
    ↓
initvar.yaml ×2（默认值）
    ↓
变量更新规则.yaml ×2（路径白名单）
    ↓
MVU 面板定义.yaml（变量描述+触发词+规则）
    ↓
[若涉及] 变量输出格式 ×2
    ↓
[若涉及] EJS 规则文件
    ↓
[若涉及] 脚本/Zod.txt（AI 参考 schema）
```

**每一层都必须同步修改，漏任何一层都会导致不一致。**

---

## 三、MVU 变量系统

```
schema.ts（Zod 定义）
    │ 单一数据源，所有变量结构、类型、默认值
    │
    ├── initvar.yaml       初始值（嵌套对象，角色创建时读取）
    ├── 变量更新规则.yaml   AI 合法路径白名单 + 业务规则
    └── 变量输出格式       防编造非法路径
```

**关键点**：
- `schema.ts` 是唯一真相——所有变更从它开始
- 变量更新规则定义 AI 可写路径（JSON Pointer），越权写入被忽略
- 初始化/状态推进的业务逻辑写在规则的 `check` 段

### 3.1 变量域划分

```
主角
├── 基础      姓名/性别/年龄/身份/金钱/所属势力
├── 属性      种族/以太适应性/战斗能力/特殊能力
├── 状态      HP/侵蚀度（数值，0-100）
├── 着装      上衣/下装/内衣/内裤/鞋子/饰品
├── 背包      物品数组
├── 战斗定位  字符串（平民/执法者/游荡者/绳匠...）
└── 当前情绪  字符串

世界
├── 当前时间  字符串（真实日期格式：M月D日·星期X）
├── 当前地点  字符串（城区·区域·具体位置）
├── 当天计划  字符串
├── 沙盒时间  number（经过天数，起始0，每天+1）
├── 天气      字符串
├── 城市流言  字符串
└── 绳网活跃度 字符串

邦布/同伴
├── 同伴列表  字符串数组
├── 邦布伙伴  字符串
├── 心情/电量/技能等

阵营/NPC
├── 阵营关系  对象（阵营名→声望值）
└── NPC好感   对象（NPC名→好感度）
```

### 3.2 变量更新规则格式

```yaml
## 主角
/主角/基础/姓名       string  replace
/主角/状态/HP         number  replace（★ 0-100）

## 世界
/世界/当前时间        string  replace
/世界/沙盒时间        number  replace（★ 经过天数，每天+1递增）
```

- 路径用 JSON Pointer（`/` 分隔）
- `★` 标注特殊规则，AI 必须遵守
- 未列出的路径 AI 不可写入

### 3.3 删减同步

移除某功能时，必须同步清理所有层次：

| 移除项 | 影响层次 |
|--------|---------|
| 状态条（如心智防护） | schema + initvar×2 + 规则×2 + 面板HTML/JS + MVU面板定义 |
| 整个系统（如章节/空洞） | 上述全部 + EJS + 变量输出格式 + 脚本/Zod.txt |

---

## 四、EJS 动态注入

```
EJS 预处理入口
    │
    ├── 常驻条目（直接 await getwi）
    └── 条件条目（按变量值分支加载）
```

**作用**：在每次 AI 回复前动态决定加载哪些世界书条目，实现上下文精准投喂。

### 4.1 沙盒模式 EJS 架构

```
@@preprocessing（入口，最早执行）
    │
    ├── 加载时间推进规则      await getwi("...")
    ├── 加载触发条件          await getwi("...")
    └── 加载关键事件时间表    await getwi("...")
```

**时间推进规则**定义：
- 时间单位：时段（早晨/午前/午后/傍晚/夜间/深夜）
- 推进序列：严格顺序，不可逆跳
- 单次推进上限：日常 1-2 时段，战斗/关键事件 2-5 时段
- 每日推进：`沙盒时间 +1`，`当前时间` 日期 +1

**触发条件**定义：
- 事件 ID 格式：`evt_序号`
- 触发条件：变量值匹配 / 地点匹配 / 天数匹配
- 触发效果：加载对应剧情条目 / 修改变量

**关键事件时间表**：
- 按经过天数排列的固定事件
- AI 在每天开始时检查是否有当日事件

---

## 五、面板设计

| 面板 | 功能 |
|------|------|
| 角色创建面板 | 预置身份可选/不可选、种族限制联动、出生点预览、步骤编排 |
| 信息面板 | 只读展示、多 Tab、变量到 DOM 的绑定 |

**设计要点**：
- 面板内嵌 `<UpdateVariable>` + `<JSONPatch>` 实现变量写入
- 种族锁定、性别锁定在 JS 中通过联动函数处理
- 预览区实时响应用户选择（身份/种族/性别）

### 5.1 角色创建面板模式

**预置身份系统**：
```
PRESETS = {
  身份A: { 种族, 性别, 年龄, 属性范围, ... },
  身份B: { ... }
}
```
- 每个身份有默认属性，用户可微调
- `canPick` 字段控制哪些身份允许自定义背景/势力/特长

**种族限制联动**：
```
RACE_BLOCKS = {
  身份X: ['不可选种族A', '不可选种族B']
}
```
- 切换身份时动态重建种族下拉框，移除禁选项
- 若当前种族被新身份禁止，自动回退到身份默认种族
- 兜底校验：`updateRaceHint()` 中检测并修正

**特殊种族规则**：
- 锁性别种族（如仅女性）：选中时禁用性别下拉框并强制设值
- 强制战力种族：选中时若战力过低自动提升到门槛

**出生点变体系统**：
```
SPAWNS = {
  身份A: [
    { g:{m:"...",f:"..."}, b:"...", c:{m:"...",f:"..."} },  // 出生点①
    { g:{m,f}, b, c:{m,f} }                                    // 出生点②
  ]
}
SPN_LOCS = { 身份A: ['地点值①', '地点值②'] }
```
- `g` = 通用（人类/亚人/其他），分男/女
- `b` = 特殊种族①（单叙事，如锁女性种族）
- `c` = 特殊种族②（分男/女）
- `SPN_LOCS` 映射出生点索引→地点值，确保 `/世界/当前地点` 与选中出生点一致

**实时预览联动**：
- 切换身份/种族/性别 → 预览区立即重渲染对应叙事
- 预览卡片可点击选择，高亮选中项
- 地点变量跟随选中出生点联动写入

**步骤编排**：
- STEP 1 身份 → STEP 2 自定义 → STEP 3 邦布/同伴 → 开始
- 章节选择、地点下拉等冗余控件应移除，由联动逻辑接管

### 5.2 信息面板模式

**Tab 系统**：世界观/主角/阵营/同伴/NPC/任务，按 `data-tab` 切换显示。

**变量绑定**：
```
DOM: <span id="h-hp-txt">0/0</span>
JS:  document.getElementById('h-hp-txt').textContent = getProp(sd, '主角.状态.HP', 100);
```
- `getProp(obj, 'a.b.c', default)` 安全读取嵌套路径
- `renderAll()` 统一调用所有赋值，DOM 防御性检查

**进度条绑定**：
```
HTML: <div class="bar-fill" id="h-hp-bar" style="width:0%"></div>
JS:   bar.style.width = value + '%';
```

**卡片化展示**：能力/状态用网格卡片（`npc-grid` > `npc-g-card`），标签+值结构。

---

## 六、打包流程

```
编辑 YAML / 面板 HTML
        │
        ▼
  forge pack          ← tavern-cards-forge 读 state.json 编译
        │
        ▼
  post-pack.js        ← 后处理（必跑！）
        │               · tavern_helper Array→Object
        │               · 补 group / name
        │               · HTML 补代码块标记
        │               · selective→constant（缓存优化）
        │               · 对AI隐藏变量更新正则改前端隐藏
        ▼
  输出角色卡 JSON     ← 可直接导入 SillyTavern
```

**禁止**：
- ✗ 用其他脚本打包 → 丢失 MVU 正则/策略
- ✗ 跳过后处理 → MVU 完全失效
- ✗ 编辑非 `正则/` 的面板 → 打包不生效

---

## 十一、新渊暗都项目实战总结（2026.06）

### 11.1 世界书条目深度设计

**核心发现**：`depth=2` 的 position 设置在 forge pack 后会丢失，因为 forge 将 position 序列化为简化值（如 `after_char`），而非 `at_depth` 对象。真正的深度控制依赖 `extensions.position=4` 和 `extensions.depth=N`。

**正确做法**：
```json
// position 在 state.json 中设置为 at_depth
"position": {"type": "at_depth", "role": "system", "depth": 2}

// 但打包后 position 被简化为 "after_char"，扩展数据在 extensions 中
"extensions": {"position": 4, "depth": 2}
```

**实际验证**：参考卡绝区零 157 个条目全部 depth=0~1，**没有使用 depth=2**。核心条目通过 `constant` 策略 + `Infinity` 阈值实现常驻，而非依赖 depth。

**教训**：
- 不要盲目设置 depth=2，它不解决条目注入问题
- 常驻条目用 `strategy: constant` + `threshold: Infinity` 更可靠
- 条件条目用 `@@if` + EJS 动态加载更精准

### 11.2 正则脚本注入设计

**replaceString vs replace_file**（本次踩坑最深处）：
- `replace_file` 在 forge pack 后**会丢失**，必须改用 `replaceString` 内联完整 HTML
- 面板 HTML 必须用 `` ```html ... ``` `` 代码块包裹（SillyTavern markdownOnly 渲染要求）
- 结尾格式必须是 `</html>  \n```  \n`（尾随空格+换行，否则代码块不闭合）

**正则脚本执行顺序**：
- `promptOnly` 和 `markdownOnly` 是独立通道，不冲突
- 但同一通道内匹配相同占位符的脚本会互斥
- 参考卡脚本顺序：隐藏状态栏 → 状态栏界面 → 角色创建（紧挨着）

**placement 字段**：
- `[1]` = 用户输入，`[2]` = AI 输出
- 信息面板用 `[2]` 才正确（只在 AI 回复渲染）

### 11.3 HTML 注入的 JS 安全规则

**致命陷阱：HTML 实体在 srcdoc 中被解码**：

```javascript
// ❌ 致命：&#39; 在 srcdoc 中解码为 ' → ''' 三个单引号 → SyntaxError
r += c===39 ? '&#39;' : s[i];

// ❌ 致命：&amp; 在 srcdoc 中解码为 & → esc 函数失效
r += c===38 ? '&amp;' : ...;

// ✅ 正确：用 String.fromCharCode 运行时拼接 HTML 实体
r += String.fromCharCode(38, 97, 109, 112, 59);  // = "&amp;"
```

**JS 语法安全清单**：
- 禁止箭头函数 `=>`：`>` 在 srcdoc 中被解析为标签
- 禁止正则字面量中的 `&<>"'` 字符：会被 HTML 实体化
- 禁止 JS 字符串中直接写 `&#39;` / `&amp;` 等 HTML 实体
- 强制使用 `function` 关键字，禁用 ES6 箭头
- 嵌套三元表达式可以正常使用
- `for` 循环、`forEach` 均安全

### 11.4 tavern_helper 序列化陷阱

**forge pack 的已知 bug**：`tavern_helper` 在 state.json 中是对象，但 pack 后变成数组 `[["scripts", [...]], ["variables", {}]]`。SillyTavern 期望对象格式 `{scripts: [...], variables: {}}`。

**post-pack 后处理必须做的事**：
```javascript
// 数组转对象，scripts 保持为数组（不是对象！）
const fixed = { scripts: [], variables: {} };
th.forEach(([k, v]) => {
  if (k === 'scripts') fixed.scripts = Array.isArray(v) ? v : Object.values(v);
  if (k === 'variables') fixed.variables = v || {};
});
```

**教训**：scripts 必须是**数组**（不是 `{0: ..., 1: ...}` 对象），否则 SillyTavern 脚本面板为空，MVU 不加载，`getAllVariables` 未定义。

### 11.5 Zod 脚本的两个致命错误

1. **`export type` 语句未移除**：skill 文档明确要求移除，遗漏导致浏览器执行时报语法错误 → `registerMvuSchema` 未执行 → MVU 不工作
2. **schema 内容重复/残留旧版**：多次编辑 Zod.txt 导致旧 schema（含已删除的 `主角状态Schema`）残留，MVU 初始化失败

### 11.6 变量更新规则设计经验

**规则必须有具体数值**：
- ❌ "受损时减少，休息时恢复" → AI 轻伤扣 50，重伤扣 5
- ✅ "战斗顿悟 +1~5，单次上限 5" → AI 有明确范围约束

**突发情况必须单独列明**：
- 常规提升和剧情例外分开写
- 每个例外给具体数值范围 + 代价（侵蚀度/金钱）
- 覆盖正向/反向/恢复全场景

**字段名变更必须全局同步**：
- schema 改 `看法` → `对主角看法` + `主角看法`
- 必须同步更新变量更新规则、面板 JS、demo 数据、扮演准则
- 遗漏任何一处 = AI 写旧字段名 → Zod 静默丢弃 → 面板显示默认值

### 11.7 EJS 条件条目的 configure 陷阱

- 含 `@@if` 的条目不能跑 `forge configure`
- configure 会将 constant 条目优化为 path，吞掉 `@@if` 条件
- 这些条目保持 `contents` 格式，直接 pack

### 11.8 角色创建面板设计经验

**步骤跳转**：用可点击步骤指示器代替"上一步"按钮，减少 UI 控件，步骤指示器做 `cursor:pointer` + hover 效果。

**数据联动**：势力→职业→种族→性别的联动过滤在 JS 中完成，禁选项置灰不可点击。

**身份绑定**：开局后必须忽略玩家自设，仅以创建面板选择的值为准。三层强化：
1. 开场白直接声明（玩家第一眼看到）
2. 扮演准则铁律（AI 每次回复阅读）
3. 变量更新规则锁死字段（技术兜底）

### 6.1 post-pack.js 做了什么

| 修正项 | 说明 |
|--------|------|
| `tavern_helper` 序列化 | Array → Object（否则 MVU 解析失败） |
| `name` 修正 | 确保角色卡名称正确 |
| `group` 补全 | 为所有条目打 group 标签（157 个） |
| HTML 代码块标记 | 正则条目补 ```` ``` ```` 包裹 |
| selective→constant | 策略优化，提升缓存命中率 |
| 前端隐藏 | 变量更新正则改为对 AI 隐藏（防 MVU 解析前被清） |

### 6.2 group 分布检查

打包后检查 group 分布是否正常：

```
最终 group 分布: {
  "EJS": 4,
  "MVU": 4,
  "世界观核心": 13,
  "地图": 16,
  ...
}
```

- MVU 条目数 = 面板数 + 规则数 + 格式数
- EJS 条目数 = 预处理入口 + 沙盒规则数
- 任何 group 数量异常 → 检查 state.json

---

## 七、项目结构模板

```
项目名/
├── .cardrc.json                 forge 配置
├── 接续上下文.md                 新对话同步
└── cards/项目名/
    ├── schema.ts                Zod 变量结构
    ├── tavern-cards-state.json  forge 状态
    ├── 项目名.json              ← 输出卡
    ├── post-pack.js             后处理脚本
    ├── 正则/                    面板编辑源
    │   ├── 角色创建面板.html
    │   └── 信息面板.html
    └── 世界书/
        ├── 变量/
        │   ├── initvar.yaml
        │   ├── 变量更新规则.yaml
        │   └── 变量输出格式
        ├── EJS/
        │   ├── 预处理入口
        │   ├── 时间推进规则
        │   ├── 触发条件
        │   └── 关键事件时间表
        ├── 世界观核心/
        ├── 地图/
        ├── 阵营/
        ├── 人物/
        ├── 剧情/
        ├── 扮演准则/
        └── 时间线/
```

---

## 八、关键原则

| 原则 | 说明 |
|------|------|
| **单一数据源** | schema.ts 定义一切，initvar/规则从它派生 |
| **编辑源唯一** | 面板只改 `正则/`，打包只改 YAML |
| **打包唯一** | 只用 forge CLI，禁止其他脚本 |
| **后处理必跑** | 跳过导致序列化错误，MVU 失效 |
| **禁止编造** | 所有人物/世界观细节须有原始素材支撑 |
| **变量白名单** | AI 只能写入规则中声明的路径 |
| **变更全局同步** | 改面板 → 同改 schema/initvar/规则 |

---

## 九、Forge 工具

**tavern-cards-forge**：CLI 打包/解包/JSON Patch，将 YAML + HTML 项目编译为 SillyTavern 兼容的角色卡（PNG/JSON），自动派生运行时配置。

https://github.com/ai4rpg/tavern-cards

---

## 十、EJS 踩坑记录

### `@@generate_before` vs `@@preprocessing`

`@@if` 条件在 SillyTavern 世界书处理流程中较早评估，早于 `@@generate_before` 中 `define()` 的执行时机。因此 `define()` 注册的变量在 `@@if` 中不可用，导致 `xxx is not defined`。

**正确做法**：EJS 预处理条目使用 `@@preprocessing` 装饰器（而非 `@@generate_before`）。`@@preprocessing` 在酒馆处理世界书**之前**运行，此时 `define()` 的变量对后续 `@@if` 条件可见。

```diff
- @@generate_before
+ @@preprocessing
  <%_
  define('current_region', getvar('stat_data.世界.当前区域', { defaults: '' }));
  _%>
```

### `@@if` 中不能直接用 `variables.xxx` 访问 MVU 变量

MVU 变量储存在 `stat_data` 下，不在 EJS 的 `variables` 全局对象中。`@@if` 里访问 MVU 变量须通过 `@@preprocessing` 中 `define()` 注册的中间变量，或在条件中显式调用 `getvar()`：

```
@@if getvar('stat_data.世界.当前区域', {defaults:''})?.includes('老城区')
```

推荐前者（`define()` + `@@preprocessing`），因为变量只需读取一次，多个 `@@if` 条目复用。

### 独立世界书与角色卡内嵌世界书冲突

若 SillyTavern 中同时存在同名的**独立世界书**和**角色卡内嵌世界书**，两者的条目可能互相覆盖或产生缓存混淆。删除角色卡后独立世界书不会自动清除。排查 EJS 报错时先检查世界书面板是否有残留。

### `forge configure` 会吞掉 `@@if`

`forge configure` 将 `strategy: constant` 的条目的 `contents`（含 `@@if`）优化为 `path`（纯文件引用），导致 `@@if` 丢失。带 `@@if` 的条目打包前**不要**跑 `configure`，直接 `pack`。
