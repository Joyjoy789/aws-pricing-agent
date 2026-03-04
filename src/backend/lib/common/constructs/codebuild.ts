import { BuildSpec, Project, ProjectProps } from "aws-cdk-lib/aws-codebuild";
import { Construct } from "constructs";

export class LabsReactProject extends Project {
    constructor(scope: Construct, id: string, props: ProjectProps) {
        super(scope, id, {
            ...props,
            buildSpec: BuildSpec.fromObject({
                version: "0.2",
                phases: {
                    install: {
                        runtimeVersions: {
                            nodejs: "22",
                        },
                        commands: ["npm install"],
                    },
                    build: {
                        commands: ["npm run build"],
                    },
                    post_build: {
                        commands: [
                            'aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"',
                        ],
                    },
                },
                artifacts: {
                    files: ["**/*"],
                    "base-directory": "dist",
                },
            }),
        });
    }
}
