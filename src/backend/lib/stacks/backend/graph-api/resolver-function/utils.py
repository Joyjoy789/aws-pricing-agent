import requests
import boto3
from requests.exceptions import RequestException
from typing import List, Dict, Any
from multi_agent_orchestrator.types import ConversationMessage, ParticipantRole
from multi_agent_orchestrator.storage import InMemoryChatStorage
import json
import os
import threading
import time
import asyncio
from gql_utils import gql_executor
from gql import update_pricing


class ModelID:
    NOVA_PRO = "us.amazon.nova-pro-v1:0"
    CLAUDE_3_HAIKU = "us.anthropic.claude-3-haiku-20240307-v1:0"
    CLAUDE_3_SONNET = "us.anthropic.claude-3-sonnet-20240229-v1:0"
    CLAUDE_3_5_SONNET = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"
    CLAUDE_3_7_SONNET = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"


class LocalStore:
    value = {}

    @staticmethod
    def get(tag: str):
        value = LocalStore.value.get(tag)
        print("LocalStore.get() called for", tag)
        if value is None:
            return None
        return value

    @staticmethod
    def set(new_value, tag: str):
        # Check if new_value is a dictionary before setting it
        if isinstance(new_value, dict) or new_value is None:
            LocalStore.value[tag] = new_value
            print("LocalStore.set() called", LocalStore.value)
            return LocalStore.value
        else:
            print(
                f"Warning: Attempted to set non-dictionary value for {tag}. Value type: {type(new_value)}"
            )
            return LocalStore.value


class ThreadManager:
    """
    A utility class to manage a thread that prints its ID periodically.
    """

    def __init__(
        self,
        memory_storage: InMemoryChatStorage = None,
        user_id: str = "",
        session_id: str = "",
        interval=5,
    ):
        """
        Initialize the ThreadManager with a specified interval.

        Args:
            interval (int): Time interval in seconds between thread ID prints
        """
        self.thread = None
        self.interval = interval
        self.memory_storage: InMemoryChatStorage = memory_storage
        self.user_id: str = user_id
        self.session_id: str = session_id
        self.running: bool = False

    def _worker(self):
        """Worker function that runs in the thread and prints the thread ID."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        # get gql values
        gql = LocalStore.get("gql")
        message_count = 0
        while self.running:
            thread_id = threading.get_ident()
            # Run the async function in the event loop
            chats = loop.run_until_complete(
                self.memory_storage.fetch_all_chats(self.user_id, self.session_id)
            )
            try:
                botResponses = []
                for chat in chats:
                    # store the chat messages a json array in botResponses
                    botResponses.append(
                        {
                            "role": chat.role,
                            "content": chat.content,
                        }
                    )

                print("\nbot messages length:", len(botResponses))
                if len(botResponses) > 0 and len(botResponses) != message_count:
                    # print("\nbot messages:", json.dumps(botResponses))
                    response = gql_executor(
                        os.environ["GRAPH_API_URL"],
                        host=gql["host"],
                        auth_token=gql["auth_token"],
                        api_key=None,
                        payload={
                            "query": update_pricing,
                            "variables": {
                                "input": {
                                    "id": self.session_id,
                                    "botResponses": json.dumps(botResponses),
                                }
                            },
                        },
                    )
                    message_count += 1
                    print("\n Chat updated with curr message count: ", message_count)
            except Exception as e:
                print(f"GQL Chat update error: {e}")

            time.sleep(self.interval)

    def start(self):
        """Start the thread if it's not already running."""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._worker)
            self.thread.daemon = True  # Thread will exit when main program exits
            self.thread.start()
            return f"Thread started with ID: {self.thread.ident}"
        return "Thread is already running"

    def stop(self):
        """Stop the thread if it's running."""
        if self.running:
            self.running = False
            if self.thread:
                # Wait for thread to finish
                self.thread.join(timeout=self.interval + 1)
                result = "Thread stopped"
                self.thread = None
                return result
        return "No thread is running"

    def is_running(self):
        """Check if the thread is currently running."""
        return self.running


s3_look_up_tool_description = {
    "toolSpec": {
        "name": "S3_Lookup",
        "description": "Scan an AWS S3 data Bucket and find files matching the file name provided in the prompt.",
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {
                    "fileName": {
                        "type": "string",
                        "description": "name of the file to lookup in AWS S3 data Bucket",
                    }
                },
                "required": ["fileName"],
            }
        },
    }
}

get_local_storage_tool_description = {
    "toolSpec": {
        "name": "get_local_storage",
        "description": "Get data from local storage that stores key value pair JSON objects based on the key supplied.",
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "key of the object",
                    }
                },
                "required": ["key"],
            }
        },
    }
}


