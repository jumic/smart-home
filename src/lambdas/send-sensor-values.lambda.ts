import * as crypto from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { default as fetch, Request } from "node-fetch";

const { Sha256 } = crypto;
const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT || "";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const query = `mutation AddValue($id: String!, $timestamp: String!, $input: ValueInput!) {
  addValue(id: $id, timestamp: $timestamp, input: $input) {
    __typename
    id
    timestamp
    temperatureValue
  }
}`;

const getQuery = `query GetSensorByIeeeAddr($ieeeAddr: String!) {
  getSensorByIeeeAddr(ieeeAddr: $ieeeAddr) {
    __typename
    id
    name
    ieeeAddr
  }
}`;

type Response = { batchItemFailures: { itemIdentifier: string }[] };

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const records = event.Records;
  const response: Response = { batchItemFailures: [] };

  const promises = records.map(async (record) => {
    try {
      await doWork(record);
    } catch (e) {
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  });

  await Promise.all(promises);

  return response;
};

async function doWork(record: SQSRecord) {
  console.log(`doWork: ${JSON.stringify(record)}`);

  const messgeBody = JSON.parse(record.body);
  const topic: string = messgeBody.topic;
  const measuredValue = messgeBody.data.measuredValue / 100;
  const timestamp = messgeBody.timestamp;
  const ieeeAddr = topic.split("/")[1];
  const id = await getSensorIyByIeeeAddr(ieeeAddr);
  if (!id) {
    console.log(`WARNING: No id found for ieeeAddr ${ieeeAddr}`);
  } else {
    const endpoint = new URL(GRAPHQL_ENDPOINT);

    const variables = {
      id: id,
      timestamp: timestamp,
      input: {
        temperatureValue: measuredValue,
      },
    };

    const signer = new SignatureV4({
      credentials: defaultProvider(),
      region: AWS_REGION,
      service: "appsync",
      sha256: Sha256,
    });

    const requestToBeSigned = new HttpRequest({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: endpoint.host,
      },
      hostname: endpoint.host,
      body: JSON.stringify({ query, variables }),
      path: endpoint.pathname,
    });

    const signed = await signer.sign(requestToBeSigned);
    const request = new Request(GRAPHQL_ENDPOINT, signed);

    let statusCode = 200;
    let body: any;

    try {
      const appSyncResponse = await fetch(request);
      body = await appSyncResponse.json();
      if (body.errors) statusCode = 400;
    } catch (error: any) {
      statusCode = 500;
      body = {
        errors: [
          {
            message: error.message,
          },
        ],
      };
    }
    console.log(`body: ${JSON.stringify(body)}`);
  }
}

async function getSensorIyByIeeeAddr(ieeeAddr: string) {
  const endpoint = new URL(GRAPHQL_ENDPOINT);

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: AWS_REGION,
    service: "appsync",
    sha256: Sha256,
  });

  const requestToBeSigned = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: endpoint.host,
    },
    hostname: endpoint.host,
    body: JSON.stringify({
      query: getQuery,
      variables: {
        ieeeAddr,
      },
    }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(GRAPHQL_ENDPOINT, signed);

  let statusCode = 200;
  let body: any;

  let id: string | undefined;
  const appSyncResponse = await fetch(request);
  body = await appSyncResponse.json();
  if (body.errors) {
    statusCode = 400;
    console.log(`errors: ${JSON.stringify(body)}`);
  } else {
    console.log(`getSensorByIeeeAddr: ${JSON.stringify(body)}`);
    id = body.data.getSensorByIeeeAddr.id;
    console.log(`getSensorByIeeeAddr id: ${id}}`);
  }
  return id ? id : "0";
}
