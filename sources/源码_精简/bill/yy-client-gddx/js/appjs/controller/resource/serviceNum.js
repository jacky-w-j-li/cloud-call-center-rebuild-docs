Ext.define('App.controller.resource.serviceNum', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'queryGrid',
            selector: 'serviceNumQueryPanel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control(
            {
                'serviceNumQueryPanel >  button#add_serviceNum_tool': {
                    click: this.showAddServiceNum
                },
                'addServiceNumWin >  button#serviceNum_new_button': {
                    click: this.addServiceNum
                },
                'serviceNumQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showSetServicenNum,
                    itemclick:this.findOneSerNum
                },
                'serviceNumQueryPanel >  button#set_serviceNum_tool': {
                    click: this.showSetServicenNum
                },

                'serviceNumQueryPanel >  button#set_serviceNum_init_tool': {
                    click: this.showSetServicenNumInit
                },
                'setServiceNumInfoWindow >  button#set_serviceNum_button': {
                    click: this.setServiceNum
                },
                'setServiceNumInitWindow >  button#set_serviceNum_init_button': {
                    click: this.setServiceNumInit
                },
                'serviceNumQueryPanel >  button#delete_serviceNum_tool': {
                    click: this.deleteServiceNum
                },
                'serviceNumQueryPanel >  button#btn_serviceNum_free': {
                    click: this.showStopAccInfo
                },
                'showStopInfoWindow >  button#btn_free_stop_serviceNum': {
                    click: this.freeServiceNum
                },
                'serviceNumQueryPanel >  button#btn_serviceNum_stop': {
                    click: this.stopServiceNum
                },
                'serviceNumQueryPanel >  button#btn_serviceNum_flag': {
                    click: this.stopServiceFlag
                }

            }
        );
        this.initFlag = true;
    },
    deleteServiceNum: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var self = this;
        Ext.Msg.confirm("警告", "确认删除服务号[" + id + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request('bill.resource.deleteServiceNum', {_id: id}, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除服务号成功！");
                        self.getQueryGrid().store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }
        });
    },
    setServiceNumInit: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.updateServiceNumInit', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新服务号成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    setServiceNum: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);

            var serviceNumSetType = data.serviceNumSetType.serviceNumSetType;
            if(serviceNumSetType == 'single'){
                delete data.beginServiceNum;
                delete data.endServiceNum;
            }else{
                delete data._id;
                delete data.concurrent;
                delete data.bind400;
            }
            delete data.serviceNumSetType;

            App.util.AppUtil.request('bill.resource.updateServiceNum', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新服务号成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showSetServicenNumInit : function(obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.getServiceNumInfo', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.serviceNum.setInit', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("服务号初始资费设置");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showSetServicenNum: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        if(selection) {
            var id = selection.get("_id");
            App.util.AppUtil.request('bill.resource.getServiceNumInfo', {_id: id}, function (data, self) {
                if (data.success) {
                    var win = Ext.create('App.view.resource.serviceNum.set', {
                        single:true,
                        data: data.data,
                        animateTarget: obj
                    });
                    win.setTitle("服务号设置");
                    win.show();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }else{
            var win = Ext.create('App.view.resource.serviceNum.set', {
                single:false,
                animateTarget: obj
            });
            win.setTitle("服务号设置");
            win.show();
        }
    },

    showAddServiceNum: function (obj) {
        var win = Ext.create('App.view.resource.serviceNum.add', {
            animateTarget: obj
        });
        win.show();
    },
    addServiceNum: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.addServiceNum', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加服务号成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showStopAccInfo: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var status = selection.get("status");
        var account=selection.get("account");
        if(status=='stop'||status=='stopTry'||status=='stopWaitPay'){
            var data={
                _id:id,
                account:account
            };
            App.util.AppUtil.request('bill.resource.showStopAccInfo', data, function (rep, self) {
                if (rep.success) {
                    var accountName=rep.accountName+"("+rep.companyName+")"||'';
                    var lastAccountName=rep.lastAccountName+"("+rep.lastCompanyName+")"||'';
                    if(accountName == '()'){
                        accountName = "";
                    }
                    if(lastAccountName == '()'){
                        lastAccountName = "";
                    }
                    var win = Ext.create('App.view.resource.serviceNum.showStopInfo', {
                        id: id,
                        accountName:accountName,
                        lastAccountName:lastAccountName,
                        animateTarget: obj
                    });
                    win.setTitle("释放号码");
                    win.show();
                } else {
                    App.util.AppUtil.msg(rep.message);
                }
            }, this);
        }else{
            App.util.AppUtil.msg("请选择停用的服务号");
            return;
        }
    },
    freeServiceNum:function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(!confirm("确认释放该号码吗?")){
            return ;
        };
        var fieldset = form.down('fieldset');
        var data = App.util.AppUtil.getFormParam(fieldset);
        App.util.AppUtil.request('bill.resource.freeStopServiceNo', data, function (rep, self) {
            if (rep.success) {
                App.util.AppUtil.msg("释放服务号成功！");
                win.close();
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(rep.message);
            }
        }, this);
    },
    stopServiceNum:function(obj){
        if(!confirm("确认停用该号码吗?")){
            return ;
        };
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        //console.dir("id==="+id)
        App.util.AppUtil.request('bill.resource.stopServiceNum', {_id:id}, function (rep, self) {
            if (rep.success) {
                App.util.AppUtil.msg("停用服务号成功！");
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(rep.message);
            }
        }, this);
    },
    stopServiceFlag:function(obj){
        if(!confirm("确认已解决360标记状态吗?")){
            return ;
        };
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        //console.dir("id==="+id)
        App.util.AppUtil.request('bill.resource.stopServiceFlag', {_id:id}, function (rep, self) {
            if (rep.success) {
                App.util.AppUtil.msg("处理标记成功！");
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(rep.message);
            }
        }, this);
    },
    findOneSerNum:function(obj){
        //显示隐藏"标记已处理" 标签
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        if(selection.data.Solution_state=="false"){
            Ext.getCmp('btn_serviceNum_flag').show();
        }else{
            Ext.getCmp('btn_serviceNum_flag').hide();
        }
    }
})