def find_string_index(arr, target_string):
    """
    Finds the index of a string in an array that includes/matches a target string.

    Args:
      arr: The array of strings to search.
      target_string: The string to search for.

    Returns:
      The index of the first matching string in the array, or -1 if no match is found.
    """
    for index, string in enumerate(arr):
        if target_string in string:
            return index
    return -1


async def fetch_s3_data(input_data):
    # scan S3 bucket and list all files
    # if file name matches, return the file content
    # else return "File not found"
    print("\nfetch_s3_data", input_data)
    fileName = input_data.get("fileName")
    print("\nfileName", fileName)

    # Get bucket name from project or use a default if not available
    bucket_name = os.environ["DATA_BUCKET"]
    print("\nbucket_name", bucket_name)

    if not bucket_name:
        return "Error: No bucket name provided"

    # scan S3 bucket and list all files
    try:
        # Initialize S3 client
        s3_client = boto3.client("s3")

        # List all objects in the bucket
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix="data")

        # Check if there are contents
        if "Contents" not in response:
            return f"No files found in bucket: {bucket_name}"

        # Extract file names and create a list
        files = [obj["Key"] for obj in response["Contents"]]
        print("\nfiles:", files)

        index = find_string_index(files, fileName)
        print("\nindex:", index)

        # get the file at index and read it
        if index != -1:
            try:
                # Get the specific file content in txt format
                file_obj = s3_client.get_object(Bucket=bucket_name, Key=files[index])
                file_content = file_obj["Body"].read().decode("utf-8")
                # Try to parse as JSON if possible
                return file_content
            except Exception as e:
                print(f"Error fetching file content: {e}")
                return f"Found file {fileName} but couldn't retrieve content: {str(e)}"

        # If a specific filename was provided, filter for it
        else:
            # Return all files if no specific filename was provided
            return f"'{fileName}' not found in bucket"

    except Exception as e:
        print(f"Error accessing S3 bucket: {e}")
        return f"Error accessing S3 bucket: {str(e)}"


