Ext.define('App.controller.resource.serviceNumWhiteList', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    refs : [
        {
            ref: 'queryGrid',
            selector: 'serviceNumWhiteListQueryPanel > grid[class="query"]'
        },
        {
            ref: 'editServiceNumWhiteList',
            selector: 'editServiceNumWhiteList',
        }
    ],
    init : function() {
        this.control({
            'serviceNumWhiteListQueryPanel > grid[class="query"]' : {
                selectionchange:this.enableDockItems,
                itemdblclick: this.showUpdate,
            },
            'serviceNumWhiteListQueryPanel >  button#toolbar_add_serviceNumWhiteList': {
                click: this.showAdd,
            },
            'serviceNumWhiteListQueryPanel >  button#toolbar_update_serviceNumWhiteList' : {
                click: this.showUpdate,
            },
            'serviceNumWhiteListQueryPanel >  button#toolbar_delete_serviceNumWhiteList' : {
                click: this.remove,
            },
            'editServiceNumWhiteList >  button#commit_button' : {
                click: this.upsert,
            },

        });
    },
    enableDockItems: function(selModel,selections){
        App.util.AppUtil.commonDock(selections,this);
    },
    showAdd: function(obj){
        var win = Ext.create('App.view.resource.serviceNumWhiteList.edit',{
            animateTarget: obj,
            editMode: 'addNew'
        });

        win.show();
    },
    showUpdate: function(obj){
        var win = Ext.create('App.view.resource.serviceNumWhiteList.edit',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    upsert:function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var serviceNumWhiteListInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));
        console.log(form.form.isValid())
        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            App.util.AppUtil.request('bill.resource.updateServiceNumWhiteList',serviceNumWhiteListInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新号码白名单成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }else if(win.editMode == 'addNew'){
            App.util.AppUtil.request('bill.resource.addServiceNumWhiteList',serviceNumWhiteListInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加号码白名单成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    remove:function(){
        App.util.AppUtil.commongDelete(this,"_id","bill.resource.removeServiceNumWhiteList",{});
    }

});