var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var utils = require ('utils');
var mysql = require('mysql');

http.createServer(function (req, res){
    try{
        var pathname = url.parse(req.url).pathname;
        if(req.method=="POST"){
            post(req, function(post){
                serverRouting(pathname, post, res, respondToRequest);
            });
        }else{
            var get=url.parse(req.url, true).query;
            serverRouting(pathname.substring(1), get, res, respondToRequest);
        }
    }catch(error){
        console.log(error);
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end("<html><head><title>ERROR</title></head><body>Internal Server Error </body></html>");
    }
}).listen(80);


function respondToRequest(error, data, res){
    if(!error){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data.toString());
        res.end();
    }else{
        res.writeHead(404, {'Content-Type': 'text/html'});
        fs.readFile('htmlfiles/error.html', function(error, data){
            if(!error){
                res.write(data.toString());
            }else{
                console.log(error);
                res.write("<html><head><title>ERROR</title></head><body>Internal Server Error </body></html>");
            }
            res.end();
        });
    }
};

function serverRouting(path, param, res, callback){
    var error = "";
    var data = "hello world!";
    path = ((path=="")?"index.html": path);
    console.log(path);
    if(Object.keys(param).length === 0){
        //if no get and POST were given
        fs.readFile('htmlfiles/calendar.html', function(err, dat){
            if(err)
                callback(err, "", res);
            else{
                callback(error, dat, res);
            }
        });
    }else{
    //if there is an action to be done it has to be defined here.
        switch (param.action){
            case 'test':
                        callback(error, data, res);
            break;
            default :
                //if you wanna have a pagecall it has to be here
                fs.readFile('htmlfiles/pagenotfound.html', function(err, dat){
                    if(err)
                        callback(err, "", res);
                    else{
                        callback(error, dat, res);
                    }
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

var isEmpty = function(obj) {
   return
 }

console.log('Server running at http://127.0.0.1:80/');
