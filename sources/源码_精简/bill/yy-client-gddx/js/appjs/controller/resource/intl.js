Ext.define('App.controller.resource.intl', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    refs : [
        {
            ref: 'queryGrid',
            selector: 'intlQueryPanel > grid[class="query"]'
        },
        {
            ref: 'editIntl',
            selector: 'editIntl',
        }
    ],
    init : function() {
        this.control({
            'intlQueryPanel > grid[class="query"]' : {
                selectionchange:this.enableDockItems,
                itemdblclick: this.showUpdate,
            },
            'intlQueryPanel >  button#toolbar_add_intl': {
                click: this.showAdd,
            },
            'intlQueryPanel >  button#toolbar_update_intl' : {
                click: this.showUpdate,
            },
            'intlQueryPanel >  button#toolbar_delete_intl' : {
                click: this.remove,
            },
            'editIntl >  button#commit_button' : {
                click: this.upsert,
            },

        });
    },
    enableDockItems: function(selModel,selections){
        App.util.AppUtil.commonDock(selections,this);
    },
    showAdd: function(obj){
        var win = Ext.create('App.view.resource.intl.edit',{
            animateTarget: obj,
            editMode: 'addNew'
        });

        win.show();
    },
    showUpdate: function(obj){
        var win = Ext.create('App.view.resource.intl.edit',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    upsert:function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var intlInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));
        console.log(form.form.isValid())
        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            App.util.AppUtil.request('bill.resource.updateIntl',intlInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新国际长途成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }else if(win.editMode == 'addNew'){
            App.util.AppUtil.request('bill.resource.addIntl',intlInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加国际长途成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    remove:function(){
        App.util.AppUtil.commongDelete(this,"_id","bill.resource.removeIntl",{});
    }

});