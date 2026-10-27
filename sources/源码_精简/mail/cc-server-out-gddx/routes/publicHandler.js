var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var logger = require('appLog');
var qiniuHandler = require(__baseDir + '/dishui/app/qiniu/QiniuHandler');
var updateHandler = require(__baseDir + '/dishui/common/system/UpdateHandler');
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var task = require(__baseDir + '/dishui/app/customer/CustomerTaskHandler');
var dept = require(__baseDir + '/dishui/config/dept/DeptHandler');
var approvalBusiness = require(__baseDir + '/dishui/config/customerApproval/CustomerApprovalHandler');
var kmHandler = require(__baseDir + '/dishui/app/km/KmCatalogHandler');
var actions = {
    qiniu: {
        getUptoken: qiniuHandler.getUptoken,
        upCallback: qiniuHandler.upCallback,
        mpsNotify: qiniuHandler.mpsNotify
    },
    system: {
        getUpNf: updateHandler.getUpNf
    },
    solr: {
        dataImportTest: solrHandler.dataImportTest,
        dataImport: solrHandler.dataImport,
        //querySolr: solrHandler.querySolr,
        //querySolrPost: solrHandler.querySolrPost,
        //updateSolr: solrHandler.updateSolr,
        //deleteSolr: solrHandler.deleteSolr

        dataImport2KmByAccount: solrHandler.dataImport2KmByAccount,
        dataImport2Km: solrHandler.dataImport2Km
        //deleteKmSolr: solrHandler.deleteKmSolr
    },
    km:{
        queryCatalogListInf : kmHandler.queryCatalogListInf,
        queryItemListInf : kmHandler.queryItemListInf,
        getKmDetailInf : kmHandler.getKmDetailInf,
        queryDicListInf : kmHandler.queryDicListInf
    }
};

var impl = {
    processUnknowAction: function (action, res) {
        var result = {};
        result.success = false;
        result.message = 'action[' + action.name + '] is not support!';
        utils.sendResult(result, res, action._aid);
    }
}

var actionHandler = {
    handleAction: function (action, res) {
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, function (result) {
                    if (result.showView) {
                        if (result.view && result.data) {
                            logger.app.info("response[" + action._aid + "] to client view[" + result.view + "] : " + JSON.stringify(result.data));
                            res.render(result.view, result.data);
                        } else {
                            logger.app.error("response[" + action._aid + "] to client view[error.html] : " + JSON.stringify({}));
                            res.render("error.html", {});
                        }
                    } else {
                        result.success = result.success || false;
                        result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                        utils.sendResult(result, res, action._aid);
                    }
                });
            } else {
                impl.processUnknowAction(action, res);
            }

        } catch (e) {
            logger.app.error(e);
            utils.sendResult({success: false, message: e.message}, res, action._aid);
        }
    },
    handleNotifyAction: function (action, res) {
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, function (result) {
                    if (result.success) {
                        logger.app.info('response[' + action._aid + '] to client: success!');
                        res.send('success');
                    } else {
                        logger.app.info('response[' + action._aid + '] to client: fail!');
                        res.send('fail');
                    }
                });
            } else {
                logger.app.error('action[' + action.name + '] is not support!');
                res.send('fail');
            }

        } catch (e) {
            logger.app.error(e);
            logger.app.info('response[' + action._aid + '] to client: fail!');
            res.send('fail');
        }
    },
    handleValidateAction: function (action, res) {
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, function (result) {
                    logger.app.info('response[' + action._aid + '] to client:' + JSON.stringify(result));
                    res.send(result);
                });
            } else {
                logger.app.error('action[' + action.name + '] is not support!');
                res.send(false);
            }

        } catch (e) {
            logger.app.error(e);
            logger.app.error('response[' + action._aid + '] to client: false');
            res.send(false);
        }
    }
}


module.exports = actionHandler;
