import { util } from '@aws-appsync/utils';

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

export function response(ctx) {
    return ctx.result.items;
}