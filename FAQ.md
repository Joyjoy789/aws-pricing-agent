# FAQ - 常见问题

## Q1: 为什么使用 multi-agent-orchestrator 而不是 Strands Agents SDK？

### 两者对比

| 特性 | multi-agent-orchestrator | Strands Agents SDK |
|------|--------------------------|-------------------|
| 定位 | 多Agent协调编排 | 通用Agent开发框架 |
| 核心能力 | Supervisor、Chain、Classifier路由 | Tool调用、多模型支持、Agent循环 |
| LLM支持 | 主要 Amazon Bedrock | Bedrock/OpenAI/Anthropic/Gemini/Llama |
| 编排模式 | 内置 SupervisorAgent、ChainAgent | 需自行实现 |
| 成熟度 | 2024年发布，生产稳定 | 2025年发布，功能更丰富 |

### 选型理由

本项目选择 **multi-agent-orchestrator** 的原因：

1. **原生编排支持** - 内置 SupervisorAgent 和 ChainAgent，开箱即用
2. **场景匹配** - 多Agent协作定价正好需要 Supervisor 协调 + Chain 串联
3. **Bedrock深度集成** - BedrockLLMAgent 封装完善，配置简洁
4. **生产验证** - 框架成熟稳定，适合企业级部署

### 何时选择 Strands Agents SDK

- 需要支持多个 LLM 提供商（OpenAI、Anthropic、Gemini）
- 构建单一复杂 Agent 而非多 Agent 协作
- 需要更灵活的 Tool 定义和调用机制
- 希望使用最新的 Agent 开发范式

---

## Q2: 后续开发计划

### Strands Agents 版本 (Roadmap)

我们计划开发基于 **Strands Agents SDK** 的版本，主要改进：

- [ ] 支持多模型提供商切换（OpenAI GPT-4o、Anthropic Claude、Google Gemini）
- [ ] 统一的 Tool 定义接口
- [ ] 更灵活的 Agent 组合方式
- [ ] 本地开发调试支持
- [ ] 成本优化（按场景选择最优模型）

### 版本规划

```
v1.0 (当前) - multi-agent-orchestrator + Bedrock Claude
v2.0 (计划) - Strands Agents SDK + 多模型支持
```

---

## Q3: 如何切换不同的 LLM 模型？

当前版本在 `agent_orchestrator.py` 中配置模型：

```python
class ModelID:
    NOVA_PRO = "us.amazon.nova-pro-v1:0"
    CLAUDE_3_HAIKU = "us.anthropic.claude-3-haiku-20240307-v1:0"
    CLAUDE_3_SONNET = "us.anthropic.claude-3-sonnet-20240229-v1:0"
    CLAUDE_3_5_SONNET = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"
```

修改 Agent 初始化时的 `model_id` 参数即可切换。

---

## Q4: 系统的成本构成？

主要成本项：
- **Bedrock 调用** - 按 token 计费，Claude 3.5 Sonnet 约 $3/M input, $15/M output
- **Lambda** - 按请求数和执行时长计费
- **AppSync** - 按 Query/Mutation 次数计费
- **NAT Gateway** - 按小时和数据传输计费（可通过 VPC Endpoint 优化）

---

## Q5: 如何扩展新的 Agent？

1. 在 `prompts.py` 定义新 Agent 的 System Prompt
2. 在 `agent_orchestrator.py` 创建 Agent 实例
3. 将 Agent 添加到 Supervisor 或 Chain 中
4. 如需新 Tool，在 `utils.py` 中定义 tool_description 和 handler
