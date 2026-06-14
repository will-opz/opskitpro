<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Memory Protocol
- ⚠️ 本项目与 `opskitpro-ops` 后端共用全局记忆库。
- 启动时请强制读取相对路径 `../opskitpro-ops/.ai/current_state.md` 和 `../opskitpro-ops/.ai/decisions.md`。
- 绝不要在本仓库目录创建 `.ai/` 文件夹。
- 所有任务结束后的日志，请统一写回 `../opskitpro-ops/.ai/session_log.md` 和 `../opskitpro-ops/.ai/task_board.md`。

## Agent Workflow

For any non-trivial task, first write an Implementation Plan to `../opskitpro-ops/.ai/plans/YYYY-MM-DD-phase-name.md`, then stop and wait for user approval before modifying code.

After implementation, write a Walkthrough to `../opskitpro-ops/.ai/walkthroughs/YYYY-MM-DD-phase-name.md`, then update `../opskitpro-ops/.ai/current_state.md` and `../opskitpro-ops/.ai/session_log.md`.

Do not rely on Antigravity chat memory as the only project memory. Project memory must live in Git-tracked files under `../opskitpro-ops/.ai/`.
