const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken")
require("dotenv").config()

const port = process.env.PORT || 5000
const app = express();


// middleware 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xicrlbt.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() { 
	const blogsCollection = client.db("bookAndCo").collection("blogs")
	app.get("/blogs", async (req, res) => {
		const query = {}
		const blogs=await blogsCollection.find(query).toArray()
		res.send(blogs)
	})
	app.post("/blogs", async (req, res) => {
		const doc = {
      title: "Record of a Shriveled Datum",
      content: "No bytes, no problem. Just insert a document, in MongoDB",
		};
		const result = await blogsCollection.insertOne(doc)
		res.send(result)
	})
}
run().catch(console.dir);



app.get("/", async (req, res) => {
	res.send("Book and Co server is running...")
})

app.listen(port, () => {
	console.log(`Book and Co running in ${port}`)
})



