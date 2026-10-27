/**
 * Created by on 2015/11/11.
 */
Ext.define('App.controller.report.proxy.global', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportProxyGlobal',
            selector: 'reportProxyGlobal'
        },
    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportProxyGlobal button#btn_export_globals':{
                click:this.exporGlobalreport
            },
            'reportProxyGlobal button#btn_reset_years':{
                click:this.restYeraandreports
            }
        });
        this.initFlag = true;
    },
    //重置按钮的方法
    restYeraandreports:function(obj){
        var form = obj.up("form");
        if(form.form.reset()){
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="restYeraandreports";
            var data=new Date();
            Ext.getCmp('globalyear').setValue(data.getFullYear());
        }

    },
    //导出Excele  渠道整体报表
    exporGlobalreport : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.exportReport('bill.proxy.exportChannelAllReport', data, function (rep, self) {
            }, this);
        }
    },
    downloadFile: function (fileUrl) {
        var url = fileUrl;
        var container = {
            id: 'downloadFile_Frame',
            tag: 'iframe',
            style: 'display:none'
        };
        var frame=Ext.getDom("downloadFile_Frame");
        if(!frame){
            Ext.DomHelper.append(Ext.getBody(),container);
            frame=Ext.getDom("downloadFile_Frame");
        }
        frame.src=url;
    }
});

