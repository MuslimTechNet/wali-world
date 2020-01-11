const express       =       require('express');
const bodyParser    =       require("body-parser");
const path          =       require('path');
const serveFavicon  =       require('serve-favicon');
const mysql         =       require("mysql");
const os            =       require("os");
const crypto        =       require("crypto");
const nodemailer    =       require("nodemailer")
const session       =       require("express-session"); 
const fs            =       require("fs");
const app = express();

console.log(process.env);

/*
    Here we are configuring our SMTP Server details.
    STMP is mail server which is responsible for sending and recieving email.
*/
var smtpTransport = nodemailer.createTransport({ //Only works when https://myaccount.google.com/lesssecureapps?pli=1 is set to on.
    service: "Gmail",
    auth: {
        user: "wali.family.islamic.services",
        pass: "4eU0&3HPNP"
    }
});
var mailOptions,host,link;
/*------------------SMTP Over-----------------------------*/




function getMysqlPass(){
    console.log(os.hostname())
    if (os.hostname()==="nick.fios-router.home" || "nick.local") return "plplpl";
}

function hashPassword(password) {
    //https://stackoverflow.com/questions/17201450/salt-and-hash-password-in-nodejs-w-crypto
    
    return new Promise((resolve,reject)=>{
        var salt = crypto.randomBytes(128).toString('base64');
        var iterations = 10000;
        var hash = crypto.pbkdf2(password, salt, iterations,64,'sha512',(err,derivedKey)=>{
            if (err) reject(err);
            resolve( {
                salt: salt,
                hash: derivedKey,
                iterations: iterations
            });
        });
    
        
    });
   
}

function isPasswordCorrect(painTextPassword, savedHash, savedSalt, savedIterations) {
    //https://stackoverflow.com/questions/17201450/salt-and-hash-password-in-nodejs-w-crypto
    return new Promise((resolve,reject)=>{

        crypto.pbkdf2(painTextPassword, savedSalt, savedIterations,64,'sha512',(err,derivedKey)=>{//wait this shouldn't be saved hash
            if (err) reject(err);
            const derivedKeyString = derivedKey.toString();
            
            if (savedHash == derivedKeyString) resolve(true)
            else resolve(false);
        });
    })
    
}

const connection = mysql.createConnection( {
    user: "root",
    password: getMysqlPass(),
    host: "127.0.0.1",
    database: "wali",
    charset : 'utf8mb4'
});
connection.connect();

const {
    PORT = 4000,
    NODE_ENV = 'development',
    SESS_NAME = 'sid',
    TWO_WEEKS =  1000*60*60*24*14,
    SESS_SECRET = 'sensiblevalue'
} = process.env;



app.use(serveFavicon(path.join(__dirname, 'public/favicon_io', 'favicon.ico')))
app.use(bodyParser.urlencoded({ extended: false })); //probably should be true based on session auth demo
app.use(bodyParser.json());
app.set('trust proxy', true)

app.use(session({
    name:SESS_NAME,
    resave:false,
    //saveUninitialized:false, //make false later when everything is set.
    saveUninitialized: true,
    secret: SESS_SECRET,
    cookie: {
        maxAge: TWO_WEEKS,
        //sameSite: true, //strict (this breaks sessions)
        secure: false //dev mode
    }
  }));

  app.use((req,res,next)=>{
      if (req.url=='/') console.log(req.sessionID)
      const { userEmail } = req.session;
      if (userEmail) {
          res.locals.user = {
              value:'whatever youre logged in'
          }
      }
      next();
  })

  app.get(['','/','/login','/make-profile','/register','/profiles','/email'],function(req,res){

    res.sendFile(path.resolve(__dirname, 'public/', 'index.html'));
});

app.get('/api/profiles',(req,res)=>{
    const ret = {};
    connection.query('SELECT * FROM suitor_profile',(err,rows,cols)=>{
        ret.suitorProfiles = rows;
        connection.query('SELECT * FROM wali_profile',(err,rows,cols)=>{
            ret.waliProfiles = rows;
            res.json(ret);
        });
        
    })
})

app.get('/isLoggedIn',(req,res)=>{
    const { userEmail } = req.session;

    if (userEmail) res.end('true');
    else res.end('false')
})

app.use(express.static('public'))

//is browser not sending cookie?


