import { util } from '@aws-appsync/utils';

/**
 * Performs a scan on the dynamodb data source
 */
export function request(ctx) {
    const { id } = ctx.args;
    return { 
        operation: 'Query',
        query: {
            expression: 'id = :id',
            expressionValues: util.dynamodb.toMapValues({ ':id': id }),
        },
        limit: 1,
    };
}

/**
 * return a list of scanned todo items
 */
export function response(ctx) {
    console.log("ctx.result: " + JSON.stringify(ctx.result));
    return ctx.result.items[0];
}