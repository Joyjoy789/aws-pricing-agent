import os
import json
import time
import asyncio
from aws_lambda_powertools.utilities.data_classes.appsync_resolver_event import (
    AppSyncResolverEvent,
)
from aws_lambda_powertools.logging import Logger, correlation_paths

# Import the new class-based orchestrator
from agent_orchestrator import AgentOrchestrator
from utils import LocalStore
from gql_utils import gql_executor, success_response, failure_response
from gql import update_pricing

# Initialize logger
logger = Logger()

# Create a single instance of the orchestrator
# This will be reused across invocations but with clean state for each request
orchestrator = None


@logger.inject_lambda_context(
    correlation_id_path=correlation_paths.APPSYNC_RESOLVER, log_event=True
)
def lambda_handler(event, context):
    """
    Lambda handler function that processes AppSync resolver events.
    Uses a class-based orchestrator to avoid global variable issues.

    Args:
        event: The event dict from AWS Lambda
        context: The context object from AWS Lambda

    Returns:
        Response from the orchestrator
    """
    global orchestrator
    # re-initialize the orchestrator
    orchestrator = AgentOrchestrator(logger)

    try:
        # Parse the AppSync event
        app_sync_event = AppSyncResolverEvent(event)
        print(app_sync_event)

        # Extract arguments and headers
        arguments = app_sync_event.arguments.get("args")
        host = app_sync_event.request_headers.get("host")
        auth_token = app_sync_event.request_headers.get("authorization")
        api_key = app_sync_event.request_headers.get("x-api-key")

        # Load and augment args with request information
        args = json.loads(arguments)
        args["host"] = host
        args["auth_token"] = auth_token
        args["api_key"] = api_key
        logger.info(args)

        # Store user/project details in LocalStore
        # Note: LocalStore is still used but each request gets fresh data
        LocalStore.set(
            {
                "userID": args["userID"],
                "sessionID": args["sessionID"],
                "product": args["product"],
            },
            "args",
        )

        # Store GraphQL connection details
        LocalStore.set(
            {
                "host": host,
                "auth_token": auth_token,
            },
            "gql",
        )

        # Initialize thread manager for this request
        result = orchestrator.initialize_thread_manager(
            user_id=args["userID"],
            session_id=args["sessionID"],
            interval=5,
        )
        print(result)

        # Run the async function
        response = asyncio.run(orchestrator.trigger_moa(args))

        print("\n** FINAL RESPONSE **")
        print(response)

        response = gql_executor(
            os.environ["GRAPH_API_URL"],
            host=args["host"],
            auth_token=args["auth_token"],
            api_key=None,
            payload={
                "query": update_pricing,
                "variables": {
                    "input": {
                        "id": args["sessionID"],
                        "status": "success",
                    }
                },
            },
        )
        print("\nUpdated success status: ", response)

        # Add a delay to ensure all processing completes
        time.sleep(5)

        # Stop the thread manager
        stop_result = orchestrator.stop_thread_manager()
        print(stop_result)

        return success_response("DONE")

    except Exception as e:
        logger.error(f"Error in lambda handler: {str(e)}")
        response = gql_executor(
            os.environ["GRAPH_API_URL"],
            host=args["host"],
            auth_token=args["auth_token"],
            api_key=None,
            payload={
                "query": update_pricing,
                "variables": {
                    "input": {
                        "id": args["sessionID"],
                        "status": "error",
                    }
                },
            },
        )
        print("\nUpdated error status: ", response)
        return failure_response(f"Error: {str(e)}")
