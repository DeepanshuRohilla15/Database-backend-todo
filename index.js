const bcrypt = require("bcrypt")
const express = require('express')
const {TodoModel, UserModel } = require("./db");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const JWT_SECRET = "iamthebest";
const { z } = require("zod");

mongoose.connect("");
const app = express();
app.use(express.json());


app.post("/signup", async function(req, res){
    //input validation
    const requiredBody = z.object({
        email: z.string().min(3).max(100).email(),
        name: z.string().min(3).max(100),
        password: z.string().min(3).max(30)
    })

    const parsedDataWithSuccess  = requiredBody.safeParse(req.body);

    if(!parsedDataWithSuccess.success){
        res.json({
            message: "Incorrect format",
            error: parsedDataWithSuccess.error
        })
        return
    }



    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

   
    const hashedPassword = await bcrypt.hash(password, 5);

    await UserModel.create({
        email: email,
        password: hashedPassword,
        name: name
    })
})

app.post("/signin",async function(req, res){
    const email = req.body.email;
    const password = req.body.password;

    const user = await UserModel.findOne({
        email: email,
    })

    if(!user){
        res.status(403).json({
            message: "User does not exist in our db"
        })
        return
    }

    const passwordMatch = bcrypt.compare(password, user.password)

    if(passwordMatch)
    {
        const token = jwt.sign({
            id: user._id.toString()
        }, JWT_SECRET);

        res.json({
            token: token
        })
    }
    else{
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }
})


function auth(req, res, next){
    const token = req.headers.token;

    const decodedData = jwt.verify(token, JWT_SECRET);

    if(decodedData){
        req.userID = decodedData.id;
        next()
    }
    else{
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }
}

// create a todo
app.post("/todo", auth, async function(req, res){
    const userId = req.userID;
    const title = req.body.title;
    const done = req.body.done;

    await TodoModel.create({
        userId,
        title,
        done
    })

    res.json({
        message: "Todo created"
    })

})

// get all todos of user
app.get("/todos", auth, async function(req, res){
    const userId = req.userID;
    const todos = await TodoModel.find({
        userID: userId
    })


    res.json({
        todos: todos
    })
})


app.listen(3000)