# 广东紫翔科技企业官网 — 部署方案与运维配置

| 项目 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 撰写 | 韩渡川（阿客实验室研发部 · DevOps 与部署运维） |
| 日期 | 2026-10-21 |
| 适用范围 | 官网首版（5 个静态页面 + assets/）的托管选型、备案、证书、缓存、发布与回滚流程、GitHub 协同工作流 |
| 读者 | 主理人（岑执衡）、前端工程师（苏映棠）、验收工程师（关千锤） |
| 关联任务 | Phase 3 部署（本文档 + deploy/ 配置）→ Phase 4 上线验收 |
| 配套文件 | `deploy/nginx.conf`（自建服务器场景）、`deploy/github-actions.yml`（GitHub Pages 自动部署）、`deploy/oss-sync.md`（阿里云 OSS 同步操作手册） |

> 部署纪律（先约定后操作）：① 所有环境配置可重现，不依赖人工操作；② 每次部署必须有回滚方案，没有回滚就不上线；③ 监控先于优化，先看到问题再动手；④ 权限最小化，不给多余的操作权限。
> 凡本文档未覆盖的部署细节，以阿里云/腾讯云/GitHub 官方文档的实时说明为准，不得凭记忆操作生产环境。

---

## 1. 部署目标与约束

### 1.1 交付物形态（与架构文档 §4/§6 对齐）

- 纯静态站点：根目录 5 个 HTML（`index/about/industries/cooperation/contact.html`）+ `assets/`（css / js / img）；
- 零外部依赖：无外链 CDN、无外链字体、无第三方 SDK、无地图 SDK；
- 无构建步骤：交付物即源码，上传即上线；
- 全站相对路径引用（`assets/css/style.css`、`./about.html`），可原样部署到任意静态托管环境，包括 GitHub Pages 的仓库子路径。

### 1.2 部署目标

1. 中国大陆境内正常、快速、稳定访问（企业官网正式环境）；
2. 全站 HTTPS，HTTP 强制 301 跳转；
3. 内容更新后 5 分钟内可全网生效（HTML 短缓存 + CDN 刷新兜底）；
4. 任何一次上线可在约 10 分钟内完成回滚；
5. 部署过程可重现、可审计（命令级文档 + 版本化配置文件）。

### 1.3 职责边界

| 范围 | 负责人 | 说明 |
|---|---|---|
| `docs/deployment.md`、`deploy/` 目录 | 韩渡川（本文档） | 部署方案与运维配置 |
| 5 个 HTML、`assets/`、`README.md` | 苏映棠 | 前端交付物，部署侧只读使用 |
| 部署执行 | 韩渡川 + 客户方配合（云账号、备案材料） | 见 §9 流程 |

---

## 2. 托管方案对比

| 维度 | 阿里云 OSS + CDN | 腾讯云 COS + CDN | GitHub Pages |
|---|---|---|---|
| 适用场景 | 国内企业官网正式环境；需要备案域名；对国内访问速度与稳定性有要求 | 同上；客户已深度使用腾讯云生态（微信/企业微信/云函数）时优先 | 个人/开源项目主页、演示与预览环境、面向海外或无需备案的轻量站点 |
| 国内访问体验 | 好：国内边缘节点覆盖全，可选华南 1（深圳）与客户总部同地域 | 好：国内节点同样充足，华南节点可选 | 无保障：服务节点在海外，国内访问慢且不稳定，可能受 DNS 污染影响 |
| 备案要求 | 域名绑定国内节点前必须完成 ICP 备案（§4） | 同左（国内节点需备案） | 默认域名（*.github.io）无需备案；绑定自定义域名长期面向国内运营建议备案，且备案也无法改善速度 |
| 费用量级 | 存储约 0.12 元/GB/月 + CDN 流量约 0.15–0.24 元/GB（阶梯），企业小站通常每月数元至数十元 | 与阿里云同量级，部分项目略低 | 免费（公开仓库；建议仓库 ≤1GB，月带宽软上限约 100GB） |
| 运维成本 | 低：无服务器运维，仅需管理证书、缓存刷新、账单 | 低：同左 | 极低：但受平台策略约束（免费版 Pages 建议仓库公开、自定义域名需 CNAME 记录） |
| 与 GitHub 协同 | 好：GitHub Actions 可自动同步到 OSS（进阶，§10.5） | 好：同理 | 原生一体：push 到 main 即自动部署（本方案已配置，见 `deploy/github-actions.yml`） |
| 精细控制能力 | 响应头、防盗链、错误文档、版本控制均可控 | 同左 | 不可精细控制响应头；无服务端重写规则；构建方式受限 |

