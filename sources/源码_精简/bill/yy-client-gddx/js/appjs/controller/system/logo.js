Ext.define('App.controller.system.logo', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    fileUpload_timeout: 10000,
    initFlag: false,
    refs : [
        {
            ref: 'logoQueryPanel',
            selector: 'logoQueryPanel'
        },
        {
            ref: 'queryGrid',
            selector: 'logoQueryPanel > grid[class="query"]'
        },
        {
            ref: 'addLogoWindow',
            selector: 'addLogoWindow'
        },
        {
            ref: 'updateLogoWindow',
            selector: 'updateLogoWindow'
        }
    ],
    init : function() {
        this.control({
            'logoQueryPanel >  button#add_logo_tool': {
                click: this.showAdd
            },
            'addLogoWindow >  button#add_logo_commit_button':{
                click: this.addLogo
            },
            'logoQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showUpdate
            },
            'logoQueryPanel >  button#update_logo_tool': {
                click: this.showUpdate
            },
            'updateLogoWindow >  button#update_logo_commit_button':{
                click : this.updateLogo
            },
            'logoQueryPanel >  button#delete_logo_tool':{
                click : this.deleteLogo
            }
        });
        this.initFlag = true;
    },
    deleteLogo:function(obj){
        var self=this.getLogoQueryPanel();
        var displayField="_id";
        var action="bill.system.deleteLogo";
        var data={};

        var queryGrid = self.down("#logo_query_grid");
        var selection = queryGrid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var fileName=selection.get("fileName");
        data = data || {};
        data._id = id;
        data.fileName=fileName;
        var display = selection.get(displayField);
        Ext.Msg.confirm("警告", "确认删除[" + display + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request(action, data, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除成功！");
                        queryGrid.store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, self);
            }
        });
    },
    showUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj,this,'bill.system.getLogoInfo','App.view.system.logo.updateLogo');
    },
    updateLogo : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        var self=this;

        if(form.down('#update_LoadImage').getValue()){//图片修改
            if(form.getForm().isValid()){
                var filePath = win.down('#update_LoadImage').getValue();
                //判断是否是图片类型
                function CheckFileExt(extstr,exg)
                {
                    var extstr = extstr.substring(extstr.lastIndexOf(".")).toLowerCase();
                    if (!extstr.match(exg)) {
                        return false;
                    }
                    return true;
                }
                if(!CheckFileExt(filePath,/.jpg|.jpeg|.gif|.png|.bmp/i))
                {
                    App.util.AppUtil.msg('您上传的文件类型不支持，请重新选择！');
                    return;
                }
                form.getForm().submit({
                    type: 'submit',
                    url: "./form",
                    waitMsg: '正在上传你的文件...',
                    failure: function (fp, action) {
                        //返回的response要进行处理
                        var message=JSON.parse(action.response.responseText).message;
                        win.close();
                        App.util.AppUtil.msg('更新Logo失败:'+message);
                    },
                    success: function (fp, action) {
                        App.util.AppUtil.msg('更新Logo成功！');
                        win.close();
                        self.getQueryGrid().store.load();
                    }
                });
            }else {
                App.util.AppUtil.msg("系统提示:请填写域名和选择文件！");
            }
        }else{//图片未修改
            if (form.form.isValid()) {
                var fieldset = form.down('fieldset');
                var data = App.util.AppUtil.getFormParam(fieldset);

                App.util.AppUtil.request('bill.system.updateLogoInfo', data, function (data, self) {
                    if (data.success) {
                        App.util.AppUtil.msg("修改logo信息成功！");
                        win.close();
                        self.getQueryGrid().store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }
        }

    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.system.logo.addLogo', {
            animateTarget: obj
        });
        win.show();
    },
    addLogo : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        var self=this;

        if(form.getForm().isValid()){
            var filePath = win.down('#LoadImage').getValue();
            //判断是否是图片类型
            function CheckFileExt(extstr,exg)
            {
                var extstr = extstr.substring(extstr.lastIndexOf(".")).toLowerCase();
                if (!extstr.match(exg)) {
                    return false;
                }
                return true;
            }
            if(!CheckFileExt(filePath,/.jpg|.jpeg|.gif|.png|.bmp/i))
            {
                App.util.AppUtil.msg('您上传的文件类型不支持，请重新选择！');
                return;
            }
            form.getForm().submit({
                type: 'submit',
                url: "./form",
                waitMsg: '正在上传你的文件...',
                failure: function (fp, action) {
                    //返回的response要进行处理
                    var message=JSON.parse(action.response.responseText).message;
                    win.close();
                    App.util.AppUtil.msg('添加Logo失败:'+message);
                },
                success: function (fp, action) {
                    App.util.AppUtil.msg('添加Logo成功！');
                    win.close();
                    self.getQueryGrid().store.load();
                }
            });
        }else {
            App.util.AppUtil.msg("系统提示:请填写域名和选择文件！");
        }
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections,this);
    }

});