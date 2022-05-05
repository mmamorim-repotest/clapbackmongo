import { createClient } from "./client/clapback-client.js";

main() 

async function main() {
    let cb = await createClient({
        host: "localhost",
        port: 8012,
        username: "",
        password: ""
    })
    //console.log(cb);

    //let res = await cb.repositories()
    //console.log(res);

    let model = cb.repo("repo01").coll("pessoa")
    console.log(model);

    let data = await model.getID("ana")
    console.log("data",data);
    data.name = "ANA CAROLINA"
    await data.save()
}

