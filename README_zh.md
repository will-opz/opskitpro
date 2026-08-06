# OpsKitPro — 实用在线工具与网站诊断

[English](./README.md) | [简体中文](./README_zh.md)

OpsKitPro 是一个中英文实用在线工具集：既提供无需登录、打开即用的日常小工具，
也为开发者、站长和运维人员提供更深入的网站与网络诊断。

当前产品坚持“工具优先”：

- 一个工具解决一个明确问题；
- 优先适配手机、微信内置浏览器和一般网络环境；
- 能在浏览器本地处理的内容尽量不上传；
- 公开工具无需注册或登录；
- AI 只嵌入具体任务，不做通用聊天产品。

Website Check 继续作为专业能力锚点；密码安全、二维码、JSON、编解码、时间、
网络等工具承担更高频的日常使用场景。原主站 Blog 模块已经下线，有价值的旧
链接会重定向到相关工具。

> [!IMPORTANT]
> 此公开仓库只包含面向用户的产品。私有数据分析、运营自动化、发布流程、
> 服务器记录和项目 AI 记忆均保存在私有 `opskitpro-ops` 仓库。

## 业务方向

OpsKitPro 由三层能力组成：

1. **高频小工具**：无需学习和登录，立即完成一个常见任务。
2. **专业检查工具**：用证据和观测位置解释网站、DNS、TLS、CDN 与网络问题。
3. **任务型智能辅助**：只在具体工具内加入确定性分析或 AI 辅助，不扩展成泛
   聊天平台。

公开语言维护范围为英文和简体中文。日文与繁体中文旧链接会重定向到最接近的
维护语言。中文推广逐步转向微信公众号中的短演示、真实场景和可复用清单；
推广策略和运营数据不进入此公开仓库。

## 主要工具

### 网站与网络

- **网站检测** (`/tools/website-check`)：检查 DNS、HTTP、TLS、CDN、跳转、
  安全响应头，并从不同观测位置解释结果。
- **网络诊断** (`/tools/network-check`)：展示连接上下文、IPv6、DNS 延迟、
  服务可达性和 Cloudflare 请求信息。
- **DNS 安全检查** (`/tools/dns-lookup`)：检查 DNS 记录及 SPF、DMARC、CAA
  策略信号。
- **IP 查询**、**Cloudflare Trace**：提供网络和边缘节点上下文。
- **Cloudflare 错误百科** (`/errors/*`)：解释常见 Cloudflare 故障及排查路径。

### 密码安全

- 首页直接提供紧凑的安全密码生成器。
- 完整工具支持网站账号、家庭 Wi-Fi、数据库/API、易输入四种预设，以及易
  混淆字符排除、自定义字符排除、UUID、PIN 和 4–8 词易记短语。
- 强度分析完全在浏览器本地执行，解释长度、字符类型、重复、连续序列、键盘
  模式和常见弱密码信号，不用单一分数承诺“安全”。
- 泄露检查只在用户主动点击后执行。浏览器向 Have I Been Pwned Pwned
  Passwords 发送 SHA-1 哈希前 5 位并启用响应填充，完整后缀在本地匹配。
- 试用版保险库在 IndexedDB 中只保存版本化 AES-256-GCM 加密信封，支持本地
  条目、搜索、自动锁定、剪贴板清理和加密导入导出。

> [!WARNING]
> 本地保险库是尚未经过独立安全审计的浏览器 MVP，不能替代成熟密码管理器。
> 主密码忘记后无法找回；恶意浏览器扩展、XSS、系统木马、键盘记录、录屏和
> 已解锁设备不在其防护范围内。

### 日常与开发工具

- 二维码生成
- JSON 格式化、修复、对比、转换与校验
- WebSocket 测试
- 编码与解码
- 时间转换
- Prompt Builder

## 隐私模型

- 生成的密码、强度分析、完整哈希、泄露结果、保险库条目和主密码不会发送到
  OpsKitPro。
- 密码相关功能只有主动触发的泄露检查会访问第三方，并采用五位前缀的
  k-anonymity 协议。
- 保险库明文只在当前页面解锁期间存在；IndexedDB 和导出备份只保存密文。
- 剪贴板管理器和浏览器扩展仍可能读取复制内容。
- 需要服务端观测的公开诊断会明确区分 OpsKitPro 探针和用户浏览器。

## 运行架构

```text
用户浏览器
   │
Cloudflare（DNS、TLS、CDN、WAF；私有后台使用 Access）
   │
AWS Lightsail 上的 Nginx
   │
Next.js 16 standalone Node.js 产品
   ├── /en 与 /zh 静态公开页面
   ├── /api 动态诊断接口
   └── /admin 私有便利入口
```

Product 运行时不依赖 Cloudflare Workers 或 Workers KV。数据流和信任边界见
[`docs/architecture.md`](./docs/architecture.md)。

## 仓库分工

| 仓库 | 可见性 | 职责 |
|---|---|---|
| `opskitpro` | 公开 | 产品界面、公开工具/API、测试和部署流程 |
| `opskitpro-ops` | 私有 | Django 中控台、数据分析、自动化、报告和权威 AI 记忆 |
| `opskitpro-public` | 公开 | 已完成的静态知识库材料，不存放私有草稿和运营状态 |

此仓库禁止加入凭据、生产流量数据、私有方案、发布队列或 `.ai` 项目记忆。

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 16 App Router |
| 运行时 | AWS Lightsail standalone Node.js |
| 公网边缘 | Cloudflare |
| 样式 | Tailwind CSS 3 |
| 测试 | Vitest + Playwright |
| 部署 | GitHub Actions → AWS Lightsail |

## 本地开发

```bash
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro
npm install
npm run dev
```

常用验证命令：

```bash
npm run verify:fast
npm run test:e2e
npm run package:standalone
```

独立部署包输出到 `.deploy/opskitpro-standalone.tar.gz`。部署细节见
[`deploy/lightsail/README.md`](./deploy/lightsail/README.md)。

管理员运行时变量：

```bash
OPSKITPRO_ADMIN_PASSWORD=
OPSKITPRO_ADMIN_SECRET=
OPSKITPRO_ADMIN_EMAILS=
```

真实值只配置在服务器环境或 GitHub Secrets。公开工具不依赖这些变量，必须保持
无需登录即可使用。

## 文档入口

- [架构与信任边界](./docs/architecture.md)
- [产品路线图](./docs/roadmap.md)
- [版本记录](./CHANGELOG.md)
- [Lightsail 部署](./deploy/lightsail/README.md)

## 联系方式

- 网站：[opskitpro.com](https://opskitpro.com)
- 邮箱：[admin@opskitpro.com](mailto:admin@opskitpro.com)
- X：[@OpsKitPro](https://x.com/OpsKitPro)