async def tool_handler(
    response: ConversationMessage, conversation: List[Dict[str, Any]]
) -> ConversationMessage:
    response_content_blocks = response.content
    print("\ntool_handler", response_content_blocks)
    # Initialize an empty list of tool results
    tool_results = []

    if not response_content_blocks:
        raise ValueError("No content blocks in response")

    for content_block in response_content_blocks:
        if "text" in content_block:
            # Handle text content if needed
            pass

        if "toolUse" in content_block:
            tool_use_block = content_block["toolUse"]
            tool_use_name = tool_use_block.get("name")

            if tool_use_name == "S3_Lookup":
                tool_response = await fetch_s3_data(tool_use_block["input"])
                tool_results.append(
                    {
                        "toolResult": {
                            "toolUseId": tool_use_block["toolUseId"],
                            "content": [{"json": {"result": tool_response}}],
                        }
                    }
                )
            elif tool_use_name == "get_local_storage":
                key = tool_use_block["input"]["key"]
                value = LocalStore.get(key)
                print("\nget_local_storage value", value)
                tool_results.append(
                    {
                        "toolResult": {
                            "toolUseId": tool_use_block["toolUseId"],
                            "content": [{"json": {"result": value}}],
                        }
                    }
                )
            elif tool_use_name == "gql_update_demand_forecast":
                try:
                    tool_input = tool_use_block["input"]
                    print("\ngql_update_demand_forecast query Input", tool_input)
                    # get project values
                    args = LocalStore.get("args")
                    # get gql values
                    gql = LocalStore.get("gql")
                    print("\nGQL", gql)

                    # Create a dictionary with only the keys that exist in tool_input based on new JSON structure
                    forecast_data = {}

                    # Map the new JSON structure fields to the forecast_data dictionary

                    if "current_confidence_score" in tool_input:
                        forecast_data["currentConfidenceScore"] = tool_input[
                            "current_confidence_score"
                        ]
                    if "confidence_p10" in tool_input:
                        forecast_data["confidenceP10"] = tool_input["confidence_p10"]
                    if "confidence_p50" in tool_input:
                        forecast_data["confidenceP50"] = tool_input["confidence_p50"]
                    if "confidence_p90" in tool_input:
                        forecast_data["confidenceP90"] = tool_input["confidence_p90"]
                    if "recommended_price" in tool_input:
                        forecast_data["recommendedPrice"] = tool_input[
                            "recommended_price"
                        ]
                    if "price_floor" in tool_input:
                        forecast_data["priceFloor"] = tool_input["price_floor"]
                    if "price_ceiling" in tool_input:
                        forecast_data["priceCeiling"] = tool_input["price_ceiling"]
                    if "pricing_rationale" in tool_input:
                        forecast_data["pricingRationale"] = tool_input[
                            "pricing_rationale"
                        ]

                    LocalStore.set(forecast_data, "demandForecast")

                    # save the demand forecast data in local storage
                    print("\nDemand Forecast DATA", json.dumps(forecast_data))
                    progress_req = gql_executor(
                        os.environ["GRAPH_API_URL"],
                        host=gql["host"],
                        auth_token=gql["auth_token"],
                        api_key=None,
                        payload={
                            "query": tool_input["gql_query"],
                            "variables": {
                                "input": {
                                    "id": args["sessionID"],
                                    "demandForecast": json.dumps(forecast_data),
                                }
                            },
                        },
                    )
                    print(f"progress_req: {progress_req}")

                except Exception as e:
                    print(f"gql_update_demand_forecast Error: {e}")
                tool_results.append(
                    {
                        "toolResult": {
                            "toolUseId": tool_use_block["toolUseId"],
                            "content": [{"json": {"demandForecast": forecast_data}}],
                        }
                    }
                )

            elif tool_use_name == "gql_update_web_scrap":
                try:
                    tool_input = tool_use_block["input"]
                    print("\ngql_update_web_scrap query Input", tool_input)
                    # get project values
                    args = LocalStore.get("args")
                    # get gql values
                    gql = LocalStore.get("gql")
                    print("\nGQL", gql)

                    # Create a dictionary with only the keys that exist in tool_input based on new JSON structure
                    web_scrap_data = {}

                    # Map the new JSON structure fields to the web_scrap_data dictionary

                    if "lowest_market_price" in tool_input:
                        web_scrap_data["lowestMarketPrice"] = tool_input[
                            "lowest_market_price"
                        ]
                    if "highest_market_price" in tool_input:
                        web_scrap_data["highestMarketPrice"] = tool_input[
                            "highest_market_price"
                        ]
                    if "average_market_price" in tool_input:
                        web_scrap_data["averageMarketPrice"] = tool_input[
                            "average_market_price"
                        ]
                    if "median_market_price" in tool_input:
                        web_scrap_data["medianMarketPrice"] = tool_input[
                            "median_market_price"
                        ]
                    if "primary_competitor" in tool_input:
                        web_scrap_data["primaryCompetitor"] = tool_input[
                            "primary_competitor"
                        ]
                    if "match_confidence_score" in tool_input:
                        web_scrap_data["matchConfidenceScore"] = tool_input[
                            "match_confidence_score"
                        ]
                    if "competitor_price_point" in tool_input:
                        web_scrap_data["competitorPricePoint"] = tool_input[
                            "competitor_price_point"
                        ]
                    if "competitor_shipping_cost" in tool_input:
                        web_scrap_data["competitorShippingCost"] = tool_input[
                            "competitor_shipping_cost"
                        ]
                    if "competitor_total_cost" in tool_input:
                        web_scrap_data["competitorTotalCost"] = tool_input[
                            "competitor_total_cost"
                        ]

                    if "market_position_assessment" in tool_input:
                        web_scrap_data["marketPositionAssessment"] = tool_input[
                            "market_position_assessment"
                        ]
                    if "recommended_base_price" in tool_input:
                        web_scrap_data["recommendedBasePrice"] = tool_input[
                            "recommended_base_price"
                        ]
                    if "recommended_promo_price" in tool_input:
                        web_scrap_data["recommendedPromoPrice"] = tool_input[
                            "recommended_promo_price"
                        ]
                    if "price_position_strategy" in tool_input:
                        web_scrap_data["pricePositionStrategy"] = tool_input[
                            "price_position_strategy"
                        ]
                    if "competitive_advantage" in tool_input:
                        web_scrap_data["competitiveAdvantage"] = tool_input[
                            "competitive_advantage"
                        ]
                    if "pricing_logic_explanation" in tool_input:
                        web_scrap_data["pricingLogicExplanation"] = tool_input[
                            "pricing_logic_explanation"
                        ]

                    LocalStore.set(web_scrap_data, "webScrap")
                    print("\nWeb Scrap DATA", json.dumps(web_scrap_data))
                    # save the demand forecast data in local storage
                    progress_req = gql_executor(
                        os.environ["GRAPH_API_URL"],
                        host=gql["host"],
                        auth_token=gql["auth_token"],
                        api_key=None,
                        payload={
                            "query": tool_input["gql_query"],
                            "variables": {
                                "input": {
                                    "id": args["sessionID"],
                                    "webScrap": json.dumps(web_scrap_data),
                                }
                            },
                        },
                    )
                    print(f"progress_req: {progress_req}")

                except Exception as e:
                    print(f"gql_update_web_scrap: {e}")

                tool_results.append(
                    {
                        "toolResult": {
                            "toolUseId": tool_use_block["toolUseId"],
                            "content": [{"json": {"webScrap": web_scrap_data}}],
                        }
                    }
                )
            elif tool_use_name == "gql_update_margin_analysis":
                try:
                    tool_input = tool_use_block["input"]
                    print("\ngql_update_margin_analysis query Input", tool_input)
                    # get project values
                    args = LocalStore.get("args")
                    # get gql values
                    gql = LocalStore.get("gql")
                    print("\nGQL", gql)

                    # Create a dictionary with only the keys that exist in tool_input based on new JSON structure
                    margin_analysis_data = {}

                    # Map the new JSON structure fields to the margin_analysis_data dictionary
                    if "minimum_price" in tool_input:
                        margin_analysis_data["minimumPrice"] = tool_input[
                            "minimum_price"
                        ]
                    if "maximum_price" in tool_input:
                        margin_analysis_data["maximumPrice"] = tool_input[
                            "maximum_price"
                        ]
                    if "suggested_price" in tool_input:
                        margin_analysis_data["suggestedPrice"] = tool_input[
                            "suggested_price"
                        ]
                    if "calculated_margin" in tool_input:
                        margin_analysis_data["calculatedMargin"] = tool_input[
                            "calculated_margin"
                        ]
                    if "base_margin_rate" in tool_input:
                        margin_analysis_data["baseMarginRate"] = tool_input[
                            "base_margin_rate"
                        ]
                    if "adjusted_margin_rate" in tool_input:
                        margin_analysis_data["adjustedMarginRate"] = tool_input[
                            "adjusted_margin_rate"
                        ]

                    if "margin_adjustments" in tool_input:
                        margin_analysis_data["marginAdjustments"] = tool_input[
                            "margin_adjustments"
                        ]
                    if "feature_adjustments" in tool_input:
                        margin_analysis_data["featureAdjustments"] = tool_input[
                            "feature_adjustments"
                        ]
                    if "volume_adjustment" in tool_input:
                        margin_analysis_data["volumeAdjustment"] = tool_input[
                            "volume_adjustment"
                        ]
                    if "seasonal_adjustment" in tool_input:
                        margin_analysis_data["seasonalAdjustment"] = tool_input[
                            "seasonal_adjustment"
                        ]

                    if "map_price" in tool_input:
                        margin_analysis_data["mapPrice"] = tool_input["map_price"]
                    if "is_map_compliant" in tool_input:
                        margin_analysis_data["isMapCompliant"] = tool_input[
                            "is_map_compliant"
                        ]
                    if "is_margin_compliant" in tool_input:
                        margin_analysis_data["isMarginCompliant"] = tool_input[
                            "is_margin_compliant"
                        ]

                    if "pricing_rationale" in tool_input:
                        margin_analysis_data["pricingRationale"] = tool_input[
                            "pricing_rationale"
                        ]
                    if "margin_explanation" in tool_input:
                        margin_analysis_data["marginExplanation"] = tool_input[
                            "margin_explanation"
                        ]
                    if "adjustment_breakdown" in tool_input:
                        margin_analysis_data["adjustmentBreakdown"] = tool_input[
                            "adjustment_breakdown"
                        ]

                    if "requires_review" in tool_input:
                        margin_analysis_data["requiresReview"] = tool_input[
                            "requires_review"
                        ]

                    # no need to store as there are no other agents downstream to process this
                    # LocalStore.set(margin_analysis_data, "marginAnalysis")
                    print("\nMargin Analysis DATA", json.dumps(margin_analysis_data))
                    # save the margin analysis data in local storage
                    progress_req = gql_executor(
                        os.environ["GRAPH_API_URL"],
                        host=gql["host"],
                        auth_token=gql["auth_token"],
                        api_key=None,
                        payload={
                            "query": tool_input["gql_query"],
                            "variables": {
                                "input": {
                                    "id": args["sessionID"],
                                    "marginAnalysis": json.dumps(margin_analysis_data),
                                }
                            },
                        },
                    )
                    print(f"progress_req: {progress_req}")

                except Exception as e:
                    print(f"gql_update_margin_analysis: {e}")

                tool_results.append(
                    {
                        "toolResult": {
                            "toolUseId": tool_use_block["toolUseId"],
                            "content": [
                                {"json": {"marginAnalysis": margin_analysis_data}}
                            ],
                        }
                    }
                )
            else:
                print(f"Unknown tool name: {tool_use_name}")
                tool_results.append(
                    {
                        "toolResult": {
                            "toolUseId": tool_use_block["toolUseId"],
                            "content": [{"json": {"result": "unknown tool"}}],
                        }
                    }
                )
    # Embed the tool results in a new user message
    print("\nTool Results:", tool_results)
    message = ConversationMessage(role=ParticipantRole.USER.value, content=tool_results)

    return message
