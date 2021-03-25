const path = require('path');
const fs = require('fs');
const util = require('util');
const Promise = require('bluebird');
const configUtils = require('./config-utils.js');

const readdir = util.promisify(fs.readdir);
const exists = util.promisify(fs.exists);

describe('config tests', () => {
    beforeAll(async () => {
        jest.setTimeout(10000);
    });

    async function getAllConfigDirectories() {
        const results = [];
        const topLevelPath = `${__dirname}/../../../`;
        const promises = [];
        for (const dir of ['packages', 'services']) {
            const subdirs = await readdir(path.join(topLevelPath, dir));
            for (const subdir of subdirs) {
                const configPath = path.join(topLevelPath, dir, subdir, 'config');
                promises.push(
                    exists(path.join(configPath, 'configschema.json')).then(exist => {
                        if (exist) {
                            results.push(configPath);
                        }
                    })
                );
            }
        }
        await Promise.all(promises);
        return results;
    }

    it('load and validate all configurations', async () => {
        const promises = [];
        for (const configDir of await getAllConfigDirectories()) {
            // Make sure that the default configuration is valid.
            const config = configUtils.loadConfig(configDir, /* validate */ true);
            // Make sure that all the config override files in the same subdirectory are also valid.
            promises.push(
                readdir(configDir).then(overrideFiles => {
                    for (const envFile of overrideFiles) {
                        if (envFile === 'configschema.json' || !envFile.endsWith('.json')) {
                            continue;
                        }
                        config.loadFile(path.join(configDir, envFile));
                        config.validate({ allowed: 'strict' });
                    }
                })
            );
        }
        await Promise.all(promises);
    });

    it('check for config file names', async () => {
        const allowedConfigFilenames = new Set([
            'configschema.json',
            'dev.json',
            'dev_us-east-1.json',
            'dev_us-east-1_full-dr.json',
            'local.json',
            'localrun.json',
            'localrun-localstack.json',
            'localrun-sam.json',
            'test.json',
            'production.json',
            'production-free.json',
            'production_us-east-1.json',
            'production_us-east-1_full-dr.json',
        ]);
        let files = [];
        const configDirectories = await getAllConfigDirectories();
        await Promise.map(configDirectories, async configDir => {
            const configFiles = await readdir(configDir);
            for (const f of configFiles) {
                if (f.endsWith('.json')) {
                    files.push(path.join(configDir, f));
                }
            }
        });
        files = new Set(files.map(file => path.basename(file)));
        expect(files).toEqual(allowedConfigFilenames);
    });
});
