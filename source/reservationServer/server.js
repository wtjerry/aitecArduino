var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var utils = require ('utils');
var mysql = require('mysql');
var crypto = require('crypto');
var sessionStore = require('./bin/SessionStore').SessionStore;
//cannot download crypto at work.

var all_session = new sessionStore();

http.createServer(function (req, res){
    try{
        var database = new Database();
        database.connection.connect(function(err){
            if(err){
                console.log("error when connecting to db");

            }
        });
        database.connection.end();
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
}).listen(80);


function respondToRequest(stor){
    if(!(stor.error)){
        stor.headCode = 200;
        stor.headInf = {'Content-Type': 'text/html', 'Set-Cookie': stor.ncookie};
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
    var prepareFile = function(){
        fs.readFile('public/'+stor.pathname, function(err, dat){
            stor.error = err;
            stor.content = dat.toString();

            callback(stor);
        });
    }
    stor.pathname = ((stor.pathname=="/")?"/index.html": stor.pathname);

    //if(Object.keys(stor.pg).length === 0){
        //if no get and POST were given
        switch(stor.pathname){
            //here you define all the pages, with special treatment.
            case '/index.html':
                switch(stor.pg.action){
                    case 'test':
                        stor.content = "Do whatever you want!";
                        callback(stor);
                        break;
                    case 'signing':
                        break;
                    case 'reservate':
                        break;
                    case 'getreservation':
                        break;
                    default:
                        prepareFile();
                }
                break;
            case '/sensordata':
                if(stor.post.sensor1 && stor.post.sensor2 && stor.post.isoccupied){

                }
            default:
                prepareFile();
        }
    //}else{
    //if there is an action to be done it has to be defined here.
        /*switch (stor.pg.action){
            case 'test':
                stor.content = "Do whatever you want!";
                
                callback(stor);
                break;
            case 'signing':
                break;
            case 'reservate':
                break;
            case 'getreservation':
                break;
            default :
                //if you wanna have a pagecall it has to be here
                fs.readFile('public/pagenotfound.html', function(err, dat){
                    if(!(err === "undefined"))
                        stor.error = err;
                    stor.content = dat.toString();
                    console.log(stor.err);
                    
                    callback(stor);
                });
        }
    }*/
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

var Database = function(){
    this.connection = mysql.createConnection({
        host     : '192.168.56.101',
        user     : 'park_shit',
        password : 'dachs',
        database : 'park_shit',
        port     : '3306'

    });

    this.query = function(queryString, parameters, callback){
        if(parameters instanceof Array){
            this.connection.connect(callback);
            if(parameters.length > 0)
                this.connection.query(queryString, parameters, callback);
            else
                this.connection.query(queryString, callback);
            this.connection.end(callback);
        }
    }

}


console.log('Server running at http://127.0.0.1:80/');
