# 广东紫翔科技企业官网 · 上线交付验收报告

| 项目 | 内容 |
|---|---|
| 报告版本 | v1.0 |
| 验收人 | 关千锤（阿客实验室研发部 · 上线交付验收） |
| 验收日期 | 2026-10-21 |
| 验收范围 | `zixiang-website/` 全部文件（5 个主页 + 验收期内新增的 `404.html` + `assets/` + `deploy/` + `docs/`） |
| 验收性质 | **独立复验**：前端（苏映棠）自查声称通过的全部项目，均以本报告所述方法重新证明，未轻信自查结论 |
| 依据文档 | `docs/architecture.md`（§5 设计令牌 / §7 SEO / §8 性能与可访问性 / §9 占位清单 / §10 内容红线 / §12 验收对照清单）、`docs/deployment.md`（§12 部署向清单）、`README.md` |

## 0. 验收结论

**有条件通过（3 项上线条件，见 §6）。**

- P0（阻断性）问题：**0 项**
- P1（必修）问题：**6 类**——5 类 21 处已由验收方直接修复并回归通过（见 §3.1–3.5、§3.7）；1 类为部署侧预览环境未部署（见 §3.6，需部署工程师处理，验收方无 GitHub 操作权限）
- 待主理人终审事项：2 项（Hero 口号、四页 description 补足文案，见 §6）
- 建议项：5 项（不阻塞上线，见 §5）

> 特别说明：验收期间（07:10）前端新增 `404.html`（响应 deployment.md §6.2 建议），部署侧 `deploy/nginx.conf`、`deploy/github-actions.yml`、`deploy/oss-sync.md` 已同步适配。该页已纳入本次验收范围并单独复验通过。

---

## 1. 验证方法与环境

| 方法 | 具体内容 |
|---|---|
| 无头浏览器实测 | 本机 Chrome（`C:/Program Files/Google/Chrome/Application/chrome.exe`）+ Node 22 自研 CDP 脚本（Chrome DevTools Protocol）：6 个页面 × 4 档视口（1440 / 1023 / 768 / 390）逐一渲染探测 |
| 静态比对 | 全部 `href`/`src` 逐一对照文件系统；设计令牌与 architecture.md §5 逐值比对；19 枚图标源文件 + 107 处内联图标属性全量 grep；aria 结构逐页统计 |
| 在线核实 | ossutil `set-meta` 语法比对阿里云官方文档（help.aliyun.com），未凭记忆断言 |
| 内容审查 | 五页 + 404 页全文通读：错别字、中英文混排、标点、内容红线（虚构数字/年份/金额/人名、规范表述） |

实测脚本位于验收工作区（`acceptance-cdp.mjs` / `acceptance-focus.mjs`），不在交付目录内。

---

## 2. 通过项（独立复验证据）

### 2.1 完整性（architecture.md §12-1）

- 6 个页面均存在且结构完整（`header / nav / main / section / footer` 成对）；
- 全站 `href` 去重后共 15 种取值：5 个站内页面、5 个赛道锚点（`#low-altitude / #legal-tech / #material / #hardware / #culture`，均真实存在于 industries.html）、`about.html#region`、`cooperation.html#model`、`assets/img/favicon.svg`、`assets/css/style.css`、`assets/js/main.js`、`#main`（skip link）、`#`（隐私政策占位，README 已登记）——**逐一对照文件系统，零死链、零 404 资源**；
- 全站无 `<img>`（插画均为内联 SVG），alt 规则无适用缺口；
- 导航/页脚/CTA 在 6 页完全一致；导航四项 + 鎏金 CTA，当前页 `aria-current="page"` 鎏金下划线（联系页正确地不在导航四项中，以面包屑标识当前页）。

### 2.2 设计一致性（§12-2 / §12-3）

- **色彩**：`--color-primary-900/800/700/600`、科技蓝三阶、鎏金三阶、浅色/文字/边框/功能色共 20 个令牌与 §5.1 逐值一致；
- **字号/间距/圆角/阴影**：H1–H4/正文/辅助/小字层级、clamp 流式规则、4px 基数间距 12 档、圆角 4 档、阴影 3 档均与 §5.2–5.5 一致（修复记录见 §3.2，修复后无一处偏离令牌）；
- **图标**：19 枚源文件与 107 处内联图标全部满足 24×24 viewBox、`fill="none"`、`stroke-width="1.8"`、`stroke-linecap/linejoin="round"`；§5.8 必需图标清单 19 项全部交付；
- 中文不斜体（`hero__title em` 显式 `font-style: normal`）、按钮无感叹号（全站 grep 零命中，仅 HTML 注释含 `=====` 装饰符）。

