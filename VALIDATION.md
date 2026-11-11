# 交付校验

- 两套 `npm run build` 成功，使用原工作目录已安装且版本吻合的 Three.js 0.180.0 / esbuild 0.25.10。
- 新构建的两套 `dist/app.js` 与已发布来源逐字节一致；`dist/` 的全部文件均与来源一致。见 SOURCE_MANIFEST.json。
- JavaScript 语法检查通过；第一套唯一客厅观察点、0.6m 站位空间无碰撞、四种尺寸投影和全景 SHA-256 测试通过。
- 两套 HTML 本地链接与 main.js 中字面量素材路径检查通过。
- Node 静态服务器的两个 HTML 入口及两个 JS 入口返回 HTTP 200 与正确 MIME 类型。
- 扫描未发现常见 GitHub/OpenAI token、私钥或直接赋值的长期秘密；排除了 .git 历史、.openai 配置、node_modules 和下载工作目录。
- 最大单文件约 5.53MB，无超过 GitHub 100MB 限制的文件。
- 没有运行新的浏览器 GPU/视觉回归测试。本次发布内容未改变，仍需在开发者实际浏览器验证 WebGL 性能。
- 干净 npm ci 的离线尝试未通过，因为环境的 npm 缓存缺少 three 安装包；没有把已有依赖复制进仓库。README 的安装命令需要 npm 网络访问，锁文件已保留。
- 仓库所有者明确要求将 GitHub 仓库设为公开；公开前再次检查，未发现常见密钥、私有部署配置或不允许再分发的源资产。
