"use strict";
import SourceModel from "./models/source.model.js";
import HostModel from "./models/host.model.js";
import geoHints from "../rules/geo.rules.js";
import cacheHints from "../rules/cache.rules.js";
import featureHints from "../rules/feature.rules.js";
import iata from "../rules/iata.js";

/**
 * Extract all matches from the provided string.
 * @param {string} value
 * @param {string} regex
 * @returns {{pop: Array, geohints: Array}}
 */
const retrieve = (value, regex) => {
    regex = new RegExp(regex, "ig");
    let match, retrievedHints = new Set(), pops = new Set();
    while (match = regex.exec(value)) {
        try {
            pops.add(match[1]);
            match.slice(2,).forEach((hint) => retrievedHints.add(hint.toLowerCase()));
        } catch (exc) { }
    }
    return { pops: Array.from(pops), retrievedHints: Array.from(retrievedHints) };
};

/**
 * Extract geographic hints and cache hints from the given source
 * data to identify CDN providers and geolocate CDN edge servers.
 * @param {SourceModel|Object} source the source data to be parsed
 * @returns {Array<HostModel>}
 */
export default function parse(source) {
    if (!(source instanceof SourceModel)) {
        source = new SourceModel(source);
    }

    const result = {};
    source = source.data;

    for (const { url, ip, headers } of source) {
        const { hostname } = new URL(url);
        const hostdata = result[hostname] || (result[hostname] = new HostModel(hostname));
        const resourcedata = hostdata.addResource(url);
        hostdata.update({ ip });

        headers.forEach(({ name, value }) => {
            const geoRules = geoHints[name];
            geoRules && geoRules.forEach(({ provider, regex, hints }) => {
                const { pops, retrievedHints } = retrieve(value, regex);
                retrievedHints.forEach((hint) => {
                    resourcedata.update({
                        location: typeof hints === "string" ? iata[hint] : hints[hint]
                    });
                });
                pops.forEach((pop) => {
                    resourcedata.update({ pop })
                });
                retrievedHints.length && hostdata.update({ provider });
            });
            
            if (name in cacheHints) {
                const { provider, regex, hints } = cacheHints[name];
                if (!regex) {
                    hostdata.update({ provider });
                    resourcedata.update({ cacheStatus: value });
                }
                else {
                    const retrievedHints = retrieve(value, regex);
                    const retrieveStatus = {};
                    hints.forEach(({ regex, value: statusValue }) => {
                        regex = new RegExp(regex);
                        if (regex.test(retrievedHints)) {
                            retrieveStatus[statusValue] = true;
                        }
                    });
                    resourcedata.update({
                        cacheStatus: retrieveStatus.hit ? "HIT" : (
                            retrieveStatus.expired ? "EXPIRED" : "MISS"
                        )
                    });
                }
            }

            const cdnRules = featureHints[name];
            cdnRules && cdnRules.forEach(({ provider, regex }) => {
                if (!provider) hostdata.update({ provider: value });
                else if (!regex) hostdata.update({ provider });
                else {
                    regex = new RegExp(regex);
                    if (regex.test(value)) hostdata.update({ provider });
                }
            });

            name === "cache-control" && resourcedata.update({ cacheControl: value });
        });
    }
    return Object.values(result).map((value) => value.toJSON());
};
