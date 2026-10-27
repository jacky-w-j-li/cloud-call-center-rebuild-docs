Ext.define('App.controller.account.industry', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    refs : [
        {
            ref: 'queryGrid',
            selector: 'industryQueryPanel > grid[class="query"]'
        },
        {
            ref: 'editIndustry',
            selector: 'editIndustry',
        }
    ],
    init : function() {
        this.control({
            'industryQueryPanel > grid[class="query"]' : {
                selectionchange:this.enableDockItems,
                itemdblclick: this.showUpdate,
            },
            'industryQueryPanel >  button#toolbar_add_industry': {
                click: this.showAdd,
            },
            'industryQueryPanel >  button#toolbar_update_industry' : {
                click: this.showUpdate,
            },
            'industryQueryPanel >  button#toolbar_delete_industry' : {
                click: this.remove,
            },
            'editIndustry >  button#commit_button' : {
                click: this.upsert,
            },

        });
    },
    enableDockItems: function(selModel,selections){
        App.util.AppUtil.commonDock(selections,this);
    },
    showAdd: function(obj){
        var win = Ext.create('App.view.account.industry.edit',{
            animateTarget: obj,
            editMode: 'addNew'
        });

        win.show();
    },
    showUpdate: function(obj){
        var win = Ext.create('App.view.account.industry.edit',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    upsert:function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var industryInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));
        console.log(form.form.isValid())
        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            App.util.AppUtil.request('bill.account.updateIndustry',industryInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新行业成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }else if(win.editMode == 'addNew'){
            App.util.AppUtil.request('bill.account.addIndustry',industryInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加行业成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    remove:function(){
        App.util.AppUtil.commongDelete(this,"name","bill.account.removeIndustry",{});
    }

});