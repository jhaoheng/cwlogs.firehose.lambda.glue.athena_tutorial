import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as kinesisfirehose from '@aws-cdk/aws-kinesisfirehose';

export interface SetLogDestinationProps {
  MyLog: logs.LogGroup
  MyFirehose: kinesisfirehose.CfnDeliveryStream;
}

export class SetLogDestination extends cdk.Resource implements logs.ILogSubscriptionDestination {

  public readonly LogDestinationArn: string;

  constructor(scope: cdk.Construct, id: string, props: SetLogDestinationProps) {
    super(scope, id);

    //
    const destinationName = `${cdk.Stack.of(this).stackName}_Destination`
    const destinationPolicy = `
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow", 
          "Principal" : {"AWS" : "${cdk.Aws.ACCOUNT_ID}"},
          "Action" : "logs:PutSubscriptionFilter", 
          "Resource" : "arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:destination:${destinationName}"
        }
      ]
    }`

    //
    const myLogDestination = new logs.CfnDestination(this, `MyLogDestination`, {
      destinationName: destinationName,
      destinationPolicy: destinationPolicy,
      roleArn: this.set_role().roleArn,
      targetArn: props.MyFirehose.attrArn,
    });
    this.LogDestinationArn = myLogDestination.attrArn
  }

  public bind(_scope: cdk.Construct, _sourceLogGroup: logs.ILogGroup): logs.LogSubscriptionDestinationConfig {
    return { arn: this.LogDestinationArn };
  }

  private set_role(): iam.Role {
    //
    return new iam.Role(this, `MyLogDestinationRole`, {
      roleName: `${cdk.Stack.of(this).stackName}_LogDestination_Role`,
      assumedBy: new iam.ServicePrincipal(`logs.${cdk.Aws.REGION}.amazonaws.com`),
      inlinePolicies: {
        FirehosePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "firehose:*"
              ],
              resources: [
                `arn:aws:firehose:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`
              ],
            }),
          ],
        }),
      }
    });
  }
}