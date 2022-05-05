import jwt from 'jsonwebtoken';

const auth = {
    app: {
        username: "root",
        password: "super",
        secret: "clapback2022"
    },
    generateToken() {
        return jwt.sign({id: auth.app.username},auth.app.secret, {
            expiresIn: 300
        })
    },
    async middlewareAuth(req, res, next) {
        const authHeader = req.headers.authorization
        if(!authHeader) {
            return res.status(401).send({error:"No token provided"})
        }
        const parts = authHeader.split(' ')
        if(parts.length !== 2) {
            return res.status(401).send({error:"Token error"})
        }
        const [ scheme, token ] = parts
        if(!(/^Bearer$/i).test(scheme)) {
            return res.status(401).send({error:"Token malformatted"})
        }
        jwt.verify(token, auth.app.secret, (err,decoded) => {
            if(err) { return res.status(401).send({error:"Token invalid"}) }
            req.id = decoded.id
            return next()
        })
    }
}

export default auth