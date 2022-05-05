
import express from "express";
import { repositorySchema, Collection } from "./repository-model.js";
import ld from "lodash"

const routePath = '/cb'
const repoPath = '/cb/repository'

export default function createAdminRouter(conn, refresh) {
    const router = express.Router()
    let db = conn.useDb('clapback')
    let Repository = db.model("Repository",repositorySchema)
    console.log("createAdminRouter");
    console.log(Repository);
    console.log("refresh",refresh);

    router.get(routePath, function (req, res) {
        res.send('Admin home router');
    })

    router.get(routePath+"/refresh", function (req, res) {
        console.log("refresh",refresh);
        refresh(conn,refresh)
        res.send('refreshed');
    })

    router.get(repoPath, async function (req, res) {
        const repos = await Repository.find()
        res.status(200).json(repos);
    })

    router.get(repoPath + '/:name', async function (req, res) {
        let name = req.params.name
        //console.log("name",name);
        if (name === undefined) { return res.status(500).json({ error: "name invalid" }); }
        const repos = await Repository.find({ name })
        //console.log("repos",repos);
        if (repos.length === 0) { return res.status(500).json({ error: "name not found" }); }
        return res.status(200).json(repos[0]);
    })

    router.post(repoPath + '/:name', async function (req, res) {
        let name = req.params.name
        //console.log("name",name);
        if (name === undefined) { return res.status(500).json({ error: "name invalid" }); }
        if (name !== req.body.name) { return res.status(500).json({ error: "url name no match body" }); }
        const repos = await Repository.find({ name })
        //console.log("repos",repos);
        if (repos.length > 0) { return res.status(500).json({ error: "name already exist" }); }
        let repository = new Repository({ name })
        repository.save()
        return res.status(200).json(repository);
    })

    router.post(repoPath + '/:name/:collectionName', async function (req, res) {
        let name = req.params.name
        let collectionName = req.params.collectionName
        console.log("name", name);
        console.log("collectionName", collectionName);
        if (name === undefined) { return res.status(500).json({ error: "name invalid" }); }
        if (collectionName === undefined) { return res.status(500).json({ error: "collection name invalid" }); }

        const repo = await Repository.find({name})
        let collection = ld.find(repo[0].collections,{name: collectionName})
        if (collection !== undefined) { return res.status(500).json({ error: "collection already exist" }); }
        console.log("req.body",req.body);
        let collItem = new Collection({
            name: collectionName,
            schema: req.body.schema
        })
        repo[0].collections.push(collItem)
        repo[0].save()
        return res.status(200).json(collItem);
    }),

    router.put(repoPath + '/:name/:collectionName', async function (req, res) {
        let name = req.params.name
        let collectionName = req.params.collectionName
        console.log("name", name);
        console.log("collectionName", collectionName);
        if (name === undefined) { return res.status(500).json({ error: "name invalid" }); }
        if (collectionName === undefined) { return res.status(500).json({ error: "collection name invalid" }); }

        const repo = await Repository.find({name})
        let collection = ld.find(repo[0].collections,{name: collectionName})
        if (collection === undefined) { return res.status(500).json({ error: "collection not found" }); }
        console.log("req.body",req.body);
        if(ld.isEmpty(req.body)) { return res.status(500).json({ error: "schema invalid" }); }
        let collItem = new Collection({
            name: collectionName,
            schema: req.body.schema
        })
        let idx = ld.findIndex(repo[0].collections,{name: collectionName})
        console.log("index of collection ",idx);
        repo[0].collections[idx] = collItem
        repo[0].save()
        return res.status(200).json(collItem);
    })

    console.log("Admin Routers created! ****");
    return router
}


