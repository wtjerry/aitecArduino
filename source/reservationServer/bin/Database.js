var Entities = require('html-entities').AllHtmlEntities;
var mysql = require('mysql');
var entities = new Entities();



var exports = module.exports = {};

exports.Database = function (){
    this.pool = mysql.createPool({
        connectionLimit : 100, //important
        host     : '192.168.56.101',
        user     : 'park_shit',
        password : 'dachs',
        database : 'park_shit',
        port     : '3306',
        debug    :  false,
        dateStrings: 'datetime'

    });
    this.query = function(quer, callback){
        this.pool.getConnection(function(error, connection){
            if(error){
                console.log("Error during the Database connection.");
                callback("Error");
            }
            connection.query(quer,function(err,rows){
                connection.release();
                if(!err) {
                    callback("", rows);
                }
            });
            connection.on('error', function(err) {
                callback(error);
            });

        });
    };
    this.query = function(quer, array, callback){
        //array.forEach(this.encapsulation);
        this.pool.getConnection(function(error, connection){
            if(error){
                console.log("Error during databaseconnection.");
                callback("Error");
            }
            connection.query(quer,array,function(err,rows){
                connection.release();
                if(!err) {
                    callback("", rows);
                }else{
                    console.log(err);
                    callback(err, "");
                }
            });
            connection.on('error', function(err) {
                callback(error);
            });

        });

    };
    this.encapsulation = function(string){
        //string = entities.encode(string);
    };
    this.testConnection = function(){
        this.pool.getConnection(function(error, connection){
            if(error){
                console.log("There has been a problem with the DB connection!");
                return;
            }
            connection.release();
        });
    };
    
};