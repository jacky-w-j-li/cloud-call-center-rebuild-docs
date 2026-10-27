Ext.define('App.controller.resource.smsChannel', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    refs : [
        {
            ref: 'queryGrid',
            selector: 'smsChannelQueryPanel > grid[class="query"]'
        },
        {
            ref: 'editSmsChannel',
            selector: 'editSmsChannel',
        }
    ],
    init : function() {
        this.control({
            'smsChannelQueryPanel > grid[class="query"]' : {
                selectionchange:this.enableDockItems,
                itemdblclick: this.showUpdate,
            },
            'smsChannelQueryPanel >  button#toolbar_add_sms_channel': {
                click: this.showAdd,
            },
            'smsChannelQueryPanel >  button#toolbar_update_sms_channel' : {
                click: this.showUpdate,
            },
            'smsChannelQueryPanel >  button#toolbar_delete_sms_channel' : {
                click: this.remove,
            },
            'editSmsChannel >  button#commit_button' : {
                click: this.upsert,
            },

        });
    },
    enableDockItems: function(selModel,selections){
        App.util.AppUtil.commonDock(selections,this);
    },
    showAdd: function(obj){
        var win = Ext.create('App.view.resource.smsChannel.edit',{
            animateTarget: obj,
            editMode: 'addNew'
        });

        win.show();
    },
    showUpdate: function(obj){
        console.log("show update.")
        var win = Ext.create('App.view.resource.smsChannel.edit',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    upsert:function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var channelInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));
        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            App.util.AppUtil.request('bill.resource.updateSmsChannel',channelInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新短信通道成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }else if(win.editMode == 'addNew'){
            App.util.AppUtil.request('bill.resource.addSmsChannel',channelInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加短信通道成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    remove:function(){
        App.util.AppUtil.commongDelete(this,"name","bill.resource.removeSmsChannel",{});
    }

});