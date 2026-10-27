Ext.define('App.controller.resource.num400', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'queryGrid',
            selector: 'num400QueryPanel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control(
            {
                'num400QueryPanel >  button#add_num400_tool': {
                    click: this.showAdd
                },
                'addNum400Win >  button#num400_new_button': {
                    click: this.add
                },
                'num400QueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showSet
                },
                'num400QueryPanel >  button#set_num400_tool': {
                    click: this.showSet
                },
                'num400QueryPanel >  button#set_num400_tool_init':{
                    click: this.showSetInit
                },
                'num400QueryPanel >  button#set_num400_tool_use':{
                    click : this.showUse
                },
                'setNum400InfoWindow >  button#set_num400_button': {
                    click: this.set
                },
                'setNum400InitWindow >  button#set_num400_init_button' :{
                    click: this.setInit
                },
                'num400QueryPanel >  button#delete_num400_tool': {
                    click: this.delete
                },
                'useNum400Window >  #use_num400_account_id':{
                    change : this.updateSelectAccountInfo
                },
                'useNum400Window >  button#use_num400_button':{
                    click : this.useNum400
                }

            }
        );
        this.initFlag = true;
    },
    useNum400 : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            delete data.name;
            delete data.companyName;
            App.util.AppUtil.request('bill.resource.useNum400',data,function(response,self){
                if(response.success){
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    updateSelectAccountInfo : function(obj,value){
      var id = value;
      App.util.AppUtil.request('bill.account.getAccountInfoById',{_id:id},function(data){
          var fieldset = obj.up("fieldset");
          if(data.success){
               var account = data.data;

              fieldset.down("[name='name']").setValue(account.name);
              fieldset.down("[name='companyName']").setValue(account.companyName);
          } else {
              fieldset.down("[name='name']").setValue("");
              fieldset.down("[name='companyName']").setValue("");
          }
      });

    },
    delete: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        Ext.Msg.confirm("警告","确认删除400号["+id+"]?",function(result){
            if(result == "yes"){
                App.util.AppUtil.request('bill.resource.deleteNum400',{_id:id},function(data,self){
                    if(data.success){
                        App.util.AppUtil.msg("删除400号成功！");
                        self.getQueryGrid().store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                },this);
            }
        });
    },
    set: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            data.dial400Fee = {local:0,remote:0,prefixMin:0};
            if(data.local) data.dial400Fee.local = data.local;
            if(data.remote) data.dial400Fee.remote = data.remote;
            if(data.prefixMin) data.dial400Fee.prefixMin = data.prefixMin;
            delete data.local;
            delete data.remote;
            delete data.prefixMin;
            App.util.AppUtil.request('bill.resource.updateNum400', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新400号成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    setInit : function (obj){
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            data.dial400Fee = {};
            if(data.local) data.dial400Fee.local = data.local;
            if(data.remote) data.dial400Fee.remote = data.remote;
            if(data.prefixMin) data.dial400Fee.prefixMin = data.prefixMin;
            delete data.local;
            delete data.remote;
            delete data.prefixMin;
            var min=data.min400Consume;
            var minProxy=data.min400ConsumeProxy;
            if(min<minProxy){
                App.util.AppUtil.msg("最低消费不能小于代理的低消");
                return;
            }
            App.util.AppUtil.request('bill.resource.updateNum400Init', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新400号成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showSetInit : function(obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.getNum400Info', {_id: id}, function (data, self) {
            data.data.initFee = data.data.initFee || {};
            if(!data.data.initFee.dialFee) data.data.initFee.dialFee = {};
            if (data.success) {
                var win = Ext.create('App.view.resource.num400.setInit', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("400号初始资费设置");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);

    },
    showUse : function(obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var win = Ext.create('App.view.resource.num400.useNum400', {
            data: id,
            animateTarget: obj
        });
        win.setTitle("占用400号码");
        win.show();


    },
    showSet: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.getNum400Info', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.num400.set', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("400号设置");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    add: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            data.dial400Fee = {};
            if(data.local) data.dial400Fee.local = data.local;
            if(data.remote) data.dial400Fee.remote = data.remote;
            if(data.prefixMin) data.dial400Fee.prefixMin = data.prefixMin;
            delete data.local;
            delete data.remote;
            delete data.prefixMin;
            App.util.AppUtil.request('bill.resource.addNum400', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加400号成功！");
                    win.close();
                    console.log(self);
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.resource.num400.add', {
            animateTarget: obj
        });
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                if(items[i].id == "set_num400_tool_use"){
                    var selectObj = selections[0];
                    if(selectObj){
                        if(selectObj.get("status") == "free"){
                            items[i].setDisabled(false);
                        } else {
                            items[i].setDisabled(true);
                        }
                    } else {
                        items[i].setDisabled(selections.length === 0);
                    }

                } else {
                    items[i].setDisabled(selections.length === 0);
                }
            }
        }
    }


})
