import cacheHints from "../../rules/cache.rules.js";
import geoHints from "../../rules/geo.rules.js";
import featureHints from "../../rules/feature.rules.js";

export default class SourceModel {
    constructor(source) {
        const headersToReserve = new Set([
            "cache-control",
            ...Object.keys(geoHints),
            ...Object.keys(cacheHints),
            ...Object.keys(featureHints)
        ]);
        try {
            this._data = source.log.entries.map(({
                serverIPAddress,
                request: { url },
                response: { headers },
            }) => ({
                url, ip: serverIPAddress,
                headers: headers.filter(({ name }) => headersToReserve.has(name)),
            }));
        } catch (exc) {
            throw TypeError(`Failed to parse the given HAR file, please check the format.\n${exc.toString()}`);
        }
    }

    get data() {
        if (!this._data) {
            throw SyntaxError("object not fully initialized, call `SourceModel.prototype.init` first");
        }
        return this._data;
    }
};