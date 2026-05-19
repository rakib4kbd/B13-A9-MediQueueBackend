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
      return res.send(result);
    });

    app.post("/tutor", async (req, res) => {
      const tutorCollection = database.collection("tutor");
      const result = await tutorCollection.insertOne(req.body);
      return res.send(result);
    });

    // Booking API
    app.get("/booking/:id", async (req, res) => {
      const userId = req.params.id;
      const bookingCollection = database.collection("booking");
      const result = await bookingCollection.find({ userId }).toArray();
      return res.send(result);
    });

    app.post("/booking", async (req, res) => {
      console.log(req.body);
      const payload = {
        ...req.body,
        bookingDate: new Date(),
        status: "pending",
      };
      const tutorCollection = database.collection("tutor");
      const tutor = await tutorCollection.findOne({
        _id: new ObjectId(payload.tutorId),
      });
      if (tutor.totalSlot <= 0) {
        return res.status(400).send({
          message:
            "This session is fully booked. You can't join at the moment.",
        });
      }
      if (new Date(tutor.sessionStartDate) > new Date()) {
        return res
          .status(400)
          .send({ message: "Session has not started yet." });
      }
      const bookingCollection = database.collection("booking");
      const result = await bookingCollection.insertOne(payload);
      if (result.acknowledged) {
        const tutorCollection = database.collection("tutor");
        await tutorCollection.updateOne(
          { _id: new ObjectId(payload.tutorId) },
          { $inc: { totalSlot: -1 } },
        );
      }
      return res.send(result);
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
