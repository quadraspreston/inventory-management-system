//modules
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const session = require('express-session');
const path = require("path");
const pdf = require('html-pdf');
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('hex');


//Initialization
const app = express();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory'
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.code);
        process.exit(1);
    }
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(session({
    secret: key, 
    resave: false,
    saveUninitialized: false
}));


//Middleware

function requireLogin(req,res,next)
{
    if(!req.session.userId)
        return res.redirect('/');
     next();
}

function redirectLogin(req,res,next)
{
    if(req.session.userId)
         return res.redirect('/products');
    next();
}

//Logout

app.get('/logout',(req,res) => {
    req.session.destroy(err =>{
        if (err) console.log(err);
        res.redirect('/');
    });
});

//Invoice

app.get('/invoice/:transactionId', requireLogin, (req, res) => {
  const transactionId = req.params.transactionId;
  const user_id = req.session.userId;

  const query = `
    SELECT t.transaction_id, t.product_name, t.category, t.unit_price, t.quantity, t.total_price, t.transaction_date,
           buyer.name AS buyer_name, seller.name AS seller_name,
           t.buyer_id, t.seller_id
    FROM transactions t
    JOIN users buyer ON t.buyer_id = buyer.user_id
    JOIN users seller ON t.seller_id = seller.user_id
    WHERE t.transaction_id = ? AND (t.buyer_id = ? OR t.seller_id = ?);
  `

  connection.query(query, [transactionId, user_id, user_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }

    if (results.length === 0) {
      const checkQuery = `SELECT transaction_id FROM transactions WHERE transaction_id = ?`;
      connection.query(checkQuery, [transactionId], (err, checkResults) => {
          if (checkResults.length === 0) {
              return res.status(404).send('Transaction not found');
          } else {
              return res.status(403).send('Unauthorized - You cannot access this transaction');
          }
      });
      return;
    }

    const transaction = results[0];

    res.render('invoice', { transaction}, (err,html) => {
        if(err) return res.status(500).send('Error generating invoice');

        pdf.create(html).toBuffer((err,buffer) =>{
            if(err) return res.status(500).send('PDF generation failed');
            res.type('pdf');
            res.setHeader('Content-Disposition',`inline; filename=invoice.pdf`);
            res.send(buffer);
        });       
    }); 
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
        if (err) return res.status(500).json({success:false});
        if (results.length === 0) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        const user=results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({success:false});

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
        if (err) return res.status(500).json({success:false});
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
                return res.status(500).json({success:false});
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
            return res.json({success:false,message: "Error loading products" });
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

app.get('/orders', requireLogin, (req, res) => {
    const userId = req.session.userId;
    
    const query = `
        SELECT products.*, users.user_id, users.name AS seller_name FROM products
        JOIN users ON products.user_id = users.user_id 
        WHERE products.user_id != ? AND quantity > 0
    `;
    
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.json({success:false, message: "Error loading orders" });
        }
        res.render('orders', { products: results,session: req.session, activePage: 'orders' });
    });
});

//Billing

app.get("/billing/:productId", requireLogin, (req, res) => {
    const userId = req.session.userId;
    const productId = req.params.productId;

    const query = `
        SELECT product_id, product_name, category, retail_price, wholesale_price, quantity,
        name AS seller_name
        FROM products 
        JOIN users ON users.user_id = products.user_id
        WHERE product_id = ? AND products.user_id != ?
    `;

    connection.query(query, [productId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.json({success:false, message: "Error has Occured" });
        }

        if (results.length === 0) {
            return res.json({success:false, message: "Product not found or cannot enter your own Product" });
        }
        const product = results[0];
        res.render("billing", { product, session: req.session, activePage:"billing"}); 
    });
});

app.post("/billing", requireLogin, (req, res) => {
    const userId = req.session.userId;
    const { productId, qty, totalPrice } = req.body;

    if (!productId || !qty || qty <= 0 || !totalPrice) {
        return res.json({ success: false, message: "Invalid order data" });
    }

    connection.beginTransaction(err =>{
        if (err) return res.json({ success: false, message: "Transaction Failed" });
    });

    const query1 = `
        INSERT INTO transactions (buyer_id, seller_id, product_name, category, unit_price, quantity, total_price, transaction_date)
        SELECT ?, u.user_id, p.product_name, p.category,
        CASE WHEN ?>=10 THEN p.wholesale_price ELSE p.retail_price END AS unit_price, ? AS quantity, ?, NOW() AS transaction_date
        FROM products p
        JOIN users u ON p.user_id = u.user_Id 
        WHERE p.product_id = ?;
    `;

    connection.query(query1, [userId, qty, qty, totalPrice, productId], (err, result) => {
        if (err) {
            console.error(err);
            return connection.rollback(() => res.json({ success: false, message: "Record Failed" }));
        }
        const query2 = ` UPDATE products 
        SET quantity= quantity-?
        WHERE product_id = ?;
    `;

    connection.query(query2, [qty, productId], (err, result) => {
        if (err) {
            console.error(err);
            return connection.rollback(() => res.json({ success: false, message: "Failed to Update Stock" }));
        }
    connection.commit(err => {
        if (err) {
            return connection.rollback(() => res.json({ success: false, message: "Transaction Commit failed" }));
        }
        return res.json({ success: true});
    });   
});
});
});


//Transactions

app.get('/transactions', requireLogin, (req, res) => {
    const userId = req.session.userId; 

    const salesQuery = `
        SELECT t.*, u.name AS buyer_name
        FROM transactions t
        JOIN users u ON t.buyer_id = u.user_id
        WHERE t.seller_id = ?
        ORDER BY t.transaction_date DESC
    `;

    const purchasesQuery = `
        SELECT t.*, u.name AS seller_name
        FROM transactions t
        JOIN users u ON t.seller_id = u.user_id
        WHERE t.buyer_id = ?
        ORDER BY t.transaction_date DESC
    `;

    connection.query(salesQuery, [userId], (err, salesData) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        connection.query(purchasesQuery, [userId], (err, purchaseData) => {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }

            res.render('transactions', {
                session: req.session,
                sales: salesData,
                purchases: purchaseData,
                activePage: 'transactions'
            });
        });
    });
});



//start localhost

app.listen(3000,()=>{
    console.log(`Server Running on Port 3000`);
});
