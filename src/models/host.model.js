import BaseModel from "./base.model.js";
import ResourceModel from "./resource.model.js";

export default class HostModel extends BaseModel {
    constructor(domain) {
        super(domain);
        this._provider = new Set();
        this._ip = new Set();
        this._resources = new Array();
    }

    addResource(url) {
        const newResource = new ResourceModel(url);
        this._resources.push(newResource);
        return newResource;
    }
};