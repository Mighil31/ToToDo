var express = require("express"),
    methodOverride = require("method-override"),
    // expressSanitizer = require("express-sanitizer"),
    passport = require("passport"),
    passportLocalMongoose = require("passport-local-mongoose"),
    LocalStrategy = require("passport-local"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
	app = express();
	

mongoose.connect("mongodb://localhost/totodo", {
	useNewUrlParser: true,
	useFindAndModify: false});
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: true}));
// app.use(expressSanitizer());


// MONGOOSE MODEL CONFIG
var todoSchema = new mongoose.Schema({
    title: String,
    body: String,
    created: {type:Date, default: Date.now}
});

var Todo = mongoose.model("Todo", todoSchema);


//PASSPORT CONFIG

var UserSchema = new mongoose.Schema({
	username: String, 
	password: String
});

UserSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", UserSchema);

app.use(require("express-session")({
	secret: "askjdnakjncd kaj dkjas dkajs dja nsd",
	resave: false,
	saveUninitialized: false
}));

app.use(function(req, res, next){
	 res.locals.currentUser = req.user;
	 next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//ROUTES

app.get("/", function(req, res){
    res.render("landing");
});

app.get("/todos", isLoggedIn, function(req, res){

	Todo.find({}, function(err, todos){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("index", {todos: todos, currentUser: req.user}); 
        }
    })
});

app.get("/todos/new", isLoggedIn, function(req, res){
    res.render("new");
});

app.post("/todos", isLoggedIn, function(req, res){
    Todo.create(req.body.todo, function(err, newTodo){
        if(err)
        {
            res.render("new");
        }
        else
        {
            res.redirect("/todos");
        }
    })
});

app.get("/todos/:id", isLoggedIn, function(req, res) {
    Todo.findById(req.params.id, function(err, foundTodo){
        if(err)
        {
            res.redirect("/todos");
        }
        else
        {
            res.render("show", {todo: foundTodo});
        }
    })
});

app.get("/todos/:id/edit", isLoggedIn, function(req, res){
	Todo.findById(req.params.id, function(err, foundTodo){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("edit", {todo: foundTodo});
		}
	})
});

app.put("/todos/:id", isLoggedIn, function(req, res){
	Todo.findByIdAndUpdate(req.params.id, req.body.todo, function(err, updatedTodo){  //syntax-findByIdAndUpdate(id, newData, callback)
		if(err)
		{
			res.redirect("/todos")
		}
		else
		{
			res.redirect("/todos/" + req.params.id);
		}
	}) 
});

//DELETE ROUTE
app.delete("/todos/:id", function(req, res){
	Todo.findByIdAndRemove(req.params.id, function(err){
		if(err)
		{
			res.redirect("/todos")
		}
		else
		{
			res.redirect("/todos")
		}
	})
});


// AUTH ROUTES

app.get("/register", function(req, res){
	res.render("register");
})

app.post("/register", function(req, res){
	var newUser = new User({username:req.body.username});
	User.register( newUser, req.body.password, function(err, user){
		if(err)
		{
			console.log(err);
			res.render("register");
		}
		else
		{
			passport.authenticate("local")(req, res, function(){
				res.redirect("/todos")
			})
		}
	});
})

app.get("/login", function(req, res){
	res.render("login");
})

app.post("/login", passport.authenticate("local", 
	{
		successRedirect:"/todos",
		failureRedirect:"/login"
	}), function(req, res){

});

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}


app.listen(3000, () => {
  console.log(`Server running `);
});



