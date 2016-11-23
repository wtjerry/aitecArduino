var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var utils = require ('utils');
var passwordHash = require('password-hash');
var mime = require('mime-types')

var sessionStore = require('./bin/SessionStore.js').SessionStore;
var Database = require('./bin/Database.js').Database;
var SensorOccupied = require('./bin/SensorOccupied');

var all_session = new sessionStore();
var database = new Database();
var sensor = new SensorOccupied();

http.createServer(function (req, res){
    try{
        var stor = {
            'req': req,
            'res': res,
            cookie:  parseCookies(req),
            ncookie: '',
            pathname: url.parse(req.url).pathname,
            ipaddress: req.connection.remoteAddress
        };
        console.log("Request from: " + stor.ipaddress + "    path: " + stor.pathname);
        stor.session = all_session.startSession(stor);
        
        if(req.method=="POST"){
            post(req, function(post){
                stor.post = post;
                stor.pg = stor.post;
                serverRouting(stor, respondToRequest);
            });
        }else{
            stor.get = url.parse(req.url, true).query;
            stor.pg = stor.get;
            serverRouting(stor, respondToRequest);
        }
    }catch(error){
        console.log(error);
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end("<html><head><title>ERROR</title></head><body>Internal Server Error </body></html>"); 
    }
}).listen(8070);


function respondToRequest(stor){
    if(!(stor.error)){
        //var contentType = mime.lookup(stor.pathname);  //.substr(stor.pathname.lastIndexOf('.')+1)=='css'?'text/css':'text/html';
        
        stor.headCode = 200;
        stor.headInf = {'Content-Type': mime.lookup(stor.pathname), 'Set-Cookie': stor.ncookie, 'expires' : new Date(new Date().getTime()+86409000).toUTCString()};
        writeResponse(stor.headCode, stor.headInf, stor.content, stor.res, stor.session);
    }else{
        stor.headCode = 404;
        stor.headInf = {'Content-Type': 'text/html'};
        fs.readFile('public/error.html', function(error, dat){
            if(!error){
                stor.content=dat.toString();
            }else{
                stor.content="<html><head><title>ERROR</title></head><body>Internal Server Error</body></html>";
            }
            writeResponse(stor.headCode, stor.headInf, stor.content, stor.res);
        });
    }
};
function writeResponse(headCode, headInf, content, res, ses){
    all_session.updateSession(ses);
    res.writeHead(headCode, headInf);
    res.write(content);
    res.end();    
}
function serverRouting(stor, callback){
    stor.error = "";
    console.log("Post or Get variables: "+JSON.stringify(stor.pg));
    var prepareFile = function(file){
        fs.readFile('public/'+stor.pathname, function(err, dat){
            if(!err){
                stor.error = err;
                stor.content = dat.toString();
                callback(stor);
            }else{
                console.log(err);
                stor.content = "Error";
                callback(stor);
            }
        });
    };
    stor.pathname = ((stor.pathname=="/")?"/index.html": stor.pathname);
    switch(stor.pathname){
        //here you define all the pages, with special treatment.
        case '/index.html':
                if(isLogedIn(stor.session)){
                    stor.pathname = "/calendar.html";
                    prepareFile();
                }else{
                    stor.pathname = "/login.html";
                    prepareFile();
                }
            break;
        case '/request.html':
            switch(stor.pg.action){
                case 'test':
                    stor.content = JSON.stringify(isLogedIn(stor.session))+"<br>"+JSON.stringify(stor.session);
                    callback(stor);
                    break;
                case 'signing':
                    if(typeof stor.pg.username !== "undefined" && typeof stor.pg.password !== "undefined" ){
                        database.query("SELECT * FROM users WHERE username = ?", [stor.pg.username], function(err, row){
                            stor.content = "Something went wrong!!!";
                            if(!err){
                                if(row.length==1){
                                    if(passwordHash.verify(stor.pg.password, row[0].password)){
                                        stor.session.username = row[0].username;
                                        stor.session.surname = row[0].surname;
                                        stor.session.familyname = row[0].familyname;
                                        stor.session.email = row[0].email;
                                        all_session.updateSession(stor.session);
                                        stor.content = "success";               // TODO
                                    }else{
                                        stor.content = "Username or Password is wrong";
                                    }
                                }else{
                                    stor.content = "Username or Password is wrong";
                                }
                            }
                            callback(stor);
                        });
                    }else{
                        stor.content = JSON.stringify({error: "no valid inputs!"});
                        callback(stor);
                    }
                    break;
                case 'reservate':
                    if(typeof stor.pg.startdate !== "undefined" && typeof stor.pg.enddate !== "undefined" && typeof stor.pg.description !== "undefined" && isLogedIn(stor.session)){
                        database.query("SELECT count(*) FROM reservation WHERE date>=? AND date<=?",[stor.pg.startdate,stor.pg.enddate], function(error, rows){
                            stor.content = {message: "This date is already reserved"};
                            if(!error){
                                if(row.length==0){
                                    database.query(""/* TODO */, [stor.pg.startdate, stor.pg.enddate, stor.pg.description, stor.session.username], function(err, row){
                                        //TODO
                                    });
                                }
                            }
                        });
                    }
                    break;
                case 'getreservation':
                    if(typeof stor.pg.month !== "undefined"){
                        database.query("SELECT * FROM reservation WHERE date>=? AND date<=?", [stor.pg.month, stor.pg.month], function(error, rows){
                            if(!error){
                                stor.content = rows;
                            }else
                                stor.content = {message: "There went something horrible wrong"};
                        });
                    }
                    break;
               case 'signup':
                    if(stor.pg.username && stor.pg.password && stor.pg.email && stor.pg.surname && stor.pg.familyname){
                        database.query("SELECT * FROM user WHERE username=?", [stor.pg.username], function(error, rows){
                            if(!error){
                                database.query("SELECT * FROM user WHERE email=?", [stor.pg.email], function(err, row){
                                    if(!error){
                                        database.query( ""/*TODO*/, [stor.pg.username, stor.pg.email, stor.pg.password, stor.pg.surname, stor.pg.familyname], function(e, r){
                                            if(!error){
                                                // TODO SUCCESS
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    break;
                default:
                    prepareFile();
            }
            break;
        case '/sensordata':
            if(stor.post.sensor1 && stor.post.sensor2 && stor.post.isoccupied){
                if(sensor.updateSensors(stor.post.sensor1, stor.post.sensor2, stor.post.isoccupied)){
                    database.query("SELECT * FROM reservation WHERE startdate<=now() AND enddate>=now()", function(error, rows){
                        if(!error){
                            stor.content = rows.length;
                        }else
                            stor.content = -1;
                    });
                }else{
                    stor.content = -1;
                }
            }
            break;
        case '/calendar.html':
            if(!isLogedIn(stor.session)){
                prepareFile();
            }else{
                stor.pathname = "/login.html";
                prepareFile();                
            }
            break;
        default:
            prepareFile();
    }
}
function post(req, callback){
    var fullBody='';
    req.on('data', function(ret){
        fullBody += ret.toString();
    });
    req.on('end', function(){
        // parse the received body data
        var decodedBody = querystring.parse(fullBody);
        callback(decodedBody);
    });
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}
function isLogedIn(session){
    return (typeof session.username !== "undefined");
}
console.log('Server running at http://127.0.0.1:8070/');
database.testConnection();