### 2.3 兼容与响应式（§12-4）

- 代码审查：media query 仅三档——`max-width: 1199px`（平板）、`max-width: 1024px`（导航折叠，架构 §2.2 约定阈值）、`max-width: 768px`（手机），**无第四档魔法值**；
- **无头 Chrome 实测**：6 页 × 4 档宽度共 24 个组合，`document.scrollWidth` 恒等于 `clientWidth`（1425/1425、1008/1008、768/768、390/390），**零横向溢出**；探测脚本标记的越界元素均为 `overflow:hidden` 容器内的装饰性 SVG（hero 光晕、banner 网格），属误报，不产生可见滚动条；
- 导航折叠阈值实测正确：1023px 起汉堡按钮显示、桌面导航隐藏；1440px 反之。

### 2.4 可访问性（§12-6 / §8.2）

- 每页单 `<main>`、单 `<h1>`，标题层级 h1→h2→h3 无跳级（6 页逐一核对）；
- skip link（跳到主内容）6 页齐全，聚焦可见；
- 汉堡按钮双实例（开/关）`aria-expanded` + `aria-controls` 同步；面包屑 `aria-current="page"`；抽屉 `role="dialog" aria-modal="true" aria-hidden` 同步；
- 表单 6 个字段全部 `label for/id` 关联，必填项 `required` + 视觉标识，错误提示 `aria-describedby` 关联，校验失败写 `aria-invalid`；
- `:focus-visible` 全站 2px 科技蓝外描边 + 2px 偏移（style.css L183-187）；
- **实测** `prefers-reduced-motion: reduce`：21 个 `.reveal` 元素计算 opacity 全部为 1（无隐藏内容）、`scroll-behavior: auto`；
- **实测**锚点跳转：`industries.html#culture` 直达后目标元素 top = 82px（固定导航 72px + scroll-margin 24px 之内，偏移正确）。

### 2.5 内容合规（§12-8 / §12-9 / §10）

- 全文通读：无虚构业绩数字、金额、案例名称、成立/发展年份、人名与职务；全站唯一年份"© 2026"为 architecture.md §2.3 许可的硬编码版权年；`industries.html` 中"1 + 1 > 2"为数学修辞非业绩数字；
- 规范表述齐全："战略性新兴产业""改革开放前沿""粤港澳大湾区""一带一路"（引号内）均按 §10.3 使用；区位与国际化表述（深圳龙华总部、广东及港澳"一带一路"桥头堡、阿布扎比（阿联酋）与印度尼西亚）与 brief 一致；
- 商业模式五步表述（顶层研判→子公司放大→技术层打通→合作方赋能→把握不同赛道机会）在 5 页一致；
- 占位信息全部标注"待客户提供"（页脚地址/电话/邮箱/备案号 ×6 页、联系页信息卡、about 时间轴、industries 基金与孵化、cooperation 流程、表单提交提示），README 占位替换清单与实际一致；
- 五大赛道名称固定且前缀统一"AI+"；
- 错别字与中英文混排：通读未发现错别字；半角标点混入中文零发现；**发现并修复**半角直引号问题（见 §3.1）。

### 2.6 性能与零依赖（§12-7 / §8.1）

- **无头浏览器实测**：`performance.getEntriesByType('resource')` 全量请求仅 `file://` 与 `data:`，**零外部请求**（断网可完整浏览的结论被复证）；
- **零 console 错误 / 警告、零未捕获异常**（`Runtime.consoleAPICalled` / `Runtime.exceptionThrown` / `Log.entryAdded` 三类事件源，6 页采样）；
- 体积（gzip 前）：HTML 9.8–28.9KB（目标 ≤120KB）、CSS 39.7KB（目标 ≤60KB）、JS 9.1KB（目标 ≤16KB），全部达标；
- CSS 在 `<head>`、JS 在 `</body>` 前；首屏关键路径仅 1 CSS + 1 JS；
- 无构建步骤、零框架、零第三方 SDK、无地图服务（contact 位置区块为静态 SVG 占位并标注"地图待接入"）。

