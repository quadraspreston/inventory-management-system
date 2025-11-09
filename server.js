const express = require("express");
const path = require("path");
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:true}));   
app.use(express.json());



//Landing

app.get("/", (req,res) => {
    res.render("landing");
});

//Login

app.get("/login", (req,res) => {
    res.render("login");
});

app.post("/login",(req,res) =>{

});

//Sign Up

app.get("/signup", (req,res) => {
    res.render("signup");
});

app.post("/signup",(req,res) =>{
    
});

//Products

app.get("/products", (req,res) => {
    res.render("products");
});




app.listen(3000,()=>{
    console.log(`Server Running on Port 3000`);
});
