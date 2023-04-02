/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from "@angular/core";
import API, { graphqlOperation, GraphQLResult } from "@aws-amplify/api-graphql";
import { Observable } from "zen-observable-ts";

export type SensorInput = {
  name: string;
  ieeeAddr: string;
};

export type Sensor = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

export type AddSensorMutation = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

export type UpdateSensorMutation = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

export type DeleteSensorMutation = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

export type GetSensorsQuery = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

@Injectable({
  providedIn: "root"
})
export class APIService {
  async AddSensor(input: SensorInput): Promise<AddSensorMutation> {
    const statement = `mutation AddSensor($input: SensorInput!) {
        addSensor(input: $input) {
          __typename
          id
          name
          ieeeAddr
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <AddSensorMutation>response.data.addSensor;
  }
  async UpdateSensor(
    id: string,
    input: SensorInput
  ): Promise<UpdateSensorMutation> {
    const statement = `mutation UpdateSensor($id: String!, $input: SensorInput!) {
        updateSensor(id: $id, input: $input) {
          __typename
          id
          name
          ieeeAddr
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id,
      input
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateSensorMutation>response.data.updateSensor;
  }
  async DeleteSensor(id: string): Promise<DeleteSensorMutation> {
    const statement = `mutation DeleteSensor($id: String!) {
        deleteSensor(id: $id) {
          __typename
          id
          name
          ieeeAddr
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteSensorMutation>response.data.deleteSensor;
  }
  async GetSensors(): Promise<Array<GetSensorsQuery>> {
    const statement = `query GetSensors {
        getSensors {
          __typename
          id
          name
          ieeeAddr
        }
      }`;
    const response = (await API.graphql(graphqlOperation(statement))) as any;
    return <Array<GetSensorsQuery>>response.data.getSensors;
  }
}