> 表中价格均为量级参考，以各云厂商控制台实时价格与计费说明为准。

**结论先行**：GitHub Pages 用作预览/演示/验收环境（零成本、push 即上线）；正式生产环境选阿里云 OSS + CDN + 已备案域名（§3）。腾讯云 COS + CDN 作为同量级备选，仅在客户已确认使用腾讯云生态时启用。

---

## 3. 推荐路径：阿里云 OSS + CDN + 已备案域名

**国内企业官网正式环境，首选「阿里云 OSS 静态托管 + CDN 加速 + 已完成 ICP 备案的独立域名」。**

理由：

1. **访问体验**：客户总部在深圳，OSS 选华南 1（深圳）地域，CDN 边缘节点覆盖全国，纯静态小站首屏基本无感加载；
2. **合规**国内云节点 + 已备案域名是大陆企业官网的标准形态，避免被服务商阻断、避免搜索引擎收录异常；
3. **成本**：无服务器、无运行时运维，按存储 + 流量计费，小站月成本通常在 20 元以内；
4. **工作流兼容**：本地或 CI 一条 `ossutil` 命令完成同步；GitHub 仓库继续承担版本管理与 Pages 预览；
5. **可回退**：OSS 版本控制 + 发布包留存，满足"没有回滚就不上线"的纪律（§9.4）。

推荐拓扑：

```
用户 → https://www.zixiang.com（CDN 边缘节点，全国加速）
                └─ 回源 → OSS 静态托管（华南1-深圳；索引文档 index.html）

GitHub 仓库（aaminute-hash/zixiang-website）
                ├─ push main → GitHub Pages 自动部署（预览/验收环境，§10.3）
                └─ 正式发布 → ossutil 同步到 OSS → CDN 刷新（§9，deploy/oss-sync.md）
```

域名结构建议：

- 主用 `www.zixiang.com`（CNAME 到 CDN 加速域名）；
- 根域 `zixiang.com` 做显性 URL 跳转到 `www`，或同解析到 CDN（阿里云云解析支持根域 CNAME）；
- 具体域名以客户注册结果为准（物料见 §13）。

---

## 4. ICP 备案要点（上线关键路径：先备案，后绑定）

### 4.1 备案主体

- 主体：**广东紫翔科技有限公司**（企业备案，非个人备案）；
- 网站负责人：建议由法定代表人或授权的公司员工担任，需完成人脸核验；
- 备案服务商：阿里云（与 OSS/CDN 同账号，便于统一管理）。

### 4.2 流程顺序（不可颠倒）

```
① 注册域名（建议阿里云万网）
② 注册并完成企业实名认证的阿里云账号
③ 提交 ICP 备案（需先在阿里云购买 ECS 获取备案服务号，或按阿里云备案引导操作）
④ 阿里云初审（约 1 个工作日）
⑤ 提交通信管局审核（广东通常 7–20 个工作日，以各地管局为准）
⑥ 备案通过，获得 ICP 备案号 → 填入网站页脚（前端替换占位，架构文档 §9）
⑦ 之后才能将域名绑定到 OSS + CDN 国内节点，并配置 DNS 解析生效
```

> **铁律：未完成备案的域名绑定国内云节点（OSS 源站 / CDN）会被服务商阻断，80/443 均无法访问。必须先备案、后绑定。**
> 备案全程通常 2–4 周，是上线的关键路径，建议项目第 0 天即启动，与前端开发并行。

### 4.3 备案材料清单（企业）

| 材料 | 说明 |
|---|---|
| 营业执照 | 最新年检过的副本扫描件 |
| 法人身份证 | 正反面扫描件 |
| 网站负责人身份证 | 正反面扫描件（可与法人为同一人） |
| 网站备案真实性核验单 | 阿里云备案系统生成，签字 + 盖章后上传 |
| 人脸核验 | 通过阿里云 APP 完成（现行以 APP 人脸核验为主） |
| 域名证书 | 阿里云域名控制台可下载 |
| 备案信息 | 网站名称、网站服务内容（企业官网）、备注说明 |

### 4.4 备案后注意事项

- 备案号须在网站页脚底部行展示（前端占位，见架构文档 §9 清单）；
- 网站开通后 30 日内需完成公安备案（全国公安机关互联网站安全管理服务平台）；
- 备案主体、域名、网站负责人变更须及时办理备案变更，避免被注销。

