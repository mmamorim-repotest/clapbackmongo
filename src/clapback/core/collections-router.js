
import express from "express";
import mongoose from "mongoose"
import moment from "moment"
import ld from "lodash"
import removeRoute from "express-remove-route"
import { doQuery, doAggregate } from "./queries.js";

import { repositorySchema } from "./repository-model.js";

const dataPath = '/data/'
const useDbOptions = {
    //ensures connections to the same databases are cached
    useCache: true,
    //remove event listeners from the main connection
    noListener: true
}

const allRoutes = []
let Repository = null

export default async function createCollectionsRouter(_app, conn, io) {
    console.log("createCollectionsRouter");

    let db = conn.useDb('clapback')
    Repository = db.model("Repository", repositorySchema)

    const repos = await Repository.find()
    //console.log("repos",repos);

    for (let i in repos) {
        let repoName = repos[i].name
        for (let k in repos[i].collections) {
            let collName = repos[i].collections[k].name
            let schema = repos[i].collections[k].schema
            if (allRoutes.includes(repoName + "/" + collName)) {
                console.log("*** rota já criada: " + repoName + "/" + collName);
            } else {
                allRoutes.push(repoName + "/" + collName)
                let route = createRoutes(repoName, collName, schema, conn, io, _app)
                _app.use(dataPath, route)
            }
        }
    }
    console.log("allRoutes", allRoutes);
}

let Models = {}

const createRoutes = function (dbName, collName, schema, conn, io, _app) {
    let router = express.Router()
    let routePath = "/" + dbName + "/" + collName
    console.log("routePath", routePath);

    let db = conn.useDb(dbName, useDbOptions)

    if (db.models[collName] != undefined) {
        console.log(`model [${collName}] already created`)
        delete db.models[collName]
        console.log(`recreating model [${collName}]`)
        console.log(`new schema [${JSON.stringify(schema)}]`)
        io.emit("repoRefresh", { msg: "repoRefresh", method: "REFRESH", data: schema })
        let msg = 'coll:' + collName + ':changed'
        io.emit(msg, { msg, method: "REFRESH", data: schema })
        schema["createdAt"] = { "type": "Date", "default": moment().format(), immutable: true }
        let Schema = new mongoose.Schema(schema)
        Models[collName] = db.model(collName, Schema)
        console.log(`model [${collName}] recreated`)
        return
    }

    schema["createdAt"] = { "type": "Date", "default": moment().format(), immutable: true }
    let Schema = new mongoose.Schema(schema)
    Models[collName] = db.model(collName, Schema)

    router.get(routePath, async function(req, res) {
        let queryFunc = doQuery
        let query = {}
        if (req.query.query !== undefined) {
            console.log("query found",req.query.query);
            query = JSON.parse(req.query.query)
        } 
        if (req.query.aggregate !== undefined) {
            console.log("agregate found",req.query.aggregate);
            query = req.query.aggregate //JSON.parse(req.query.aggregate)
            queryFunc = doAggregate
        } 
        try {
            let data = await queryFunc(Models[collName],query)
            return res.status(200).json(data);
        } catch (e) {
            console.log("error GET", e.message);
            return res.status(500).json({ error: e.message })
        }
    })

    router.get(routePath + '/:id', async function (req, res) {
        let id = req.params.id
        console.log("id", id);
        if (id === undefined) { return res.status(500).json({ error: "id invalid" }); }
        if (id == "refreshschema") {
            const repos = await Repository.find({ name: dbName })
            //console.log("repos", repos);
            let idx = ld.findIndex(repos[0].collections, { name: collName })
            console.log("index of collection " + idx) //,repos[0].collections[idx]);
            let schema = repos[0].collections[idx].schema
            console.log(schema);
            createRoutes(dbName, collName, schema, conn, io, _app)
            return res.status(200).json({ msg: "Schema restarted" });
        }
        const repos = await Models[collName].find({ id })
        if (repos.length == 0) { return res.status(500).json({ error: "id not found" }); }
        return res.status(200).json(repos[0]);
    })

    router.post(routePath + '/:id', async function (req, res) {
        let id = req.params.id
        console.log("id", id);
        if (id === undefined) { return res.status(500).json({ error: "id invalid" }); }
        console.log("req.body", req.body);
        if (id !== req.body.id) { return res.status(500).json({ error: "url id no match body" }); }
        const repos = await Models[collName].find({ id })
        //console.log("repos",repos);
        if (repos.length > 0) { return res.status(500).json({ error: "id already exist" }); }
        try {
            let model = new Models[collName](req.body)
            await model.save()
            let msg = 'coll:' + collName + ':changed'
            io.emit(msg, { msg, method: "POST", data: model })
            return res.status(200).json(model);
        } catch (e) {
            console.log("error POST", e.message);
            return res.status(500).json({ error: e.message })
        }
    })

    router.put(routePath + '/:id', async function (req, res) {
        let id = req.params.id
        console.log("id", id);
        if (id === undefined) { return res.status(500).json({ error: "id invalid" }); }
        console.log("req.body", req.body);
        if (id !== req.body.id) { return res.status(500).json({ error: "url id no match body" }); }
        const repos = await Models[collName].find({ id })
        //console.log("repos",repos);
        if (repos.length == 0) { return res.status(500).json({ error: "id not found" }); }
        try {
            let model = await Models[collName].findOneAndUpdate({ id }, req.body, { new: true })
            let msg = 'coll:' + collName + ':changed'
            io.emit(msg, { msg, method: "PUT", data: model })
            return res.status(200).json(model);
        } catch (e) {
            console.log("error POST", e.message);
            return res.status(500).json({ error: e.message })
        }
    })

    router.delete(routePath + '/:id', async function (req, res) {
        let id = req.params.id
        console.log("id", id);
        if (id === undefined) { return res.status(500).json({ error: "id invalid" }); }
        const repos = await Models[collName].find({ id })
        if (repos.length == 0) { return res.status(500).json({ error: "id not found" }); }
        try {
            let model = await Models[collName].findOneAndDelete({ id })
            let msg = 'coll:' + collName + ':changed'
            io.emit(msg, { msg, method: "DELETE", data: model })
            return res.status(200).json(model);
        } catch (e) {
            console.log("error POST", e.message);
            return res.status(500).json({ error: e.message })
        }
    })

    return router
}