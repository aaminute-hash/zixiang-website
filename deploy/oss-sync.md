# 阿里云 OSS 同步操作手册（ossutil）

| 项目 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 撰写 | 韩渡川（阿客实验室研发部 · DevOps 与部署运维） |
| 日期 | 2026-10-21 |
| 适用范围 | 将官网静态站点（5 个 HTML + assets/）同步到阿里云 OSS 并刷新 CDN 的全部命令级操作 |
| 读者 | 韩渡川（执行）、客户运维（配合） |
| 关联文档 | `docs/deployment.md`（方案总纲：§9 发布流程、§9.4 回滚） |

> 纪律：先备份/确认回滚路径再操作；`--delete` 类命令执行前必须核对 bucket 名与本地路径；任何 AK/SK 不进仓库、不进聊天记录。

---

## 1. 前置条件

1. OSS bucket 已创建：`zixiang-website`，地域**华南 1（深圳）**，读写权限**公共读**，静态页面托管已开启（索引文档 `index.html`，错误文档 `404.html`）；
2. **版本控制已开启**（误删恢复的唯一手段，deployment.md §7）；
3. CDN 已添加加速域名 `www.zixiang.com`，源站指向该 bucket，HTTPS 证书已部署；
4. ICP 备案已完成（域名绑定国内节点前置条件，deployment.md §4）；
5. 持有一把阿里云密钥。**强烈建议使用 RAM 子账号密钥**，最小权限策略示例：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:PutObject",
        "oss:GetObject",
        "oss:ListObjects",
        "oss:AbortMultipartUpload"
      ],
      "Resource": [
        "acs:oss:*:*:zixiang-website",
        "acs:oss:*:*:zixiang-website/*"
      ]
    }
  ]
}
```

> 仅当确认要使用 `sync --delete` 时，才追加 `oss:DeleteObject`；日常发布不需要删除权限。不给 `oss:*` 全量、不给 bucket 管理权限。

---

## 2. 安装 ossutil

版本号与下载地址以阿里云官方文档为准（https://help.aliyun.com/zh/oss/developer-reference/ossutil）。

**Windows（PowerShell / Git Bash）**：

```powershell
# 下载 Windows amd64 版压缩包并解压，得到 ossutil.exe
# 将 ossutil.exe 所在目录加入 PATH，或直接使用绝对路径调用
ossutil.exe version
```

**WSL2 Ubuntu 20.04（或任意 Linux）**：

```bash
curl -o ossutil.zip "https://gosspublic.alicdn.com/ossutil/<版本号>/ossutil-<版本号>-linux-amd64.zip"
unzip -o ossutil.zip
chmod +x ossutil-*/ossutil
sudo mv ossutil-*/ossutil /usr/local/bin/ossutil
ossutil version
```

---

## 3. 配置 ossutil

```bash
ossutil config
```

交互式输入（也可用一条非交互命令，见下）：

| 配置项 | 值 |
|---|---|
| endpoint | `oss-cn-shenzhen.aliyuncs.com`（华南1-深圳） |
| accessKeyID | RAM 子账号 AccessKeyId |
| accessKeySecret | RAM 子账号 AccessKeySecret |
| 语言 | `CH` |

一条命令形式（适合 CI 或脚本）：

```bash
ossutil config -e oss-cn-shenzhen.aliyuncs.com -i <AccessKeyId> -k <AccessKeySecret> -L CH
```

- 配置文件位置：Linux/macOS 为 `~/.ossutilconfig`，Windows 为 `C:\Users\<用户名>\.ossutilconfig`；
- endpoint 必须与 bucket 地域匹配，填错会报 `AccessDenied` 或连接失败。

---

## 4. 常用命令

```bash
# 查看 bucket 与文件清单（发布前核对用）
ossutil ls oss://zixiang-website/
ossutil ls oss://zixiang-website/assets/ -d          # 递归列出目录

# 上传单个文件（覆盖式）
ossutil cp index.html oss://zixiang-website/

# 上传整个目录（-r 递归 / -f 强制 / --update 只传较新文件）
# 注意：本地路径带 / 结尾，文件落在 bucket 根，不要多套一层目录
ossutil cp -r -f --update ./ oss://zixiang-website/

# 同步模式（推荐）：本地为唯一事实来源，自动上传新增与变更文件
ossutil sync ./ oss://zixiang-website/

# 删除远端多余文件才加 --delete（有风险，先读 §5 再决定）
# ossutil sync ./ oss://zixiang-website/ --delete
```

> 路径易错点：`ossutil cp -r ./zixiang-website oss://zixiang-website/` 会在线上多出一层 `zixiang-website/` 目录，导致整站 404。发布后务必抽查 `curl -sI https://www.zixiang.com/`。

---

## 5. `--delete` 风险提示（重要）

`ossutil sync ./ oss://zixiang-website/ --delete` 会**删除 OSS 中所有本地不存在的对象**。如果本地路径配错、工作副本不完整（比如只 clone 了部分文件）、或 bucket 名笔误，等同于**清空线上站点**。

执行纪律：