---

## 5. HTTPS 证书

| 环境 | 证书方案 | 部署位置 |
|---|---|---|
| 正式环境（阿里云） | 免费 DV 单域名证书（阿里云 SSL 证书服务，1 年期、可续期）或付费证书 | 部署到 CDN，开启 HTTPS 并设置"强制跳转 HTTPS" |
| 预览环境（GitHub Pages） | 平台自动提供 *.github.io 证书；绑定自定义域名后自动签发与续期 | 无需操作 |
| 自建服务器（可选备选） | certbot / Let's Encrypt 免费证书，90 天自动续期 | nginx（配置见 `deploy/nginx.conf`） |

要求：

1. 全站仅提供 HTTPS，HTTP 80 一律 301 跳转 HTTPS；
2. 证书按需覆盖 www 与根域（免费证书可申请多域名或通配符，以阿里云控制台为准）；
3. 自建场景开启 HSTS（`Strict-Transport-Security`，见 nginx.conf）；CDN 场景可在响应头配置中添加；
4. 证书到期前阿里云会发送提醒（§11 监控表），到期前完成续期与重新部署。

---

## 6. 缓存策略

| 文件类型 | Cache-Control | 配置位置 | 说明 |
|---|---|---|---|
| HTML（5 个页面） | `public, max-age=300`（5 分钟） | OSS 源站响应头，CDN 遵循 | 内容可能随时更新（占位信息替换、文案调整），短缓存保证旧内容最长滞留 5 分钟；紧急更新用 CDN 刷新立即生效 |
| 静态资源（assets/css、assets/js、assets/img 全部文件） | `public, max-age=31536000, immutable`（1 年） | OSS 源站响应头，CDN 遵循 | 全站仅 3 类资源、体积小、变更频率低，长缓存最大化 CDN 命中率、降低回源 |

### 6.1 关于"文件名稳定性"（本项目无构建、无 hash 文件名，务必理解）

1. 本项目 CSS/JS/SVG 文件名固定（`style.css`、`main.js`、`favicon.svg` 等），**无法通过"改文件名"让浏览器获取新版本**；
2. 一旦用户浏览器按 `immutable` 缓存了旧版 `style.css`，直接覆盖上传后，已访问过的用户可能继续使用旧文件，最长可达 1 年；
3. 因此采用组合拳（按优先级）：
   - **每次覆盖更新 `assets/` 后，必须执行 CDN 目录刷新**（§9.3），强制边缘节点回源；
   - 若某次更新希望立即对全部用户生效且不做 CDN 刷新，需前端配合在引用处加版本参数，如 `assets/css/style.css?v=20261021`（属前端变更，不建议作为常规手段）；
   - 首版上线后冻结 assets 文件名与语义，新增资源一律使用新文件名；
4. HTML 始终保持 5 分钟短缓存，保证入口文件能及时引用到新资源。

### 6.2 错误文档

- OSS 静页托管错误文档设为 `404.html`（前端已补充：位于站点根目录，复用全站样式，无外部请求，已加 `noindex`）；
- 自建 nginx 场景已启用 `error_page 404 /404.html`（`deploy/nginx.conf`）；
- 部署时确认 `404.html` 已随站点一并上传（`ossutil` 同步自动包含；GitHub Actions 产物组装已包含）；
- GitHub Pages 会自动使用根目录的 `404.html` 作为默认 404 页。

---

## 7. OSS 静态托管配置要点

1. **Bucket**：地域选华南 1（深圳）；读写权限公共读；开启静态页面托管；
2. **索引文档**：`index.html`；**错误文档**：`404.html`（前端已补充，见 §6.2）；
3. **版本控制：必须开启**——这是误删与错误覆盖后的唯一恢复手段（OSS 对象在未开启版本控制时误删将无法恢复）；
4. **MIME 类型**：SVG 必须为 `image/svg+xml`（`ossutil` 上传后需抽查；常见坑是变成 `application/octet-stream` 或 `text/plain`，导致浏览器不渲染，修复命令见 `deploy/oss-sync.md` §6）；
5. **防盗链（可选）**：Referer 白名单仅放行官网域名，防止样式与图片被外站盗刷流量；
6. **传输加速（可选）**：仅对上传速度有帮助，面向公网访问不需要。

---

## 8. 自建服务器场景（可选备选）

若客户已有云服务器且要求自托管，直接使用 `deploy/nginx.conf`：

