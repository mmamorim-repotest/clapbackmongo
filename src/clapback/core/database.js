import mongoose from 'mongoose';
import auth from "../auth.js"

export default function createServerDB(app, info, connection) {
    let _app = app
    let _connection = connection
    let { name } = info
    let _db = _connection.useDb(name).db;
    //console.log("_db",_db.db.collections());

    let type = "user defined"
    if (["admin", "config", "local"].lastIndexOf(name) != -1) {
        type = "mongo default"
    }
    //let names = _db.collections
    _db.collections().then(function (names) {
        for(let i in names) {
            let collectionName = names[i].namespace.split(".")[1]
            console.log(`collections [${name}]:`, collectionName); // [{ name: 'dbname.myCollection' }]
        }
    });

    return {
        ...info,
        type
    }

}