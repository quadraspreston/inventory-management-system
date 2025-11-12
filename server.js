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


//Middleware

function requireLogin(req,res,next)
{
    if(!req.session.userId)
        res.redirect('/');
    else
        next();
}

function redirectLogin(req,res,next)
{
    if(req.session.userId)
        res.redirect('/products');
    else
        next();
}

//Logout

app.get('/logout',(req,res) => {
    req.session.destroy(err =>{
        if (err) console.log(err);
        res.redirect('/');
    });
});


//Landing

app.get("/",redirectLogin,(req,res) => {
    res.render("landing", { session: req.session });
});

//Login

app.get("/login", redirectLogin, (req,res) => {
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

app.get("/signup", redirectLogin, (req,res) => {
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
            else {
            req.session.userId = userId;
            req.session.userName = name;
            return res.json({ success: true });
            }
        });
    });
});

//Products

app.get("/products", requireLogin, (req, res) => {
    const userId = req.session.userId;

    const query = `
        SELECT * FROM products
        WHERE user_id = ?
    `;

    connection.query(query, [userId], (err, products) => {
        if (err) {
            console.error(err);
            return res.render("error", { message: "Error loading products" });
        }
        res.render("products", { products, session: req.session , activePage: "products"});
    });
});

app.post("/products/add", requireLogin, (req,res) => {
    const { productName, category, retailPrice, wholesalePrice, quantity } = req.body;
    const userId = req.session.userId;

    const insertProduct = `
        INSERT INTO products (user_id, product_name, category, retail_price, wholesale_price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(insertProduct, [userId, productName, category, retailPrice, wholesalePrice, quantity], (err, results) => {
        if(err) {
            console.error(err);
            return res.json({ success: false });
        }
        return res.json({ success: true });
    });
});

app.post("/products/edit", requireLogin, (req,res) =>
{
     const { productId, retailPrice, wholesalePrice, quantity } = req.body;
    const userId = req.session.userId;

    const updateProduct = `
        UPDATE products
        SET retail_price = ?, wholesale_price = ?, quantity = ?
        WHERE id = ? AND user_id = ?
    `;

    connection.query(updateProduct, [retailPrice, wholesalePrice, quantity, productId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false });
        }

        return res.json({ success: true });
    });
});

app.post("/products/delete", requireLogin, (req, res) => {
    const { productId } = req.body;
    const userId = req.session.userId;

    const deleteProduct = `
        DELETE FROM products
        WHERE product_id = ? AND user_id = ?
    `;

    connection.query(deleteProduct, [productId, userId], (err) => {
        if (err) {
            console.error(err);
            return res.json({ success: false });
        }

        return res.json({ success: true });
    });
});


//Orders

app.get("/orders", requireLogin, (req, res) => {
    const userId = req.session.userId;
    const query = ``;

    connection.query(query, [userId], (err, products) => {
        if (err) {
            console.error(err);
            return res.render("error", { message: "Error loading orders" });
        }
        res.render("orders", { products, session: req.session, activePage: "orders" });
    });
});

//Transactions

app.get("/transactions", requireLogin, (req, res) => {
    const userId = req.session.userId;

    const query = ``;

    connection.query(query, [userId], (err, orders) => {
        if (err) {
            console.error(err);
            return res.render("error", { message: "Error loading transactions" });
        }
        res.render("transactions", { transactions, session:req.session, activePage: "transactions"});
    });
});


//start localhost

app.listen(3000,()=>{
    console.log(`Server Running on Port 3000`);
});