- gzip 压缩（文本类资源）、静态资源缓存头（HTML 5 分钟 / 资产 1 年 immutable）；
- HTTP 80 强制 301 跳转 HTTPS、TLS 1.2+ 密码套件；
- 安全响应头（HSTS / X-Content-Type-Options / X-Frame-Options / Referrer-Policy / CSP）；
- `image/svg+xml` 正确 MIME、favicon 静默处理、隐藏文件拒绝；
- 部署动作：将站点文件放置 `/var/www/zixiang-website`，本配置放入 `/etc/nginx/conf.d/`，`nginx -t && systemctl reload nginx`。无 PHP、无数据库、无反向代理需求。

> 自建场景需自行补齐服务器安全加固、证书自动续期、监控告警，运维成本高于 OSS+CDN；仅作备选。

---

## 9. 上传与发布流程

### 9.1 发布前检查

- [ ] 前端交付物已合入 main，且 GitHub Pages 预览无异常；
- [ ] 占位信息（架构文档 §9）已由客户提供并替换，或主理人明确接受占位上线；
- [ ] 上一版发布包已留存（`deploy-YYYYMMDD.zip`，见 §9.4）；
- [ ] 回滚路径已确认（OSS 版本控制已开启）。

### 9.2 上传（ossutil）

完整命令见 `deploy/oss-sync.md`，核心两条：

```bash
# 同步本地站点到 OSS（不含删除，适合日常更新）
ossutil cp -r -f --update ./ oss://zixiang-website/

# 或以 sync 模式（推荐，自动上传新增/变更；--delete 有风险，先读 deploy/oss-sync.md §5 再决定）
ossutil sync ./ oss://zixiang-website/
```

### 9.3 CDN 刷新

```bash
# 阿里云 CLI（或控制台 → CDN → 刷新预热）
aliyun cdn RefreshObjectCaches --ObjectType Directory --ObjectPath "https://www.zixiang.com/assets/"
aliyun cdn RefreshObjectCaches --ObjectType Directory --ObjectPath "https://www.zixiang.com/"
```

- 目录刷新默认配额约 100 个/日、URL 刷新约 2000 条/日（以控制台配额管理页为准），紧急更新优先刷目录；
- 刷新为异步任务，控制台可查看进度；刷新完成前边缘节点可能仍返回旧内容；
- `ossutil` 本身不提供 CDN 刷新子命令，刷新走阿里云 CLI 或控制台。

### 9.4 回滚（每次上线前确认可回滚）

三种方式，按速度排序：

1. **OSS 版本控制恢复（首选）**：从控制台/`ossutil` 下载上一版本发布包 → 重新同步 → CDN 刷新，约 10 分钟；
2. **Git 回滚**：`git revert` 出问题的 commit → push → 重新执行 §9.2/§9.3；
3. **本地留存发布包**：每次发布前留存上一版文件（zip 或独立目录），出事原样重传 + CDN 刷新。

> 纪律：线上异常先回滚止血、保留现场日志，再排查原因；不允许"先改着看看"。

---

## 10. 与 GitHub 协同工作流

### 10.1 仓库与分支

- 仓库：`aaminute-hash/zixiang-website`（建议 Public，便于 Pages 预览与协作者审阅）；
- 分支：`main` 唯一主干，push 到 main 即触发自动部署；
- 建议 `.gitignore` 排除：系统文件（`.DS_Store`、`Thumbs.db`）、编辑器目录（`.vscode/`、`.idea/`）、本地发布包 zip。

### 10.2 本地开发（Windows 主环境，命令级）

```powershell
# 克隆（首次）
cd C:\Users\lenovo\WorkBuddy\2026-10-21-06-29-15
git clone https://github.com/aaminute-hash/zixiang-website.git

# 日常开发：编辑 5 个 HTML / assets 后
cd zixiang-website
git status                                  # 确认改动范围
git add .                                   # 或精确添加：git add index.html assets/
git commit -m "feat: 更新产业布局页文案"
git push origin main                        # 推送即触发 Pages 自动部署（约 1-2 分钟）

# 本地预览（任选其一）
python -m http.server 8080                  # 浏览器开 http://localhost:8080
```

> 提交粒度建议：一个页面或一个主题一次 commit，便于 `git revert` 精准定位。

### 10.3 自动部署（GitHub Pages，预览/验收环境）

