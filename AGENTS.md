<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Memory Protocol
- ⚠️ 本项目与 `opskitpro-ops` 后端共用全局记忆库；这份记忆同时用于不同仓库、不同 Agent、不同会话之间同步信息。
- 启动时请强制读取相对路径 `../opskitpro-ops/.ai/index.md`，并按其中 Read Order 继续读取权威记忆。
- 至少读取 `../opskitpro-ops/.ai/memory_maintenance.md`、`../opskitpro-ops/.ai/recent_context.md`、`../opskitpro-ops/.ai/current_state.md`、`../opskitpro-ops/.ai/decisions.md` 和 `../opskitpro-ops/.ai/repositories/opskitpro.md`。
- 绝不要在本仓库目录创建 `.ai/` 文件夹。
- 所有任务结束后的日志、决策、风险和下一步，请统一写回 `../opskitpro-ops/.ai/session_log.md`、`../opskitpro-ops/.ai/task_board.md` 或相关 `.ai` 文件，方便下一个 Agent 接手。

## Agent Workflow

For any non-trivial task, first write an Implementation Plan to `../opskitpro-ops/.ai/plans/YYYY-MM-DD-phase-name.md`, then stop and wait for user approval before modifying code.

After implementation, write a Walkthrough to `../opskitpro-ops/.ai/walkthroughs/YYYY-MM-DD-phase-name.md`, then update `../opskitpro-ops/.ai/current_state.md` and `../opskitpro-ops/.ai/session_log.md`.

Do not rely on Antigravity chat memory as the only project memory. Project memory must live in Git-tracked files under `../opskitpro-ops/.ai/`.


## Dry-Run Rule

Any command or script that writes data, sends notifications, deletes files, moves files, changes symlinks, modifies infrastructure, restarts services, deploys releases, or calls external side-effect APIs should support `--dry-run`.

Dry-run mode should validate inputs, compute the planned actions, and print what would happen without making changes.

For AWS CLI commands, preserve the upstream flag spelling when needed. For example, `aws s3 sync` uses `--dryrun`, not `--dry-run`.

For every non-trivial command added or modified, the Implementation Plan must state whether dry-run support is required.
