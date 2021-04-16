import * as cdk from '@aws-cdk/core';
import * as glue from '@aws-cdk/aws-glue';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';

export interface SetGlueProps {
  S3BucketOfSource: s3.Bucket
  S3PrefixOfSource: string
}

export class SetGlue extends cdk.Construct {

  private s3location: string
  private glueCatalogId: string
  private glueDatabaseName: string
  private glueTableName: string

  constructor(scope: cdk.Construct, id: string, props: SetGlueProps) {
    super(scope, id);
    //
    const myGlueDatabase = new glue.Database(this, 'MyGlueDatabase', {
      databaseName: `${cdk.Stack.of(this).stackName}_database`,
    });
    myGlueDatabase.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
    //
    this.s3location = `s3://${props.S3BucketOfSource.bucketName}/${props.S3PrefixOfSource}`
    this.glueCatalogId = myGlueDatabase.catalogId
    this.glueDatabaseName = myGlueDatabase.databaseName
    this.glueTableName = `rawdata`

    //
    const glue_table = this.set_table()
    //
    this.set_crawler().addDependsOn(glue_table)
  }

  private set_table(): glue.CfnTable {
    //
    const myGlueTable = new glue.CfnTable(this, `MyGlueTable`, {
      catalogId: this.glueCatalogId,
      databaseName: this.glueDatabaseName,
      tableInput: {
        name: this.glueTableName,
        tableType: "EXTERNAL_TABLE",
        parameters: {
          classification: "json",
          has_encrypted_data: false,
          compressionType: "gzip",
          typeOfData: "file",
        },
        storageDescriptor: {
          location: this.s3location,
          compressed: false,
          storedAsSubDirectories: false,
          columns: [
            { name: "messagetype", type: "string" },
            { name: "owner", type: "string" },
            { name: "loggroup", type: "string" },
            { name: "logstream", type: "string" },
            { name: "subscriptionfilters", type: "array<string>" },
            { name: "logevents", type: "array<struct<id:string,timestamp:bigint,message:string>>" },
          ],
          inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
          outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
          serdeInfo: {
            serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
            parameters: {
              "paths": "logEvents,logGroup,logStream,messageType,owner,subscriptionFilters",
              "serialization.format": "1",
            },
          },
        },
        partitionKeys: [
          { name: "year", type: "string" },
          { name: "month", type: "string" },
          { name: "day", type: "string" },
          { name: "hour", type: "string" },
        ],
      },
    })
    return myGlueTable
  }


  private set_crawler(): glue.CfnCrawler {
    const myCrawler = new glue.CfnCrawler(this, 'MyGlueCrawler', {
      name: `${cdk.Stack.of(this).stackName}-crawler`,
      databaseName: this.glueDatabaseName,
      role: this.set_role().roleArn,
      targets: {
        catalogTargets: [
          {
            databaseName: this.glueDatabaseName,
            tables: [
              this.glueTableName
            ],
          }
        ],
      },
      schemaChangePolicy: {
        deleteBehavior: "LOG", // LOG | DELETE_FROM_DATABASE | DEPRECATE_IN_DATABASE
        updateBehavior: "UPDATE_IN_DATABASE", // LOG | UPDATE_IN_DATABASE
      },
      configuration: '{"Version": 1.0, "Grouping": {"TableGroupingPolicy": "CombineCompatibleSchemas"}}',
    });
    return myCrawler
  }

  private set_role(): iam.Role {
    //
    return new iam.Role(this, `MyGlueCrawlerRole`, {
      roleName: `${cdk.Stack.of(this).stackName}_GlueCrawler_Role`,
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(this, `AWSGluePolicy`, "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole")
      ],
      inlinePolicies: {
        S3Policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "s3:GetObject",
                "s3:PutObject"
              ],
              resources: ["*"],
            }),
          ],
        }),
      }
    });
  }

}