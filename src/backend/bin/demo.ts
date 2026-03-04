import { App, Aspects } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { AppStack } from "../lib/stacks/app";

const app = new App();

const APP_NAME = app.node.tryGetContext("project_id");

new AppStack(app, APP_NAME ?? "app", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

app.synth();

// Add CDK Nag for infra security
Aspects.of(app).add(new AwsSolutionsChecks());
