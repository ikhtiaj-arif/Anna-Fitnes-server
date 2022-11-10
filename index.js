const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middle wears

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server running");
});

// jwt middle wear
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  // console.log(authHeader);
  if (!authHeader) {
    res.status(401).send({ message: "Unauthorized Access!" });
    console.log("x");
  }
  const token = authHeader.split(" ")[1];
  // console.log(token);
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("success middlewear");
    req.decoded = decoded;

    next();
  } catch (err) {
    res.status(401).send({ message: "Unauthorized Access!" });
  }
}

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tslfjs6.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const allProgramsCollection = client
      .db("simonPanda")
      .collection("allPrograms");
    const reviewsCollection = client.db("simonPanda").collection("reviews");
    const blogsCollection = client.db("simonPanda").collection("blogs");

    // verify user using jwt
    // send token to user
    app.post("/userJWT", (req, res) => {
      const user = req.body;
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const token = jwt.sign(user, secret, { expiresIn: "5h" });
      // must wrap the token inside an object..otherwise browser wont be able to read it
      res.send({ token });
    });

    // load all programs
    app.get("/allPrograms", async (req, res) => {
      const query = {};
      const cursor = allProgramsCollection.find(query);
      const allPrograms = await cursor.toArray();
      res.send(allPrograms);
    });

    // get blogs
    app.get('/blogs', async(req, res)=> {
      const query = {};
      const cursor = blogsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })

    // post to db with private route jwt authorization
    app.post("/allPrograms", verifyJWT, async (req, res) => {
      const data = req.body;
      const { title, details, image, price, email, name } = data;
      const decoded = req.decoded;

      if(decoded.email !== email){
        return res.status(403).send({ message: "Unauthorized Access!" });
      };

      const program = {
        title,
        image,
        price,
        details,
      };
     
      const result = await allProgramsCollection.insertOne(program);
      res.send(result)
      

    });

    // load using pagination
    app.get("/filterPrograms", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const toSkip = page * size;
      // console.log(page,size);
      const query = {};
      const cursor = allProgramsCollection.find(query);
      const filterPrograms = await cursor.skip(toSkip).limit(size).toArray();
      res.send(filterPrograms);
    });

    // load single program using dynamic id
    app.get("/program/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const idProgram = await allProgramsCollection.findOne(query);

      res.send(idProgram);
    });

    // get review
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { programId: id };
      const timeSort = { time: -1 };

      const cursor = reviewsCollection.find(filter).sort(timeSort);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get all reviews according to user
    app.get("/reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        return res.status(403).send({ message: "Unauthorized Access!" });
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // get one review
    app.get("/review/:id", verifyJWT, async (req, res) => {
      if (!req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access!" });
      }

      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await reviewsCollection.findOne(query);
      res.send(result);
    });

    // post review to db
    app.post("/reviews", verifyJWT, async (req, res) => {
      const review = req.body;
      if (review.email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access!" });
      }

      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    // update a review
    app.put("/reviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      if (update.email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access!" });
      }

      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateObj = {
        $set: {
          rating: update.rating,
          feedback: update.feedback,
          contact: update.contact,
          time: update.time,
        },
      };
      const result = await reviewsCollection.updateOne(
        filter,
        updateObj,
        option
      );
      res.send(result);
    });
    // delete review
    app.delete("/review/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      if (!req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access!" });
      }

      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((e) => console.dir(e));

app.listen(port, () => {
  console.log(`server running on ${port}`);
});
