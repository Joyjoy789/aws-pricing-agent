import { Aspects, Stage, StageProps } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { Construct } from "constructs";

import { AppStack } from "./stacks/app";

export class ApplicationStage extends Stage {
    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props);
        new AppStack(this, props.stageName ?? "app", props);
        Aspects.of(this).add(new AwsSolutionsChecks());
    }
}
