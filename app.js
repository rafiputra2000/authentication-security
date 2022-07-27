//jshint esversion:6
require('dotenv').config() //untuk modul process.env.anything penyimpan secret Key
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.use(session({
    secret: "this is our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);


// const secret = process.env.SECRET_KEY
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res){
    res.render("home");

});

app.get('/login', function(req, res){
    res.render("login");

});

app.get('/register', function(req, res){
    res.render("register");

});

app.get('/secrets', function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get('/logout', function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/");
      });
});

app.post('/register', function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
    
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    
    //     newUser.save(function(err){
    //         if(!err){
    //             res.render("secrets");
    //         } else {
    //             console.log(err);
    //         }
    //     })
    // });
});

app.post('/login', function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    })
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username}, function(err, foundUser){
    //     if(!err){
    //         if(foundUser){
    //             // if(foundUser.password === password){
    //             //     res.render("secrets")
    //             // } 
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 if(!err){
    //                     if(result === true){
    //                         res.render("secrets");
    //                     }
    //                 }
    //             });
    //         } else {
    //             //alert(username + " username is wrong please check your username again");
    //         }
    //     } else {
    //         console.log(err);
    //     }

    // });

});

app.listen(3000, function(err){
    if(!err){
        console.log("Server running on port 3000");
    }
});











