Ext.define('App.controller.resource.callLine', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs : [
        {
            ref: 'queryGrid',
            selector: 'callLineQueryPanel > grid[class="query"]'
        },
        {
            ref: 'addLineWindow',
            selector: 'addLineWindow'
        }
    ],
    init : function() {
        this.control({
            'callLineQueryPanel >  button#add_line_tool': {
                click: this.showAdd
            },
            'addLineWindow >  button#commit_button':{
                click: this.add
            },
            'callLineQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showUpdate
            },
            'callLineQueryPanel >  button#update_line_tool': {
                click: this.showUpdate
            },
            'updateLineWindow >  button[class="commit_button"]':{
                click : this.update
            },
            'callLineQueryPanel >  button#delete_line_tool':{
                click : this.delete
            }
        });
        this.initFlag = true;
    },
    delete : function(obj){
        App.util.AppUtil.commongDelete(this,"name","bill.resource.deleteLine",{});
    },
    update : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var data = {};
            var feeSet = form.down('fieldset');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);
            data.dialFee = {};
            data.internationalFee = {};
            for(var key in feeSetData){
                if(key.startWith("dial_")){
                    data.dialFee[key.replace("dial_","")] =  feeSetData[key];
                    continue;
                }
                if(key.startWith("intl_")){
                    data.internationalFee[key.replace("intl_","")] =  feeSetData[key];
                    continue;
                }
                data[key] = feeSetData[key];
            }
            App.util.AppUtil.request('bill.resource.updateLine',data,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新线路信息成功");
                //  App.util.AppUtil.getDicStore("line",true);
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
        App.util.AppUtil.commonShowUpdate(obj,this,'bill.resource.getLineInfo','App.view.resource.callLine.update');
    },
    add : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var data = {};
            var feeSet = form.down('fieldset#line_add_info');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);
            data.dialFee = {};
            data.internationalFee = {};
            for(var key in feeSetData){
                if(key.startWith("dial_")){
                    data.dialFee[key.replace("dial_","")] =  feeSetData[key];
                    continue;
                }
                if(key.startWith("intl_")){
                    data.internationalFee[key.replace("intl_","")] =  feeSetData[key];
                    continue;
                }
                data[key] = feeSetData[key];
            }

            App.util.AppUtil.request('bill.resource.addLine',data,function(data,self){
                if(data.success){
                    self.getAddLineWindow().close();
                    App.util.AppUtil.msg("添加线路成功");
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
        var win = Ext.create('App.view.resource.callLine.add', {
            animateTarget: obj
        });
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections,this);
    }

});