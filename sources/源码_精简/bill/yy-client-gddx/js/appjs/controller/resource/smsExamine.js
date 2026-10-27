Ext.define('App.controller.resource.smsExamine', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    refs : [
        {
            ref: 'queryGrid',
            selector: 'smsExamine > grid[class="query"]'
        },
        {
            ref: 'editSmsChannel',
            selector: 'editSmsChannel',
        },
        {
            ref : 'smsExamineCheckedWin',
            selector : 'smsExamineCheckedWin'
        },
        {
            ref : 'smsExamineWin',
            selector : 'smsExamine'
        },
        {
            ref: 'queryAccountGrid',
            selector: 'addAccountCountWin >  grid[class="query"]',
        },
        {
            ref:'queryCommunicateGrid',
            selector:'toCommunicate >  grid[class="query"]'
        }

    ],
    init : function() {
        this.control({
            'smsExamine > grid[class="query"]' : {
                selectionchange:this.enableDockItems,
                itemdblclick: this.toShowSmsDetail,
            },
            'toCommunicate >  grid[class="query"]' : {
                selectionchange:this.enableDockItems,
                itemdblclick: this.toShowMessageDetail,
            },
            'smsExamine >  button#toolbar_checked_sms_examine': {
                click: this.toShowChecked,
            },
            'smsExamine >  button#toolbar_no_checked_sms_examine' : {
                click: this.notToChecked,
            },
            'smsExamine >  button#toolbar_communicate_sms_examine' : {
                click: this.toShowCommunicate,
            },
            'notCheckedWin >  button#commit_button' : {
                click: this.upsert,
            },
            'toCommunicate >  button#btn_show_add_count':{
                click: this.showAddCommunicate
            },
            'smsExamineCheckedWin >  button#btn_add_sms_examine':{
                click: this.examineSmsTemplete
            },
            'addCommunicateWin >  button#btn_addCommunicate':{
                click:this.addCommunicate
            }


        });
    },
    enableDockItems: function(selModel,selections){
        App.util.AppUtil.commonDock(selections,this);
    },
    toShowChecked: function(obj){
        var account=this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.resource.smsExamine.checked',{
            animateTarget: obj,
            editMode: 'addNew',
            account:account,
            templateValue:account.data.templateType
        });

        win.show();
    },
    toShowSmsDetail:function (obj) {
        var selection =this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.resource.smsExamine.showSmsDetail', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle('短信信息');
        win.show();

    },
    toShowMessageDetail:function (obj) {
        var selection =this.getQueryCommunicateGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.resource.smsExamine.showMessageDetail', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle('短信信息');
        win.show();

    },
    //沟通
    toShowCommunicate :function (obj) {
        var selection =this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.resource.smsExamine.toCommunicate', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle('沟通列表');
        win.show();
    },
    notToChecked: function(obj){
        var win = Ext.create('App.view.resource.smsExamine.notChecked',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    showAddCommunicate: function(obj){
        var win = Ext.create('App.view.resource.smsExamine.addCommunicate',{
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
            App.util.AppUtil.request('bill.resource.updateNoSmsExamine',channelInfo,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("不通过审核成功");
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
    },
    addCommunicate:function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var channelInfo = App.util.AppUtil.getFormParam(form.down('fieldset'));
        if(!form.form.isValid()){
            return;
        }
        App.util.AppUtil.request('bill.resource.addCommunicate',channelInfo,function(data,self){
            if(data.success){
                win.close();
                App.util.AppUtil.msg("添加成功");
                self.getQueryCommunicateGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        },this);
    },
    //审核短信模版
    examineSmsTemplete : function (){
        var win = this.getSmsExamineCheckedWin();
        var form = win.down('form');
        if (form.form.isValid()){
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            //内容加签名总文字长度不超过280个字
            var signContent = data.sign;
            var signRecord = fieldset.down('combobox[name="sign"]').findRecordByValue(data.sign);
            if(signRecord){
                signContent = signRecord.raw.codeName;;
            }
            var signLength = signContent.length;
            var contentLength = data.content.length;
            if(signLength + contentLength > 280){
                return App.util.AppUtil.msg('内容加签名总文字长度不可以超过280个字');
            }
            if(data.operatorStrategy){
                data.operatorStrategy=data.operatorStrategy.operatorStrategy;

            }
            if (data.smsChannel) {
                data.smsChannel = data.smsChannel.smsChannel || [];
            }
            if(!(data.smsChannel instanceof  Array)){
                var temp = data.df_smsChannel;
                data.smsChannel = [temp];
            }
            App.util.AppUtil.request('bill.resource.updateSmsExamine', data , function(data , self){
                if (data.success){
                    App.util.AppUtil.msg("添加短信模板成功！");
                    win.close();
                        self.getSmsExamineWin().store.load();
                }   else {
                    App.util.AppUtil.msg(data.message);
                }
            } , this);
        }
    },

});