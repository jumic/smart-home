import * as path from "path";
import * as actions from "@aws-cdk/aws-iot-actions-alpha";
import * as iot from "@aws-cdk/aws-iot-alpha";
import { App, CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";

import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

import { OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdaSource from "aws-cdk-lib/aws-lambda-event-sources";

import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { SendSensorValuesFunction } from "./lambdas/send-sensor-values-function";

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolDomain = userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        domainPrefix: "smart-home-dev",
      },
    });

    const bucket = new s3.Bucket(this, "Destination", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const oai = new OriginAccessIdentity(this, "OriginAccessIdentity");
    bucket.grantRead(oai);

    // Handles buckets whether or not they are configured for website hosting.
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity: oai,
        }),
      },
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: "/index.html",
        },
      ],
    });
    new CfnOutput(this, "DistributionDomainName", {
      value: `https://${distribution.distributionDomainName}`,
    });

    const userPoolClient = userPool.addClient("UserPoolClientFrontend", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PHONE,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.COGNITO_ADMIN,
        ],
        callbackUrls: [
          "http://localhost:4200",
          `https://${distribution.distributionDomainName}`,
        ],
        logoutUrls: [
          "http://localhost:4200",
          `https://${distribution.distributionDomainName}`,
        ],
      },
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolWebClientId", {
      value: userPoolClient.userPoolClientId,
    });

    const api = new appsync.GraphqlApi(this, "Api", {
      name: "Smart Home API",
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, "../schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.IAM,
          },
        ],
      },
      xrayEnabled: true,
      logConfig: {
        retention: RetentionDays.ONE_WEEK,
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [
        s3deploy.Source.asset("./frontend/dist/smart-home-frontend"),
        s3deploy.Source.jsonData("frontend-config.json", {
          frontendUrl: `https://${distribution.distributionDomainName}`,
          region: Stack.of(this).region,
          userPoolId: userPool.userPoolId,
          userPoolWebClientId: userPoolClient.userPoolClientId,
          cognitoDomain: `${userPoolDomain.domainName}.auth.${
            Stack.of(this).region
          }.amazoncognito.com`,
          appsyncEndpoint: api.graphqlUrl,
        }),
      ],
      destinationBucket: bucket,
      distribution,
    });

    const userPoolUser = new cognito.CfnUserPoolUser(this, "UserPoolUser", {
      userPoolId: userPool.userPoolId,
      username: "julian",
      userAttributes: [
        {
          name: "email",
          value: "mail@julianmichel.de",
        },
        {
          name: "email_verified",
          value: "True",
        },
      ],
    });

    const groupAdmin = new cognito.CfnUserPoolGroup(
      this,
      "UserPoolGroupAdmin",
      {
        groupName: "Admin",
        userPoolId: userPool.userPoolId,
      }
    );

    const userAdminGroupAssignment =
      new cognito.CfnUserPoolUserToGroupAttachment(this, "UserJulianAdmin", {
        username: "julian",
        groupName: "Admin",
        userPoolId: userPool.userPoolId,
      });
    userAdminGroupAssignment.addDependency(userPoolUser);
    userAdminGroupAssignment.addDependency(groupAdmin);

    const sensorTable = new dynamodb.Table(this, "SensorTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    sensorTable.addGlobalSecondaryIndex({
      indexName: "ieeeAddrIndex",
      partitionKey: {
        name: "ieeeAddr",
        type: dynamodb.AttributeType.STRING,
      },
    });

    const valuesTable = new dynamodb.Table(this, "ValuesTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "timestamp",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const sensorDS = api.addDynamoDbDataSource("sensorDataSource", sensorTable);
    const valuesDS = api.addDynamoDbDataSource(
      "sensorValuesSource",
      valuesTable
    );

    sensorDS.createResolver("QueryGetSensorsResolver", {
      typeName: "Query",
      fieldName: "getSensors",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    sensorDS.createResolver("MutationAddSensorResolver", {
      typeName: "Mutation",
      fieldName: "addSensor",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition("id").auto(),
        appsync.Values.projecting("input")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    sensorDS.createResolver("MutationUpdateSensorResolver", {
      typeName: "Mutation",
      fieldName: "updateSensor",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition("id").is("id"),
        appsync.Values.projecting("input")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    sensorDS.createResolver("MutationDeleteSensorResolver", {
      typeName: "Mutation",
      fieldName: "deleteSensor",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbDeleteItem(
        "id",
        "id"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    valuesDS.createResolver("MutationAddValueResolver", {
      typeName: "Mutation",
      fieldName: "addValue",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition("id")
          .is("id")
          .sort("timestamp")
          .is("timestamp"),
        appsync.Values.projecting("input")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    const getValuesFunc = valuesDS.createFunction("GetValuesFunction", {
      name: "getValues",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("src/resolvers/getValues.js"),
    });

    const pipelineReqResCode = appsync.Code.fromInline(`
      export function request(ctx) {
        return {}
      }

      export function response(ctx) {
        return ctx.prev.result
      }
    `);

    new appsync.Resolver(this, "PipelineResolver", {
      api,
      typeName: "Query",
      fieldName: "getValues",
      code: pipelineReqResCode,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getValuesFunc],
    });

    const getSensorById = sensorDS.createFunction("GetSensorById", {
      name: "getSensorById",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("src/resolvers/getSensorById.js"),
    });

    const getSensorByIeeeAddr = sensorDS.createFunction("GetSensorByIeeeAddr", {
      name: "getSensorByIeeeAddr",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("src/resolvers/getSensorByIeeeAddr.js"),
    });

    new appsync.Resolver(this, "GetSensorByIeeeAddrPipelineResolver", {
      api,
      typeName: "Query",
      fieldName: "getSensorByIeeeAddr",
      code: pipelineReqResCode,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getSensorByIeeeAddr],
    });

    new appsync.Resolver(this, "GetSensorByIdPipelineResolver", {
      api,
      typeName: "Query",
      fieldName: "getSensorById",
      code: pipelineReqResCode,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getSensorById],
    });

    const sendSensorValuesFunction = new SendSensorValuesFunction(
      this,
      "SendSensorValuesFunction",
      {
        environment: {
          API_ENDPOINT: api.graphqlUrl,
        },
        memorySize: 512,
      }
    );

    api.grantMutation(sendSensorValuesFunction);
    api.grantQuery(sendSensorValuesFunction);

    const myQueue = new sqs.Queue(this, "MyQueue");

    const topicRule = new iot.TopicRule(this, "TopicRule", {
      sql: iot.IotSql.fromStringAsVer20160323(
        "SELECT * as data, topic() as topic, timestamp() as timestamp FROM 'zigbee/+/attributeReport/1/msTemperatureMeasurement'"
      ),
    });
    topicRule.addAction(new actions.SqsQueueAction(myQueue));

    const eventSource = new lambdaSource.SqsEventSource(myQueue);
    sendSensorValuesFunction.addEventSource(eventSource);
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, "smart-home-dev", { env: devEnv });
// new MyStack(app, 'smart-home-prod', { env: prodEnv });

app.synth();