### 2.7 安全

- 全站无外链（`rel="noopener"` 无适用场景）；
- 表单**无任何网络请求**（实测：合法提交仅展示占位提示 `role="status"`，`fetch/XHR` 零调用，JS 全文无网络 API）；
- `deploy/` 与 `docs/` 敏感信息扫描：无硬编码 AK/SK/Token，密钥均以 `<AccessKeyId>` 占位或 `${{ secrets.* }}` / GitHub Secrets 引用，RAM 最小权限策略正确；
- **发现并修复** nginx CSP 会拦截内联脚本的问题（见 §3.3）。

### 2.8 部署向（deployment.md §12）

- deployment.md 方案（OSS + CDN + 备案域名；GitHub Pages 作预览/验收）与站点纯静态、相对路径、扁平结构匹配，可原样托管；
- `deploy/github-actions.yml`：产物组装含 404.html 且带存在性自检（缺失即使流水线失败）、权限最小化（contents:read / pages:write / id-token:write）、concurrency 正确——**但该工作流从未实际运行**（GitHub 仓库/Pages 站点未部署，见 §3.6），其正确性仅为静态审查结论；
- `deploy/nginx.conf`：HTTP 301、TLS1.2+、gzip、安全响应头、HTML 5 分钟 / 资产 1 年缓存、SVG MIME、error_page 指向已存在的 404.html，与站点实际结构匹配；
- `deploy/oss-sync.md`：上传/同步/刷新/回滚命令抽查，**发现并修复** set-meta 语法错误（见 §3.3）。

---

## 3. 问题项分级与修复记录（P0/P1，验收方已直接修复）

### 3.1 P1 · 中文文案半角直引号（排版不规范，15 处）

- **现象**：中文正文使用半角 `"` 引号，而 about.html 的 meta description 已使用规范弯引号，全站引号风格不一致。
- **修复**（半角直引号 → 全角弯引号 `“”`，均在同行原位替换）：

| 文件 | 行号 | 内容 |
|---|---|---|
| index.html | 157、158 | "高科技报国" / "顶层研判 → 子公司放大 → 技术层打通 → 合作方赋能" |
| index.html | 293、297 | "一带一路"（正文 + 区位要点列表） |
| about.html | 116、155、159 | "高科技报国" / "一带一路" ×2 |
| about.html | 199、225、258 | "AI+ 产业融合平台" / "顶层研判 + 子公司放大" / "高科技报国" |
| industries.html | 114 | "1 + 1 > 2" |
| cooperation.html | 129、139、181 | "AI+" / "高科技报国" / "一带一路" |
| contact.html | 113 | "待客户提供" |

- **回归**：修复后全站文案零直引号残留，弯引号左右各页配对相等（index 4/4、about 8/8、industries 1/1、cooperation 3/3、contact 1/1）；无头浏览器复测零 console 错误。

### 3.2 P1 · 字号偏离设计令牌（3 处）

architecture.md §5.2 规定"全站字号仅允许上表取值，不新增中间档"，以下 3 处使用了表外中间值：

| 文件 | 行号 | 选择器 | 原值 | 修复值 | 说明 |
|---|---|---|---|---|---|
| assets/css/style.css | 462 | `.logo__sub` | `11px` | `var(--fs-small)`（13px） | 落在页脚/小字档 |
| assets/css/style.css | 478 | `.nav__link` | `15px` | `var(--fs-aux)`（14px） | 落在辅助档 |
| assets/css/style.css | 511 | `.nav__cta` | `15px` | `var(--fs-aux)`（14px） | 与导航链接同档，保持层级关系 |

- **回归**：修复后 CSS 全部 `font-size` 声明均取自令牌（全量 grep 确认）；四档宽度无头复测无新增溢出。

### 3.3 P1 · 抽屉打开时焦点未迁移（可访问性缺陷）

- **现象**：`aria-modal="true"` 的对话框打开后，焦点未移入对话框。无头实测复现：点击汉堡钮当帧抽屉计算样式仍为 `visibility: hidden`（CSS 过渡尚未开始），`main.js` 中同步执行的 `closeBtn.focus()` 落在不可见元素上而失败；键盘用户打开抽屉后 Tab 仍从文档顶部开始。
- **修复**：`assets/js/main.js` L39-50，焦点迁移延迟双帧执行：