1. 首次同步**不使用** `--delete`；
2. 使用前先 `ossutil ls oss://zixiang-website/ -d` 导出远端清单，与本地 `find . -type f` 对比，确认差异符合预期；
3. 核对 bucket 名拼写：`zixiang-website`；
4. 确认本地工作副本是完整的（`git status` 干净、无未跟踪遗漏）；
5. 执行后立即抽查首页与各资源（见 §7 检查清单）；
6. 万一误删：OSS 版本控制已开启的前提下，可从历史版本恢复（见 `docs/deployment.md` §9.4）。

---

## 6. SVG MIME 修复（常见坑）

SVG 上传后 Content-Type 若为 `application/octet-stream` 或 `text/plain`，浏览器会下载而非渲染图标。修复：

```bash
# 单文件（官方语法：header:value，冒号分隔；勿写成 "Content-Type=..."）
ossutil set-meta oss://zixiang-website/assets/img/favicon.svg Content-Type:image/svg+xml --update

# 批量：目录下所有 svg（-f 跳过批量确认提示，避免交互卡住）
ossutil set-meta oss://zixiang-website/assets/img/ Content-Type:image/svg+xml --update -r --include "*.svg" -f

# 验证
curl -sI https://www.zixiang.com/assets/img/favicon.svg | grep -i content-type
```

同理，如发现 CSS/JS 的 Content-Type 异常，用相同方式修复为 `text/css` / `application/javascript`。

---

## 7. CDN 刷新（上传后必做）

`ossutil` 不提供 CDN 刷新能力，刷新走阿里云 CLI 或控制台。

```bash
# 方式一：阿里云 CLI（需另装 aliyun CLI，配置同账号 RAM 子账号密钥）
aliyun cdn RefreshObjectCaches --ObjectType Directory --ObjectPath "https://www.zixiang.com/assets/"
aliyun cdn RefreshObjectCaches --ObjectType Directory --ObjectPath "https://www.zixiang.com/"

# 方式二：阿里云控制台 → CDN → 刷新预热 → 提交目录/URL 刷新
```

- 目录刷新默认配额约 100 个/日、URL 刷新约 2000 条/日（以控制台配额管理页为准）；
- 刷新为异步任务，控制台可查看进度；刷新完成前边缘节点可能仍返回旧内容；
- 每次覆盖更新 `assets/` 后必须刷新（HTML 仅 5 分钟短缓存可自然过期，但紧急发布同样建议刷新）。

---

## 8. 发布检查清单

- [ ] 本地工作副本 `git status` 干净，Pages 预览无异常
- [ ] `ossutil ls oss://zixiang-website/ -d` 与本地清单已核对（尤其使用 `--delete` 时）
- [ ] `ossutil sync ./ oss://zixiang-website/` 执行成功
- [ ] `curl -sI https://www.zixiang.com/` 返回 200
- [ ] `curl -sI https://www.zixiang.com/assets/css/style.css` Content-Type 为 `text/css`、Cache-Control 含 `31536000`
- [ ] `curl -sI https://www.zixiang.com/assets/img/favicon.svg` Content-Type 为 `image/svg+xml`
- [ ] CDN 目录刷新已提交
- [ ] 上一版发布包已留存（zip 或独立目录）
- [ ] 手机网络实测五个页面无异常

---

## 9. 回滚

```bash
# 方式一（首选）：从 OSS 历史版本下载上一版发布包后重传
# 版本 ID 在 OSS 控制台 → bucket → 文件管理 → 版本 中查看
ossutil cp oss://zixiang-website/index.html ./rollback/index.html --version-id <VersionId>
# 或整目录重传本地留存的上一版发布包
ossutil cp -r -f ./rollback/ oss://zixiang-website/

# 方式二：Git 回滚后重新同步（见 docs/deployment.md §9.4）
# git revert <commit> && git push origin main
# 然后重新执行 §4 同步命令

# 回滚后必须：CDN 刷新 + curl 抽查
```

> 纪律：线上异常先回滚止血、保留现场，再排查原因。

---

## 10. 常见问题

| 现象 | 原因与处理 |
|---|---|
| 网站 404 / 访问到错误页 | 检查静页托管索引文档是否为 `index.html`、错误文档是否为 `404.html`；检查文件是否落在 bucket 根（不要多一层目录）；确认 `404.html` 已上传 |
| SVG 图标/Logo 不显示或被下载 | Content-Type 错误，按 §6 修复 |
| 样式/脚本更新不生效 | assets 长缓存：CDN 刷新 + 用户强刷；长期方案见 `docs/deployment.md` §6.1 |
| `AccessDenied` / `403` | bucket 非公共读，或 RAM 子账号权限不足（§1 策略） |
| 连接失败/超时 | endpoint 与 bucket 地域不匹配，应为 `oss-cn-shenzhen.aliyuncs.com` |
| 备案未通过域名无法绑定 | 按 `docs/deployment.md` §4.2 顺序：先备案后绑定 |

---

*本手册由韩渡川撰写；方案总纲见 `docs/deployment.md`。命令如有变更，请同步更新本文档版本号与变更说明。*
