from gql import (
    update_pricing,
    gql_update_demand_forecast_tool_description,
    gql_update_web_scrap_tool_description,
    gql_update_margin_analysis_tool_description,
)
from utils import (
    LocalStore,
    s3_look_up_tool_description,
    get_local_storage_tool_description,
    ThreadManager,
    tool_handler,
    ModelID,
)
from prompts import (
    DEMAND_FORECAST_AGENT_SYSTEM_PROMPT,
    WEB_SCRAPER_AGENT_SYSTEM_PROMPT,
    SUPERVISOR_AGENT_SYSTEM_PROMPT,
    MARGIN_AGENT_SYSTEM_PROMPT,
)
import os
from botocore.exceptions import ClientError
from multi_agent_orchestrator.agents.supervisor_agent import (
    SupervisorAgent,
    SupervisorAgentOptions,
)

from multi_agent_orchestrator.orchestrator import (
    MultiAgentOrchestrator,
    OrchestratorConfig,
)
from multi_agent_orchestrator.storage import InMemoryChatStorage
from multi_agent_orchestrator.agents import (
    BedrockLLMAgent,
    BedrockLLMAgentOptions,
    AgentResponse,
    ChainAgent,
    ChainAgentOptions,
)

from multi_agent_orchestrator.classifiers import (
    BedrockClassifier,
    BedrockClassifierOptions,
)


