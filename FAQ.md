# FAQ - 常见问题

## Q1: 为什么使用 multi-agent-orchestrator 而不是其他框架？

### 四大框架对比

| 特性 | multi-agent-orchestrator | Strands SDK | LangChain | LangGraph |
|------|--------------------------|-------------|-----------|-----------|
| 定位 | AWS多Agent编排 | AWS通用Agent | 通用LLM应用框架 | 状态机Agent框架 |
| 核心抽象 | Orchestrator + Agent | Agent + Tool | Chain + Agent | Graph + Node + Edge |
| 多Agent模式 | 内置Supervisor/Chain | Tool调用实现 | AgentExecutor | 图节点编排 |
| 状态管理 | InMemoryChatStorage | MemoryManager | Memory类 | StateGraph（强类型） |
| 流程控制 | 框架内置 | 代码控制 | Chain串联 | **图结构（最灵活）** |
| 条件分支/循环 | ❌ 不支持 | ❌ 需手动 | ❌ 有限 | ✅ 原生支持 |
| 学习曲线 | 低 | 低 | 中 | 高 |
| AWS集成 | ⭐⭐⭐ 原生 | ⭐⭐⭐ 原生 | ⭐⭐ 需配置 | ⭐⭐ 需配置 |

### 选型理由

本项目选择 **multi-agent-orchestrator** 的原因：

1. **原生编排支持** - 内置 SupervisorAgent 和 ChainAgent，开箱即用
2. **场景匹配** - 多Agent协作定价正好需要 Supervisor 协调 + Chain 串联
3. **Bedrock深度集成** - BedrockLLMAgent 封装完善，配置简洁
4. **生产验证** - 框架成熟稳定，适合企业级部署

### 何时选择其他框架？

| 场景 | 推荐框架 |
|------|---------|
| 简单问答/RAG | LangChain 或 Strands |
| 多 Agent 协作（AWS） | multi-agent-orchestrator |
| 复杂流程（条件/循环/人机协作） | **LangGraph** |
| 快速原型 | Strands SDK |
| 需要多 LLM 提供商 | Strands SDK |

### LangGraph 的独特能力

如果需要更复杂的流程控制，LangGraph 是更好的选择：

```
        ┌─────────────┐
        │   START     │
        └──────┬──────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│ Demand Agent│ │Competitor   │  ← 并行执行
└──────┬──────┘ └──────┬──────┘
       └───────┬───────┘
               ▼
       ┌─────────────┐
       │Margin Agent │
       └──────┬──────┘
              │
       ┌──────┴──────┐        ← 条件分支
       ▼             ▼
   [置信度<0.7]  [置信度>=0.7]
       │             │
       ▼             ▼
┌─────────────┐     END
│Human Review │               ← 人机协作
└─────────────┘
```

LangGraph 支持：
- ✅ 条件分支（if-else）
- ✅ 循环（Agent 自我修正）
- ✅ 并行执行
- ✅ 人机协作节点
- ✅ 持久化检查点（可恢复）

---

## Q2: ChainAgent 和 SupervisorAgent 是 AWS 原生提供的吗？

**是的**，都是 [multi-agent-orchestrator](https://github.com/awslabs/multi-agent-orchestrator) 库原生提供：

```python
from multi_agent_orchestrator.agents import ChainAgent, ChainAgentOptions
from multi_agent_orchestrator.agents.supervisor_agent import SupervisorAgent, SupervisorAgentOptions
```

### 内置 Agent 类型

| Agent | 作用 |
|-------|------|
| BedrockLLMAgent | 调用 Bedrock 模型的基础 Agent |
| ChainAgent | 串联多个 Agent，按顺序执行 |
| SupervisorAgent | 协调多个子 Agent 并行/协作 |
| AmazonBedrockAgent | 调用 Bedrock Agent（带 Knowledge Base） |

### Strands SDK 如何实现类似功能？

Strands **没有内置** SupervisorAgent/ChainAgent，需要通过 Tool 机制实现：

```python
from strands import Agent, tool

@tool
def call_demand_agent(product: str) -> str:
    """调用需求分析Agent"""
    agent = Agent(model="bedrock/claude-3-sonnet")
    return agent(f"分析产品需求: {product}")

# Supervisor 通过 Tool 调用子 Agent
supervisor = Agent(
    model="bedrock/claude-3-sonnet",
    tools=[call_demand_agent, call_competitor_agent]
)
```

---

## Q3: Memory 实现细节是什么？

### 本项目的 Memory 架构

```
┌─────────────────────────────────────────────────────┐
│              InMemoryChatStorage                     │
│         (对话历史，按 user_id + session_id)          │
├─────────────────────────────────────────────────────┤
│              LocalStore (自定义)                     │
│         (Agent 间共享状态，如分析结果)               │
└─────────────────────────────────────────────────────┘
```

### InMemoryChatStorage（框架提供）

```python
from multi_agent_orchestrator.storage import InMemoryChatStorage

memory_storage = InMemoryChatStorage()
# 内部结构: Dict[str, List[ConversationMessage]]
# key = "{user_id}#{session_id}#{agent_id}"
```

### LocalStore（本项目自定义）

```python
class LocalStore:
    value = {}  # 全局字典
    
    @staticmethod
    def set(new_value, tag: str):
        LocalStore.value[tag] = new_value
    
    @staticmethod
    def get(tag: str):
        return LocalStore.value.get(tag)
```

**用途**：
- Demand Agent 完成 → `LocalStore.set(result, "demandForecast")`
- Margin Agent 读取 → `LocalStore.get("demandForecast")`

---

## Q4: 后续开发计划

### Strands Agents 版本 (Roadmap)

我们计划开发基于 **Strands Agents SDK** 的版本，主要改进：

- [ ] 支持多模型提供商切换（OpenAI GPT-4o、Anthropic Claude、Google Gemini）
- [ ] 统一的 Tool 定义接口
- [ ] 更灵活的 Agent 组合方式
- [ ] 本地开发调试支持
- [ ] 成本优化（按场景选择最优模型）

### LangGraph 版本 (考虑中)

如果需要更复杂的流程控制：

- [ ] 条件分支（低置信度时人工审核）
- [ ] 循环重试（Agent 自我修正）
- [ ] 检查点恢复（长流程断点续传）

### 版本规划

```
v1.0 (当前) - multi-agent-orchestrator + Bedrock Claude
v2.0 (计划) - Strands Agents SDK + 多模型支持
v3.0 (考虑) - LangGraph + 复杂流程控制
```

---

## Q5: 如何切换不同的 LLM 模型？

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

## Q6: 系统的成本构成？

主要成本项：
- **Bedrock 调用** - 按 token 计费，Claude 3.5 Sonnet 约 $3/M input, $15/M output
- **Lambda** - 按请求数和执行时长计费
- **AppSync** - 按 Query/Mutation 次数计费
- **NAT Gateway** - 按小时和数据传输计费（可通过 VPC Endpoint 优化）

---

## Q7: 如何扩展新的 Agent？

1. 在 `prompts.py` 定义新 Agent 的 System Prompt
2. 在 `agent_orchestrator.py` 创建 Agent 实例
3. 将 Agent 添加到 Supervisor 或 Chain 中
4. 如需新 Tool，在 `utils.py` 中定义 tool_description 和 handler
