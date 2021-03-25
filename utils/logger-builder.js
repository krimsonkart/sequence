class LoggerBuilder {
    constructor() {
        this.loggerParams = {};
    }

    withAWSLambdaContext(context = {}) {
        this.loggerParams.reqId = context.awsRequestId;
        this.loggerParams.fnName = context.functionName;
        return this;
    }

    getLoggerParams() {
        return this.loggerParams;
    }

    static newBuilder() {
        return new LoggerBuilder();
    }
}

module.exports = {
    LoggerBuilder,
};