```js
if (open) {
  var closeBtn = drawer.querySelector(".drawer__close");
  if (closeBtn) {
    // 抽屉由 visibility:hidden 过渡打开：点击当帧计算样式仍为 hidden，
    // 同步 focus() 会落在不可见元素上而失败。延迟两帧待样式生效后再移动焦点。
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        closeBtn.focus();
      });
    });
  }
}
```

- **回归**：实测 `afterOpen.closeFocused = true`；`aria-expanded` 双钮同步、body 锁滚动、`aria-hidden`、Esc 关闭且焦点归还汉堡钮均正常。

### 3.4 P1 · nginx CSP 拦截页面内联脚本（部署配置缺陷）

- **现象**：`deploy/nginx.conf` L80 CSP 为 `script-src 'self'`，而 6 个页面 `<head>` 均含内联脚本（`has-js` 标记，防入场动画闪烁的标准写法）。自建服务器场景下该内联脚本会被 CSP 拦截：控制台出现 CSP 违规报错（违背"零 console 报错"验收口径），且 `.has-js` 不生效。
- **修复**：`script-src 'self'` → `script-src 'self' 'unsafe-inline'`，并更新注释说明内联脚本与内联 style 均需放行。
- **说明**：仅影响自建 nginx 场景；OSS/CDN 与 GitHub Pages 场景不受影响（不下发该 CSP）。

### 3.5 P1 · ossutil set-meta 命令语法错误（部署文档缺陷）

- **现象**：`deploy/oss-sync.md` §6 写作 `ossutil set-meta oss://... "Content-Type=image/svg+xml" --update`（等号 + 引号）。经比对阿里云官方文档（help.aliyun.com/zh/oss/developer-reference/set-meta），正确语法为 `header:value`（冒号分隔），等号写法执行时会失败——SVG MIME 修复是 deployment.md §7.4/§14.5 标注的"常见坑"修复手段，命令错误将导致该坑无法按文档修复。
- **修复**：`deploy/oss-sync.md` L145、L148 改为官方语法：

```bash
ossutil set-meta oss://zixiang-website/assets/img/favicon.svg Content-Type:image/svg+xml --update
ossutil set-meta oss://zixiang-website/assets/img/ Content-Type:image/svg+xml --update -r --include "*.svg"
```

### 3.6 P1 · GitHub Pages 预览/验收环境未部署（部署侧，待韩渡川处理）

- **现象**（2026-10-21 验收期间在线核查）：
  - `https://aaminute-hash.github.io/zixiang-website/` 返回 GitHub 官方 "Site not found · GitHub Pages"（404），站点未发布；
  - `https://github.com/aaminute-hash/zixiang-website` 仓库页面返回 404——仓库尚未创建/推送，或为私有仓库（未登录访问私有仓库 GitHub 同样返回 404）；
  - 因此 `docs/deployment.md` §10.3"push 到 main 后自动部署"的工作流从未实际运行过，§12 清单末项"GitHub Pages 预览地址已提供给验收工程师"无法打钩。
- **影响**：代码侧与本地无头实测全部通过（零依赖纯静态站，`file://` 与静态托管行为等价），但**线上预览环境缺失**，验收方无法在真实 HTTP 环境下做最终确认；生产环境（OSS+CDN）尚在备案关键路径上，短期只能依靠 Pages 预览。
- **需部署工程师执行**（按 deployment.md §10.1/§10.3）：① 创建公开仓库 `aaminute-hash/zixiang-website` 并推送 main；② Settings → Pages → Source 选 "GitHub Actions"；③ 确认 workflow 跑绿后提供可访问的预览地址，由验收方复测（重点：五页 + 404.html 可达、资源加载、相对路径在子路径下正常）。
- **归属说明**：此项需 GitHub 账号操作权限，超出验收方权限边界，未由验收方修复，记为上线条件之一（见 §6）。

### 3.7 P2 · CSS 失效选择器（已顺手清理）

- `assets/css/style.css` L532（原）`.nav--scrolled + .site-header__inner .nav-toggle`：`.site-header__inner` 是 `.site-header` 的子元素而非兄弟节点，该选择器永假，属死代码。已删除，保留同规则内另两个有效选择器。无行为影响。

---

## 4. 前端自查声称项的复验结果对照

