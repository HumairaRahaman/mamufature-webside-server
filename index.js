const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const res = require("express/lib/response");
const ObjectId = require("mongodb").ObjectId;
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9wqm6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// //jwt fun for appointment
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const productCollection = client
      .db("super_hand_tools")
      .collection("products");
    const reviewCollection = client
      .db("super_hand_tools")
      .collection("reviews");
    const userCollection = client.db("super_hand_tools").collection("users");
    const orderCollection = client.db("super_hand_tools").collection("orders");
    const paymentCollection = client
      .db("super_hand_tools")
      .collection("payments");

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    //users
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    //user access route
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // //for admin
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;

      const filter = { email: email };

      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //for user
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "9h" }
      );
      res.send({ result, token });
    });
    //for user profile info
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);

      res.send(result);
    });

    //product api
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });
    // //order status api
    // app.get("/orderStatus", async (req, res) => {
    //   const query = {};
    //   const cursor = productCollection.find(query);
    //   const products = await cursor.toArray();
    //   res.send(products);
    // });

    
    //single product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });
    //single userInfo
    app.get("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    //for order
    app.post("/orders", async (req, res) => {
      const userOrder = req.body;
      const query = {
        product: userOrder.treatment,

        user: userOrder.user,
      };
      const exists = await orderCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, userOrder: exists });
      }
      const result = await orderCollection.insertOne(userOrder);
      return res.send({ success: true, result });
    });

    //order status
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };

      const updateDoc = {
        $set: { orderStatus: "sipping" },
      };
      const result = await productCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //for dashboard
    app.get("/orders", verifyJWT, async (req, res) => {
      const user = req.query.user;

      const decodedEmail = req.decoded.email;
      if (user === decodedEmail) {
        const query = { user: user };
        const userOrder = await orderCollection.find(query).toArray();
        return res.send(userOrder);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    //for payment
    app.get("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    });
    //Delete order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
    //Delete product
    app.delete("/products/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
    //all order api
    app.get("/order", async (req, res) => {
      const query = {};
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    //for payment stripe
    app.post("/create-payment-intent", async (req, res) => {
      const orderPrice = req.body;
      const price = orderPrice.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
    //for payment database
    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.params.orderStatus;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          orderStatus: status,
          transactionId: payment.transactionId,
        },
      };

      const result = await paymentCollection.insertOne(payment);
      const updatedBooking = await orderCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedDoc);
    });
    //all review api
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    //add review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    //add product
    app.post("/product", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
