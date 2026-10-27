/**
 * 主页面全局控制器
 */
Ext.define('App.controller.Main', {
    extend: 'Ext.app.Controller',
    views: ['App.view.Viewport'],
    requires: ['App.util.TipsWindowUtil'],
    refs: [
        {
            ref: 'mainViewport',
            selector: 'mainViewport'
        },
        {
            ref: 'userInfoWin',
            selector: 'userInfoWin'
        },
        {
            ref: 'payWin',
            selector: 'payWin'
        }
    ],
    initFlag: false,
    init: function () {
        this.control({
            'mainHeaderPanel > #logout_button': {
                // click : this.openwindow
                click: this.userLogout
            },
            'mainHeaderPanel > #current_user_info': {
                click: this.showCurrentUserInfo
            },
            'mainHeaderPanel > #user_pay_bank': {
                click: this.showPay
            },
            'userInfoWin >  button#userInfo_modify_button': {
                click: this.updateUserInfo
            },
            'panel#menu-panel > treepanel': {
                itemclick: this.loadMenu
            },
            'mainViewport': {
                show: this.runClientTask,
                resize: this.viewportResizeHandler
            },
            'tipsWindow': {
                destroy: this.tipsWindowCloseHandler
            },
            '#undoBusinessOrderInfo_button': {
                click: this.showUndoBusinessOrder
            },
            // common query
            'form[class="query"] button[class="query"]': {
                click: App.util.AppUtil.queryGrid
            },
            //common reset

            'form[class="query"] button[class="reset"]': {
                click: App.util.AppUtil.resetQuery
            },
            'payWin >  button#sn_pay_button': {
                click: this.redirectBank
            }


        });
        this.initFlag = true;
    },
    // openwindow : function() {
    // // 加载控制器，显示页面
    // gloab_application.getController('App.controller.Logout').init();
    // Ext.create("App.view.test.moneyChange").show(Ext.get("logout_button"));
    // },
    updateUserInfo: function (obj) {
        var win = this.getUserInfoWin();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var json = App.util.AppUtil.getFormParam(fieldset);
            //var data = Ext.JSON.decode(json);
            if (json.password != json.repassword) {
                App.util.AppUtil.msg('两次密码不一致！');
                return;
            }
            App.util.AppUtil.request('UpdateUserInfo', json, this.updateSysUserHandler, this);
        }
    },
    showUndoBusinessOrder: function (obj) {
        var menuController = 'App.controller.billing.account.BusiOrder';
        var menuClass = 'App.view.billing.account.BusiOrder';
        var main = Ext.getCmp("content-panel");
        var id = menuClass;
        var panel = Ext.getCmp(id);
        if (!panel) {
            var controller = gloab_application.getController(menuController);
            if (!controller.initFlag) {
                controller.init();
            }
            // gloab_application.getController(menuController).init();
            var panel = Ext.create(menuClass, {
                id: id,
                title: '账户业务单',
                closable: true,
                closeAction: 'destory',
                autoDestroy: true
            });
            var p = main.add(panel);
            main.setActiveTab(p);
        } else {
            main.setActiveTab(panel);
        }
        var win = obj.up('window');
        win.close();

    },
    updateSysUserHandler: function (data, self) {
        if (data.Succeed) {
            self.getUserInfoWin().close();
            App.util.AppUtil.msg('修改用户信息成功！');
            gloab_client_user = data.user;
            gloab_client_user.account = data.account;
            gloab_client_user.extension = data.extension;
        } else {
            App.util.AppUtil.msg('修改用户信息失败！');
        }
    },
    sessionUserInfoHandler: function (data, self) {
        if (data.data.success) {
            gloab_client_user = data.data;
            App.util.AppUtil.msg("修改用户信息成功！");
            var win = self.getUserInfoWin();
            win.close();
        } else {
            App.util.AppUtil.msg("客户端加载缓存失败！");
        }
    },
    showCurrentUserInfo: function (obj) {
        var menuController = "App.controller.system.userInfo.userInfo";
        var main = Ext.getCmp("content-panel");
        var id = "App.view.system.userInfo.userInfo";
        var panel = Ext.getCmp(id);
        if (!panel) {
            App.util.AppUtil.request('bill.systemUser.getMyInfo', {}, function (data, self) {
                if (data.success) {
                    var item=data.data;
                    var controller = gloab_application.getController(menuController);
                    if (!controller.initFlag) {
                        controller.init();
                    }
                    if(item){
                        controller._formatTrueFee(item);
                    }
                    var panel = Ext.create(id, {
                        id: id,
                        data:item,
                        title: "个人设置",
                        closable: true,
                        closeAction: 'destory',
                        autoDestroy: true
                    });
                    var p = main.add(panel);
                    main.setActiveTab(p);
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);

        } else {
            main.setActiveTab(panel);
        }
//        var win = Ext.create('App.view.UserInfoWin', {
//            animateTarget: obj,
//            user: gloab_client_user
//        });
//        win.show();

    },
    userLogout: function (obj) {
        var me = this;
        Ext.Msg.confirm('提示', '确认要退出？', function (result) {
            if (result == 'yes') {
                document.location.href="../index.html";
            }
        });
    },
    userLogoutHandler: function (data, self) {
        if (data.data.success) {
            window.opener = null;
            window.open('', '_self');
            window.close();
        } else {
            App.util.AppUtil.msg(data.data.errorInfo + '错误码：' + data.data.errorCode);
        }
    },
    loadMenu: function (selModel, record) {
        if (record.get('leaf')) {
            var menuClass = record.get('id');
            var menuController = menuClass.replace('.view.', '.controller.');
            var main = Ext.getCmp("content-panel");
            var id = menuClass;
            var panel = Ext.getCmp(id);
            if (!panel) {
                var controller = gloab_application.getController(menuController);
                if (!controller.initFlag) {
                    controller.init();
                }
                var panel = Ext.create(menuClass, {
                    id: id,
                    title: record.get('text'),
                    closable: true,
                    closeAction: 'destory',
                    autoDestroy: true
                });
                var p = main.add(panel);
                main.setActiveTab(p);
                // gloab_application.getController(menuController).init();

            } else {
                main.setActiveTab(panel);
            }
        }

    },
    runClientTask: function () {
        var pingtask = {
            run: this.ping,
            interval: 10000
        }
        // Ext.TaskManager.start(pingtask);
        // var task = {
        // run : this.requestBusinessOrder,
        // interval : 10000
        // };
        // Ext.TaskManager.start(task);
    },
    ping: function (times) {
        var json = new Object();
        // json.username = gloab_client_user.user.username;
        // json = Ext.JSON.encode(json);
        App.util.AppUtil.request('Ping', json, function (data, self) {
            if (data.Succeed === false) {
                Ext.TaskManager.stopAll();
                Ext.MessageBox.show({
                    title: '警告！',
                    msg: '与服务器连接失败！',
                    closable: false,
                    buttons: Ext.Msg.OK,
                    icon: Ext.window.MessageBox.INFO,
                    fn: function () {
                        window.location.reload();
                    }
                });
            }
        }, this, true);
    },
    requestBusinessOrder: function (times) {
        App.util.AppUtil.request('queryUserUnDealBusinessOrder', '', function (data, self) {
            if (data.data.hasOrder === true) {
                var showdata = new Object();
                showdata.type = 'order';
                showdata.data = data.data.accountUndealBusinessOrder;
                App.util.TipsWindowUtil.showTips(showdata);
            }
        }, this, true);
    },
    tipsWindowCloseHandler: function (obj) {
        App.util.TipsWindowUtil.removeTips(obj.count);
    },
    viewportResizeHandler: function () {
        App.util.TipsWindowUtil.resizeTips();
    },
    showPay: function (obj) {
//        if(gloab_client_user.identity=='hp'){
//            if(!confirm("确认要充值吗?"))return;
//            App.util.AppUtil.request('bill.hp.hpPay', '', function (data, self) {
//                if (data.success) {
//                    self.syncBalance();
//                    App.util.AppUtil.msg("支付成功！");
//                } else {
//                    App.util.AppUtil.msg(data.message);
//                }
//            }, this);
//        }else{
            var win = Ext.create('App.view.system.systemUser.pay', {
                animateTarget: obj,
                user: gloab_client_user
            });
            win.show();
//        }
    },
    redirectBank: function (obj) {
        var win = this.getPayWin();
        var form = win.down('form');
        var param={};
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var json = App.util.AppUtil.getFormParam(fieldset);
            var uid=gloab_client_user._id;
            json.proxy=uid;
            param={data:json};

            var container={
                id: 'system_user_pay',
                tag: 'div',
                style: 'display:none'
            };
            var div = Ext.getDom("system_user_pay");
            if(!div){
                Ext.DomHelper.append(Ext.getBody(), container);
            }
            var div2 = Ext.getDom("system_user_pay");

            if(div2){
                var html='<input type="hidden" name="action" value="bill.bankPay">' +
                    '<input type="hidden" name="data" value="">';
                var form = {
                    id:'system_user_pay_frm',
                    tag: 'form',
                    action: './public',
                    target: '_blank',
                    method:'POST',
                    html: html
                };
                div2.innerHTML='';
                Ext.DomHelper.append('system_user_pay', form);
                Ext.getDom("system_user_pay_frm").data.value=Ext.JSON.encode(param);
                Ext.getDom("system_user_pay_frm").submit();
                win.close();
            }
        }
    }
//    syncBalance:function(){
//        var win = Ext.getCmp("main_head_panel");
//        var pane=win.down("#user_balance_head");
//        App.util.AppUtil.request('bill.account.getSystemInfoById', null, function (data, self) {
//            if (data.success) {
//                gloab_client_user=data.user;
//                var balance=(gloab_client_user.totalFee - gloab_client_user.consume)/1000||0;
//                pane.update('余额：[' + '<span style="color:blue;">'+balance+'</span>' + ']元')
//            } else {
//                App.util.AppUtil.msg(data.message);
//            }
//        }, this);
//    }

})
