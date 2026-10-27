var log             = require('appLog');
var config          = require('../../config');
var authHandler     = require('./authHandler');
var messageHandler  = require('./messageHandler.js');
var menuHandler     = require('./menuHandler.js');
var materialHandler = require('./materialHandler.js');

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
    getMaterial        : materialHandler.getMaterial




}

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