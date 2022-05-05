import mongoose from 'mongoose';

const db = mongoose.connect('mongodb://localhost/vegetais', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

var Vegetable = new mongoose.Schema({ name: String });
let model = mongoose.model('vegetais', Vegetable);

main()

async function main() {
    let r = await model.find({ name: "Cebola"},{ _id: 0, __v: 0},{sort: "name", limit: 3})
    console.log(r);
} 