var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/common/Fields');

/**
 * 线路
 *
 */
var model = {
    get: function(id,cb){
        mongo.appDb("bill").collection(fields.DB_BILL_PLATFORM_LINE).findOne({_id: id}, function (err, record) {
            if(err){
                return cb(err);
            }
            cb(null,record)
        });
    },
    findLineLines : function(cb){
        model.find({},function(err,lines){
            if(err){
                return cb(err);
            }

            var lineLines = {};
            lines.forEach(function(item){
                lineLines[item._id] = item;
            });

            return cb(null,lineLines);
        });
    },
    findSomeLineLines : function(lineIds,cb){
        if(!lineIds){
            return cb(null,{});
        }

        model.findSomeLines(lineIds,function(err,lines){
            if(err){
                return cb(err);
            }

            var lineLines = {};
            lines.forEach(function(item){
                lineLines[item._id] = item;
            });

            return cb(null,lineLines);
        });
    },

    findSomeLines : function(lineIds,cb){
        if(!lineIds){
            return cb(null,[]);
        }

        mongo.appDb("bill").collection(fields.DB_BILL_PLATFORM_LINE).find({_id:{$in : lineIds}}).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },

    find : function(condition,cb){
        mongo.appDb("bill").collection(fields.DB_BILL_PLATFORM_LINE).find(condition).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },
    getAllLineIds : function(cb){
        model.find({},function(err,lines){
            if(err){
                return cb(err);
            }

            var lineIds = [];
            lines.forEach(function(item){
                lineIds.push(item._id);
            });

            return cb(null,lineIds);
        });
    }
}

module.exports = model;