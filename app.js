const cookieParser = require('cookie-parser');
const express=require('express');
const app=express();
var jwt = require('jsonwebtoken');
app.set('view engine', 'ejs');
const bcrypt = require ('bcrypt');
const mongoose=require('mongoose');
const User=require('./models/user');
const ProfileIds=require('./models/profileIds');
const path = require('path');
const axios = require('axios');
require('dotenv').config()
// const user = require('./models/user');

app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // To handle form data
app.use(express.static('public')); 


const PORT      = process.env.PORT


//Home page routs
app.get('/',function(req,res){
    res.render('homePage');
})



app.get('/register',function(req,res){
    res.render('register');
})

app.post('/register',function(req,res){
    var email=req.body.email;
    var password=req.body.password;
    var username=req.body.username;
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            let user=new User({
                email:email,
                password:hash,
                username:username
            })
            user.save()
            .then(() => {
                var token= jwt.sign({email},'secret');
                console.log("User saved:", user);
                res.cookie("token",token);
                console.log(req.cookies.token);
                res.render('login');
            })
            .catch((err) => {
                console.error("Error saving user:", err);
                res.status(500).send("Error saving user");
            });;
            console.log(user);
        });
    });
    
})

app.get('/logout',function(req,res){
    res.clearCookie("token");
    res.redirect("/");

})

app.get('/login',function(req,res){
    res.render('login');
})

app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    User.findOne({ email: email }).then((user) => {
        if (!user) {
            return res.send(`
                <script>
                    alert('User Not found');
                    window.location.href = '/login';
                </script>
            `);
        }

        bcrypt.compare(password, user.password, function(err, result) {
            if (err) {
                return res.send(`
                    <script>
                        alert('User Not found');
                        window.location.href = '/login';
                    </script>
                `);
            }
            if (result) {
                var token = jwt.sign({ email }, 'secret');
                res.cookie("token", token);
                console.log("Token set:", token);
                res.redirect("userHome");
            } else {
                return res.send(`
                    <script>
                        alert('Password is Incorrect');
                        window.location.href = '/login';
                    </script>
                `);
            }
        });
    }).catch((err) => {
        console.error("Error during login:", err);
        res.status(500).send("Internal Server Error");
    });
});


//middleware for authentication
async function authenticate(req,res,next){
    const token=req.cookies.token;
    if (!token) {
        return res.send(`
            <script>
                alert('Please log in first!');
                window.location.href = '/login';
            </script>
        `);
    }
    try {
        const decoded = jwt.verify(token, 'secret');
        req.user = await User.findOne({email:decoded.email}); // (optional) to use user info later
        next();
    } catch (err) {
        return res.send(`
            <script>
                alert('Session expired or invalid. Please log in again.');
                window.location.href = '/login';
            </script>
        `);
    }
}



//landing page routes
app.get('/userHome',authenticate,function(req,res){
    console.log("Authenticated user:", req.user);
    res.render('userHome',{user:req.user});
})


app.get('/profile',authenticate,function(req,res){
    res.render('profile',{user:req.user})
})

app.get('/addIds',authenticate,function(req,res){

    res.render('addIds',{user:req.user})
})

app.post('/addIds',authenticate,function(req,res){
    var platform=req.body.platform;
    var profileId=req.body.profileId;
    var email=req.user.email;
    var profileObject=new ProfileIds({
        email:email,
        platform:platform,
        profileId:profileId
    });
    profileObject.save()
        .then(()=>{
           res.redirect('/addIds');
        })
        .catch((err)=>{
            res.status(500).send("Internal Server Error");
        });
    });
 




app.get('/showIds',authenticate,async function(req,res){
    var allIds=await ProfileIds.find({email:req.user.email});
    res.render('showIds',{allIds:allIds,user:req.user});
})
// app.get('/verify',function(req,res){
//     token=req.cookies.token;
//     var decoded = jwt.verify(token, 'secret');

//     console.log(decoded)
// })




