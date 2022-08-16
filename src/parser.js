"use strict";
import geoHints from "../rules/geo.rules.js";
import cacheHints from "../rules/cache.rules.js";
import featureHints from "../rules/feature.rules.js";
import iata from "../rules/iata.js";
import EdgeInfo from "./edgeInfo.js";

/**
 * Extract all matches from the provided string.
 * @param {string} value
 * @param {string} regex
 * @returns {{pop: Array, geohints: Array}}
 */
const retrieve = (value, regex) => {
    regex = new RegExp(regex, "ig");
    let match, res = [];
    while (match = regex.exec(value)) {
        res = res.concat(match.slice(1,).map((hint) => hint.toLowerCase()));
    }
    return [...new Set(res)];
};

/**
 * Extract geographic hints and cache hints from the given source
 * data to identify CDN providers and geolocate CDN edge servers.
 * @param {Object} source the source data to be parsed
 * @returns {Array<HostModel>}
 */
export default function locedge(data) {
    const { log: { entries } } = data;
    const relatedHeaders = new Set([
        "cache-control",
        ...Object.keys(geoHints),
        ...Object.keys(cacheHints),
        ...Object.keys(featureHints)
    ]);

    entries.forEach((entry) => {
        const entryResult = new EdgeInfo();
        entry.response.headers.forEach(({ name, value }) => {
            if (!relatedHeaders.has(name)) return;
            const geoRules = geoHints[name];
            geoRules && geoRules.forEach(({ provider, regex, hints }) => {
                const retrievedHints = retrieve(value, regex);
                retrievedHints.forEach((hint) => entryResult.update({
                    location: typeof hints === "string" ? iata[hint] : hints[hint],
                    pop: hint,
                }));
                retrievedHints.length && entryResult.update({ provider });
            });

            const cacheRules = cacheHints[name];
            cacheRules && cacheRules.forEach(({ provider, regex, hints }) => {
                if (!regex) entryResult.update({ provider, cacheStatus: value });
                else {
                    const retrievedHints = retrieve(value, regex);
                    const retrievedStatus = {};
                    hints.forEach(({ regex, value: statusValue }) => {
                        regex = new RegExp(regex, "ig");
                        retrievedHints.forEach((hint) => {
                            if (regex.test(hint)) {
                                retrievedStatus[statusValue] = true;
                            }
                        });
                    });
                    entryResult.update({
                        provider, cacheStatus: retrievedStatus.hit ? "HIT" : (
                            retrievedStatus.expired ? "EXPIRED" : "MISS"
                        )
                    });
                }
            });

            const featureRules = featureHints[name];
            featureRules && featureRules.forEach(({ provider, regex }) => {
                if (!provider) entryResult.update({ provider: value });
                else if (!regex) entryResult.update({ provider });
                else {
                    regex = new RegExp(regex, "ig");
                    if (regex.test(value)) entryResult.update({ provider });
                }
            });
        });
        entry["_edgeInfo"] = entryResult.toJSON();
    });
    return data;
};