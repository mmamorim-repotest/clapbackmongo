
export async function doQuery(model,query) {
    console.log("doQuery", query);
    let filter = {}, projection = {}, options = {}
    if (query !== undefined) {
        ({ filter, projection, options } = query)
        if (filter === undefined) { filter = {} }
        if (projection === undefined) { projection = {} }
        if (options === undefined) { options = {} }
    }
    let data = await model.find(filter, projection, options)
    return data
}

export async function doAggregate(model,query) {
    console.log("doAggregate", query);
    console.log("doAggregate", query.length);
    let aggregate = []
    for(let i in query) {
        aggregate.push(JSON.parse(query[i]))
    }
    console.log("aggregate", aggregate);
    let data = await model.aggregate(aggregate)
    return data
}