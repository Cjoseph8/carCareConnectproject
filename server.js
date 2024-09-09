require('dotenv').config();
const mongoose = require('mongoose');
const customerRouter= require('./router/customerRouter');
const mechRouter = require('./router/mechRouter')
const bookingRouter =require('./router/bookingRouter')
const express = require("express");
const cors = require('cors')


const app = express();

app.use(cors({origin: "*"}));


app.use(express.json());

app.get(`/`, (req, res)=>{
    res.send(`Welcome to CarCare Connect!`)
})
// Use the user routes
app.use('/api/v1', customerRouter);
app.use('/api/v1', mechRouter);
app.use('/api/v1', bookingRouter);


const port = process.env.port


mongoose.connect(process.env.DataBase)
.then(()=>{
    console.log('Server is connected to DATABASE Successfully..')
    app.listen(port, ()=>{
        console.log(`Connection to PORT is Successfull...`)
    })
}).catch((err)=>{
    console.log('Error connecting to DATABASE..' +err)
})