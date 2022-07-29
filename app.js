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
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// const secret = process.env.SECRET_KEY
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', function(req, res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }
));

app.get('/auth/google/secrets', 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get('/login', function(req, res){
    res.render("login");
});

app.get('/register', function(req, res){
    res.render("register");
});

app.get('/secrets', function(req, res){
    User.find({secret: {$ne:null}}, function(err, foundUser){
        if(!err){
            if(foundUser){
                res.render("secrets", {userWithSecrets: foundUser});
            }
        }
    });
});

app.get('/submit', function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post('/submit', function(req, res){
    const secretSubmitted = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
        if(!err){
            if(foundUser){
                foundUser.secret = secretSubmitted;
                foundUser.save(function(err){
                    if(err){
                        console.log(err);
                    } else{
                        res.redirect("/secrets");
                    }
                });
            }
        } else {
            console.log(err);
        }
    });
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











