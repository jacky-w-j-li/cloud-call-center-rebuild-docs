var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var nodeUtil = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var constants = require(__baseDir + '/7moor/common/Constants');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/7moor/manager/ivr/IvrHandler');

/**
 * Init dial job number node
 * If it has init, ignore this init process.
 * @param data
 * @param session
 * @param callback
 */
exports.initDialJobNum = function (data, session, callback) {
    var result = {success: false};
    var queryData = {
        Account: data.Account,
        PBX: data.PBX,
        Exten: '2'
    }
    mongo.db().collection(constants.DB_IVR_SYSTEM).find(queryData).toArray(function (err, docs) {
        if (err) {
            result.success = false;
            result.message = 'Init dial job number node failure.';
            logger.app.error(result.message, err);
            callback(result);
            return;
        }

        if (docs && docs.length > 0) {
            logger.app.info(data.Account + ' Dial job number node has init, ignore this init process:' + data.PBX);
            result.success = true;
            result.data = docs[0];
            callback(result);
            return;
        } else {
            var assData = {
                Exten: '2',
                DialJobNumParam: 'JOBNUM',
                Action: "DialJobNumNodeAdd",
                Account: data.Account,
                PBX: data.PBX,
                DisplayName: "拨打工号",
                ToPeer: '',
                AgentBusyToPeer: '',
                LogoffToPeer: '',
                Update: false
            }
            var initData = {
                Exten: '2',
                VarId: 'JOBNUM',
                Account: data.Account,
                PBX: data.PBX,
                DisplayName: "拨打工号",
                ToPeerWhenEmpnoNotExist: '0',
                ToPeerWhenEmpnoNotExistType: 'system',
                ToPeerWhenEmpnoAgentBusy: '0',
                ToPeerWhenEmpnoAgentBusyType: 'system',
                ToPeerWhenEmpnoLogoff: '0',
                ToPeerWhenEmpnoLogoffType: 'system',
                UpdateTime: dateTimeUtil.getCurrentDate(),
                _id: uuid.generateUuid()
            }
            var ivrData = {
                nodeData: assData,
                dbData: {
                    tableName: constants.DB_IVR_SYSTEM,
                    updateData: initData
                }
            }
            ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                if (err) {
                    result.message = "Init dial job number node failure: " + nodeUtil.inspect(initData);
                    logger.app.error(result.message, err);
                    result.success = false;
                    callback(result);
                    return;
                }
                logger.app.info('Account [' + data.Account + '] dial job number node init success.');
                result.success = true;
                result.data = initData;
                callback(result);
            });
        }
    });
}
