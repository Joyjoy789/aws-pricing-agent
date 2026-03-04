# AI解决方案架构师面试话术准备

## 一、项目一句话介绍

"这是一个基于Amazon Bedrock的多智能体零售定价系统，通过协调需求预测、竞品分析、利润规则三个专业Agent，实现从数天的人工定价分析到分钟级自动化定价决策的转变。"

---

## 二、架构亮点（面试重点）

### 1. Multi-Agent Orchestration 设计模式

```
用户请求 → Supervisor Agent → [Demand Agent + Web Scraper Agent] → Margin Agent → 最终定价
                  ↓
            ChainAgent串联执行
```

**话术：**
"我采用了Supervisor + Chain的混合编排模式：
- Supervisor Agent负责协调需求预测和竞品分析两个Agent并行工作
- ChainAgent将Supervisor的输出串联到Margin Agent做最终决策
- 这种设计让专业Agent各司其职，同时保证了数据流的完整性"

### 2. 实时通信架构

```
Lambda → GraphQL Mutation → AppSync → WebSocket Subscription → React前端
```

**话术：**
"为了让用户实时看到Agent的思考过程，我设计了基于AppSync Subscription的实时推送机制。每个Agent完成分析后，通过GraphQL Mutation更新DynamoDB，AppSync自动将变更推送到前端，实现了Agent对话的实时可视化。"

### 3. 安全架构设计

**话术：**
"安全是企业级AI应用的核心考量：
- 认证层：Cognito UserPool + IdentityPool实现身份联合
- 网络层：VPC隔离 + Private Subnet + VPC Endpoints避免公网暴露
- 应用层：WAF规则集保护API Gateway和AppSync
- 数据层：S3加密 + DynamoDB PITR备份"

---

## 三、技术选型理由

| 组件 | 选型 | 理由 |
|------|------|------|
| LLM | Claude 3.5 Sonnet | 复杂推理能力强，JSON输出稳定 |
| 编排框架 | multi-agent-orchestrator | AWS开源库，原生支持Supervisor/Chain模式 |
| API | AppSync GraphQL | 原生支持Subscription，实时性好 |
| 前端 | React + CloudScape | AWS设计系统，企业级UI一致性 |
| IaC | CDK TypeScript | 类型安全，可复用Construct |

---

## 四、关键代码设计解读

### Agent Prompt Engineering

**话术：**
"每个Agent的Prompt都遵循统一结构：
1. 角色定义 - 明确Agent职责边界
2. 工作流程 - 步骤化的执行指令
3. 输出Schema - 强制JSON格式，确保下游可解析
4. 验证规则 - 内置数据校验逻辑
5. 错误处理 - 默认值和降级策略"

### Tool Use 设计

**话术：**
"Agent通过Tool实现与外部系统交互：
- `S3_Lookup`: 读取需求预测、竞品数据、利润规则
- `get_local_storage`: Agent间共享中间结果
- `gql_update_*`: 将分析结果写入数据库并触发前端更新

这种设计让Agent专注于推理，数据操作通过Tool标准化。"

---

## 五、业务价值陈述

**话术：**
"这个系统解决了零售定价的三个核心痛点：
1. **效率**：将数天的人工分析压缩到分钟级
2. **一致性**：通过规则引擎确保MAP合规和利润底线
3. **可解释性**：每个定价决策都有完整的推理链路，支持审计"

---

## 六、可能的面试问题

### Q1: 为什么选择Multi-Agent而不是单一Agent？

"单一Agent处理复杂任务时Prompt会过长，导致：
- 上下文窗口压力
- 推理质量下降
- 难以维护和迭代

Multi-Agent让每个Agent专注单一领域，Prompt更精准，输出更可控。"

### Q2: 如何处理Agent之间的数据一致性？

"通过LocalStore实现Agent间的状态共享：
- Demand Agent完成后将结果存入LocalStore
- Web Scraper Agent同样存储结果
- Margin Agent从LocalStore读取两者的输出做最终决策

同时，每个Agent都会通过GraphQL Mutation持久化结果到DynamoDB。"

### Q3: 如何保证定价结果的准确性？

"三层保障机制：
1. **Prompt约束**：强制输出Schema，内置验证规则
2. **业务规则**：Margin Agent应用MAP合规检查和利润底线
3. **人工审核**：置信度低于阈值时标记`requires_review=true`"

### Q4: 系统如何扩展？

"架构天然支持扩展：
- 新增Agent：只需定义Prompt和Tool，注册到Orchestrator
- 新增数据源：添加S3文件或扩展Tool
- 新增业务规则：修改margin_rules.json
- 水平扩展：Lambda自动伸缩，DynamoDB按需容量"

### Q5: 成本如何优化？

"几个关键策略：
- 分类器用Nova Pro（便宜），推理用Claude Sonnet（准确）
- VPC Endpoint避免NAT Gateway流量费
- Lambda按需计费，无闲置成本
- DynamoDB按需模式，适合不可预测的工作负载"

---

## 七、项目演示流程（2分钟版）

1. "这是一个零售定价AI系统，用户选择产品后..."
2. "系统启动三个专业Agent：需求预测、竞品分析、利润计算"
3. "左侧实时显示Agent对话，右侧可视化工作流状态"
4. "最终输出包含建议价格、利润率、合规检查结果"
5. "整个过程从传统数天缩短到2分钟内完成"

---

## 八、技术栈速记

```
前端: React 18 + CloudScape + Amplify + Jotai + React Flow
后端: Lambda Python + [multi-agent-orchestrator](https://github.com/awslabs/multi-agent-orchestrator) + Bedrock
API: AppSync GraphQL + API Gateway REST
数据: DynamoDB + S3
安全: Cognito + WAF + VPC
IaC: CDK TypeScript
```
