const AWS = require('aws-sdk');
const delay = require('delay');
const _ = require('lodash');
const retry = require('async-retry');
const Promise = require('bluebird');
const awsConfig = require('./config');
const logger = require('./logger');

const docClientCache = {};
// Retry dynamodb calls for 3 times with fixed backoff
const db = new AWS.DynamoDB({
    ...awsConfig.get('DYNAMODB_CONFIG'),
    maxRetries: 3,
    retryDelayOptions: {
        base: 500,
        customBackoff(retryNumber) {
            return retryNumber * 500;
        },
    },
});
// See https://stackoverflow.com/questions/37479586/nodejs-with-dynamodb-throws-error-attributevalue-may-not-contain-an-empty-strin
const docClient = new AWS.DynamoDB.DocumentClient({ ...awsConfig.get('DYNAMODB_CONFIG'), convertEmptyValues: true });

function getDocClient(awsCredentials) {
    let result = docClient;
    if (awsCredentials) {
        const { RoleArn } = awsCredentials.service.config.params;
        if (!docClientCache[RoleArn]) {
            docClientCache[RoleArn] = new AWS.DynamoDB.DocumentClient({
                ...awsConfig.get('DYNAMODB_CONFIG'),
                convertEmptyValues: true,
                credentials: awsCredentials,
            });
        }
        result = docClientCache[RoleArn];
    }
    return result;
}
async function getNotValidApps(cid) {
    const query = {
        TableName: awsConfig.get('TABLE_NAMES.enterprises'),
        Select: 'ALL_ATTRIBUTES',
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
            '#pk': 'pk',
        },
        ExpressionAttributeValues: { ':pk': `${cid}#p#inv#` },
    };
    const pids = [];
    await queryAllRecords(query, record => pids.push(record));
    return pids;
}

// TODO: Add DBError class and throw Errors of this class rather than random throws or just rethrowing exceptions from AWS
/**
 * Inserts a record in dynamodb, as dictated by the query params. any errors are bubbled up.
 * If you need the response to return the updated/new item,
 *  when action = 'update', set the "ReturnValues" field in the params to 'ALL_NEW/UPDATED_NEW/ALL_OLD/UPDATED_OLD'
 *  when action = 'put', set the "ReturnValues" field in the params to 'ALL_OLD'
 * Documentation: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
 * @param params
 * @param id
 * @param action
 * @returns {Promise<*>}
 */
function persistUniqueDbEntry(params, id, action = 'put', awsCredentials) {
    const documentClient = getDocClient(awsCredentials);
    switch (action) {
        case 'put':
            return documentClient.put(params).promise();
        case 'update':
            return documentClient.update(params).promise();
        default:
            throw new Error(`unknown action: ${action}`);
    }
}

// suppresses ConditionalCheckFailedException
async function persistDbEntry(params, id, action = 'put', { awsCredentials } = {}) {
    try {
        return await persistUniqueDbEntry(params, id, action, awsCredentials);
    } catch (err) {
        if (err.code !== 'ConditionalCheckFailedException') {
            logger.error({ err, params }, `Unable to persist entry`);
            throw err;
        }
        return null;
    }
}

/**
 * Queries dynamo with the given query. If startKey is specified, sets it as
 * the ExclusiveStartKey parameter in the call (indicates the start (excluded) of the next page of data).
 * @param dbQueryParams
 * @param startKey
 * @param timeout Amount of time to wait for one query. If retries > 0, then total duration of this function
 *     may be more than timeout.
 * @param retries Number of retries in case of failure or timeout.
 * @returns {Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>>}
 */
function queryAll(dbQueryParams, startKey, { timeout = 10000, retries = 2 } = {}) {
    if (startKey) {
        dbQueryParams.ExclusiveStartKey = startKey;
    }
    return retry(
        () => {
            const promise = docClient.query(dbQueryParams, startKey).promise();
            return timeout > 0 ? Promise.resolve(promise).timeout(timeout, 'Timeout connecting to Dynamo') : promise;
        },
        { retries }
    );
}

async function querySingle(dbQueryParams, { timeout = 10000, retries = 2 } = {}) {
    return retry(
        async () => {
            const dbResultPromise = docClient.query(dbQueryParams).promise();
            const dbResult = await (timeout > 0
                ? Promise.resolve(dbResultPromise).timeout(timeout, 'Timeout connecting to Dynamo')
                : dbResultPromise);
            return dbResult.Count > 0 ? dbResult.Items[0] : undefined;
        },
        { retries }
    );
}

function hasUnprocessedItems(batchWriteResponse) {
    return batchWriteResponse.UnprocessedItems && Object.keys(batchWriteResponse.UnprocessedItems).length;
}

async function persistConditionalUpdates(puts) {
    for (const put of puts) {
        docClient.update(put.params, function() {});
    }
}

