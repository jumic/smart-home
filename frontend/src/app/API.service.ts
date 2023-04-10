/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from "@angular/core";
import API, { graphqlOperation, GraphQLResult } from "@aws-amplify/api-graphql";
import { Observable } from "zen-observable-ts";

export interface SubscriptionResponse<T> {
  value: GraphQLResult<T>;
}

export type __SubscriptionContainer = {
  addedValue: AddedValueSubscription;
};

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

export type ValueInput = {
  temperatureValue: string;
};

export type Value = {
  __typename: "Value";
  id: string;
  timestamp: string;
  temperatureValue: string;
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

export type AddValueMutation = {
  __typename: "Value";
  id: string;
  timestamp: string;
  temperatureValue: string;
};

export type GetSensorsQuery = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

export type GetSensorByIeeeAddrQuery = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

export type GetSensorByIdQuery = {
  __typename: "Sensor";
  id: string;
  name: string;
  ieeeAddr: string;
};

export type GetValuesQuery = {
  __typename: "Value";
  id: string;
  timestamp: string;
  temperatureValue: string;
};

export type AddedValueSubscription = {
  __typename: "Value";
  id: string;
  timestamp: string;
  temperatureValue: string;
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
  async AddValue(
    id: string,
    timestamp: string,
    input: ValueInput
  ): Promise<AddValueMutation> {
    const statement = `mutation AddValue($id: String!, $timestamp: String!, $input: ValueInput!) {
        addValue(id: $id, timestamp: $timestamp, input: $input) {
          __typename
          id
          timestamp
          temperatureValue
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id,
      timestamp,
      input
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <AddValueMutation>response.data.addValue;
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
  async GetSensorByIeeeAddr(
    ieeeAddr: string
  ): Promise<GetSensorByIeeeAddrQuery> {
    const statement = `query GetSensorByIeeeAddr($ieeeAddr: String!) {
        getSensorByIeeeAddr(ieeeAddr: $ieeeAddr) {
          __typename
          id
          name
          ieeeAddr
        }
      }`;
    const gqlAPIServiceArguments: any = {
      ieeeAddr
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetSensorByIeeeAddrQuery>response.data.getSensorByIeeeAddr;
  }
  async GetSensorById(id: string): Promise<GetSensorByIdQuery> {
    const statement = `query GetSensorById($id: String!) {
        getSensorById(id: $id) {
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
    return <GetSensorByIdQuery>response.data.getSensorById;
  }
  async GetValues(id: string): Promise<Array<GetValuesQuery>> {
    const statement = `query GetValues($id: String!) {
        getValues(id: $id) {
          __typename
          id
          timestamp
          temperatureValue
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <Array<GetValuesQuery>>response.data.getValues;
  }
  AddedValueListener(
    id: string
  ): Observable<
    SubscriptionResponse<Pick<__SubscriptionContainer, "addedValue">>
  > {
    const statement = `subscription AddedValue($id: String!) {
        addedValue(id: $id) {
          __typename
          id
          timestamp
          temperatureValue
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    return API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    ) as Observable<
      SubscriptionResponse<Pick<__SubscriptionContainer, "addedValue">>
    >;
  }
}
