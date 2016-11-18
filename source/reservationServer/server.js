var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var utils = require ('utils');
var mysql = require('mysql');
var crypto = require('crypto');
//cannot download crypto at work.

var all_session = new SessionStore();

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
    
    stor.pathname = ((stor.pathname=="/")?"index.html": stor.pathname);

    if(Object.keys(stor.pg).length === 0){
        //if no get and POST were given
        fs.readFile('public/'+stor.pathname, function(err, dat){
            stor.error = err;
            stor.content = dat.toString();
            
            callback(stor);
        });
    }else{
    //if there is an action to be done it has to be defined here.
        switch (stor.pg){
            case 'test':
                stor.content = "Do whatever you want!";
                
                callback(stor);
            break;
            default :
                //if you wanna have a pagecall it has to be here
                fs.readFile('public/pagenotfound.html', function(err, dat){
                    stor.error += err;
                    stor.content = dat.toString();
                    
                    callback(stor);
                });
        }
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

function SessionStore(){
    this.session = new Map();
    
    this.newSession = function(sessionParam){
        if(sessionParam.sid){
            if(!this.session.has(sessionParam.sid)){
                this.session.set(sessionParam.sid, sessionParam);
                return ('sid='+ sessionParam.sid +";");
            }else{
                throw new Error("Session is in use!");
            }
        }else{
            throw new Error("Invalid sessionrequest!");
        }
    };
    this.startSession = function(stor){
        sid = stor.cookie.sid;
        if(stor.cookie.sid){
            if(!this.session.has(sid)){
                stor.ncookie += this.newSession({'sid':sid});
            }
        }else{
            sid = this.generateKey();
            stor.ncookie += this.newSession({'sid':sid});
        }
        return this.getSession(sid);
    }
    this.getSession = function(sid){
        if(this.session.has(sid)){
            return this.session.get(sid);
        }else{
            throw new Error("There is no such key!");
        }
    };
    
    this.setSession = function(params){
        this.newSession(params);
    };
    
    this.killSession = function(){
        
    };
    
    this.updateSession = function(sid, sessionParam){
        if(this.session.has(sid)){
            this.session.set(sid, sessionParam);
        }
    };
    this.generateKey = function(){
        var sha = crypto.createHash('sha256');
        sha.update(Math.random().toString());
        return sha.digest('hex');
    }
}


console.log('Server running at http://127.0.0.1:80/');
