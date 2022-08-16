export default class EdgeInfo{
    constructor() {
        this._pop = new Set();
        this._provider = new Set();
        this._location = new Set();
        this._cacheStatus = new Set();
        this._cacheControl = null;
    }

    update(data = {}) {
        Object.entries(data).forEach(([prop, val]) => {
            if (val === undefined || val === "") return;
            prop = `_${prop}`;
            if (!this.hasOwnProperty(prop)) {
                throw new TypeError(`'${this.constructor.name}' does not have '${prop}' property`);
            }
            else if (this[prop] instanceof Set) {
                this[prop].add(val);
            }
            else {
                this[prop] = val;
            }
        })
    }

    toJSON() {
        const result = {};
        Object.getOwnPropertyNames(this).forEach((name) => {
            result[name.slice(1,)] = this[name] instanceof Set ? (
                this[name].size ? Array.from(this[name]) : undefined
            ) : (this[name] instanceof Array ? (
                this[name].length ? this[name] : undefined
            ) : (
                this[name] === null ? undefined : this[name]
            ));
        });
        return result;
    }
}