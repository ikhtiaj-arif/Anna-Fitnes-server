const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express());


app.get('/', (req, res)=>{
    res.send('server running')
})

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tslfjs6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        const allProgramsCollection = client.db('simonPanda').collection('allPrograms');


        app.get('/allPrograms', async(req, res)=> {
            const query ={};
            const cursor = allProgramsCollection.find(query);
            const allPrograms = await cursor.toArray();
            res.send(allPrograms)
        })

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

    }
    finally{

    }
}
run().catch(e => console.dir(e))








app.listen(port, ()=>{
    console.log(`server running on ${port}`);
})