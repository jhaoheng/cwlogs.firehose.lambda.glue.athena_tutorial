import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as kinesisfirehose from '@aws-cdk/aws-kinesisfirehose';

export interface SetFirehoseProps {
  S3BucketArn: string;
  LambdaArn: string;
}


export class SetFirehose extends cdk.Construct {
  public readonly myFirehose: kinesisfirehose.CfnDeliveryStream;
  public readonly S3Prefix: string

  constructor(scope: cdk.Construct, id: string, props: SetFirehoseProps) {
    super(scope, id);

    /*
    The firehose save data to s3 prefix path 
    */
    this.S3Prefix = `${cdk.Stack.of(this).stackName}-cwlogs-rawdata/`
    const roleArn = this.set_role().roleArn 
    //
    this.myFirehose = new kinesisfirehose.CfnDeliveryStream(this, 'MyFirehoseStream', {
      deliveryStreamName: `${cdk.Stack.of(this).stackName}_FirehoseStream`,
      deliveryStreamType: "DirectPut",
      extendedS3DestinationConfiguration: {
        bucketArn: props.S3BucketArn,
        prefix: this.S3Prefix,
        errorOutputPrefix: "firehose-error/",
        roleArn: roleArn,
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 1,
        },
        compressionFormat: "GZIP",
        processingConfiguration:{
          enabled: true,
          processors:[
            {
              type: "Lambda",
              parameters:[
                {
                  parameterName: "BufferIntervalInSeconds",
                  parameterValue: "60",
                }, 
                {
                  parameterName: "BufferSizeInMBs",
                  parameterValue: "1",
                }, 
                {
                  parameterName: "LambdaArn",
                  parameterValue: props.LambdaArn,
                }, 
                {
                  parameterName: "NumberOfRetries",
                  parameterValue: "3",
                },
                {
                  parameterName: "RoleArn",
                  parameterValue: roleArn,
                }, 
              ],
            },
          ],
        },
      },
    });

  }

  private set_role(): iam.Role {
    //
    return new iam.Role(this, `MyFirehoseStreamRole`, {
      roleName: `${cdk.Stack.of(this).stackName}_FirehoseStream_Role`,
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        SelfPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "s3:*",
                "lambda:*"
              ],
              resources: ["*"],
            }),
          ],
        }),
      }
    });
  }
}