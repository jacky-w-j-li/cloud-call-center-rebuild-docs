var groupIndex;
Ext.define('App.controller.resource.dialCount', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    refs : [
        {
            ref: 'queryGrid',
            selector: 'dialCountQueryPanel > grid[class="query"]'
        },
        {
            ref: 'addDialCount',
            selector: 'addDialCount',
        },
        {
            ref: 'queryAccountGrid',
            selector: 'addAccountCountWin >  grid[class="query"]',
        }

    ],
    init : function() {
        this.control({
            'dialCountQueryPanel > grid[class="query"]' : {
                selectionchange:this.enableDockItems,
                itemdblclick: this.showUpdate
            },
            'addAccountCountWin >  grid[class="query"]':{
                selectionchange:this.enableDockAccountItems,
                itemdblclick: this.showUpdate
            },
            'dialCountQueryPanel >  button#toolbar_add_dial_count': {
                click: this.showAdd,
            },
            'dialCountQueryPanel >  button#toolbar_update_dial_count' : {
                click: this.showUpdate,
            },
            'dialCountQueryPanel >  button#toolbar_delete_dial_count' : {

                //删除拨号计数
                click: this.remove,
            },
            'dialCountQueryPanel >  button#toolbar_set_dial_count' : {
                //设置拨号计数
                click: this.setDialCount,
            },
            'addDialCount >  button#commit_button_dial' : {
                click:this.addDialCountNum
            },
            'addAccountCountWin >  button#btn_show_add_account_count' : {
                //设置账号计数
                click:this.setAccountCount
            },
            'addAccountCountWin >  button#btn_show_update_account_count' : {
                //修改账号计数设置
                click:this.updateAccountCount

            },
            //removeAccountCount
            'addAccountCountWin >  button#btn_delete_account_count' :{
                //移除账号计数
                click:this.removeAccount
            },
            //btn_addCount_save
            'addCount >  button#btn_addCount_save' : {
                //保存账号计数设置
                click:this.addAccountCount

            },



        });
    },
    enableDockItems: function(selModel,selections){
        App.util.AppUtil.commonDock(selections,this,this.getQueryGrid());
    },
    enableDockAccountItems:function (selModel,selections) {
        groupIndex=selModel.lastFocused.index;
        console.log(groupIndex);
       App.util.AppUtil.commonDock(selections,this,this.getQueryAccountGrid());
    },
    showAdd: function(obj){
        var win = Ext.create('App.view.resource.dialCount.add',{
            animateTarget: obj,
            editMode: 'addNew'
        });

        win.show();
    },
    showUpdate: function(obj){
        var win = Ext.create('App.view.resource.dialCount.add',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    addDialCountNum:function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var DialCountNumInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));

        if(!form.form.isValid()){
            return;
        }

        if(win.editMode == 'update'){
            App.util.AppUtil.request('bill.resource.updateDialCount',DialCountNumInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新拨号计数成功");
                    self.getQueryGrid().store.load();
                } else {

                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }else if(win.editMode == 'addNew'){
            App.util.AppUtil.request('bill.resource.addDialCountNum',DialCountNumInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加拨号计数成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }


    },
    remove:function(){
        App.util.AppUtil.commongDelete(this,"_id","bill.resource.removeDialCount",'',this.getQueryGrid());
    },
    removeAccount:function () {
        var grid=this.getQueryAccountGrid();
        var selection = grid.getSelectionModel().getSelection()[0];
        console.log(selection.data);
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        var datas={
            id:items[2].value,
            name:selection.data.name
        };
        console.log("datas=")
        console.log(datas);
        App.util.AppUtil.commongDelete(this,"name","bill.resource.removeAccountCount",datas,grid);
    },
    //拨号列表设置
    setDialCount:function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.resource.dialCount.addAccountCountWin', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle('账户拨号计数');
        win.show();
    },
    //账户拨号设置
    setAccountCount:function (obj) {
        var parent=obj.up("window");
        var account=parent.account;
        var win = Ext.create('App.view.resource.dialCount.addCount', {
            editMode :"addNew",
            account: account,
            animateTarget: obj
        });
        win.setTitle('添加账号拨号');
        win.show();
    },
    //账户拨号修改
    updateAccountCount:function (obj) {

        // console.log(this.selModel.lastFocused.index)
        var parent=obj.up("window");
        var account=parent.account;
        var win = Ext.create('App.view.resource.dialCount.addCount', {
            editMode :"update",
            account: account,
            animateTarget: obj,
            record:this.getQueryAccountGrid().getSelectionModel().getSelection()[0],
        });
        win.setTitle('修改账号拨号');
        win.show();
    },
    addAccountCount :function (obj) {

        var win = obj.up('window');
        var form = win.down('form');
        var DialCountNumInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));
        var account=[];
        account.name=DialCountNumInfo.name;                                   //账户名称
        account.companyName=DialCountNumInfo.companyName;                     //公司名称
        account.accountCount=DialCountNumInfo.accountCount;                   //拨号次数
        account.accountResidualCount=DialCountNumInfo.accountResidualCount;   //剩余拨号次数

        if(win.editMode == 'update'){
            console.log("into update...")
            DialCountNumInfo.groupIndex=groupIndex;
            DialCountNumInfo._NIndex=this.getQueryAccountGrid().getSelectionModel().getSelection()[0].data._NIndex;
            console.log(DialCountNumInfo);
            App.util.AppUtil.request('bill.resource.updateDialCountAccSet',DialCountNumInfo,function(data,self){

                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("更新拨号计数成功");
                    self.getQueryAccountGrid().store.load();
                } else {

                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }else if(win.editMode == 'addNew'){
            console.log("into add...")
            App.util.AppUtil.request('bill.resource.updateDialCountAcc',DialCountNumInfo,function(data,self){

                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加拨号计数成功");
                    self.getQueryAccountGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }

    }

});