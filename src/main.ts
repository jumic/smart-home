import * as path from "path";
import { App, CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";

import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

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
            defaultAction: appsync.UserPoolDefaultAction.DENY,
          },
        },
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
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const sensorDS = api.addDynamoDbDataSource("sensorDataSource", sensorTable);

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
