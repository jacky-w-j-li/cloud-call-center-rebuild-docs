Ext.define('App.controller.report.sales.area.week', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportSalesAreaWeek',
            selector: 'reportSalesAreaWeek'
        },
        {
            ref: 'areaWeekGrid',
            selector: 'reportSalesAreaWeek > grid[class="query"]'
        }

    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportSalesAreaWeek button#btn_export_area_week':{
                click : this.exportAreaWeek
            },
            'reportSalesAreaWeek button#btn_reset_area_week':{
                click : this.resetAreaWeek
            }
        });
        this.initFlag = true;
    },
    //查询出所有节点
    queryAllGrid: function (obj) {
        var panel=this.reportSalesAreaWeek();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.request('bill.report.reportSalesAreaWeek',param, function (data, self) {
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
    exportAreaWeek : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="exportAreaWeek";
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
    resetAreaWeek : function(obj){
        var form = obj.up("form");
        if (form.form.reset()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="resetAreaWeek";
            var data = new Date();
            Ext.getCmp('btn_area_reportType').setValue('day');
            Ext.getCmp('btn_area').setValue('all');
            Ext.getCmp('btn_area_year').setValue(data.getFullYear());
            Ext.getCmp('btn_area_month').setValue('');
        }
    }

});
