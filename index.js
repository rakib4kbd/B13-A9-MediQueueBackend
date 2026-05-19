const express = require("express");
const cors = require("cors");
const { json } = require("express/lib/response");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
const { ObjectId } = require("mongodb");
dotenv.config();
const dbUri = process.env.MONGODB_URL;

const app = express();
const port = process.env.PORT;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(dbUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("mediqueue").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    const database = client.db("mediqueue");

    // app.use(cors);
    app.use(express.json());
    app.use(cors());

    app.get("/", (req, res) => {
      res.send({ message: "hello world" });
    });

    app.get("/tutors", async (req, res) => {
      const tutors = database.collection("tutor");

      const queryLimit = req.query.limit;
      if (queryLimit) {
        const result = await tutors.find().limit(Number(queryLimit)).toArray();
        return res.send(result);
      }
      const result = await tutors.find().toArray();
      return res.send(result);
    });

    app.get("/tutor/:id", async (req, res) => {
      const tutorById = database.collection("tutor");
      const result = await tutorById.findOne({
        _id: new ObjectId(req.params.id),
      });
      console.log(result);
      return res.send(result);
    });

    app.post("/add-tutor", (req, res) => {
      console.log(req.body);
      res.status(201).json({
        message: "User created successfully",
        data: req.body,
      });
    });

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);
