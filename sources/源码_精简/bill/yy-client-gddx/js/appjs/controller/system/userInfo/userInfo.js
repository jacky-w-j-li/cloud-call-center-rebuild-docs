Ext.define('App.controller.system.userInfo.userInfo', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'userInfoPanel',
            selector: 'userInfoPanel'
        }
    ],
    init: function () {
        this.control({
                'userInfoPanel': {
                },
                'userInfoPanel >  button#btn_userinfo_updatepwd': {
                    click: this.updateMyPwd
                },

                'userInfoPanel >  button#btn_userinfo_updateinfo': {
                    click: this.updateMyInfo
                },
                'userInfoPanel >  button#btn_userinfo_saveAlert': {
                    click: this.saveProxyAlert
                }

            }
        );
        this.initFlag = true;
    },

    _formatTrueFee:function(data){
        var rate=10000;
        if(data.overdraw) data.overdraw=data.overdraw/rate;
        if(data.callinLicence) data.callinLicence=data.callinLicence/rate;
        //if(data.calloutLicence) data.calloutLicence=data.calloutLicence/rate;
        if(data.monitorLicence) data.monitorLicence=data.monitorLicence/rate;
        if(data.standardLicence) data.standardLicence=data.standardLicence/rate;
        if(data.smsFee) data.smsFee=data.smsFee/rate;
//        if(data.min400Consume) data.min400Consume=data.min400Consume/rate;
        if(!data.dialFee){
            data.dialFee={};
        }else{
            for(var key in data.dialFee){
                data.dialFee[key] = data.dialFee[key]/rate;
            }
        }
        if(!data.dial400Fee){
            data.dial400Fee={};
        }else{
            for(var key in data.dial400Fee){
                data.dial400Fee[key] = data.dial400Fee[key]/rate;
            }
        }
        //国际长途
        if(!data.internationalFee){
            data.internationalFee={};
        }else{
            for(var key in data.internationalFee){
                data.internationalFee[key] = data.internationalFee[key]/rate;
            }
        }

    },
    updateMyPwd: function (obj) {
        var pane = this.getUserInfoPanel();
        var form = pane.down("#panel_userinfo_updatePwd > form");
//        console.dir(form)
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            if(data.password!=data.retryPassword){
                App.util.AppUtil.msg("两次输入的密码不一致！");
                return;
            }
            App.util.AppUtil.request('bill.systemUser.updateMyPwd', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改密码成功！");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    updateMyInfo: function (obj) {
        var pane = this.getUserInfoPanel();
        var form = pane.down("#panel_userinfo_base form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.updateMyInfo', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改基本信息成功！");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    saveProxyAlert: function (obj) {
        var pane = this.getUserInfoPanel();
        var form = pane.down("#panel_userinfo_alert form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
//            console.dir(data);
            App.util.AppUtil.request('bill.systemUser.setAlertInfo', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改设置成功！");
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    }

});
