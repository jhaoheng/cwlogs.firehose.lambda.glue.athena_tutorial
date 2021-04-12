import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';

export interface SetS3Props {
}

export class SetS3 extends cdk.Construct {
  public readonly s3bucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    //
    this.s3bucket = new s3.Bucket(this, 'MyBucket', {
      bucketName: `${cdk.Stack.of(this).stackName}-${cdk.Stack.of(this).account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          id: "expired_after_365_days",
          expiration: cdk.Duration.days(365),
        },
      ],
    });
  }
}