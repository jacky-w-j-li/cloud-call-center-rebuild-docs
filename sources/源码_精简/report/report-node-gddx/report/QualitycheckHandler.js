/**
 * Created by jingdeliang on 2016-06-03.
 */

var fields = require(__baseDir + '/common/Fields');
var mongo = require('appDb/MongoDb');

exports.queryCycleReport = function(data, callback) {
    var result = {success: false};
    var query ={};
    query.templte_id = data.qualityChecked_table;

    if(data.selectedAgent.length>0){
        query.DISPOSAL_AGENT = {$in:data.selectedAgent};
    }
    query.cycle_section = {$in:cyclerange(data)};
    var keys ={
        cycle_section:1,
        DISPOSAL_AGENT:1
    }
    var initial = {monitorcount:0,all_1_count :0,
        all_cent:0,all_1:0,uncurxnum:0,uncurxerrornum:0,uncruxerrorand:0
    };
    var reduce = function(curr, result ){
        var uncruxerrorand = curr.uncruxerrorand;
        var uncruxerror = curr.uncruxerror;
        var uncurxnum = curr.uncurxnum;
        var uncurxerrornum =curr.uncurxerrornum;
        var ratio = curr.ratio;
        var cruxerror = curr.cruxerror;
        if(curr.uncruxerrorand == null){uncruxerrorand = "-"};
        if(curr.cruxerror == null){cruxerror = "-"};
        if(curr.uncruxerror == null){uncruxerror = "-"};
        if(curr.uncurxnum == null){uncurxnum = "-"};
        if(curr.uncurxerrornum == null){uncurxerrornum = "-"};
        if(curr.ratio == null){ratio = "-"};
        result['monitorcount']=curr.monitorcount;
        if(uncruxerror == "-"||uncruxerrorand == "-"){
            result['cruxerrorrate']="-";
        }else{
            result['cruxerrorrate']=(curr.monitorcount-(uncruxerror+uncruxerrorand))/curr.monitorcount;//关键错误准确率
        }
        result['uncruxerrorand']=uncruxerrorand;
        if(uncurxnum == "-"||uncurxerrornum == "-"||ratio == "-"||uncruxerrorand == "-"||cruxerror == "-"){
            result['uncruxerrorrate']="-";//非关键错误准确率 ;
            result['accrate']="-";//准确率
        }else{
            result['uncruxerrorrate']=(uncurxnum-uncurxerrornum)/uncurxnum;//非关键错误准确率 ;
            result['accrate']=(((curr.monitorcount-uncruxerror-uncruxerrorand)/curr.monitorcount)*((1-(ratio/100)))+(ratio/100)*(uncurxnum-uncurxerrornum)/uncurxnum);//准确率
        }
        if(uncruxerror == "-"||uncruxerrorand == "-"){
            result['uncurxnum']="-";
        }else{
            result['uncurxnum']=uncruxerror+uncruxerrorand;
        }
        //非关键错误未通过录音数
        result['cyclename']=curr.cycle_name;
        for(var i in curr) {
            if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 1&&i.substr(i.length-2,2)=="no") {
                result['all_1_count']+=curr[i];
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
                result['all_1']++;
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 2&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 3&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 4&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 5&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 6&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 7&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 8&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 9&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }else if (i.substr(0,11) =='config_name'&&i.split(/-/g).length.toString() == 10&&i.substr(i.length-2,2)=="no") {
                result[i+"_cent"]=1-(curr[i]/curr.monitorcount);
            }
        }
    }
    //���������
    var finalize = function(result){
        result['all_1_cent']=1-(result['all_1_count']/(result['all_1']*result['monitorcount']));
    }

    mongo.db().collection(fields.DB_QUALITY_CHECK_REPORT).group(keys,query,initial,reduce,finalize,{},{},function(err,docs){
        if(err){
            logger.app.error(err.stack);
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });

}

exports.getTableHeader = function(data,callback){
    var result = {success:false};
    var find = {
        Account : data.account,
        Type : data.reportType
    };
    mongo.appDb("cc").collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).findOne(find,function(err, doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        if(doc){
            result.data = doc ;
            result.success = true;
            callback(result);
        }else{
            var findSystem = {
                Account : 'system',
                Type : data.reportType
            }
            mongo.appDb("cc").collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).findOne(findSystem,function(err, sysdoc){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.data = sysdoc;
                result.success = true;
                callback(result);
            });
        }
    });
}
function cyclerange(data){
    var cycles = [];
    var endcycle = data.qualityChecked_end_cycle.substr(data.qualityChecked_end_cycle.length-1,1);
    var startcycle = data.qualityChecked_start_cycle.substr(data.qualityChecked_start_cycle.length-1,1);
    for(var i=startcycle;i<=endcycle;i++){
        cycles.push(data.qualityChecked_end_cycle.substr(0,data.qualityChecked_end_cycle.length-1)+i);
    }
    return cycles;
}

