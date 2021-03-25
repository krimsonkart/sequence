jest.mock('aws-sdk');
const { testUtils } = require('@productiv/core');
const dynamoUtils = require('./dynamodb.js');

jest.mock('delay', () => () => {
    return 'mocked';
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('batch write tests', () => {
    it('persist db entries', async () => {
        const batchWrites = [];
        dynamoUtils.docClient.batchWrite.mockImplementation(request => {
            batchWrites.push(request.RequestItems);
            return { promise: () => Promise.resolve({}) };
        });
        const puts = [];
        for (let n = 0; n < 100; n++) {
            puts.push({ Item: `put-item-${n}` });
        }
        const tableName = `table_${testUtils.randomString()}`;
        await dynamoUtils.persistDbEntries(puts, tableName);
        expect(batchWrites.length).toBe(10); // 4 batches
        for (const batch of batchWrites) {
            expect(batch[tableName].length).toBe(10);
            for (const putRequest of batch[tableName]) {
                expect(putRequest.PutRequest.Item.startsWith('put-item-')).toBe(true);
            }
        }
    });

    it('failed persist db entries', async () => {
        const batchWrites = [];
        dynamoUtils.docClient.batchWrite.mockImplementation(request => {
            batchWrites.push(request.RequestItems);
            // indicate failure on the first request.
            return { promise: () => Promise.resolve({ UnprocessedItems: request.RequestItems }) };
        });
        const puts = [];
        for (let n = 0; n < 100; n++) {
            puts.push({ Item: `put-item-${n}` });
        }

        try {
            await dynamoUtils.persistDbEntries(puts, `table_${testUtils.randomString()}`);
            expect('Error expected').toBe(false);
        } catch (e) {
            expect(e.code === 'BatchWriteItemFailed').toBe(true);
        }
    });

    it('db throttled. retry succeeds', async () => {
        const batchWrites = [];
        let i = 0;
        dynamoUtils.docClient.batchWrite.mockImplementation(request => {
            batchWrites.push(request.RequestItems);
            // indicate failure on the first request.
            if (i === 0) {
                i++;
                return { promise: () => Promise.resolve({ UnprocessedItems: request.RequestItems }) };
            }
            return { promise: () => Promise.resolve({}) };
        });
        const puts = [];
        for (let n = 0; n < 100; n++) {
            puts.push({ Item: `put-item-${n}` });
        }

        await dynamoUtils.persistDbEntries(puts, `table_${testUtils.randomString()}`);
    });
});
