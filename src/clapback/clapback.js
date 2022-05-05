import express from 'express'
import bodyParser from 'body-parser';
import cors from "cors"
import mongoose from 'mongoose';
import { createServer } from "http";
import { Server } from "socket.io";
import appRoot from 'app-root-path';
import auth from "./auth.js"
import { repositorySchema } from '././core/repository-model.js'
import createAdminRouter from "./core/admin-router.js"
import createCollectionsRouter from "./core/collections-router.js"

/** @param {number} port */
export function createClapback(port) {
    let _port = port
    let _repositories = []

    const _app = express();
    _app.use(bodyParser.urlencoded({ extended: false }));
    _app.use(bodyParser.json()); // support json encoded bodies
    _app.use(cors()); // support json encoded bodies

    const httpServer = createServer(_app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
//        socket.on('chat message', (msg) => {
//            console.log('message: ' + msg);
//        });
        socket.emit('greeting',{ msg: "Hello client! 🛫✨" })
    });

    console.log(`Admin running on `,appRoot+'/public');
    _app.use('/', express.static(appRoot+'/public'));

//    _app.get('/', (req, res) => {
//        res.json({ msg: "Home clapback" })
//    });

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

    const initRepository = async function(conn) {
        try {
            let db = conn.useDb('clapback')
            let Repository = db.model("Repository", repositorySchema)
            const repos = await Repository.find()
            //console.log("repos",repos);
            if (repos.length == 0) {
                let repoIni = new Repository({
                    name: "repo01"
                })
                repoIni.save()
                console.log("repoIni saved");
            }
            _app.use('/', auth.middlewareAuth, createAdminRouter(conn, initRepository))
            await createCollectionsRouter(_app, conn, io)
            io.emit("repoRefresh", { msg: "repoRefresh", method: "REFRESH" })

        } catch (e) {
            console.log(e.message)
        }
    }
    
    let _conn = null

    return {

        listen(cbfunc = () => { }) {

            _conn = mongoose.createConnection('mongodb://localhost', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
            initRepository(_conn).then(() => {
                httpServer.listen(_port, () => {
                    console.log("clapback listen on port: " + _port)
                    cbfunc()
                })
            })
        },

        async refreshRoutes() {
            await initRepository(_conn)
        }

    }
}