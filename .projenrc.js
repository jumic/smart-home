const { awscdk } = require("projen");
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "main",
  name: "smart-home",

  prettier: true,

  buildCommand:
    "cp schema.graphql frontend && cd frontend && amplify codegen && ng build",

  deps: [
    "@aws-crypto/sha256-js",
    "@aws-sdk/credential-provider-node",
    "@aws-sdk/protocol-http",
    "@aws-sdk/signature-v4",
    "node-fetch",
    "@aws-cdk/aws-iot-alpha",
    "@aws-cdk/aws-iot-actions-alpha",
    "@types/aws-lambda",
  ],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();
