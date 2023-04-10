import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const { ieeeAddr } = ctx.args;
    return { 
        operation: 'Query',
        query: {
            expression: 'ieeeAddr = :ieeeAddr',
            expressionValues: util.dynamodb.toMapValues({ ':ieeeAddr': ieeeAddr }),
        },
        limit: 10,
        scanIndexForward: false,
        index: "ieeeAddrIndex"
    };
}

export function response(ctx) {
    console.log("ctx.result: " + JSON.stringify(ctx.result));
    return ctx.result.items[0];
}