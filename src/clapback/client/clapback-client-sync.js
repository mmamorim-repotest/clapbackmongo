import createNetCore from "./net-core.js"
import "./lodash.js"
import { Mutex } from "./async-mutex.js"

const ld = _
const singleton = {
    cb: null,
    mutex: new Mutex()
}

export function createClient(config) {
    if(singleton.cb == null) {
        singleton.mutex.acquire().then((release) => {
            createClientAssync(config).then((cb) => {
                singleton.cb = cb                
                release()
            })
        })
        return {
            net() {
                return null
            },
    
            async repositories() {
                await singleton.mutex.waitForUnlock()
                return await singleton.cb.repositories()
            },
    
            repo(repoName) {
                return null
            }
        }
    } else {
        return singleton.cb
    }   
}

async function createClientAssync(config) {
    let _config = config
    let _net = await createNetCore(config)

    let _repositories = await _net.get('cb/repository/')

    function createCollectionModel(collection, repoName) {
        let name = collection.name
        let schema = collection.schema
        let route = 'data/' + repoName + '/' + name
        //console.log("route",route);

        return {
            async getAll() {
                let data = await _net.get(route)
                return data
            },
            async find(filter={},projection={},options={}) {
                let query = { query: {filter,projection,options} }
                let data = await _net.get(route,query)
                return data
            },
            async getID(id) {
                let data = await _net.get(route + "/" + id)
                let dataSafe = JSON.parse(JSON.stringify(data))
                dataSafe.save = async function () {
                    let _data = JSON.parse(JSON.stringify(dataSafe))
                    let data = await _net.put(route + "/" + id, _data)
                    return data
                }
                return dataSafe
            },
            async push(data) {
                let { id } = data
                if (id === undefined) {
                    console.log("Error: id not defined");
                    return {}
                }
                let _data = await _net.post(route + "/" + id, data)
                return _data
            },

            async remove(id) {
                if (id === undefined) {
                    console.log("Error: id not defined");
                    return {}
                }
                let _data = await _net.delete(route + "/" + id, {})
                return _data
            },

            listen(cbfunc) {
                _net.addListen('coll:'+name+':changed',cbfunc)
            }
        }
    }

    function createRepoModel(repository) {
        let _repo = repository

        return {
            coll(collectionName) {
                let collection = ld.find(_repo.collections, { name: collectionName })
                if (collection == undefined) {
                    console.log(`collection name [${collectionName}] not found`);
                    return null
                }
                return createCollectionModel(collection, _repo.name)
            },
            collections() {
                let data = []
                for (let i in _repo.collections) {
                    data.push(_repo.collections[i].name)
                }
                return data
            }
        }
    }



    return {
        net() {
            return _net
        },

        async repositories() {
            let data = []
            for (let i in _repositories) {
                data.push({
                    name: _repositories[i].name,
                    collectionsCount: _repositories[i].collections.length
                })
            }
            return data
        },

        repo(repoName) {
            let repository = ld.find(_repositories, { name: repoName })
            return createRepoModel(repository)
        }
    }
} 