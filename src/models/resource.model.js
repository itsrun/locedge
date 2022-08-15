import BaseModel from "./base.model.js";

export default class ResourceModel extends BaseModel {
    constructor(url) {
        super(url);
        this._pop = new Set();
        this._location = new Set();
        this._cacheStatus = new Set();
        this._cacheControl = null;
    }
};