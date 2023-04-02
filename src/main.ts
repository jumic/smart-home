import * as path from "path";
import { App, CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";

import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        domainPrefix: "smart-home-dev",
      },
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
        callbackUrls: ["http://localhost:4200"],
        logoutUrls: ["http://localhost:4200"],
      },
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolWebClientId", {
      value: userPoolClient.userPoolClientId,
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
