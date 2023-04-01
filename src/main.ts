import { App, CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";

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
