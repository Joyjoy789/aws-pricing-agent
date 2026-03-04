update_pricing = """
mutation UpdatePricing(
  $input: UpdatePricingInput!
  $condition: ModelPricingConditionInput
) {
  updatePricing(input: $input, condition: $condition) {
    id
    userId
    product
    demandForecast
    webScrap
    marginAnalysis
    botResponses
    createdAt
    updatedAt
    __typename
  }
}
"""

gql_update_demand_forecast_tool_description = {
    "toolSpec": {
        "name": "gql_update_demand_forecast",
        "description": "Perform a GraphQL mutation operation with the supplied demand forecast data.",
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {
                    "gql_query": {
                        "type": "string",
                        "description": "A GraphQL mutation query with input, conditions & response JSON object structure",
                    },
                    "recommended_price": {
                        "type": "number",
                        "description": "Recommended optimal price point based on demand analysis",
                    },
                    "price_floor": {
                        "type": "number",
                        "description": "Minimum recommended price point",
                    },
                    "price_ceiling": {
                        "type": "number",
                        "description": "Maximum recommended price point",
                    },
                    "pricing_rationale": {
                        "type": "string",
                        "description": "Explanation of the pricing recommendation logic",
                    },
                    "current_confidence_score": {
                        "type": "number",
                        "description": "Confidence score for current demand (0-1 scale)",
                    },
                    "confidence_p10": {
                        "type": "number",
                        "description": "10th percentile of demand forecast confidence interval",
                    },
                    "confidence_p50": {
                        "type": "number",
                        "description": "50th percentile (median) of demand forecast confidence interval",
                    },
                    "confidence_p90": {
                        "type": "number",
                        "description": "90th percentile of demand forecast confidence interval",
                    },
                },
                "required": ["gql_query", "recommended_price"],
            }
        },
    }
}

gql_update_web_scrap_tool_description = {
    "toolSpec": {
        "name": "gql_update_web_scrap",
        "description": "Perform a GraphQL mutation operation with the supplied competitive pricing analysis data.",
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {
                    "gql_query": {
                        "type": "string",
                        "description": "A GraphQL mutation query with input, conditions & response JSON object structure",
                    },
                    "lowest_market_price": {
                        "type": "number",
                        "description": "Lowest price found across all competitors",
                        "minimum": 0,
                    },
                    "highest_market_price": {
                        "type": "number",
                        "description": "Highest price found across all competitors",
                        "minimum": 0,
                    },
                    "average_market_price": {
                        "type": "number",
                        "description": "Mean price across all competitors",
                        "minimum": 0,
                    },
                    "median_market_price": {
                        "type": "number",
                        "description": "Median price across all competitors",
                        "minimum": 0,
                    },
                    "primary_competitor": {
                        "type": "string",
                        "description": "Name of the main competing retailer",
                        "minLength": 1,
                    },
                    "match_confidence_score": {
                        "type": "number",
                        "description": "Confidence level of product match (0-100)",
                        "minimum": 0,
                        "maximum": 100,
                    },
                    "competitor_price_point": {
                        "type": "number",
                        "description": "Current price at primary competitor",
                        "minimum": 0,
                    },
                    "competitor_shipping_cost": {
                        "type": "number",
                        "description": "Shipping cost at primary competitor",
                        "minimum": 0,
                    },
                    "competitor_total_cost": {
                        "type": "number",
                        "description": "Total customer cost including shipping at primary competitor",
                        "minimum": 0,
                    },
                    "market_position_assessment": {
                        "type": "string",
                        "description": "Analysis of market positioning",
                        "enum": ["premium", "mid-premium", "mid-range", "value"],
                    },
                    "recommended_base_price": {
                        "type": "number",
                        "description": "Recommended regular price based on competitive analysis",
                        "minimum": 0,
                    },
                    "recommended_promo_price": {
                        "type": "number",
                        "description": "Recommended promotional price point",
                        "minimum": 0,
                    },
                    "price_position_strategy": {
                        "type": "string",
                        "description": "Suggested pricing strategy relative to competition",
                        "enum": [
                            "undercut",
                            "match",
                            "premium_position",
                            "value_leader",
                        ],
                    },
                    "competitive_advantage": {
                        "type": "string",
                        "description": "Key competitive advantage identified",
                        "minLength": 1,
                    },
                    "pricing_logic_explanation": {
                        "type": "string",
                        "description": "Detailed explanation of pricing recommendation logic",
                        "minLength": 50,
                    },
                },
                "required": [
                    "gql_query",
                    "lowest_market_price",
                    "highest_market_price",
                    "average_market_price",
                    "median_market_price",
                    "primary_competitor",
                    "match_confidence_score",
                    "competitor_price_point",
                    "competitor_shipping_cost",
                    "competitor_total_cost",
                    "market_position_assessment",
                    "recommended_base_price",
                    "recommended_promo_price",
                    "price_position_strategy",
                    "competitive_advantage",
                    "pricing_logic_explanation",
                ],
            }
        },
    }
}

gql_update_margin_analysis_tool_description = {
    "toolSpec": {
        "name": "gql_update_margin_analysis",
        "description": "Perform a GraphQL mutation operation with the supplied final pricing boundaries.",
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {
                    "gql_query": {
                        "type": "string",
                        "description": "A GraphQL mutation query with input, conditions & response JSON object structure",
                    },
                    "minimum_price": {
                        "type": "number",
                        "description": "Minimum allowable price point based on margin rules",
                    },
                    "maximum_price": {
                        "type": "number",
                        "description": "Maximum recommended price point based on margin rules",
                    },
                    "suggested_price": {
                        "type": "number",
                        "description": "Optimal price point balancing margin requirements and market factors",
                    },
                    "calculated_margin": {
                        "type": "number",
                        "description": "Actual margin percentage at the suggested price",
                    },
                    "base_margin_rate": {
                        "type": "number",
                        "description": "Standard margin rate for the product category",
                    },
                    "adjusted_margin_rate": {
                        "type": "number",
                        "description": "Margin rate after all adjustments are applied",
                    },
                    "map_price": {
                        "type": "number",
                        "description": "Minimum Advertised Price (MAP) if applicable",
                    },
                    "is_map_compliant": {
                        "type": "boolean",
                        "description": "Indicates if the suggested price complies with MAP requirements",
                    },
                    "is_margin_compliant": {
                        "type": "boolean",
                        "description": "Indicates if the suggested price meets minimum margin requirements",
                    },
                    "pricing_rationale": {
                        "type": "string",
                        "description": "Explanation of the final pricing recommendation",
                    },
                    "margin_explanation": {
                        "type": "string",
                        "description": "Detailed explanation of margin calculations",
                    },
                    "requires_review": {
                        "type": "boolean",
                        "description": "Flag indicating if human review is recommended",
                    },
                },
                "required": [
                    "gql_query",
                    "minimum_price",
                    "maximum_price",
                    "suggested_price",
                    "map_price",
                ],
            }
        },
    }
}
