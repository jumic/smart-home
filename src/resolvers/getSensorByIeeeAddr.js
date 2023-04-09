import { util } from '@aws-appsync/utils';

/**
 * Performs a scan on the dynamodb data source
 */
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

/**
 * return a list of scanned todo items
 */
export function response(ctx) {
    console.log("ctx.result: " + JSON.stringify(ctx.result));
    return ctx.result.items[0];
}