| 前端声称 | 独立复验结果 |
|---|---|
| 多档宽度渲染无横向溢出 | **确认**（6 页 × 4 宽度实测，scrollWidth 恒等于 clientWidth） |
| 抽屉/表单交互自动化通过 | **确认**（抽屉 aria/锁滚动/Esc/焦点迁移、表单空提交/合法提交/非法邮箱/blur 校验均实测通过；焦点迁移缺陷已修复） |
| 零外部请求 | **确认**（resource 计时全量白名单） |
| 零 console 报错 | **确认**（三类事件源零错误/警告/异常） |
| 所有 href/src 指向真实文件 | **确认**（逐一对照文件系统） |
| 5 个赛道锚点存在 | **确认**（industries.html 五个 id 均在） |
| 19 枚图标规范统一 | **确认**（源文件 + 内联全量属性检查） |
| title/description 依 §7.2 | **确认**（title 五页与 §7.2 一致；description 四页为补足版，长度 86–102 字符在 70–120 区间，文案待主理人终审，见 §6） |

---

## 5. 建议项（不阻塞上线）

1. **文档同步**：`README.md` 目录结构与占位清单未登记新增的 `404.html`；`docs/deployment.md` §6.2"首版站点暂无该页面"表述已过时。建议前端与部署侧各补一笔文档变更（走版本号 + 变更说明流程）。
2. **表单焦点样式**：输入框 `:focus` 以 3px 蓝色光环（box-shadow）替代 §5.6 字面的"2px 外描边 + 2px 偏移"，可见性达标、与规范字面表述略异，建议后续统一或修订规范表述。
3. **placeholder 对比度**：`#A8B4C9` on `#FFFFFF` 约 2.1:1，偏低（WCAG 对占位符不强制），建议后续加深一档。
4. **焦点圈禁（focus trap）**：抽屉为 `aria-modal="true"` 模态，当前未圈禁焦点（Tab 可逸出到背后内容）。首版规格未要求，建议后续增强。
5. **隐私政策占位链接**：`href="#"` 点击无反馈，已登记为占位；建议客户提供内容后建页或以文字占位替代空链接。

---

## 6. 待主理人终审事项（不擅改，回传总监）

1. **首页 Hero 口号**："以 AI 之力，赴产业之兴"（architecture.md §10.8 要求 Slogan 终审后定稿；当前页面已按此呈现）。
2. **四页 description 补足文案**：about（86 字符）/ industries（102）/ cooperation（96）/ contact（95），系前端在 §7.2 草案基础上补足至 70–120 字符区间，文案终审权在主理人。

**上线条件（3 项，满足后即可放行）：**

1. 主理人对 §6 所列 2 项终审确认（或提出修订由前端落实后知会验收方）；
2. **预览环境上线**：GitHub 仓库创建/推送、Pages Source 设为 GitHub Actions、workflow 跑绿且预览地址可访问（五页 + 404.html 可达），由验收方在真实 HTTP 环境下复测通过（见 §3.6）；
3. 正式发布后按 `docs/deployment.md` §12 清单完成运维侧抽查：`curl -sI` 核对 HTML `max-age=300`、CSS/JS `Content-Type` 与 `31536000`、favicon `image/svg+xml`，以及五页逐一打开无异常、移动网络实测。

---

## 7. 复验后的最终状态

- 全部代码侧 P0/P1 问题已修复并通过无头浏览器回归（溢出 / console / 网络 / 抽屉 / 表单 / reduced-motion / 锚点七组实测全绿）；
- 修复涉及文件：`assets/js/main.js`、`assets/css/style.css`、`index.html`、`about.html`、`industries.html`、`cooperation.html`、`contact.html`、`deploy/nginx.conf`、`deploy/oss-sync.md`；
- 部署侧待办（§3.6）：GitHub 仓库/Pages 预览环境部署，责任人韩渡川；
- 验收方未改动：任何文案终审项、`docs/architecture.md`、`docs/deployment.md`、`README.md`、其余源码逻辑。

> 变更记录：v1.1（2026-10-21 验收期间）——新增 §3.6 预览环境未部署的在线核查发现，结论由"通过（附 2 项条件）"修订为"有条件通过（3 项条件）"。

---

*本报告由关千锤撰写；凡引用数据均为本次验收实测或逐值比对结果，未虚构任何测试结论。*
