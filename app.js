require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

const db = require('./Models/index');
const userRoutes = require('./routes/Auth/userRouts');

try {
    db.sequelizeConfig.sync();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({ 
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(userRoutes);

app.listen(process.env.PORT, (err) => {
    if(err) {
        console.log('Error', err);
    }
    console.log(`Example app listening at http://localhost:${process.env.PORT}`)
})

