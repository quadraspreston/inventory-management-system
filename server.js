//modules
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const session = require('express-session');
const path = require("path");



//Initialization
const app = express();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory'
});


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(session({
    secret: 'superSecretKey_12345!@#$%_changeThisLater', 
    resave: false,
    saveUninitialized: false
}));



//Landing

app.get("/", (req,res) => {
    res.render("landing", { session: req.session });
});

//Login

app.get("/login", (req,res) => {
    res.render("login");
});

app.post("/login",(req,res) =>{
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = ?`;
    connection.query(query, [email], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        const user=results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
                req.session.userId = user.user_id;
                req.session.userName = user.name;
                return res.json({ success: true });
            } else {
                return res.json({ success: false });
            }
        });
     });
});

//Sign Up

app.get("/signup", (req,res) => {
    res.render("signup");
});

app.post("/signup",(req,res) =>{
    const {name, email, password} = req.body;
    bcrypt.hash(password,10,(err,hashPassword) => {
        if(err) throw err;
    const userId = uuidv4();
    const insertUser = `
            INSERT INTO users (user_id, name, email, password)
            VALUES (?, ?, ?, ?)
        `;

    connection.query(insertUser, [userId, name, email, hashPassword], (err, results) => {
            if (err) {
                console.error(err.code);
                if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('email')) {
                    return res.json({ success: false, emailExists: true });
                }
                throw err;
            }
            return res.json({ success: true });
        });
    });
});

//Products

app.get("/products", (req,res) => {
    res.render("products", { session: req.session });
});



//start localhost

app.listen(3000,()=>{
    console.log(`Server Running on Port 3000`);
});
