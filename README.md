# 广东紫翔科技有限公司 · 企业官网（首版）

纯静态、零依赖的 5 页面企业官网（另含 404 错误页）。无构建步骤、无外部请求（断网可完整浏览），交付物即源码。

- 设计依据：`docs/architecture.md`（唯一权威设计与实现依据）
- 部署说明：`docs/deployment.md`（由部署工程师并行编写）

## 技术约束

| 项 | 约定 |
|---|---|
| 标记 | HTML5，语义化标签（`header / nav / main / section / article / footer`） |
| 样式 | 手写 CSS3 单文件 `assets/css/style.css`，CSS 自定义属性承载设计令牌 |
| 脚本 | 原生 JavaScript（ES2017+），单文件 `assets/js/main.js` |
| 构建 | **无构建步骤**，直接打开即用 |
| 外部依赖 | **零 CDN、零外链字体、零第三方 SDK、不接地图服务** |
| 字体 | 系统字体栈 |
| 图片 | 全部为内联 SVG 或本地 SVG 文件，无位图 |
| 兼容 | 现代浏览器最近两个大版本（Chrome / Edge / Firefox / Safari），不承诺 IE |

## 目录结构

```
zixiang-website/
├── index.html                  # 首页（定位总览 / 流量枢纽）
├── about.html                  # 关于我们（我是谁 / 信念与区位）
├── industries.html             # 产业布局（五大赛道 / AI 底座）
├── cooperation.html            # 合作生态（合作模式 / 国际化）
├── contact.html                # 联系我们（联系方式 / 留言）
├── 404.html                    # 错误页（OSS 静态托管错误文档；noindex，样式复用全站组件）
├── assets/
│   ├── css/
│   │   └── style.css           # 全站样式（令牌 → 基础 → 布局 → 组件 → 页面 → 响应式）
│   ├── js/
│   │   └── main.js             # 全站脚本（导航 / 抽屉 / 动画 / 表单校验）
│   └── img/
│       ├── logo.svg            # 主 Logo（深底版横排锁定）
│       ├── logo-mark.svg       # 仅图形标
│       ├── favicon.svg         # 站点图标
│       └── icons/              # 19 枚线性图标（24px 网格 / stroke 1.8 / 圆角线帽）
│           ├── ai-core.svg  low-altitude.svg  legal-tech.svg  material.svg
│           ├── hardware.svg  culture.svg  global.svg  handshake.svg
│           ├── fund.svg  incubator.svg  location.svg  phone.svg
│           ├── mail.svg  arrow-right.svg  menu.svg  close.svg
│           ├── check.svg  user.svg  building.svg
└── docs/
    ├── architecture.md         # 架构设计文档（设计与实现依据）
    └── deployment.md           # 部署说明
```

> 图标在页面中以**内联 `<svg>`** 方式使用（便于 `currentColor` 继承与主题适配）；`assets/img/icons/` 与 `logo*.svg` 为源文件交付，供后续内容运营或 redesign 复用。

## 本地预览

方式一：直接双击 `index.html` 在浏览器打开（无任何构建或服务端依赖）。

方式二（推荐）：任选其一启动静态服务器，行为与线上一致：

```bash
# Python 3
python3 -m http.server 8080

# 或 Node.js（需先 npm i -g serve）
npx serve .
```

然后访问 `http://localhost:8080`。

## 页面与区块索引

| 页面 | 区块 |
|---|---|
| index.html | Hero 主视觉 → 定位速览带 → 关于概览 → 产业速览（5 卡）→ 商业模式三步 → 区位与国际化 → 合作 CTA |
| about.html | 页头横幅 → 公司简介 → 企业信念（3 卡）→ 区位叙事 → 发展路径（时间轴）→ 组织与治理 → 人才与未来 |
| industries.html | 页头横幅 → AI 技术底座（放射图）→ 五大产业赛道（5 卡）→ 产业融合模式 → 基金与孵化 → CTA |
| cooperation.html | 页头横幅 → 合作方图谱（5 类）→ 商业模式详解（三步闭环）→ 国际化合作 → 合作流程（4 步）→ CTA |
| contact.html | 页头横幅 → 联系信息（4 卡）→ 在线留言（本地校验表单）→ 位置示意（地图占位） |
| 404.html | 页头横幅（面包屑）→ 引导回到正题（返回首页 / 联系我们双按钮）；noindex 不参与 SEO |

## 占位信息替换清单

以下信息**严禁虚构**，当前均以"待客户提供"标注。客户提供后按下表位置统一替换：