app.get('/verify',function(req,res){

    connection.query('SELECT * FROM registration WHERE email=?',[req.query.email],(err,rows,cols)=>{
        
    if(req.protocol+"://"+req.get('host')=="http://"+rows[0].send_request_host){     //if the protocol and URL is the same as the protocol and URL from the '/send' call (pas to be stored in database I guess?)

        console.log("Domain is matched. Information is from Authentic email");
        if(req.query.id==rows[0].email_verification_id){
            connection.query('UPDATE registration SET emailVerified=? WHERE email=?',[true,req.query.email],(err,rows,cols)=>{
                console.log("email is verified");
                res.end("<h1>Email "+req.query.email+" is been Successfully verified");
            })
            
        }
        else{
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    }
    else{
        res.end("<h1>Request is from unknown source");
    }
})
});


app.get('/thankyou',function(req,res){

   res.send("Thank you for your submission!");
})

app.get('/register-error',(req,res)=>{

    res.send('There was an error registering');
})




app.post('/make-profile/submit',function(req,res){
    console.log(req.body);
    connection.query('INSERT INTO suitor_profile(bio,looking_for) VALUES(?,?)',[req.body.descriptionofyou,req.body.descriptionofspouse],(err,row,col)=>{
        if (err) {
            res.end('A weird error was thrown');
        }
        else{
            res.end('success');
        }
    })
});

app.post('/login/submit',function(req,res){

    connection.query('SELECT * FROM registration WHERE email=?',[req.body['contact-info']],(err,row,col)=>{

        if (err) {
            res.end('A weird error was thrown');
        }
        else if (!row.length){
            res.end('This user does not exist');
        }
        else{
                isPasswordCorrect(req.body.password,row[0].password,row[0].salt,parseInt(row[0].password_iterations,10)).then(is=>{
                    console.log(is)
                    if (is) {
                        res.end('success');
                        req.session.user = {
                            email:row[0].email
                        }
                        req.session.userEmail = 'does this work';
                        req.session.save();
                    }
                    else{
                        res.end('The password is incorrect');
                    }
                }).catch(e=>{
                    console.log(e);
                    res.end('A weird error was thrown');
                })
                
        }


    })
});

app/*.post*/.get('/logout',(req,res)=>{

    req.session.destroy(err => {
        
        if (err) {
            //why would there be an err though
        }
        res.clearCookie(SESS_NAME);
    })
});

app.post('/emailcheck',function(req,res){

    let email = req.body['email'];
    connection.query('SELECT email FROM registration WHERE email=?',[email],(err,rows,col)=>{
        if (rows.length) res.end('Username is taken');
        else res.end('success');
    });
})

app.post('/register/submit',function(req,res){

    let contactInfo = req.body['contact-info'];
    //let host = req.get('host');
    let host = req.headers.host;
    hashPassword(req.body.password).then(results=>{

        connection.query(`INSERT INTO registration(email,password,salt,password_iterations) VALUES(?,?,?,?)`,[contactInfo,results.hash.toString(),results.salt,results.iterations],(err,row,col)=>{
            if (err) {
                console.log(err);
                if (err.code && err.code == 'ER_DUP_ENTRY'){
                    res.end('Username is taken')
                }
                else res.end('A weird error was thrown');
            }
            else {

                //If you get an error here then call it again, it says Duplicate entry 'nickmanning214@gmail.com' for key 'PRIMARY'

                const rand=Math.floor((Math.random() * 100) + 54);
                console.log("THE HOST THOUGH",[rand,host,req.query.to])
                connection.query('UPDATE registration SET email_verification_id=?, send_request_host=? WHERE email=?',[rand,host,contactInfo],(err,rows,cols)=>{
                    console.log(rows)
                    if (err) res.end('A weird error was thrown')
                    else{
                        smtpTransport.sendMail({
                            to : contactInfo,
                            subject : "Please confirm your Email account",
                            html : `Hello,<br> Please Click on the link to verify your email.<br><a href="http://${req.get('host')}/verify?id=${rand}&email=${encodeURIComponent(contactInfo)}">Click here to verify</a>`
                        }, function(error, response){
                            if(error){
                                    console.log("Hmmm")
                                   console.log(error,contactInfo);
                                   res.end('A weird error was thrown')
                            }else{
                                   console.log("Message sent: " + response.message);
                               res.end("sent");
                                }
                           });
                           
                    }
                });
            }
        })
    });


   
})







const server = app.listen(4000,function(){

});
