var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var uuid = require('appUtil/UUID');
var objectUtil = require('appUtil/ObjectUtil');
var dateTimeUtil = require('appUtil/DateTime');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var config = require('appConfig').conf;
var fs = require('fs');
var utils = require('appUtil/Utils');
var qiniuHandler = require(__baseDir+'/dishui/app/qiniu/QiniuHandler');
var qiniuAPI = require('qiniu');

exports.querySound = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_SOUND).find(data, {sort:{SoundType:-1, DisplayName:1}}).toArray(function(err, docs){
        if(err){
            logger.app.error(err.stack);
            result.message = "Query sound failure:" + data.Account+","+data.PBX;
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

/**
 { _id: 'abe61c70-1a05-11e3-910e-394fba81197a',
  SoundFilePath: '/Users/yangweili/tmp/nodeUpFiles/430642ffa5ac4aec1db5239e157874d8',
  OldSoundFilePath: 'a9d5ee3edbf6e7144645662421ef49d5.wav',
  SoundType: 'normal',
  DisplayName: '欢迎词',
  Memo: ' ',
  PBX: '2.3.1.100' }
 */
exports.addOrUpdateSound = function(data, session, callback) {
    if(data.SoundFilePath == '' && data.QiniuMusicUrl == ''){
        callback({success:false,message:'请上传语音文件再保存!'});
        return;
    }
    var soundFilePath = data.SoundFilePath;
    delete data.SoundFilePath;
    var oldSoundFilePath = data.OldSoundFilePath;
    delete data.OldSoundFilePath;
    var isUploadFile = false;
    var queryData = {
        Account: session.user.account,
        PBX: data.PBX,
        _id: data._id

    }
    getSound(queryData, session, function(err, preUpdateSound){
        if(err){
            callback(err);
            return;
        }
        var fileName = null;
        if (preUpdateSound){
            if(oldSoundFilePath){
                isUploadFile = true;
                fileName = preUpdateSound.Filename;
            }
            data.preUpdateSound = preUpdateSound;
        } else {
            data._id = uuid.generateUuid();
            isUploadFile = true;
            if(data.IsQiniuMusic && data.IsQiniuMusic == 'yes'){
                isUploadFile = false;
            }else{
                delete data.IsQiniuMusic;
                delete data.QiniuMusicUrl;
            }
            fileName = soundFilePath.substr(soundFilePath.lastIndexOf('/') + 1)+".wav";
            data.preUpdateSound = {};
        }
        if(data.IsQiniuMusic && data.IsQiniuMusic == 'yes'){
            data.DBFileName = fileName.substring(0, fileName.indexOf('.'));
            data.Filename = fileName;
            if(data.SoundType == 'hold') {
                data.IsHoldMusic = 'yes';
                data.HoldMusic = data.DBFileName;
            }
            data.QiniuMusicUrl = data.QiniuMusicUrl.replace("=/", "@");
            exports.saveQiniuTransferSoundData(data, session, callback);
        }else if(isUploadFile){
            // get file from mongoDB
            data.DBFileName = fileName.substring(0, fileName.indexOf('.'));
            data.SendFile = true;
            data.Filename = fileName;
            if(data.SoundType == 'hold') {
                data.IsHoldMusic = 'yes';
                data.HoldMusic = data.DBFileName;
            }
            exports.saveSoundData(data, session, callback);
        } else {
            data.NotSynAcs = true;
            exports.saveSoundData(data, session, callback);
        }
    });
}

exports.saveSoundData = function(data, session, callback){
    var result = {success: false};
    var preUpdateSound = data.preUpdateSound;
    delete data.preUpdateSound;
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    data.UpdateUser = session.user._id;
    if(data.IsQiniuMusic && data.IsQiniuMusic == 'yes'){
        data.preUpdateSound = {};
        delete data.SendFile;
        if(data.SoundType == 'hold') {
            data.IsHoldMusic = 'yes';
            data.HoldMusic = data.DBFileName;
        }
        data.QiniuMusicUrl = data.QiniuMusicUrl.replace("=/", "@");
        exports.saveQiniuTransferSoundData(data, session, callback);
        return;
    }
    data.Action = "MusicAdd";
    if(!data.Memo){
        data.Memo = ' ';
    }
    var soundData = {
        nodeData: data,
        dbData : {
            tableName : fields.DB_IVR_SOUND
        }
    }
    if(!data.SendFile){
        soundData.nodeData.NotSynAcs = true;
    }
    ivrHandler.saveOrUpdateIvr(soundData, session, function(err){
        if(err){
            result.success = false;
            result.reason = 500;
            callback(result);
            return;
        }
        if(data.SoundType == 'hold'){
            data.TypeName = '队列等待语音';
            var reloadData = {
                Type : 3,
                Account: data.Account,
                PBX: data.PBX
            };
            ivrHandler.reloadIvr(reloadData, session, function(res){});
        } else {
            data.TypeName = '普通语音';
        }

        data = objectUtil.mixin(preUpdateSound, data);
        result.data = data;
        result.success = true;
        callback(result);
    });
}

exports.saveQiniuTransferSoundData = function(data, session, callback){
    var preUpdateSound = data.preUpdateSound;
    delete data.preUpdateSound;
    var result = {success: false};
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    data.UpdateUser = session.user._id;
    data.Action = "MusicAdd";
    if(!data.Memo){
        data.Memo = ' ';
    }
    var soundData = {
        nodeData: data,
        dbData : {
            tableName : fields.DB_IVR_SOUND
        }
    }
    ivrHandler.saveOrUpdateIvr(soundData, session, function(err){
        if(err){
            result.success = false;
            result.reason = 500;
            callback(result);
            return;
        }
        if(data.SoundType == 'hold'){
            data.TypeName = '队列等待语音';
            var reloadData = {
                Type : 3,
                Account: data.Account,
                PBX: data.PBX
            };
            ivrHandler.reloadIvr(reloadData, session, function(res){});
        } else {
            data.TypeName = '普通语音';
        }

        data = objectUtil.mixin(preUpdateSound, data);
        result.data = data;
        result.success = true;
        callback(result);
    });
}

function getSound(data, session, callback) {
    if(data._id){
        exports.querySound(data, session, function(queryResult){
            if(!queryResult.success){
                callback(queryResult);
                return;
            }
            if(queryResult.list && queryResult.list.length > 0){
                callback(null, queryResult.list[0]);
            } else {
                callback(null, null);
            }
        });
    } else {
        callback(null, null);
    }
}



exports.deleteSound = function(data,session,callback){
    var result = {success:false};
    getSound(data,session,function(err,sound){
        if(err){
            logger.app.info(err);
            callback(result);
            return;
        }
        if(!sound){
            result.message = 'not found this sound!';
            callback(result);
            return
        }
        if(sound.SoundType === 'normal'){
            data.Action = 'FileDelete';
            data.Filename = sound.Filename;
            data.Path = 'sound';
        }else{
            data.Action = 'HoldMusicRemove';
            data.HoldMusic = sound.HoldMusic;
            data.Filename = sound.Filename;
        }
        var soundData = {
            nodeData: data,
            dbData : {
                tableName : fields.DB_IVR_SOUND
            }
        }
        ivrHandler.deleteIvr(soundData, session, function(delRes){
            if (!delRes.success) {
                result.message = "delete sound failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }

            var dbFileName = data.Filename.substring(0, data.Filename.indexOf('.'));
            mongo.removeFileFromDb(dbFileName, function(err) {
                if(err) {
                    logger.app.info('Remove file from DB: ' + dbFileName);
                    // Even if delete file from DB failure, ignore err to return true.
                }
                result.data = sound;
                result.success = true;
                callback(result);
            });
        });
    })
}

exports.soundToQiniuTransfer = function(data, session, callback){
    var result = {success: false};
    qiniuHandler.getIvrMusicUptoken({},session, function(tokenRes){
        if(tokenRes.success) {
            var extra = new qiniuAPI.io.PutExtra();

            var tempFileName = data.filePath.substring(data.filePath.lastIndexOf('/')+1);
            console.log(tempFileName)
            qiniuAPI.io.putFile(tokenRes.uptoken, tempFileName, data.filePath, extra, function(err, ret) {
                if(!err) {
                    // 上传成功， 处理返回值
                    console.log(ret);
                    console.log(ret.key, ret.hash);
                    // ret.key & ret.hash
                    var doc = {
                        account: session.user.account,
                        userId: session.user._id,
                        fileName: data.fileName,
                        filePath: data.filePath,
                        qiniuFileKey: ret.key,
                        qiniuHash: ret.hash,
                        qiniuPersistentId: ret.persistentId,
                        createTime: utils.DateTime.getCurrentDateTime()
                    }
                    mongo.db().collection('manager_ivr_sound_qiniu_transfer').insert(doc,function(err){
                        if(err){
                            console.log(err);
                            callback(result);
                            return;
                        }
                        result.data = {persistentId: ret.persistentId};
                        result.success = true;
                        callback(result);
                        return;
                    });
                } else {
                    // 上传失败， 处理返回代码
                    console.log(err);
                    callback(result);
                    // http://developer.qiniu.com/docs/v6/api/reference/codes.html
                }
            });
        }else{
            console.log('get token failed!');
            callback(result);
        }
    })
}

exports.soundToQiniuTransferRefresh = function(data, session, callback){
    var result = {success: false};
    var find = {'qiniuNotify.id': data.persistentId};
    mongo.db().collection('manager_ivr_sound_qiniu_transfer').findOne(find,function(err, doc){
        if(err || !doc){
            callback(result);
            return;
        }
        result.code = 400;
        if(doc.qiniuNotify){
            if(doc.qiniuNotify.code == 0
                && doc.qiniuNotify.items
                && doc.qiniuNotify.items[0].code == 0
                && doc.qiniuNotify.items.length > 0){
                result.code = 0;
                result.url = 'http://7xo2y7.com2.z0.glb.qiniucdn.com/'+doc.qiniuNotify.items[0].key;
            }
        }
        result.success = true;
        callback(result);
        return;
    });
}