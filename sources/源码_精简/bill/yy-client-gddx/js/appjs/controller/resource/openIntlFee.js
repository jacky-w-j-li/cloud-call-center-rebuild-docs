Ext.define('App.controller.resource.openIntlFee', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs : [
        {
            ref: 'queryGrid',
            selector: 'openIntlFeeQueryPanel > grid[class="query"]'
        },
        {
            ref: 'addIntlFee',
            selector: 'addIntlFee'
        }
    ],
    init : function() {
        this.control({
            //开通国际长途
            'openIntlFeeQueryPanel >  button#btn_intlFee_add': {
                click: this.showAdd
            },
            'openIntlFeeQueryPanel >  button#delete_intlFee_tool':{
                click : this.delete
            },
            'addIntlFee >  button#serviceNum_new_button':{
                click: this.add
            },

            //详情
            'openIntlFeeQueryPanel >  button#btn_openIntlFee_show_detail': {
                click: this.showDetail
            },

            'openIntlFeeQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showDetail
            }
        });
        this.initFlag = true;
    },
    delete : function(obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var num = selection.get("num");
        App.util.AppUtil.commongDelete(this,"num","bill.resource.deleteIntlFee",{num:num});
    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.resource.openIntlFee.add', {
            animateTarget: obj
        });
        win.show();
    },
    add:function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var fieldset = form.down('fieldset');
            var param = App.util.AppUtil.getFormParam(fieldset);

            App.util.AppUtil.request('bill.resource.addIntlFeeNum',param,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("开通国际长途成功！");
                    var queryGrid =self.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections,this);
    },
    showDetail: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        //从服务号数据表取出数据
        var num = selection.get("num");
        var finalData=[];
        App.util.AppUtil.request('bill.resource.getServiceNumInfo', {_id: num}, function (data, self) {
            if (data.success) {
                finalData=data.data;
                var account=finalData.account;
                App.util.AppUtil.request('bill.account.getAccountInfoById', {_id: account}, function (data, self) {
                    if (data.success) {
                        finalData.companyName=data.data.companyName;
                        finalData.status=data.data.status;
                        var win = Ext.create('App.view.resource.openIntlFee.showDetail', {
                            data: finalData,
                            animateTarget: obj
                        });
                        win.setTitle(num + '---->' + '详情');
                        win.show();
                    } else {
                        App.util.AppUtil.msg("数据库找不到该服务号所属的用户！");
                    }
                }, this);

            } else {
                App.util.AppUtil.msg("数据库找不到该服务号！");
            }
        }, this);

    }

});