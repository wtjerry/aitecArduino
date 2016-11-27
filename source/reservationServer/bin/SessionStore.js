module.exports = {};
var exports = module.exports = {};
var crypto = require('crypto');

exports.SessionStore = function (){
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
