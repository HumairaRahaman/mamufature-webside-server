const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require('mongodb').ObjectId;
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9wqm6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// //jwt fun for appointment
// function verifyJWT(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).send({ message: "UnAuthorized access" });
//   }

//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//     if (err) {
//       return res.status(403).send({ message: "Forbidden Access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// }

 async function run(){
    try{
        await client.connect();
        const productCollection = client.db('super_hand_tools').collection('products');
        const reviewCollection = client.db('super_hand_tools').collection('reviews');
        const userInfoCollection = client.db('super_hand_tools').collection('userInfo');
        // const paymentCollection = client.db("super_hand_tools").collection("payments");


    // const verifyAdmin = async (req,res,next)=>{
    //   const requester = req.decoded.email;
    //   const requesterAccount = await userCollection.findOne({
    //     email: requester
    //   });
    //   if (requesterAccount.role === "admin"){
    //     next();

    //   }
    //   else{
    //     res.status(403).send({message:'forbidden'});
    // }
    // }

    //users
    // app.get("/user", verifyJWT, async (req, res) => {
    //   const users = await userCollection.find().toArray();
    //   res.send(users);
    // });
    // //user access route
    // app.get('/admin/:email', async(req,res)=>{
    //     const email = req.params.email;
    //     const user = await userCollection.findOne({email: email});
    //     const isAdmin = user.role === 'admin';
    //     res.send({admin: isAdmin});
    // })

    // //for admin
    // app.put("/user/admin/:email", verifyJWT,verifyAdmin, async (req, res) => {
    //   const email = req.params.email;
     
    //     const filter = { email: email };

    //     const updateDoc = {
    //       $set: { role: "admin" },
    //     };
    //     const result = await userCollection.updateOne(filter, updateDoc);
    //     res.send(result);
    
    // });

    // //for user
    // app.put("/user/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const user = req.body;
    //   const filter = { email: email };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: user,
    //   };
    //   const result = await userCollection.updateOne(filter, updateDoc, options);
    //   const token = jwt.sign(
    //     { email: email },
    //     process.env.ACCESS_TOKEN_SECRET,
    //     { expiresIn: "1h" }
    //   );
    //   res.send({ result, token });
    // });

        //product api
        app.get('/products', async(req,res)=>{
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
      

          //single product
    app.get("/products/:id", async (req, res) => {
        const id = req.params.id;
        const query = {_id:ObjectId(id)};
        const product = await productCollection.findOne(query);
        res.send(product);
      });
        //review api
        app.get('/reviews', async(req,res)=>{
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });
    }
    finally{

    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
