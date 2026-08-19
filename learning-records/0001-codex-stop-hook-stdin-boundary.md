# Codex Stop hook 的 stdin 边界与 continuation 机制

学习者已澄清一个关键误解：Codex Stop hook 的真实调用由运行时在模型采样外侧完成，运行时把包含 `session_id`、`turn_id`、`cwd`、`model`、`permission_mode` 等字段的 JSON 写入 hook 子进程 stdin；模型在手工 shell 验证中看到的失败，属于普通命令输出或后续事件反馈，不能直接证明真实 hook 参数由模型传错。

**Evidence**：学习者指出“hook 的调用不应该是在模型结束的外侧吗”，并要求结合 Codex 源码和官方手册分析；源码核对显示 `run_turn_stop_hooks` 构造 `StopRequest`，`run_stop` 序列化 `StopCommandInput`，`command_runner` 通过 `stdin.write_all(input_json.as_bytes())` 投递 JSON，而项目脚本 `delivery_guard.py hook-stop` 只读取 `sys.stdin` 中的 `session_id`。

**Implications**：后续教学可以跳过“hook 是脚本回调”的基础解释，直接进入 hook 输入 schema、exit code/JSON 输出协议、Stop block 如何生成 continuation prompt、以及项目本地 guard 脚本如何避免 PowerShell 管道 BOM 和手工复现偏差。
