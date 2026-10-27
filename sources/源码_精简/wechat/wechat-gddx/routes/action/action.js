var log             = require('appLog');
var config          = require('../../config');
var authHandler     = require('./authHandler');
var messageHandler  = require('./messageHandler.js');
var menuHandler     = require('./menuHandler.js');
var materialHandler = require('./materialHandler.js');
var oAuthWx       = require('./oAuth_wx');
var customServiceHandler = require('./customServiceHandler');

var actions = {
    getPreAuthCode     : authHandler.getPreAuthCode,
    sendMsg            : messageHandler.sendMsg,
    getMenu            : menuHandler.getMenu,
    saveMenu           : menuHandler.saveMenu,
    saveMaterial       : materialHandler.saveMaterial,
    uploadImage        : materialHandler.uploadImage,
    saveNewsMaterial   : materialHandler.saveNewsMaterial,
    getMaterialCount   : materialHandler.getMaterialCount,
    updateNewsMaterial : materialHandler.updateNewsMaterial,
    removeMaterial     : materialHandler.removeMaterial,
    getMaterials       : materialHandler.getMaterials,
    getMaterial        : materialHandler.getMaterial,
    sendImCSRInfo      : oAuthWx.sendImCSRInfo,
    pushImCSRInfo      : oAuthWx.pushImCSRInfo,
    addCustomService   : customServiceHandler.add,
    updateCustomService: customServiceHandler.update,
    delCustomService   : customServiceHandler.del,
    getAllCustomService: customServiceHandler.getAll,
    uploadCustomServiceAvatar: customServiceHandler.uploadAvatar
};

module.exports = function(action, callback){
    if(actions[action.action]) {
        try{
            actions[action.action](action, callback);
        } catch (e) {
            log.app.warn(e);
            callback({succeed: false, message: 'error'});
        }

    } else {
        callback({succeed: false, message: 'Action not found: '+action.action});
    }
}