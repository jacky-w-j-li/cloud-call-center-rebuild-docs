Ext.define('App.controller.report.sales.personal.season', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportSalesPersonalSeason',
            selector: 'reportSalesPersonalSeason'
        },
        {
            ref: 'weekGrid',
            selector: 'reportSalesPersonalSeason > grid[class="query"]'
        }

    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportSalesPersonalSeason button#btn_export_season':{
                click : this.exportPersonalSeason
            },
            'reportSalesPersonalSeason button#btn_reset_season':{
                click : this.resetPersonalSeason
            }
        });
        this.initFlag = true;
    },
    //查询出所有节点
    queryAllGrid: function (obj) {
        var panel=this.reportSalesPersonalSeason();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.request('bill.report.reportSalesPersonalSeason',param, function (data, self) {
                if (data.success) {
                    panel.data=data.list;
                    var grid = form.up("panel").down("grid[class='query']");
                    grid.store.proxy.extraParams.data = Ext.JSON.encode(param);
                    grid.store.loadPage(1);
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    //导出
    exportPersonalSeason : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="exportPersonalSeason";
            App.util.AppUtil.request('bill.export.exportBillXls', data, function (rep, self) {
                if (rep.Succeed) {
                    self.downloadFile(rep.path);
                } else {
                    App.util.AppUtil.msg(rep.message);
                }
            }, this);
        }
    },
    //下载
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
    },
    //重置按钮
    resetPersonalSeason : function(obj){
        var form = obj.up("form");
        if (form.form.reset()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="resetPersonalSeason";
            var data = new Date();
            Ext.getCmp('btn_personal_year').setValue(data.getFullYear());
            Ext.getCmp('btn_area1_season').setValue('');
        }
    }

});