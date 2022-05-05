import express from "express";

export default function createRepositoryRouter() {

    const router = express.Router()

    router.get('/', function (req, res) {
        res.send('Wiki home page');
    })
    return router
}
