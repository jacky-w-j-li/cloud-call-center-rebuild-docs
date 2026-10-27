var logger = require('appLog');
var qiniuAPI = require('qiniu');


var handler = {
    getUptoken : function(data , callback){
        var result = {success: false};
        var putPolicy = {
            scope: data.scope+'/'
        }
        try{
            var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);
            var token = putPolicy.token();
            result.uptoken = token;
            result.success = true;
        } catch (e){
            logger.app.error("",e);
            result.message = "get token form qiniu error!";
        }
        callback(result);
    }
};


module.exports = handler;