class AgentOrchestrator:
    """
    A class to encapsulate the agent orchestration logic, ensuring no global variable issues
    upon reinvocation of the lambda function.
    """

    def __init__(self, logger):
        """
        Initialize the AgentOrchestrator with all necessary components.

        Args:
            logger: Logger instance for logging
        """
        self.logger = logger
        self.memory_storage = InMemoryChatStorage()
        self.llm_agent_model_id = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"

        # Initialize classifier
        self.custom_bedrock_classifier = BedrockClassifier(
            BedrockClassifierOptions(
                model_id=os.environ["CLASSIFIER_MODEL_ID"],
                # model_id=ModelID.CLAUDE_3_HAIKU,
                region=os.environ["AWS_REGION"],
            )
        )

        # Initialize orchestrator
        self.orchestrator = self._create_orchestrator()

        # Initialize agents
        self.demand_forecast_agent = self._create_demand_forecast_agent()
        self.web_scraper_agent = self._create_web_scraper_agent()
        self.lead_agent = self._create_lead_agent()
        self.supervisor_agent = self._create_supervisor_agent()
        self.margin_agent = self._create_margin_agent()
        self.pricing_chain = self._create_pricing_chain()

        # Add agents to orchestrator
        self.orchestrator.add_agent(self.pricing_chain)
        # Thread manager will be initialized per request
        self.thread_mgr = None

    def _create_orchestrator(self):
        """Create and configure the MultiAgentOrchestrator"""
        return MultiAgentOrchestrator(
            # classifier=self.custom_bedrock_classifier,
            logger=self.logger,
            storage=self.memory_storage,
            options=OrchestratorConfig(
                LOG_AGENT_CHAT=True,
                LOG_CLASSIFIER_CHAT=True,
                LOG_CLASSIFIER_RAW_OUTPUT=True,
                LOG_CLASSIFIER_OUTPUT=True,
                LOG_EXECUTION_TIMES=True,
                MAX_RETRIES=3,
                USE_DEFAULT_AGENT_IF_NONE_IDENTIFIED=True,
                MAX_MESSAGE_PAIRS_PER_AGENT=10,
            ),
        )

    def _create_demand_forecast_agent(self):
        """Create and configure the Demand Forecast Agent"""
        return BedrockLLMAgent(
            BedrockLLMAgentOptions(
                model_id=ModelID.CLAUDE_3_5_SONNET,
                name="Demand Forecast Agent",
                description="You are a Demand Forecasting Specialist Agent designed for the retail industry. Your primary function is to analyze historical demand forecast data and predict product price for the supplied product.",
                region=os.environ["AWS_REGION"],
                LOG_AGENT_DEBUG_TRACE=True,
                streaming=False,
                custom_system_prompt={
                    "template": DEMAND_FORECAST_AGENT_SYSTEM_PROMPT,
                    "variables": {"update_pricing_query": update_pricing},
                },
                inference_config={
                    "maxTokens": 1500,
                    "temperature": 0.5,
                    "topP": 0.5,
                    "stopSequences": ["Human:", "AI:"],
                },
                tool_config={
                    "tool": [
                        get_local_storage_tool_description,
                        s3_look_up_tool_description,
                        gql_update_demand_forecast_tool_description,
                    ],
                    "toolMaxRecursions": 5,
                    "useToolHandler": tool_handler,
                },
            )
        )

    def _create_web_scraper_agent(self):
        """Create and configure the Web Scraper Agent"""
        return BedrockLLMAgent(
            BedrockLLMAgentOptions(
                model_id=ModelID.CLAUDE_3_5_SONNET,
                name="Web Scraper Agent",
                description="Analyse the supplied web scrap data for products from competitor websites and come up with competitive pricing for the supplied product.",
                region=os.environ["AWS_REGION"],
                streaming=False,
                custom_system_prompt={
                    "template": WEB_SCRAPER_AGENT_SYSTEM_PROMPT,
                    "variables": {"update_pricing_query": update_pricing},
                },
                inference_config={
                    "maxTokens": 1500,
                    "temperature": 0.5,
                    "topP": 0.5,
                    "stopSequences": ["Human:", "AI:"],
                },
                tool_config={
                    "tool": [
                        get_local_storage_tool_description,
                        s3_look_up_tool_description,
                        gql_update_web_scrap_tool_description,
                    ],
                    "toolMaxRecursions": 5,
                    "useToolHandler": tool_handler,
                },
            )
        )

    def _create_lead_agent(self):
        """Create and configure the Lead Agent"""
        lead_agent = BedrockLLMAgent(
            BedrockLLMAgentOptions(
                model_id=ModelID.CLAUDE_3_SONNET,
                name="Team Lead",
                description="Coordinates specialized team members for determining product pricing. The agent efficiently handles various data formats and applies contextual validation rules to ensure accuracy and reliability of the submitted information.",
                streaming=False,
                region=os.environ["AWS_REGION"],
            )
        )
        lead_agent.set_system_prompt(SUPERVISOR_AGENT_SYSTEM_PROMPT)
        return lead_agent

    def _create_supervisor_agent(self):
        """Create and configure the Supervisor Agent"""
        return SupervisorAgent(
            SupervisorAgentOptions(
                name="Pricing Supervisor",
                description="You are a supervisor agent that manages the team of agents to determine pricing of a retail product.",
                lead_agent=self.lead_agent,
                team=[self.demand_forecast_agent, self.web_scraper_agent],
                storage=self.memory_storage,
                trace=True,
            )
        )

    def _create_margin_agent(self):
        return BedrockLLMAgent(
            BedrockLLMAgentOptions(
                model_id=ModelID.CLAUDE_3_SONNET,
                name="Margin Agent",
                description="You are a Margin Agent that manages the final pricing of a retail product by analyzing the demand forecast & webs ite scrape data.",
                region=os.environ["AWS_REGION"],
                streaming=False,
                custom_system_prompt={
                    "template": MARGIN_AGENT_SYSTEM_PROMPT,
                    "variables": {"update_pricing_query": update_pricing},
                },
                inference_config={"maxTokens": 3500, "temperature": 0.2, "topP": 0.5},
                tool_config={
                    "tool": [
                        get_local_storage_tool_description,
                        s3_look_up_tool_description,
                        gql_update_margin_analysis_tool_description,
                    ],
                    "toolMaxRecursions": 5,
                    "useToolHandler": tool_handler,
                },
            )
        )

    def _create_pricing_chain(self):
        """Create and configure the Pricing Chain Agent"""
        return ChainAgent(
            ChainAgentOptions(
                name="Retail Product pricing orchestrator chain",
                description="A set of agents which determines the product price for the supplied product ",
                default_output="Pricing orchestration faced an issue during processing.",
                agents=[self.supervisor_agent, self.margin_agent],
            )
        )

    def initialize_thread_manager(self, user_id, session_id, interval=5):
        """
        Initialize the thread manager for the current request.

        Args:
            user_id: User ID for the current request
            session_id: Session ID for the current request
            interval: Interval for thread manager in seconds
        """
        self.thread_mgr = ThreadManager(
            memory_storage=self.memory_storage,
            user_id=user_id,
            session_id=session_id,
            interval=interval,
        )
        return self.thread_mgr.start()

    def stop_thread_manager(self):
        """Stop the thread manager"""
        if self.thread_mgr:
            return self.thread_mgr.stop()
        return "No thread manager to stop"

    async def _route_request(self, user_input, user_id, session_id, additional_params):
        """
        Helper method to route requests with retry logic
        """
        return await self.orchestrator.route_request(
            user_input=user_input,
            user_id=user_id,
            session_id=session_id,
            additional_params=additional_params,
        )

    async def trigger_moa(self, args):
        """
        Trigger the Multi-Agent Orchestrator with the given arguments.

        Args:
            args: Dictionary containing request arguments

        Returns:
            Response from the orchestrator
        """
        try:
            # Store args in LocalStore for agents to access
            LocalStore.set(args, "args")

            # Use the retry-enabled route_request method
            response: AgentResponse = await self._route_request(
                user_input="Determine the product price of the supplied product using the Retail Product pricing orchestrator chain",
                user_id=args["userID"],
                session_id=args["sessionID"],
                additional_params={"product": args["product"]},
            )

            # Print metadata
            print("\nMetadata:")
            if response and response.metadata:
                print(f"Selected Agent: {response.metadata}")
            else:
                print("No metadata available")

            print("\nOutput:")
            if response and response.output and response.output.content:
                print(response.output.content)
            else:
                print("No output content available")
            # this response is irrelevant as we rely on GraphQL subscriptions to update front end
            return "done"
        except Exception as e:
            print(f"Error in trigger_moa: {str(e)}")
            raise
