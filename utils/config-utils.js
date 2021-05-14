const convict = require('convict');
const convict_format_with_validator = require('convict-format-with-validator');
const fs = require('fs');
const path = require('path');
const isURL = require('validator/lib/isURL');
const json5 = require('json5');

// "email", "ipaddress" or "url" format
convict.addFormats(convict_format_with_validator);
// for configuration file in JSON5 format (i.e. with comments, etc.).
convict.addParser({ extension: 'json', parse: json5.parse });

// Add the 'endpoint' format for AWS endpoint config.
// Used to make sure that an endpoint must either be null or a valid URL.
convict.addFormat({
    name: 'endpoint',
    validate(val) {
        if (val === null) {
            return;
        }
        if (val.length === 0 || !isURL(val, { require_tld: false })) {
            throw new Error('must be null or a valid, non-empty URL');
        }
    },
});

// Loads the configuration from a given config directory.
// The schema is expected to be named configschema.json under the configDir directory.
// Environment specific override files are expected to be named production.json, dev.json,
// Environment region specific override files are expected to be named production_{region}.json, dev_{region}.json
// localrun.json, and test.json under the configDir directory.
function loadConfig(configDir, validate = false) {
    const config = convict(path.resolve(configDir, 'configschema.json'));
    if (validate) {
        // Validate that the default values are valid in the given schema.
        // Note that the default values may be overridden later, but we still
        // want to ensure that they are valid.
        config.validate({ allowed: 'strict' });
    }

    // load environment specific config, by default points to us-west-2
    const environment = process.env.NODE_ENV;
    const envConfigFilePath = path.resolve(configDir, `${environment}.json`);
    loadConfigFileIfExists(envConfigFilePath, config, validate);

    // load environment region specific config
    const region = process.env.REGION;
    if (region && region !== 'us-west-2') {
        const envRegionConfigFilePath = path.resolve(configDir, `${environment}_${region}.json`);
        loadConfigFileIfExists(envRegionConfigFilePath, config, validate);
    }
    return config;
}

function loadConfigFileIfExists(filePath, config, validate) {
    if (fs.existsSync(filePath)) {
        config.loadFile(filePath);
        if (validate) {
            // Some config values may have been overridden. Validate again to make
            // sure they are still valid.
            config.validate({ allowed: 'strict' });
        }
    }
}

module.exports = {
    loadConfig,
};
