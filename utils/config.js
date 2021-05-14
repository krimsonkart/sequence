const configUtils = require('./config-utils');

const config = configUtils.loadConfig(`${__dirname}/../config`);

// Add more special overriding logics when running using AWS sam-cli and when
// running within localstack's docker container.
if (process.env.NODE_ENV === 'localrun') {
    if (process.env.AWS_SAM_LOCAL) {
        config.loadFile(`${__dirname}/../config/localrun-sam.json`);
    }
    if (process.env.LOCALSTACK_HOSTNAME) {
        config.loadFile(`${__dirname}/../config/localrun-localstack.json`);
    }
}

module.exports = config;
