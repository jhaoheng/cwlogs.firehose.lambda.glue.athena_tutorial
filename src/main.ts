import * as cdk from '@aws-cdk/core';
import { SetS3 } from './s3'
import * as logs from '@aws-cdk/aws-logs';
import { SetFirehose } from './firehose'
import { SetLogDestination } from './logDestination'
import { SetGlue } from './glue'
import { SetLambda } from './lambda'

const LogsFilterPattern = " " // Match everything

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    // tags
    cdk.Tags.of(this).add(
      "Service", cdk.Stack.of(this).stackName
    )

    // s3
    const myS3Stack = new SetS3(this, 'MyS3BucketStack')
    new cdk.CfnOutput(this, "s3bucket-arn", {
      value: myS3Stack.s3bucket.bucketArn,
    })

    // Lambda
    const myLambdaStack = new SetLambda(this, `MyLambda`)
    new cdk.CfnOutput(this, `lambda-arn`, {
      value: myLambdaStack.MyLambdaArn
    })

    // firehose
    const myFirehoseStack = new SetFirehose(this, 'MyFirehoseStack', {
      S3BucketArn: myS3Stack.s3bucket.bucketArn,
      LambdaArn: myLambdaStack.MyLambdaArn,
    })
    new cdk.CfnOutput(this, `firehose-attrArn`, {
      value: myFirehoseStack.myFirehose.attrArn
    })


    // glue
    new SetGlue(this, `MyGlueStack`, {
      S3BucketOfSource: myS3Stack.s3bucket,
      S3PrefixOfSource: myFirehoseStack.S3Prefix,
    })

    
    // logs
    const myLog = new logs.LogGroup(this, 'MyLogGroup', {
      logGroupName: `/aws/${cdk.Stack.of(this).stackName}/logs`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    });
    myLog.addStream(`MyLogGroupTestStream`, {
      logStreamName: "TestSubsctiptionFilter",
    })
    new cdk.CfnOutput(this, `loggroup-arn`, {
      value: myLog.logGroupArn
    })


    // logs destination
    const logDestinationStack = new SetLogDestination(this, `MyLogDestinationStack`, {
      MyFirehose: myFirehoseStack.myFirehose,
      MyLog: myLog,
    })
    new cdk.CfnOutput(this, `logDestination-attrArn`, {
      value: logDestinationStack.LogDestinationArn
    })


    // logs put subscription filter
    myLog.addSubscriptionFilter(`MySubscriptionFilter`, {
      destination: logDestinationStack,
      filterPattern: logs.FilterPattern.allTerms(LogsFilterPattern),
    })


  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new MyStack(app, 'analysis', {
  env: devEnv,
  description: "",
});

app.synth();