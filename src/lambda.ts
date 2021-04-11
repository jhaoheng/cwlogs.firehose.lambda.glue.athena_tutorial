import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
import * as logs from '@aws-cdk/aws-logs';

export interface SetLambdaProps {
}

export class SetLambda extends cdk.Construct {

    public readonly MyLambdaFunc: lambda.Function;
    public readonly MyLambdaArn: string;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        const role = this.set_role();

        // lambda
        this.MyLambdaFunc = new lambda.Function(this, 'MyLambda', {
            functionName: `${cdk.Stack.of(this).stackName}_transform_cwlogs`,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname + '/../', 'lambda-handler')),
            role: role,
            memorySize: 128,
            timeout: cdk.Duration.seconds(60),
            logRetention: logs.RetentionDays.ONE_WEEK,
            logRetentionRole: role,
        });
        this.MyLambdaArn = this.MyLambdaFunc.functionArn
    }

    //
    private set_role(): iam.Role {
        //
        return new iam.Role(this, `${cdk.Stack.of(this).stackName}_Lambda_Role`, {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                LogsPolicies: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [
                                "logs:CreateLogGroup",
                            ],
                            resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                            ],
                            resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/${cdk.Stack.of(this).stackName}:*`],
                        }),
                    ],
                }),
            }
        });
    }
}