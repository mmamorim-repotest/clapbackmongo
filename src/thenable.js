
//console.log("oi");

function createThenable(value) {
    return {
        value,
        then: function (func) {
            func(this.value)
        },
        async other(value) {
            this.value = this.value + value
            return await createThenable(value)
        }
    }
}

const algo = async function (value) {
    return await createThenable(value)
}

function createQuery(value) {
    let _value = value
    return {
        val() {
            return _value
        },
        then: function (func) {
            func(_value)
        },
        query(value) {
            return createQuery(_value + value)
        }
    }
}

function find(value) {
    return createQuery(value)
}

main()

async function main() {
    let r = await find("oi").query("oi").query("oi")
    console.log(r);
}