async function persistDbEntries(puts, tableName, { awsCredentials } = {}) {
    if (_.isEmpty(puts)) {
        // Nothing to do here.
        return;
    }
    logger.log(`Persisting ${puts.length} records`);
    const batches = _.chunk([...puts], 10); // don't mutate inputs, split in 10s
    for (const [index, batch] of batches.entries()) {
        logger.log({ index }, 'Processing batch');
        const batchWriteRequest = { RequestItems: { [tableName]: [] } };
        for (const put of batch) {
            batchWriteRequest.RequestItems[tableName].push({ PutRequest: { Item: put.Item } });
        }
        let batchWriteResponse;
        let itemsToProcess = batchWriteRequest;
        let retryCount = 0;

        do {
            if (retryCount === 3) {
                // no dice after three tries. Bail
                const err = new Error(
                    `Failure to write entire batch for ${tableName}:${JSON.stringify(batchWriteResponse)}`
                );
                err.code = 'BatchWriteItemFailed';
                throw err;
            }
            if (retryCount > 0) {
                const delayMs = retryCount * 2000;
                const result = await delay(delayMs, { value: `retrying after ${delayMs} ms` });
                logger.info(result);
            }
            batchWriteResponse = await getDocClient(awsCredentials)
                .batchWrite(itemsToProcess)
                .promise();
            itemsToProcess = { RequestItems: batchWriteResponse.UnprocessedItems };
            retryCount++;
        } while (hasUnprocessedItems(batchWriteResponse));
    }
}

async function batchGetDbEntries(getRequests, tableName) {
    if (_.isEmpty(getRequests)) {
        return [];
    }

    let entries = [];

    // max batch size for retrieving entries is 100, per AWS
    const batches = _.chunk([...getRequests], 100);
    for (const batch of batches) {
        const params = {
            RequestItems: {},
        };
        params.RequestItems[tableName] = {
            Keys: batch,
        };
        const response = await docClient.batchGet(params).promise();
        entries = entries.concat(response.Responses[tableName]);
    }

    return entries;
}

async function batchDeleteDbEntries(deleteRequests, tableName) {
    if (_.isEmpty(deleteRequests)) {
        // Nothing to do here.
        return;
    }
    const batches = _.chunk([...deleteRequests], 20); // don't mutate inputs, split in 20s
    for (const batch of batches) {
        const batchDeleteRequest = { RequestItems: { [tableName]: [] } };
        for (const deleteReqs of batch) {
            batchDeleteRequest.RequestItems[tableName].push(deleteReqs);
        }
        let batchDeleteResponse;
        let itemsToProcess = batchDeleteRequest;
        let retryCount = 0;

        do {
            if (retryCount === 3) {
                // no dice after three tries. Bail
                const err = new Error(
                    `Failure to delete entire batch for ${tableName}:${JSON.stringify(batchDeleteResponse)}`
                );
                err.code = 'BatchWriteItemFailed';
                err.unprocessed = batchDeleteResponse.UnprocessedItems;
                throw err;
            }
            if (retryCount > 0) {
                const result = await delay(200, { value: 'retrying after 200 ms' });
                logger.info(result);
            }
            batchDeleteResponse = await docClient.batchWrite(itemsToProcess).promise();
            itemsToProcess = { RequestItems: batchDeleteResponse.UnprocessedItems };
            retryCount++;
        } while (hasUnprocessedItems(batchDeleteResponse));
    }
}

/**
 * Fetch all records for the given query and process one page at a time
 * @param query
 * @param processorFn {Function} Synchronous function that runs over all records.
 */
async function queryAllRecords(query, processorFn) {
    if (!processorFn) {
        throw new Error('Processor Function is mandatory!!');
    }
    let startKey;
    do {
        // Fetch one page of records and process the page
        const response = await queryAll(query, startKey);
        if (Array.isArray(response.Items)) {
            for (const item of response.Items) {
                processorFn(item); // Do not await
            }
        }
        startKey = response.LastEvaluatedKey;
    } while (startKey);
}

function getDynamoJsonConverter() {
    return AWS.DynamoDB.Converter;
}

/**
 * Do not use outside of customer deletion since it is an expensive operation. For the given params, scan through dynamo.
 * @param params
 * @returns {Promise<PromiseResult<DynamoDB.ScanOutput, AWSError>>}
 */
function scan(params) {
    return db.scan(params).promise();
}

const __scripts_only__ = {
    scan,
};

module.exports = {
    __scripts_only__,
    db,
    docClient,
    getDynamoJsonConverter,
    persistConditionalUpdates,
    persistUniqueDbEntry,
    persistDbEntry,
    queryAll,
    queryAllRecords,
    querySingle,
    persistDbEntries,
    getNotValidApps,
    batchGetDbEntries,
    batchDeleteDbEntries,
};
