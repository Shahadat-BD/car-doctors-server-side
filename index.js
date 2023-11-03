const express = require('express');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser")

const app = express()

app.use(cors({
     origin : [ 
      'http://localhost:5173'
     ],
     credentials : true
}))
app.use(express.json())
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwsgehv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// Middlewares 

const logger = (req,res,next) => {
     console.log('log info :',req.method , req.url);
     next()
}

const verifyToken = (req,res,next) =>{
    const token = req?.cookies?.token
    // console.log('token in the middleware',token);
   if (!token) {
        return res.status(401).send({message : "unauthorized access"})
   }
   jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) => {
       if (err) {
          return res.status(401).send({message : "unauthorized access"})
       }
       req.user = decoded;
       next()
   })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
 
    const serviceCollection = client.db("CarDoctors").collection('services');
    const orderCollection   = client.db("CarDoctors").collection('serviceOrder');
  

//  auth related api 

app.post("/jwt",async(req,res) => {
   const user = req.body 
   console.log('user token response',user);
   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {expiresIn:'1h'})
   
   res.cookie('token',token,{
        httpOnly : true,
        secure : true,
        sameSite : 'none'
   })
   .send({success : true})
})


// logout api => when user logout then token get out form cooke.
   app.post('/logout',async(req,res) => {
       const user  =  req.body;
       console.log('logout user',user);
       res.clearCookie('token',{maxAge:0})
       .send({success : true})
   })

    // the user service order stored in database by post method.
    app.post('/order',async(req,res)=>{
      const order = req.body
      const result = await orderCollection.insertOne(order)
      res.send(result)
    })

    // the user services order collect form database by get method for display in client side.
    app.get('/order',logger, verifyToken ,async(req,res)=>{
      console.log('user token owner',req.user);
       if (req.user.email !== req.query.email) {
          res.status(403).send({message : "forbidden access"})
       }
       let query = {}
       if (req.query?.email) {
          query = { email : req.query.email }
       }
       const result = await orderCollection.find(query).toArray()
       res.send(result)
    })
    // specific order deleted by delete method
    app.delete('/order/:id',async(req,res)=>{
      const id = req.params.id
      const query = { _id : new ObjectId(id) };  
      const result = await orderCollection.deleteOne(query);
        res.send(result)
    })

    // all services collection form database for display
    app.get('/services',async(req,res) => { 
        const result = await serviceCollection.find().toArray()
        res.send(result)
    })
   
    // specific service collect form database for display in details route
    app.get('/services/:id',async(req,res) => {
      const id = req.params.id
      const query = {_id : new ObjectId(id) }
      const result = await serviceCollection.findOne(query)
      res.send(result)
  }) 

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res) => {
    res.send('car doctor is coming soon');
})

app.listen(port, () => {
     console.log(`this port is listen at ${port}`);
})
