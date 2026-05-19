const express = require("express");
const cors = require("cors");
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
      const query = {};

      // Get query parameters
      const queryLimit = req.query.limit ? Number(req.query.limit) : 0;
      const querySearch = req.query.search?.trim() || "";
      const queryRegistrationStart = req.query.registrationStart || "";
      const queryRegistrationEnd = req.query.registrationEnd || "";
      const userId = req.query.userId;

      if (userId) {
        const result = await tutors
          .find({ "addedBy.userId": userId })
          .toArray();
        return res.send(result);
      }

      const queryItems = [];

      if (querySearch) {
        queryItems.push({
          tutorName: { $regex: querySearch, $options: "i" },
        });
      }

      if (queryRegistrationStart && queryRegistrationEnd) {
        queryItems.push({
          $and: [
            {
              sessionStartDate: {
                $gte: new Date(queryRegistrationStart).toISOString(),
              },
            },
            {
              sessionStartDate: {
                $lte: new Date(queryRegistrationEnd).toISOString(),
              },
            },
          ],
        });
      } else if (queryRegistrationStart) {
        queryItems.push({
          sessionStartDate: {
            $gte: new Date(queryRegistrationStart).toISOString(),
          },
        });
      } else if (queryRegistrationEnd) {
        queryItems.push({
          sessionStartDate: {
            $lte: new Date(queryRegistrationEnd).toISOString(),
          },
        });
      }

      if (queryItems.length > 0) {
        query.$and = queryItems;
      }

      let result;
      if (queryLimit > 0) {
        result = await tutors.find(query).limit(queryLimit).toArray();
      } else {
        result = await tutors.find(query).toArray();
      }

      return res.send(result);
    });

    app.get("/tutor/:id", async (req, res) => {
      const tutorById = database.collection("tutor");
      const query = { _id: new ObjectId(req.params.id) };
      const result = await tutorById.findOne(query);
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

    app.delete("/booking/:id", async (req, res) => {
      const bookingId = req.params.id;
      const bookingCollection = database.collection("booking");
      const booking = await bookingCollection.findOne({
        _id: new ObjectId(bookingId),
      });
      if (!booking) {
        return res.status(404).send({ message: "Booking not found" });
      }
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      if (result.acknowledged) {
        const tutorCollection = database.collection("tutor");
        await tutorCollection.updateOne(
          { _id: new ObjectId(booking.tutorId) },
          { $inc: { totalSlot: 1 } },
        );
      }
      return res.send(result);
    });

    app.patch("/booking/:id", async (req, res) => {
      const bookingId = req.params.id;
      const { status } = req.body;
      const bookingCollection = database.collection("booking");
      const booking = await bookingCollection.findOne({
        _id: new ObjectId(bookingId),
      });
      if (!booking) {
        return res.status(404).send({ message: "Booking not found" });
      }
      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: { status } },
      );
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
