# GPT-5.6 Sol Ultra 长程研究：final-v4 最终验收记录

> 验收日期：2026-07-12（Asia/Shanghai）  
> 推荐交付物：[`final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> SHA-256：`8E55035B7FED017801BD60A87410E8AF1EE18495184A582708971F7F49079B11`  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> 结论：**P0=0、P1=0、P2=0；75/75 checklist 与 13/13 No-Go 全部通过，可以交付。**

## 1. 三路独立验收

| 验收轴 | 独立记录 | 结果 | 关键证据 |
|---|---|---|---|
| 官方事实与视觉 | [final-v4 官方/视觉 delta 复验](review-final-v4-official-visual-delta.md) | P0/P1/P2 均为 0；13/13 No-Go | Figure 7 六组值、双页码、persistence 证据归属、Deployment 两图关系、PDF digest 全通过 |
| 当前源码 | [final-v4 源码回归](review-final-v4-code-regression.md) | P0/P1/P2 均为 0 | 五条 token 路径、Goal 条件路径、usage-limit 三态、32 个精确 anchors 无回退 |
| 结构、评测与总验收 | [final-v4 最终验收](review-final-v4-acceptance.md) | 75/75；13/13；P0/P1/P2 均为 0 | Terminal 对照、八项有效性矩阵、16-agent 边界、历史版本、链接与视觉全通过 |

## 2. 机械与结构检查

- final-v4：62,793 字节、618 行。
- 本地 Markdown 引用：77 个，69 个唯一目标，缺失 0，源码行号越界 0。
- 源码 `#L...` anchors：32 个，语义落点与行号范围均通过独立复验。
- Markdown 表：8 个连续表块，列分隔数量全部一致。
- fenced block：2 行边界，形成一个闭合 Mermaid block。
- 风格扫描：第三人称、直呼、对照句式、待办标记、占位文本与 Unicode replacement character 检查均为零命中。
- Mermaid 图明确标注为综合示意图，没有冒充官方架构。

## 3. 视觉与归档完整性

- [`visual-evidence-audit-v3.md`](visual-evidence-audit-v3.md) 已完成 Figure 7、Deployment Simulation 网页 Figure 1、论文 Figure 2 的本地 `view_image` 原图检查。
- System Card PDF 的本地 SHA-1 Base32 为 `RA4R3VP7LW7KHAPTY7X5E2N7RW7NENY2`，与三个 Internet Archive CDX 记录的 digest 完全一致。
- System Card Figure 7 使用 PDF 物理第 20 页（页脚编号 19）渲染；六类点估计在 PDF、最终裁剪和正文三层逐项一致。
- 网页 Figure 1 的官方 SVG 与本地 PNG、论文 Figure 2 的官方 PDF 页与本地裁剪均保存 hash、尺寸和来源。
- 官方 `internaldep.png` 的原始字节因本机网络不可达而未直接取得；最终裁剪来自已验证 PDF payload，报告没有声称两者 byte-identical。

## 4. 历史版本完整性

| 文件 | SHA-256 |
|---|---|
| `draft-v0-evidence-map.md` | `5908642ECC753AF691DD438DD8720C36F7F2700720F5C234821FF1DDEA65EA23` |
| `draft-v1-source-synthesis.md` | `0595A1E866E141B92B5AEEC74D021178ABCBF4DBD99C3A87397B6DC3154190AD` |
| `draft-v2-causal-architecture-and-evals.md` | `2B166E5C620C265E0C8AD88BC6AD852D545A551E44F8E1BCDECFBF411DC2AD76` |
| `draft-v3-reviewed-claim-ledger.md` | `FD56879DA275DAC75B091D919A1BCEA41E185F5B9D11233D1EEA3D8A4603A1FD` |
| `final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `1BDE3F19A2D32FF76C07E74880827CE74C71939BE83B443724BEC9161409A33B` |
| `final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `7122BD2D96CD0FB5D13142D5A1ED3C85F4765F5BD1E3D5C657A6234457B7436E` |
| `final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `DDD4F92ACF514F7E31AB8A7774081EE1280163F4CC191884E75E95822320C61B` |
| `final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `8E55035B7FED017801BD60A87410E8AF1EE18495184A582708971F7F49079B11` |

旧稿与旧 final 均保持独立文件。任何终审修订都进入新版本，没有覆盖前一版本。

## 5. 代码与测试边界

本轮只新增研究 Markdown、视觉资产、官方 PDF/渲染工件与审计记录，没有修改 Rust 源码。未运行 Rust 测试；源码结论来自固定 commit 的实现、SQL、prompt 和既有测试静态复核。工作树中 `codex-rs/prompts/templates/compact/prompt.md` 的工作 blob 与 HEAD blob 均为 `42fae605db8a71cb2becb7b4eabd1de963ccb7a3`，本轮没有内容改动。