- 母本配置 `deploy/github-actions.yml`，活跃副本 `.github/workflows/deploy-pages.yml`（GitHub 仅从 `.github/workflows/` 读取工作流；变更流程：改母本 → 同步覆盖活跃副本 → push，两份头部注释已互相注明关系）；
- 动作：push 到 main 后自动组装静态产物并部署到 GitHub Pages；
- **首次启用 Pages 是一次性人工动作，且 GITHUB_TOKEN 无法代劳**：configure-pages 的 `enablement: true` 尝试代建站点时会报 `Create Pages site failed: Resource not accessible by integration`（GitHub 平台限制：集成令牌无权创建 Pages 站点，2026-10-21 实测）。必须由仓库属主二选一：
  - a) 仓库页面 → Settings → Pages → Build and deployment → Source 选 "GitHub Actions"；
  - b) 或带 `repo` scope 的 PAT 调 API：`curl -X POST https://api.github.com/repos/aaminute-hash/zixiang-website/pages -H "Authorization: token <PAT>" -d '{"build_type":"workflow"}'`（本项目即用此法启用，已在线验证）；
- 启用后 workflow 的 configure-pages 即可正常读取站点配置；`enablement: true` 保留作语义标记（该参数默认 `false`，站点缺失时报 "Get Pages site failed: Not Found"，2026-10-21 实测）；
- 如曾手动设置过 "Deploy from a branch" 来源，需先改回 GitHub Actions，否则冲突；
- 仓库一次性设置：Settings → Pages → Build and deployment → Source 选 **GitHub Actions**（不要选 "Deploy from a branch"，否则与本 workflow 冲突）；
- 预览地址：`https://aaminute-hash.github.io/zixiang-website/`；
- Workflow 权限最小化：仅 `contents: read`、`pages: write`、`id-token: write`；
- 验收工程师（关千锤）可直接访问该地址执行 Phase 4 验收，无需等待备案与 OSS；
- **注意：GitHub Pages 定位为预览/演示/验收环境，不作正式生产环境**（国内访问无保障，见 §2）。

### 10.4 WSL2 Ubuntu 20.04 协同（可选）

```bash
# 若偏好在 Linux 侧工作，建议 clone 到 WSL 文件系统（避免跨盘 IO 慢）
cd ~
git clone https://github.com/aaminute-hash/zixiang-website.git
cd zixiang-website
# 编辑、提交、推送命令与 Windows 侧完全一致（git 原生命令，无环境差异）
```

> 纪律：同一文件不要同时在 Windows 与 WSL 两个工作副本中编辑，避免冲突；以一个工作环境为准。

### 10.5 进阶：CI 自动发布到阿里云 OSS（可选，备案完成后再启用）

在 workflow 中追加 job：checkout → 安装 ossutil → `ossutil cp -r -f --update` → 调用 CDN 刷新。

- 密钥管理：阿里云 AK/SK 存 GitHub Secrets（`ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET`）；
- **使用 RAM 子账号**，策略仅授予该 bucket 的对象读写（不给 bucket 管理权限、不给 `oss:*` 全量）——权限最小化；
- 骨架示例：

```yaml
- name: Sync to OSS
  env:
    ALIYUN_ACCESS_KEY_ID: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
    ALIYUN_ACCESS_KEY_SECRET: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
  run: |
    # 安装 ossutil（版本号与下载地址以阿里云官方文档为准）
    curl -o ossutil.zip "https://gosspublic.alicdn.com/ossutil/<版本号>/ossutil-<版本号>-linux-amd64.zip"
    unzip -o ossutil.zip && chmod +x ossutil-*/ossutil
    ./ossutil-*/ossutil config -e oss-cn-shenzhen.aliyuncs.com -i "$ALIYUN_ACCESS_KEY_ID" -k "$ALIYUN_ACCESS_KEY_SECRET" -L CH
    ./ossutil-*/ossutil cp -r -f --update ./ oss://zixiang-website/
    # CDN 刷新：安装阿里云 CLI 后调用 RefreshObjectCaches（命令见 §9.3）
```

> 首版建议以本机 `ossutil` 手工发布为主（`deploy/oss-sync.md`），流程稳定运行数次后再迁移到 CI 自动发布。

---

## 11. 监控与健康检查（先看到问题再动手）

