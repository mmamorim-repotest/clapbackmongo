import mongoose from "mongoose"
import moment from "moment"

const collectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdAt: { type: Date, default: moment().format(), immutable: true },
    schema: Object
})

const repositorySchema = new mongoose.Schema({
    name: String,
    createdAt: { type: Date, default: moment().format(), immutable: true },
    collections: [collectionSchema]
})
const Repository = mongoose.model("Repository",repositorySchema)
const Collection = mongoose.model("Collection",collectionSchema)

export { Repository, Collection, repositorySchema, collectionSchema }