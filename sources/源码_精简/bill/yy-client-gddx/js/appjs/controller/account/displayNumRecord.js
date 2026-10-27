Ext.define('App.controller.account.displayNumRecord', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'displayNumRecordPanel',
            slelctor: 'displayNumRecordPanel'
        },
        {
            ref: 'queryGrid',
            selector: 'displayNumRecordPanel > grid[class="query"]'
        }

    ],
    init: function () {
        this.control(
            {
                'displayNumRecordPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showUpdate,
                },
                'displayNumRecordPanel >  button#toolbar_add_display_num_record': {
                    click: this.showAdd,
                },
                'displayNumRecordPanel >  button#toolbar_update_display_num_record' : {
                    click: this.showUpdate,
                },
                'displayNumRecordPanel >  button#toolbar_delete_display_num_record' : {
                    click: this.remove,
                },
                'displayNumRecordPanel >  button#toolbar_download_display_num_record' : {
                    click: this.downloadOathImg,
                },
                'editDisplayNumRecord >  button#commit_button' : {
                    click: this.upsert,
                },
            }
        );
        this.initFlag = true;
    },
    enableDockItems: function(selModel,selections){
        App.util.AppUtil.commonDock(selections,this);
    },
    showAdd: function(obj){
        var win = Ext.create('App.view.account.displayNumRecord.edit',{
            animateTarget: obj,
            editMode: 'addNew'
        });

        win.show();
    },
    showUpdate: function(obj){
        var win = Ext.create('App.view.account.displayNumRecord.edit',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    upsert:function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var displayNumRecordInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));

        var displayNums = form.down('fieldset#displayNums').nums;
        if(!displayNums || !displayNums.length){
            form.down('textfield#add_num').markInvalid("透传号码不能为空!");
            return;
        }

        displayNumRecordInfo.displayNums = displayNums;
        displayNumRecordInfo.oathImgs = displayNumRecordInfo.oathImgs || null;

        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            App.util.AppUtil.request('bill.account.updateDisplayNumRecord',displayNumRecordInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新备案成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }else if(win.editMode == 'addNew'){
            App.util.AppUtil.request('bill.account.addDisplayNumRecord',displayNumRecordInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加备案成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    remove:function(){
        App.util.AppUtil.commongDelete(this,"accountName","bill.account.removeDisplayNumRecord",{});
    },
});