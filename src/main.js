import express from 'express'
import bodyParser from 'body-parser';
import cors from "cors"
import auth from "./auth.js"

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // support json encoded bodies
app.use(cors()); // support json encoded bodies

app.get('/', (req,res) => {
    res.json({ msg: "ok!"})
});

app.get('/teste', auth.middlewareAuth, (req,res) => {
    res.json({ msg: "ok!", user: req.id })
});

app.post('/auth', async (req,res) => {
    let { username, password } = req.body
    if(username != auth.app.username) {
        return res.status(400).send({ error: "user not found"})
    }
    if(password != auth.app.password) {
        return res.status(400).send({ error: "invalid password"})
    }
    return res.json({msg:"ok", token: auth.generateToken() })
});

app.listen(8012);

