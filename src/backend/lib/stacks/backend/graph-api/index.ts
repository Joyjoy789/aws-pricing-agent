import { AmplifyData, AmplifyDataDefinition } from "@aws-amplify/data-construct";
import {
    Duration,
    aws_appsync as appsync,
    aws_cognito as cognito,
    aws_ec2 as ec2,
    aws_logs as logs,
    aws_wafv2 as waf,
    Aws,
} from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import * as path from "path";
import { LabsPythonFunction, LabsPythonLayerVersion } from "../../../common/constructs/lambda";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

interface LabsGraphApiProps {
    vpc?: ec2.Vpc;
    securityGroup?: ec2.SecurityGroup;
    userPool: cognito.UserPool;
    regionalWebAclArn: string;
}

export class LabsGraphApi extends Construct {
    public readonly graphApi: AmplifyData;
    public readonly pythonResolverFunction: LabsPythonFunction;

    constructor(scope: Construct, id: string, props: LabsGraphApiProps) {
        super(scope, id);

        const powerToolsLayer = new LabsPythonLayerVersion(this, "resolver-layer", {
            entry: path.join(__dirname, "..", "..", "..", "common", "layers", "powertools"),
        });

        this.pythonResolverFunction = new LabsPythonFunction(this, "resolver-lambda", {
            functionName: "gql-resolver",
            entry: path.join(__dirname, "resolver-function"),
            handler: "lambda_handler",
            layers: [powerToolsLayer],
            memorySize: 1024,
            timeout: Duration.minutes(5),
            ...(props.vpc && {
                vpc: props.vpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                securityGroups: [props.securityGroup!],
            }),
            environment: {
                CLASSIFIER_MODEL_ID: `arn:aws:bedrock:${Aws.REGION}:${Aws.ACCOUNT_ID}:inference-profile/us.amazon.nova-pro-v1:0`,
            },
        });

        // function permissions
        // add bedrock invoke permissions to resolver lambda
        this.pythonResolverFunction.addToRolePolicy(
            new PolicyStatement({
                actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
                resources: ["*"],
            })
        );

        this.graphApi = new AmplifyData(this, "graphApi", {
            definition: AmplifyDataDefinition.fromFiles(path.join(__dirname, "schema.graphql")),
            authorizationModes: {
                defaultAuthorizationMode: "AMAZON_COGNITO_USER_POOLS",
                userPoolConfig: {
                    userPool: props.userPool,
                },
                iamConfig: {
                    enableIamAuthorizationMode: true,
                },
            },
            logging: {
                fieldLogLevel: appsync.FieldLogLevel.ALL,
                retention: logs.RetentionDays.THREE_MONTHS,
                excludeVerboseContent: false,
            },
            functionNameMap: {
                resolverLambda: this.pythonResolverFunction,
            },
        });
        NagSuppressions.addResourceSuppressions(
            this.graphApi,
            [
                {
                    id: "AwsSolutions-IAM4",
                    reason: "AmplifyGraphqlApi requires the AWSAppSyncPushToCloudWatchLogs policy for logging.",
                },
                {
                    id: "AwsSolutions-S1",
                    reason: "AmplifyGraphqlApi-created buckets do not require server access logs.",
                },
                {
                    id: "AwsSolutions-S10",
                    reason: "AmplifyGraphqlApi-created buckets do not require requests to use SSL.",
                },
            ],
            true
        );

        // environment variables
        this.pythonResolverFunction.addEnvironment("GRAPH_API_URL", this.graphApi.graphqlUrl);
        // gql permissions
        this.graphApi.resources.graphqlApi.grantMutation(this.pythonResolverFunction);
        this.graphApi.resources.graphqlApi.grantQuery(this.pythonResolverFunction);
        this.graphApi.resources.graphqlApi.grantSubscription(this.pythonResolverFunction);

        this.graphApi.resources.cfnResources.cfnGraphqlApi.xrayEnabled = true;
        Object.values(this.graphApi.resources.cfnResources.cfnTables).forEach((table) => {
            table.pointInTimeRecoverySpecification = {
                pointInTimeRecoveryEnabled: true,
            };
        });

        new waf.CfnWebACLAssociation(this, "graphApiWebAclAssociation", {
            resourceArn: this.graphApi.resources.graphqlApi.arn,
            webAclArn: props.regionalWebAclArn,
        });
    }
}
