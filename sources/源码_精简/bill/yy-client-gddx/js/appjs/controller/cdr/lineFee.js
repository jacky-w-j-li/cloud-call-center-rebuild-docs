Ext.define('App.controller.cdr.lineFee', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'lineFeeQueryPanel',
            selector: 'lineFeeQueryPanel'
        },
        {
            ref: 'lineFeeGrid',
            selector: 'lineFeeQueryPanel > grid[class="query"]'
        }

    ],
    init : function() {
        this.control({
            'lineFeeQueryPanel button#btn_lineFee_all_query':{
//                click : this.queryAllGrid
            },
            'lineFeeQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showLineFee
            },
            'lineFeeQueryPanel button#btn_cdr_lineFee_detail':{
                click : this.showLineFee
            },
            'lineFeeQueryPanel button#btn_export_line_fee':{
                click : this.exportLineFee
            }

        });
        this.initFlag = true;
    },
    queryAllGrid: function (obj) {
        var panel=this.getLineFeeQueryPanel();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);
//            alert(param.line);
//            console.dir(param);
            App.util.AppUtil.request('bill.cdr.queryCdrLineFeeDetail',param, function (data, self) {
                if (data.success) {
//                    console.dir(data)
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
    showLineFee: function (obj) {
        var selection = this.getLineFeeGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.cdr.showLineFee', {
            data: selection.raw,
            animateTarget: obj
        });
        win.setTitle(selection.get('_id') + '---->' + '线路成本详情');
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getLineFeeGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    //导出功能
    exportLineFee : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="exportLineFee";
//            console.dir(data);
            App.util.AppUtil.request('bill.export.exportBillXls', data, function (rep, self) {
                if (rep.Succeed) {
                    self.downloadFile(rep.path);
//                    App.util.AppUtil.msg("导出成功！");
                } else {
                    App.util.AppUtil.msg(rep.message);
                }
            }, this);
        }
    },
    downloadFile: function (fileUrl) {
//        var url = fileUrl + "&sessionId=" + session.id;
        var url = fileUrl;
        var container = {
            id: 'downloadFile_Frame',
            tag: 'iframe',
            style: 'display:none'
        };
        var frame=Ext.getDom("downloadFile_Frame");
//        console.info(url);
        if(!frame){
            Ext.DomHelper.append(Ext.getBody(),container);
            frame=Ext.getDom("downloadFile_Frame");
        }

//        console.dir(frame);
        frame.src=url;
    }


})