#!/usr/bin/env node

import {
    CloudFormationClient,
    DescribeStacksCommand,
    Output,
    ListStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { blueBright, bold, greenBright, redBright } from "chalk";
import { executeCommand, freePort } from "./utils";
import { writeFileSync, existsSync, readFileSync } from "fs";
import enquirer from "enquirer";
import * as path from "path";
import * as yaml from "yaml";

const frontendPath = path.join(__dirname, "..", "..", "src", "frontend");

const createLocalServer = async (): Promise<void> => {
    await freePort(3000);

    const command =
        process.platform === "win32" ? "npm run -w frontend dev" : "(npm run -w frontend dev &)";
    await executeCommand(command);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 second delay for serving

    console.log("");
    await enquirer.prompt({
        type: "input",
        name: "continue",
        message: "Press enter to continue...",
    });
    await freePort(3000);
};

const createLocalBuild = async (): Promise<boolean> => {
    console.log(blueBright(`\nBuilding frontend...`));
    try {
        await executeCommand("npm run -w frontend build");
        return true;
    } catch {
        console.error(redBright("\n🛑 Failed to build frontend."));
        return false;
    }
};

const getStackOutputs = async (partialStackName: string): Promise<Output[]> => {
    console.log(blueBright(bold("\nListing all CloudFormation stacks...")));
    try {
        const cfClient = new CloudFormationClient({});
        const command = new ListStacksCommand({});
        const response = await cfClient.send(command);
        const stack = response.StackSummaries?.find((s) => s.StackName?.includes(partialStackName));

        if (!stack) {
            console.error(redBright("\n🛑 Failed to find stack."));
            return [];
        }
        try {
            const cfClient = new CloudFormationClient();
            const command = new DescribeStacksCommand({
                StackName: stack.StackName,
            });
            const response = await cfClient.send(command);
            return response.Stacks?.[0].Outputs ?? [];
        } catch (error) {
            console.error(
                redBright(
                    "\n🛑 Failed to get stack outputs. Make sure the frontendDeploy stack is deployed."
                )
            );
            console.error("\n", error);
        }
    } catch (error) {
        console.error(redBright("\n🛑 Failed to list stacks."));
        console.error("\n", error);
    }
    return [];
};

const createLocalEnvironment = async (stackOutputs: Output[]): Promise<boolean> => {
    console.log(blueBright(bold("\nCreating local environment...")));
    // Create environment file
    const environmentVariables = stackOutputs
        .filter((output) => output.ExportName?.includes("vite-"))
        .map((output) => {
            const key = output.ExportName?.replace(/^.*?(vite-.*)/, "$1")
                .toUpperCase()
                .replace(/-/g, "_");
            return `${key}=${output.OutputValue}`;
        })
        .join("\n");
    try {
        writeFileSync(path.join(frontendPath, ".env"), environmentVariables);
        console.log(greenBright("\nCreated environment file!"));
    } catch {
        console.error(redBright("\n🛑 Failed to create environment file."));
        return false;
    }

    return true;
};

const createGraphQLConfig = async (graphApiId: string): Promise<boolean> => {
    // get region from aws configure
    const region = (await executeCommand("aws configure get region", true)).trim() || "us-west-2";

    console.log(blueBright(bold("\nSetting region to " + region)));

    if (!region) {
        console.error(redBright("\n🛑 Failed to get region."));
        return false;
    }

    const configPath = path.join(frontendPath, ".graphqlconfig.yml");
    let graphqlConfig = {
        projects: {
            "Codegen Project": {
                schemaPath: "schema.json",
                includes: ["src/common/graphql/**/*.ts"],
                extensions: {
                    amplify: {
                        codeGenTarget: "typescript",
                        generatedFileName: "src/common/graphql/types.ts",
                        docsFilePath: "src/common/graphql",
                        region: region,
                        apiId: graphApiId,
                        frontend: "javascript",
                        framework: "react",
                        maxDepth: 2,
                    },
                },
            },
        },
    };
    let successMessage = greenBright("\nCreated GraphQL config file!");
    try {
        if (existsSync(configPath)) {
            graphqlConfig = yaml.parse(readFileSync(configPath, "utf-8"));
            graphqlConfig.projects["Codegen Project"].extensions.amplify.apiId = graphApiId;
            graphqlConfig.projects["Codegen Project"].extensions.amplify.region = region;
            successMessage = greenBright("\nUpdated GraphQL config file!");
        }

        writeFileSync(configPath, yaml.stringify(graphqlConfig));
        console.log(successMessage);
        await executeCommand("npm run -w frontend generate");
        return await createLocalBuild();
    } catch {
        console.error(redBright("\nFailed to generate GraphQL files."));
        return false;
    }
};

const main = async () => {
    const stackOutputs = await getStackOutputs("frontendDeploy");
    console.log(blueBright(bold("\nFound front end deployment stack ...")));
    await createLocalEnvironment(stackOutputs);
    const graphApiId = stackOutputs.find((output) =>
        output.ExportName?.endsWith("codegen-graph-api-id")
    )?.OutputValue;
    if (graphApiId) {
        console.log(greenBright("\nFound graph api id!"));
        if (!(await createGraphQLConfig(graphApiId))) {
            console.error(redBright("\n🛑 Failed to create a GraphQL configurations!"));
            return;
        }
    }

    await createLocalServer();
};

main();
