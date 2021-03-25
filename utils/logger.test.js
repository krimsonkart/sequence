const {
    error: { ApiClientError },
} = require('@productiv/core');

const logMock = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};
const childMock = {
    fields: {},
    child: jest.fn().mockReturnValue(logMock),
};
const bunyanMock = {
    ...jest.requireActual('bunyan'),
    createLogger: jest.fn().mockReturnValue(childMock),
};
jest.doMock('bunyan', () => bunyanMock);
const logger = require('./logger');

describe('Logger Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.clearAllTimers();
    });

    describe('Logger Class Tests', () => {
        it('Test Logger Class constructor with no params defers to regular stdout', () => {
            // eslint-disable-next-line no-unused-vars
            const loggerClass = new logger.__test_only__.Logger();
            expect(bunyanMock.createLogger).toHaveBeenCalledTimes(1);
            expect(bunyanMock.createLogger).toHaveBeenCalledWith({
                name: 'DefaultLogger',
                streams: [
                    {
                        stream: process.stdout,
                        level: 'debug',
                    },
                ],
                serializers: {
                    err: logger.__test_only__.errSerializer,
                },
            });
            expect(childMock.child).toHaveBeenCalledTimes(1);
            expect(childMock.child).toHaveBeenCalledWith({}, true);
        });
    });

    describe('Logger Usage Tests', () => {
        it('Test logger is initialized correctly', () => {
            logger.initializeLogger(new logger.LoggerBuilder().withCid('cid1').withPid('pid1'));
            expect(logger.__test_only__.Loggers.logger).toBeTruthy();
        });

        it('Test logger log works as expected', () => {
            logger.initializeLogger(new logger.LoggerBuilder().withCid('cid1').withPid('pid1'));
            logger.log('Test log');
            expect(logMock.info).toHaveBeenCalledTimes(1);
            expect(logMock.info).toHaveBeenCalledWith('Test log');
        });

        it('Test logger warn works as expected', () => {
            logger.initializeLogger(new logger.LoggerBuilder().withCid('cid1').withPid('pid1'));
            logger.warn('Warning log');
            expect(logMock.warn).toHaveBeenCalledTimes(1);
            expect(logMock.warn).toHaveBeenCalledWith('Warning log');
        });

        it('Test logger error works as expected', () => {
            logger.initializeLogger(new logger.LoggerBuilder().withCid('cid1').withPid('pid1'));
            logger.error('Error log');
            expect(logMock.error).toHaveBeenCalledTimes(1);
            expect(logMock.error).toHaveBeenCalledWith('Error log');
        });

        it('Test logger debug works as expected', () => {
            logger.initializeLogger(new logger.LoggerBuilder().withCid('cid1').withPid('pid1'));
            logger.debug('This is a debug log');
            expect(logMock.debug).toHaveBeenCalledTimes(1);
            expect(logMock.debug).toHaveBeenCalledWith('This is a debug log');
        });
    });

    describe('Error Serializer Tests', () => {
        it('Test ApiClientError', () => {
            const apiRoute = '/test-route';
            const baseUrl = 'test-service-url';
            const error = new ApiClientError('Some error', apiRoute, baseUrl);
            const object = logger.__test_only__.errSerializer(error);
            expect(object.data).toStrictEqual({ apiRoute, baseUrl });
        });
    });
});
