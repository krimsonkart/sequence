const bunyan = require('bunyan');
const awsConfig = require('./config');
const { LoggerBuilder } = require('./logger-builder');

class Logger {
    constructor(builder, loggerName) {
        // More info about params here: https://github.com/trentm/node-bunyan
        const bunyanLogger = bunyan.createLogger({
            name: loggerName || 'DefaultLogger',
            streams: [
                {
                    stream: process.stdout,
                    level: awsConfig.get('LOG_LEVEL'), // Defaults to debug, on production set to info
                },
            ],
            serializers: { err: errSerializer },
        });
        // Remove unnecessary default logger fields
        if (!loggerName) {
            delete bunyanLogger.fields.name;
        }
        delete bunyanLogger.fields.hostname;
        delete bunyanLogger.fields.pid;

        // Add fields from builder
        const params = (builder && builder.getLoggerParams()) || {};
        return bunyanLogger.child(params, true);
    }
}

const Loggers = {};

function initializeLogger(builder, loggerName) {
    Loggers.logger = new Logger(builder, loggerName);
}

function getLogger() {
    if (!Loggers.logger) Loggers.logger = new Logger();
    return Loggers.logger;
}

function log(...args) {
    getLogger().info(...args);
}

function info(...args) {
    getLogger().info(...args);
}

function warn(...args) {
    getLogger().warn(...args);
}

function error(...args) {
    console.error(...args);
    getLogger().error(...args);
}

function debug(...args) {
    getLogger().debug(...args);
}

function trace(...args) {
    getLogger().trace(...args);
}

// wrapper around bunyan error serializer to include data, provided by packages/core/src/error/api-client-error.js
function errSerializer(err) {
    return bunyan.stdSerializers.err(err);
}

const __test_only__ = {
    Logger,
    Loggers,
    errSerializer,
};

module.exports = {
    initializeLogger,
    log,
    info,
    warn,
    error,
    debug,
    trace,
    Logger,
    LoggerBuilder,
    __test_only__,
};
