const express = require('express');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express()

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwsgehv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
 
    const serviceCollection = client.db("CarDoctors").collection('services');
    const orderCollection   = client.db("CarDoctors").collection('serviceOrder');
  
    // services order store in database by post method
    app.post('/order',async(req,res)=>{
      const order = req.body
      const result = await orderCollection.insertOne(order)
      res.send(result)
    })

    // services order store in database by post method.
    app.get('/order',async(req,res)=>{
       let query = {}
       if (req.query?.email) {
          query = { email : req.query.email }
       }
       const result = await orderCollection.find(query).toArray()
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