| # | 占位项 | 所在文件与位置 | 当前占位文案 | 出现次数 |
|---|---|---|---|---|
| 1 | 详细办公地址 | 6 个 HTML（含 404.html，下同）的页脚"联系我们"栏；6 个 HTML 的移动端抽屉 `.drawer__meta`；contact.html 联系信息卡"办公地址" | 广东省深圳市龙华区（详细地址待客户提供） | 13 |
| 2 | 联系电话 | 6 个 HTML 的页脚"联系我们"栏；contact.html 联系信息卡"联系电话" | 待客户提供 | 7 |
| 3 | 企业邮箱 | 6 个 HTML 的页脚"联系我们"栏；contact.html 联系信息卡"企业邮箱" | 待客户提供 | 7 |
| 4 | 办公时间 | contact.html 联系信息网格下方的 `.contact-note` 一行 | 待客户提供 | 1 |
| 5 | ICP 备案号 | 6 个 HTML 页脚底部行 `.footer__bottom-links` | 备案号待客户提供 | 6 |
| 6 | 公安备案号 | 同上 | 公安备案号待客户提供（如有） | 6 |
| 7 | 隐私政策页面 | 6 个 HTML 页脚底部行（当前 `href="#"`） | 单页占位链接，尚未建页 | 6 |
| 8 | 表单提交方式 | contact.html 表单 `.form__notice`（提交后展示） | "提交功能待接入：……不会发送至任何服务器……" | 1 |
| 9 | 发展里程碑年份 | about.html"发展路径"时间轴（当前为阶段化描述，无年份） | 阶段一至阶段四文字描述 | 4 节点 |
| 10 | 五大赛道具体业务内容 | industries.html 赛道卡（当前为方向性描述） | 区块说明处已注明"待客户提供后补充" | 1 |
| 11 | 基金名称与规模 / 孵化器名称 | industries.html"基金与孵化"双卡；另区块说明句 1 处 | "名称与规模待客户提供" | 3 |
| 12 | 合作流程细节 | cooperation.html"合作流程"（当前为建议四步） | 区块说明处已注明"待客户提供确认后更新" | 1 |
| 13 | 社交媒体账号 | 全站（当前不展示） | 无 | — |
| 14 | og:image 品牌分享图 | 5 个正式页面 HTML `<meta property="og:...">`（当前未设置 og:image；404 页不设 og 标签） | 缺 | 5 |
| 15 | 地图服务 | contact.html"位置示意"区块 | 静态占位，明确标注"地图待接入" | 1 |

首页 Hero 口号『以 AI 之力，赴产业之兴』与各页 `<meta name="description">`（架构草案基础上补足至 70 中文字符以上）均已经主理人终审通过（2026-10-21），维持现状（架构文档 §10.8）。

## 交互与可访问性

- 导航滚动超过 40px 切换白底态（`.nav--scrolled`）；≤1024px 折叠为汉堡菜单，全屏深藏青抽屉（`aria-expanded` / `aria-controls` 同步、展开时锁定 body 滚动、Esc 可关、点链接自动收起）
- 当前页导航以鎏金下划线 + `aria-current="page"` 标识
- 站内锚点平滑滚动（`prefers-reduced-motion` 下降级为即时）
- 卡片 hover 上浮；`IntersectionObserver` 轻量入场动画（240ms，降级时直接呈现）
- 表单本地校验（必填、邮箱格式、电话格式、留言长度），错误提示关联 `aria-describedby`，提交仅展示占位提示，**不发出任何网络请求**
- 每页提供"跳到主内容"skip link；`:focus-visible` 全站可见 2px 科技蓝描边
- 响应式三档断点：≥1200px / 769–1199px / ≤768px（导航折叠阈值 1024px）

## 部署

部署方案、服务器与环境配置详见 **`docs/deployment.md`**（部署工程师韩渡川并行编写中）。

要点速览：本站为纯静态站点，整个 `zixiang-website/` 目录（不含 `docs/`，如需）可直接托管于任意静态托管环境（Nginx / OSS / GitHub Pages 等），无服务端依赖、无环境变量、无构建产物。

## 第一阶段验收自查对照（架构文档 §12）

- [x] 5 个页面均可达（另含 404 错误页），导航/页脚全局一致，无死链（`#` 占位仅隐私政策 1 类，6 个页面页脚各 1 处，已登记）
- [x] 设计令牌与 §5 完全一致（色值/字号/间距/圆角/阴影照抄）
- [x] 图标符合 24px 网格、stroke 1.8、圆角线帽规范
- [x] 三档响应式断点（≥1200 / 769–1199 / ≤768），无横向滚动
- [x] 每页 title/description 依 §7.2 起草（description 已补足至 70–120 中文字符）
- [x] 语义化、alt/aria、focus 可见、prefers-reduced-motion 均落实
- [x] 无任何外部请求（断网可完整浏览）
- [x] 占位信息全部以"待客户提供"标注，无虚构数字与年份
- [x] 内容红线（§10）逐条通过

## 变更约定

需要调整设计或信息架构时，请先更新 `docs/architecture.md`（版本号 + 变更说明），再同步修改代码，勿口头约定。

**资源文件名冻结（与部署侧约定）**：上线后 CSS/JS/SVG 配 1 年长缓存（immutable），且本项目无构建、文件名固定，浏览器不会主动获取新版本。因此上线后**不要重命名** `style.css` / `main.js` / 已有 SVG；新增或改动资源一律使用新文件名（如 `main.v2.js`、`icons/global.v2.svg`），并在 HTML 中同步更新引用。

---

*前端实现：苏映棠（阿客实验室研发部） · 2026-10*
