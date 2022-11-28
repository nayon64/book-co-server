const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xicrlbt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {


  // data collection
  const blogsCollection = client.db("bookAndCo").collection("blogs");
  const bookCategorysCollection = client
    .db("bookAndCo")
    .collection("bookCategorys");
  const usersCollection = client.db("bookAndCo").collection("users");
  const booksCollection = client.db("bookAndCo").collection("books");
  const bookingCollection = client.db("bookAndCo").collection("bookingBooks");
  const paymentsCollection = client.db("bookAndCo").collection("paymentsItem");


  // booking item payment api 
  app.post("/create-payment-intent", async (req, res) => {
    const booking = req.body;
    const price = booking.price;
    const amount = price * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: amount,
      payment_method_types: ["card"],
    });
    console.log(paymentIntent);
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });

// set payment item in data base 
  app.post("/payments", async (req, res) => {
    const payment = req.body;
    const result = await paymentsCollection.insertOne(payment);
    const id = payment.bookingId;
    const filter = { _id: ObjectId(id) };
    const updatedDoc = {
      $set: {
        paid: true,
        transactionId: payment.transactionId,
      },
    };
    const updatedResult = await bookingCollection.updateOne(filter, updatedDoc);
    res.send(result);
  });

  // create jwt token
  app.get("/jwt", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user) {
      const token = jwt.sign({ email }, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "30d",
      });
      return res.send({ accessToken: token });
    }
    res.status(403).send({ accessToken: "" });
  });

  // cheack user admin role
  app.get("/users/admin/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    res.send({ isAdmin: user?.role === "Admin" });
  });

  // cheack user seller api
  app.get("/users/seller/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    res.send({ isSeller: user?.role === "Seller" });
  });


  app.put("/admin/sellerVarified", async (req, res) => {
    const email = req.query.email;
    const filter = {
    email:email
    }
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        sellerVarified:true,
      },
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options)
    res.send(result)
  })

  // booking a book item
  app.post("/bookingItem", async (req, res) => {
    const bookingBook = req.body;
    const bookItemId = bookingBook.bookItemId;
    const buyerEmail = bookingBook.buyerEmail;

    const query = {
      bookItemId: bookItemId,
      buyerEmail: buyerEmail,
    };
    
    const findBook = await bookingCollection.findOne(query);
   
    if (findBook) {
      return res.send({
        acknowledged: false,
        message: "All ready book the book",
      });
    }
    const result = await bookingCollection.insertOne(bookingBook);
    res.send(result);
  });

  // add a book selling post in database
  app.post("/seller/addBookItem", async (req, res) => {
    const bookInfo = req.body;
    const result = await booksCollection.insertOne(bookInfo);
    res.send(result);
  });

  // get a seller all selling book
  app.get("/seller/myBooks", async (req, res) => {
    const email = req.query.email;
    const query = {
      sellerEmail: email,
    };
    const books = await booksCollection.find(query).toArray();
    res.send(books);
  });

  // book item reported
  app.put("/bookReported/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        isReported: true,
      },
    };
    const result = await booksCollection.updateOne(filter, updateDoc, options);
    res.send(result);
  });

  // get all reported item for admin
  app.get("/reportedItems", async (req, res) => {
    const filter = {
      isReported: true,
    };
    const reportedItems = await booksCollection.find(filter).toArray();
    res.send(reportedItems);
  });

  // reported item delete by admin
  app.delete("/admin/reportedItems/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await booksCollection.deleteOne(query);
    res.send(result);
  });

  

  // add for advertised api 
  app.put("/seller/advertised/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        isAdvertised: true,
      },
    };
    const result = await booksCollection.updateOne(filter, updateDoc, options);
    res.send(result);
  });

  // get single buyer all order
  app.get("/buyer/myOrders", async(req, res) => {
    const email = req.query.email
    console.log(email)
    const query = {
      buyerEmail:email
    };
    const myOrders=await bookingCollection.find(query).toArray()
    res.send(myOrders)
  })

  app.get("/payment/:id", async (req, res) => {
    const id = req.params.id
    const query = { _id: ObjectId(id) }
    const orderItem = await bookingCollection.findOne(query)
    res.send(orderItem)
  });

  // get advertised book itmes
  app.get("/advertised", async (req, res) => {
    const query = {
      isAdvertised: true,
    };
    const avertisedItmes = await booksCollection.find(query).toArray();
    res.send(avertisedItmes);
  });

  // single category product data
  http: app.get("/singleCategory/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const catagory = await bookCategorysCollection.findOne(query);
    const catagoryName = catagory.category;
    const filter = {
      bookCategory: catagoryName,
    };
    const allSingleCategoryBook = await booksCollection.find(filter).toArray();
    res.send(allSingleCategoryBook);
  });

  app.get("/blogs", async (req, res) => {
    const query = {};
    const blogs = await blogsCollection.find(query).toArray();
    res.send(blogs);
  });

  // homepage book category api
  app.get("/categorys", async (req, res) => {
    const query = {};
    const categorys = await bookCategorysCollection.find(query).toArray();
    res.send(categorys);
  });

  // only book category name api
  app.get("/categoryNames", async (req, res) => {
    const query = {};
    const categoryName = await bookCategorysCollection
      .find(query)
      .project({ category: 1 })
      .toArray();
    res.send(categoryName);
  });

  //new user create api
  app.post("/users", async (req, res) => {
    const user = req.body;
    const userEmail = user.email;
    const query = { email: userEmail };
    const checkedEmail = await usersCollection.findOne(query);
    if (checkedEmail) {
      res.send({ acknowledged: true, message: "Your account was created." });
    } else {
      const result = await usersCollection.insertOne(user);
      res.send(result);
    }
  });

  // get all sellers
  app.get("/allSellers", async (req, res) => {
    const query = { role: "Seller" };
    const allSeller = await usersCollection.find(query).toArray();
    res.send(allSeller);
  });

  // get all buyers
  app.get("/allBuyers", async (req, res) => {
    const query = { role: "Buyer" };
    const allBuyers = await usersCollection.find(query).toArray();
    res.send(allBuyers);
  });

  // get all user
  app.get("/allusers", async (req, res) => {
    const query = {};
    const users = await usersCollection.find(query).toArray();
    res.send(users);
  });
}
run().catch(console.dir);



app.get("/", async (req, res) => {
  res.send("Book and Co server is running...");
});



app.listen(port, () => {
  console.log(`Book and Co running in ${port}`);
});