//codeforces apis
// Codeforces APIs
app.get('/codeforces', authenticate, async function(req, res) {
    try {
        const profileIdData = await ProfileIds.findOne({
            email: req.user.email,
            platform: 'Codeforces'  // Make sure this matches exactly how you store it in the DB
        });
        
        // Use the profile ID from database, or show an error if not found
        const handle = profileIdData ? profileIdData.profileId : null;
        
        if (!handle) {
            return res.send(`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Codeforces Profile Not Found</h2>
                    <p>You haven't added your Codeforces profile ID yet.</p>
                    <p><a href="/addIds">Add your Codeforces ID</a></p>
                    <p><a href="/userHome">Return to Dashboard</a></p>
                </div>
            `);
        }
        
        console.log(`Fetching Codeforces data for ${handle}...`);
        
        const ratings = await axios.get(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`);
        const recentSubmissions = await axios.get(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10`);
        
        res.render('codeforces', {
            handle: handle,
            ratings: ratings.data.result,
            user: req.user,
            recentSubmissions: recentSubmissions.data.result
        });
    } catch (err) {
        console.error('Codeforces route error details:', err);
        
        return res.send(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Codeforces API Error</h2>
                <p>We couldn't fetch data from the Codeforces API.</p>
                <p>This could be due to:</p>
                <ul>
                    <li>The Codeforces API is currently down</li>
                    <li>User handle doesn't exist on Codeforces</li>
                    <li>Network connectivity issues</li>
                </ul>
                <p>Try again later or check your handle.</p>
                <p><a href="/userHome">Return to Dashboard</a></p>
            </div>
        `);
    }
});



// codechef apis
app.get('/codechef', authenticate, async function(req, res) {
    
    try{
        const profileIdData = await ProfileIds.findOne({
            email: req.user.email,
            platform: 'CodeChef'  
        });
        
        const handle = profileIdData ? profileIdData.profileId : null;
        
        if (!handle) {
            return res.send(`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>CodeChef Profile Not Found</h2>
                    <p>You haven't added your CodeChef profile ID yet.</p>
                    <p><a href="/addIds">Add your CodeChef ID</a></p>
                    <p><a href="/userHome">Return to Dashboard</a></p>
                </div>
            `);
        }
        const profile = await axios.get(`https://codechef-api.vercel.app/handle/${handle}`);
        // console.log(req.user);
        res.render('codechef',{profile:profile.data,user:req.user,handle:handle});
    }
    catch(error){
        res.send("Error Occured");
        console.log(error);
    }
});


// AtCoder APIs and routes
app.get('/atcoder', authenticate, async function(req, res) {
  
  try {
    const profileIdData = await ProfileIds.findOne({
      email: req.user.email,
      platform: 'AtCoder'  // Make sure this matches exactly how you store it in the DB
    });
    
    // Use the profile ID from database, or show an error if not found
    const handle = profileIdData ? profileIdData.profileId : null;
    
    if (!handle) {
      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>AtCoder Profile Not Found</h2>
          <p>You haven't added your AtCoder profile ID yet.</p>
          <p><a href="/addIds">Add your AtCoder ID</a></p>
          <p><a href="/userHome">Return to Dashboard</a></p>
        </div>
      `);
    }
    
    console.log(`Fetching AtCoder data for ${handle}...`);
    
    const infoRes = await axios.get(
      `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`
    );
    
    const submissionsRes = await axios.get(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=0`
    );
    
    if (!infoRes.data || infoRes.data.length === 0) {
      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>User Not Found</h2>
          <p>We couldn't find any data for user "${handle}" on AtCoder.</p>
          <p>Please check the username and try again.</p>
          <p><a href="/userHome">Return to Dashboard</a></p>
        </div>
      `);
    }
    console.log("AtCoder user data fetched successfully");
    
    const successfulSubmissions = submissionsRes.data
      .filter(sub => sub.result === "AC")
      .slice(0, 10); // Get the 10 most recent
    
    const profile = {
      user_id: handle,
      rating: "See chart below", 
      highest_rating: "See chart below"
    };
    
    const ratingData = infoRes.data || [];
    
    res.render('atcoder', {
      profile,
      ratingData,
      successfulSubmissions,
      user: req.user,
      handle
    });
  }
  catch (err) {
    console.error('AtCoder route error details:', err);
    
    return res.send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>AtCoder API Error</h2>
        <p>We couldn't fetch data for user "${handle}" from the AtCoder API.</p>
        <p>This could be due to:</p>
        <ul>
          <li>The AtCoder API is currently down or has changed</li>
          <li>User "${handle}" doesn't exist on AtCoder</li>
          <li>Network connectivity issues</li>
        </ul>
        <p>Try again later or try a different username.</p>
        <p><a href="/userHome">Return to Dashboard</a></p>
      </div>
    `);
  }
});



app.listen(PORT, () => 
  console.log(`Server running on http://localhost:${PORT}`)
)
