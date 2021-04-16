import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';

export interface SetLambdaProps {
}

export class SetLambda extends cdk.Construct {

    public readonly MyLambdaFunc: lambda.Function;
    public readonly MyLambdaArn: string;
    private funcName:string;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.funcName = `${cdk.Stack.of(this).stackName}_firehose_transform`
        
        //
        const role = this.set_role();
        // lambda
        this.MyLambdaFunc = new lambda.Function(this, 'MyLambda', {
            functionName: this.funcName,
            runtime: lambda.Runtime.PYTHON_3_8,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname + '/../', 'lambda-handler/py')),
            role: role,
            memorySize: 128,
            timeout: cdk.Duration.seconds(60),
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
                                "logs:*",
                            ],
                            resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*:*`],
                        }),
                    ],
                }),
            }
        });
    }
}