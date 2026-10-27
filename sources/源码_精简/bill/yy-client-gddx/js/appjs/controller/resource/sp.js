Ext.define('App.controller.resource.sp', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs : [
        {
            ref: 'queryGrid',
            selector: 'spQueryPanel > grid[class="query"]'
        },
        {
            ref: 'addSpWindow',
            selector: 'addSpWindow'
        }
    ],
    init : function() {
        this.control({
            'spQueryPanel >  button#add_sp_tool': {
                click: this.showAdd
            },
            'addSpWindow >  button#commit_button':{
                click: this.add
            },
            'spQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showUpdate
            },
            'spQueryPanel >  button#update_sp_tool': {
                click: this.showUpdate
            },
            'updateSpWindow >  button[class="commit_button"]':{
                click : this.update
            },
            'spQueryPanel >  button#delete_sp_tool':{
                click : this.delete
            }
        });
        this.initFlag = true;
    },
    delete : function(obj){
        this.spDelete(this,"name","bill.resource.deleteSp",{});
    },
    //删除并刷新缓存
    spDelete: function (self, displayField, action, data , queryGrid){
        queryGrid = queryGrid || self.getQueryGrid();
        var selection = queryGrid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        data = data || {};
        data._id = id;
        var display = selection.get(displayField);
        Ext.Msg.confirm("警告", "确认删除[" + display + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request(action, data, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除成功！");
                        App.util.AppUtil.getDicStore("sp",true);//刷新缓存
                        queryGrid.store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, self);
            }
        });
    },
    update : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var data = {};
            var feeSet = form.down('fieldset');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);
            for(var key in feeSetData){
                data[key] = feeSetData[key];
            }
            App.util.AppUtil.request('bill.resource.updateSp',data,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新运营商信息成功");
                    App.util.AppUtil.getDicStore("sp",true);
                    var queryGrid =self.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);

        }
//        App.util.AppUtil.commonUpdate(obj,"bill.resource.updateLine","更新线路信息成功！",this);
    },
    showUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj,this,'bill.resource.getSpInfo','App.view.resource.sp.update');
    },
    add : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var data = {};
            var feeSet = form.down('fieldset#sp_add_info');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);
            for(var key in feeSetData){
                data[key] = feeSetData[key];
            }
            App.util.AppUtil.request('bill.resource.addSp',data,function(data,self){
                if(data.success){
                    self.getAddSpWindow().close();
                    App.util.AppUtil.msg("添加运营商成功");
                    App.util.AppUtil.getDicStore("sp",true);//刷新缓存
                    var queryGrid =self.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);

        }
//        App.util.AppUtil.commonAdd(obj,"bill.resource.addLine","添加线路成功！",this);
    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.resource.sp.add', {
            animateTarget: obj
        });
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections,this);
    }

});