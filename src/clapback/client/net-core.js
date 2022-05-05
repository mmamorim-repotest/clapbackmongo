import { io } from "./socket.io.esm.min.js"

let _axios = null
if (typeof window === 'undefined') {
    console.log("clapback running node");
} else {
    console.log("🌐 clapback browser-client");
    _axios = window.axios
    //console.log("_axios",_axios);
}

export default async function createNetCore(config) {
    let _config = config
    let hostPath = "http://" + config.host + ':8012/'
    //console.log(hostPath);

    if (_axios === null) {
        let axios = await import('../../../node_modules/axios/index.js');
        _axios = axios.default
        //console.log("_axios",_axios);
    }

    try {
        let response = await _axios({
            method: 'post',
            url: hostPath+"auth",
            data: config
        })
        //console.log("auth",response.data)
        _axios.defaults.headers.common = {'Authorization': `bearer ${response.data.token}`}
    } catch (e) {
        console.log("AUTH FAIL");
    }

    let socket = io(hostPath)
    socket.on('greeting', (msg) => {
        console.log('server greetings', msg);
    });

    return {

        addListen(msg, cbfunc) {
            socket.on(msg, (msg) => {
                cbfunc(msg);
            });
        },

        async get(route, _data) {
            let _url = hostPath + route
            //console.log("request GET on " + _url);
            //console.log("data ", _data);
            try {
                let response = await _axios({
                    method: 'get',
                    url: _url,
                    params: _data
                })
                return response.data
            } catch (e) {
                console.log("error:", e.response.data.error);
                return e.response.data
            }
        },

        async post(route, data) {
            let url = hostPath + route
            //console.log("request POST on " + url);
            //console.log("data ", data);
            try {
                let response = await _axios({
                    method: 'post',
                    url: url,
                    data
                })
                return response.data
            } catch (e) {
                console.log("error:", e.response.data.error);
                return e.response.data
            }
        },

        async put(route, data) {
            let url = hostPath + route
            //console.log("request PUT on " + url);
            //console.log("data ", data);
            try {
                let response = await _axios({
                    method: 'put',
                    url: url,
                    data
                })
                return response.data
            } catch (e) {
                console.log("error:", e.response.data.error);
                return e.response.data
            }
        },

        async delete(route, data) {
            let url = hostPath + route
            //console.log("request DELETE on " + url);
            //console.log("data ", data);
            try {
                let response = await _axios({
                    method: 'delete',
                    url: url,
                    data
                })
                return response.data
            } catch (e) {
                console.log("error:", e.response.data.error);
                return e.response.data
            }
        }
    }
}