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
        scanIndexForward: false,
        limit: 10,
    };
}

/**
 * return a list of scanned todo items
 */
export function response(ctx) {
    return ctx.result.items;
}