const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res)=>{
    res.send('server running')
})

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tslfjs6.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        const allProgramsCollection = client.db('simonPanda').collection('allPrograms');
        const reviewsCollection = client.db('simonPanda').collection('reviews');

// load all programs
        app.get('/allPrograms', async(req, res)=> {
            const query ={};
            const cursor = allProgramsCollection.find(query);
            const allPrograms = await cursor.toArray();
            res.send(allPrograms)
        })
// load using pagination
        app.get('/filterPrograms', async(req, res)=> {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const toSkip = page * size;
            // console.log(page,size);
            const query ={};
            const cursor  =allProgramsCollection.find(query)
            const filterPrograms = await cursor.skip(toSkip).limit(size).toArray();
            res.send(filterPrograms)
        })
// load single program using dynamic id
        app.get('/program/:id', async(req, res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id)}
            const idProgram = await allProgramsCollection.findOne(query);
            res.send(idProgram)
        })

// get review
        app.get('/reviews', async(req, res)=>{
            const query = {};
            const cursor = reviewsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })



// post review to db
        app.post('/reviews', async(req, res)=> {
            const review = req.body;
            console.log(review);
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });







    }
    finally{

    }
}
run().catch(e => console.dir(e))








app.listen(port, ()=>{
    console.log(`server running on ${port}`);
})