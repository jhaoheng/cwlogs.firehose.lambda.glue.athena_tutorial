# Readme

## flow
![flow](./asserts/cwlogs.firehose.lambda.glue.athena_tutorial.svg)

## CMD
- `cdk deploy`

# Firehose, Transform source records with AWS Lambda
- You transform each log event within Lambda func.

# Operation Flow

## 1. Put log event to CWLogs

- GUI
    1. go to Log Group `/aws/analysis/logs`
    2. Create log event `ERROR: hello world`
- AWS CLI
    - `aws logs put-log-events --log-group-name /aws/analysis/logs --log-stream-name TestSubsctiptionFilter --log-events timestamp=$(date +%s000),message='ERROR: hello world'`

![step_1](./asserts/step_1.png)

## 2. Wait the log move into S3 Bucket

- Base on the Firehose's buffer conditions, wait the log file move on the S3 Bucket.
    - Could verify the log file by S3 Select.

![step_2](./asserts/step_2.png)

## 3. Athena, to check the Glue table partition

1. Athena query : `MSCK REPAIR TABLE rawdata;`
2. If fine, should get `Query successful.` response.
    - Jump to STEP_5
3. If Not, will get like `Partitions not in metastore:	rawdata:2021/04/12/03`
    - Go to STEP_4 to update the partition.

![step_3](./asserts/step_3.png)

## 4. Glue, run Crawler: analysis-crawler

1. Run Crawler: analysis-crawler
2. Make sure the `analysis-crawler` is done.

![step_4](./asserts/step_4.png)

## 5. Athena, exec query, to get data from Glue table 

1. Athena query : `SELECT * FROM "analysis_database"."rawdata" limit 10;`
2. If you find the empty value, go to STEP_3 to check the partitions.

![step_5](./asserts/step_5.png)

## 6. (optional) QuickSight

- You could integration QuickSight and Athena
