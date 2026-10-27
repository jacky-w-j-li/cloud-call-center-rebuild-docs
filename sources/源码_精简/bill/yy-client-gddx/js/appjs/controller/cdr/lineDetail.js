Ext.define('App.controller.cdr.lineDetail', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'lineDetailQueryPanel',
            selector: 'lineDetailQueryPanel'
        },
        {
            ref: 'lineDetailGrid',
            selector: 'lineDetailQueryPanel > grid[class="query"]'
        }

    ],
    init : function() {
        this.control({
            'lineDetailQueryPanel button#btn_line_detail_query':{
//                click : this.queryAllGrid
            },
            'lineDetailQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showLineDetail      //双击事件
            },
            'lineDetailQueryPanel button#btn_cdr_show_line_detail':{
                click : this.showLineDetail
            },
            'lineDetailQueryPanel button#btn_export_line_detail':{
                click : this.exportLineDetail
            }

        });
        this.initFlag = true;
    },
    queryAllGrid: function (obj) {
        var panel=this.getLineDetailQueryPanel();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.request('bill.cdr.queryCdrLineDetail',param, function (data, self) {
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
    showLineDetail: function (obj) {
        var selection = this.getLineDetailGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.cdr.showLineDetail', {
            data: selection.raw,
            animateTarget: obj
        });
        win.setTitle(selection.get('_id') + '---->' + '线路话单详情');
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getLineDetailGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    //导出功能
    exportLineDetail : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="exportLineDetail";
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