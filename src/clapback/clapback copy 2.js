import express from 'express'
import bodyParser from 'body-parser';
import cors from "cors"
import mongoose from 'mongoose';
import auth from "./auth.js"
import createServerDB from './core/database.js';

const connection = mongoose.createConnection('mongodb://localhost', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const Admin = mongoose.mongo.Admin

/** @param {number} port */
export function createClapback(port) {
    let _port = port
    let _dbs = []
    let _dbsServer = []

    const _app = express();
    _app.use(bodyParser.urlencoded({ extended: false }));
    _app.use(bodyParser.json()); // support json encoded bodies
    _app.use(cors()); // support json encoded bodies

    _app.get('/teste', auth.middlewareAuth, (req, res) => {
        res.json({ msg: "ok!", user: req.id })
    });

    _app.post('/auth', async (req, res) => {
        let { username, password } = req.body
        if (username != auth.app.username) {
            return res.status(400).send({ error: "user not found" })
        }
        if (password != auth.app.password) {
            return res.status(400).send({ error: "invalid password" })
        }
        return res.json({ msg: "ok", token: auth.generateToken() })
    });

    return {

        listen(cbfunc = ()=>{}) {

            connection.on('open', () => {
                console.log("connection ok")
                //now call the list databases function
                let admin = new Admin(connection.db)
                admin.listDatabases(function (err, results) {
                    _dbs = results
                    console.log(_dbs.databases);
                    for(let i in _dbs.databases) {
                        _dbsServer.push(createServerDB(_app,_dbs.databases[i],connection))
                    }

                    _app.listen(_port, () => {
                        console.log("clapback listen on port: " + _port)
                        cbfunc()
                    })    
                });
            })
        },

        getDbs() {
            return _dbsServer
        }
    }
}