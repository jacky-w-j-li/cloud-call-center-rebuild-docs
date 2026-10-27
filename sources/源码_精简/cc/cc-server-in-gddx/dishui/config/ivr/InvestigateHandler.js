var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var objectUtil = require('appUtil/ObjectUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.queryInvestigateMenu = function (session, callback) {
    var query = {
        Account: session.user.account,
        PBX: session.user.pbx
    };
    mongo.db().collection(fields.DB_IVR_NODE_SATISFACTION).find(query).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });

};
