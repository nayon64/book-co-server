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

	// data collection 
	const blogsCollection = client.db("bookAndCo").collection("blogs")
	const bookCategorysCollection = client.db("bookAndCo").collection("bookCategorys")


	app.get("/blogs", async (req, res) => {
		const query = {}
		const blogs=await blogsCollection.find(query).toArray()
		res.send(blogs)
	})
	
	app.get('/categorys', async (req, res) => {
		const query = {};
    const categorys = await bookCategorysCollection.find(query).toArray();
    res.send(categorys);
	})
}
run().catch(console.dir);



app.get("/", async (req, res) => {
	res.send("Book and Co server is running...")
})

app.listen(port, () => {
	console.log(`Book and Co running in ${port}`)
})