| 监控项 | 手段 | 频率 |
|---|---|---|
| 站点可用性 | 外部拨测（阿里云 CDN 监控/拨测，或免费 UptimeRobot）+ 每日人工 `curl` | 每日 |
| 响应头抽查 | `curl -sI https://www.zixiang.com/assets/css/style.css` 核对 Cache-Control；抽查 SVG 的 Content-Type | 每次发布后 |
| CDN 命中率 / 回源流量 | CDN 控制台监控 | 每周 |
| 证书到期 | 阿里云证书服务到期提醒（到期前 30/14/7 天） | 持续 |
| 账单 | 阿里云费用中心，设置预算告警（建议 50 元/月） | 每月 |
| OSS 存储与版本堆积 | 版本控制会累积历史版本，关注存储量；非当前版本可设生命周期规则定期清理 | 每季度 |

---

## 12. 上线检查清单（Phase 4 前逐项打钩）

- [ ] 域名已注册并完成 ICP 备案，备案号已填入页脚
- [ ] OSS bucket（华南1-深圳）已创建：公共读、静态页面托管（索引 `index.html`）、版本控制已开启
- [ ] CDN 已添加域名、源站指向 OSS、HTTPS 证书已部署、"强制跳转 HTTPS"已开启
- [ ] DNS 解析生效（`www` CNAME → CDN 加速域名）
- [ ] `curl -sI https://www.zixiang.com/` 返回 200，Cache-Control 为 `max-age=300`
- [ ] `curl -sI https://www.zixiang.com/assets/css/style.css` 返回 200、Content-Type 为 `text/css`、Cache-Control 含 `31536000`
- [ ] `curl -sI https://www.zixiang.com/assets/img/favicon.svg` Content-Type 为 `image/svg+xml`
- [ ] 五个页面逐一打开无异常，导航/页脚一致，无死链（占位 `#` 除外）
- [ ] 访问一个不存在的路径返回 `404.html` 页面（而非 OSS 裸 XML 错误页）；`https://www.zixiang.com/404.html` 可访问且样式正常
- [ ] 移动网络（4G/5G）下实测打开速度正常
- [ ] 上一版发布包已留存；回滚步骤已文档化或已演练
- [ ] GitHub Pages 预览地址已提供给验收工程师（关千锤）

---

## 13. 客户需准备的物料清单

| # | 物料 | 责任方 | 状态 |
|---|---|---|---|
| 1 | 域名（如 `zixiang.com`，建议阿里云万网注册） | 客户提供/注册 | 待确认 |
| 2 | 阿里云账号（企业实名认证） | 客户或我方协助 | 待确认 |
| 3 | ICP 备案材料（§4.3 清单：营业执照、法人/负责人身份证、核验单、人脸核验等） | 客户提供 | 待确认 |
| 4 | 备案周期时间窗（2–4 周，上线关键路径，建议立即启动） | 双方协同 | 待启动 |
| 5 | GitHub 账号（已有 `aaminute-hash`）与仓库创建授权 | 我方（韩渡川） | 已具备 |
| 6 | 网站占位信息替换（电话/邮箱/详细地址/备案号，架构文档 §9） | 客户提供 | 待提供 |
| 7 | 免费 SSL 证书（阿里云 SSL 证书服务申领，无费用） | 我方（韩渡川） | 待申领 |
| 8 | 云服务器（仅自建场景需要，见 §8） | 客户 | 视方案 |

---

## 14. 风险与注意事项

1. **未备案先绑定**：国内节点域名未备案会被服务商阻断，反复失败还可能拖慢备案进度——严格按 §4.2 顺序执行；
2. **assets 长缓存 + 覆盖更新**：不做 CDN 刷新会导致用户长时间拿到旧样式/旧脚本，每次更新 assets 必须刷新（§6.1）；
3. **`ossutil --delete` 风险**：`sync --delete` 会删除目标端（OSS）中本地不存在的文件，路径或 bucket 名配错等同于清站——执行前先核对，详见 `deploy/oss-sync.md` §5；
4. **OSS 误删不可逆**：未开启版本控制时误删对象无法恢复，版本控制必须开启；
5. **SVG MIME 类型**：上传后 Content-Type 不是 `image/svg+xml` 会导致图标/Logo 不显示，发布后必须抽查（§11）；
6. **GitHub Pages 非生产**：国内访问无保障，仅作预览/演示/验收；正式环境以 OSS + CDN 为准；
7. **密钥安全**：任何 AK/SK 不进仓库、不进聊天记录，只进阿里云控制台或 GitHub Secrets；CI 场景使用 RAM 子账号最小权限。

---

*本文档由韩渡川撰写；配套操作手册见 `deploy/oss-sync.md`，配置见 `deploy/nginx.conf` 与 `deploy/github-actions.yml`。如需调整，请走文档变更（改版本号 + 变更说明），勿口头约定。*
