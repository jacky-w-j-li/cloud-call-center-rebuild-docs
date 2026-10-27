Ext.define('App.controller.resource.cc.board', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'ccsetBoardWindow',
            selector: 'ccsetBoardWindow'
        },
        {
            ref: 'queryGrid',
            selector: 'ccboardQueryPanel > grid[class="query"]'
        },
        {
            ref: 'outRouteQueryGrid',
            selector: 'ccsetBoardWindow >  panel#calloutRoute_config_panel > grid[class="query"]'
        },
        {
            ref: 'outLineQueryGrid',
            selector: 'ccsetBoardWindow >  panel#calloutLine_config_panel > grid[class="query"]'
        },
        {
            ref: 'inRouteQueryGrid',
            selector: 'ccsetBoardWindow >  panel#callinRoute_config_panel > grid[class="query"]'
        },
        {
            ref: 'serverQueryGrid',
            selector: 'ccsetBoardWindow >  panel#server_config_panel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control({
            'panel#calloutRoute_config_panel >  button#cc_add_outRoute_tool': {
                click: this.showOutRouteAdd
            },
            'ccaddBoardOutRouteWindow >  button#commit_button': {
                click: this.addOutRoute
            },
            'panel#calloutRoute_config_panel >  button#cc_update_outRoute_tool': {
                click: this.showOutRouteUpdate
            },
            'ccupdateBoardOutRouteWindow >  button[class="commit_button"]': {
                click: this.updateOutRoute
            },
            'panel#calloutRoute_config_panel >  button#cc_delete_outRoute_tool': {
                click: this.deleteOutRoute
            },
            'panel#calloutRoute_config_panel >  button#cc_effect_outRoute_tool':{
                click : this.effectOutRoute
            },
            'ccsetBoardWindow >  panel#calloutRoute_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsOutRoute,
                itemdblclick: this.showOutRouteUpdate
            },


            'panel#calloutLine_config_panel >  button#cc_add_outLine_tool': {
                click: this.showOutLineAdd
            },
            'ccaddBoardOutLineWindow >  button#commit_button': {
                click: this.addOutLine
            },
            'panel#calloutLine_config_panel >  button#cc_update_outLine_tool': {
                click: this.showOutLineUpdate
            },
            'ccupdateBoardOutLineWindow >  button[class="commit_button"]': {
                click: this.updateOutLine
            },
            'panel#calloutLine_config_panel >  button#cc_delete_outLine_tool': {
                click: this.deleteOutLine
            },
            'panel#calloutLine_config_panel >  button#cc_effect_outLine_tool': {
                click: this.effectOutLine
            },
            'ccsetBoardWindow >  panel#calloutLine_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsOutLine,
                itemdblclick: this.showOutLineUpdate
            },


            'panel#callinRoute_config_panel >  button#cc_add_inRoute_tool': {
                click: this.showInRouteAdd
            },
            'ccaddBoardInRouteWindow >  button#commit_button': {
                click: this.addInRoute
            },
            'panel#callinRoute_config_panel >  button#cc_update_inRoute_tool': {
                click: this.showInRouteUpdate
            },
            'ccupdateBoardInRouteWindow >  button[class="commit_button"]': {
                click: this.updateInRoute
            },
            'panel#callinRoute_config_panel >  button#cc_delete_inRoute_tool': {
                click: this.deleteInRoute
            },
            'panel#callinRoute_config_panel >  button#cc_effect_inRoute_tool': {
                click: this.effectInRoute
            },
            'ccsetBoardWindow >  panel#callinRoute_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsInRoute,
                itemdblclick: this.showInRouteUpdate
            },


            'panel#server_config_panel >  button#cc_add_server_tool': {
                click: this.showServerAdd
            },
            'ccaddBoardServerWindow >  button#commit_button': {
                click: this.addServer
            },
            'panel#server_config_panel >  button#cc_update_server_tool': {
                click: this.showServerUpdate
            },
            'ccupdateBoardServerWindow >  button[class="commit_button"]': {
                click: this.updateServer
            },
            'panel#server_config_panel >  button#cc_delete_server_tool': {
                click: this.deleteServer
            },
            'ccsetBoardWindow >  panel#server_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsServer,
                itemdblclick: this.showServerUpdate
            },
            'ccboardQueryPanel >  button#cc_add_board_tool': {
                click: this.showAdd
            },
            'ccaddBoardWindow >  button#commit_button': {
                click: this.add
            },
            'ccboardQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showUpdate
            },
            'ccboardQueryPanel >  button#cc_update_board_tool': {
                click: this.showUpdate
            },
            'ccupdateBoardWindow >  button[class="commit_button"]': {
                click: this.update
            },
            'ccboardQueryPanel >  button#cc_delete_board_tool': {
                click: this.delete
            },
            'ccboardQueryPanel >  button#cc_set_board_tool': {
                click: this.showSet
            }
        });
        this.initFlag = true;
    },
    effectOutLine : function (obj){
        var data = {
            type : "gateway",
            boardId : this.getCcsetBoardWindow().data._id
        };
        App.util.AppUtil.request("bill.resource.cc.effectRoute", data, function (data) {
            if (data.success) {
                App.util.AppUtil.msg("生效路由成功！");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    effectInRoute : function(obj){
        var data = {
            type : "in",
            boardId : this.getCcsetBoardWindow().data._id
        };
        App.util.AppUtil.request("bill.resource.cc.effectRoute", data, function (data) {
            if (data.success) {
                App.util.AppUtil.msg("生效路由成功！");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    effectOutRoute : function(obj){
        var data = {
            type : "out",
            boardId : this.getCcsetBoardWindow().data._id
        };
        App.util.AppUtil.request("bill.resource.cc.effectRoute", data, function (data) {
            if (data.success) {
                App.util.AppUtil.msg("生效路由成功！");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);

    },

    deleteServer : function (obj){
        App.util.AppUtil.commongDelete(this, "name", "bill.resource.cc.deleteBoardServer", {},this.getServerQueryGrid());
    },
    updateServer : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.cc.updateBoardServer", "更新机器成功！", this ,this.getServerQueryGrid() );
    },
    showServerUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.cc.queryBoardServerInfo', 'App.view.resource.cc.board.updateServer',this.getServerQueryGrid());
    },
    showServerAdd: function (obj) {
        var win = Ext.create('App.view.resource.cc.board.addServer', {
            animateTarget: obj,
            boardId: this.getCcsetBoardWindow().data._id
        });
        win.show();
    },
    addServer: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.cc.addBoardServer", "添加机器成功！", this, this.getServerQueryGrid());
    },


    deleteInRoute : function (obj){
        App.util.AppUtil.commongDelete(this, "number", "bill.resource.cc.deleteBoardInRoute", {},this.getInRouteQueryGrid());
    },
    updateInRoute : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.cc.updateBoardInRoute", "更新路由成功！", this ,this.getInRouteQueryGrid() );
    },
    showInRouteUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.cc.queryBoardInRouteInfo', 'App.view.resource.cc.board.updateInRoute',this.getInRouteQueryGrid());
    },
    showInRouteAdd: function (obj) {
        var win = Ext.create('App.view.resource.cc.board.addInRoute', {
            animateTarget: obj,
            boardId: this.getCcsetBoardWindow().data._id
        });
        win.show();
    },
    addInRoute: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.cc.addBoardInRoute", "添加路由成功！", this, this.getInRouteQueryGrid());
    },



    deleteOutLine : function (obj){
        App.util.AppUtil.commongDelete(this, "number", "bill.resource.cc.deleteBoardOutLine", {},this.getOutLineQueryGrid());
    },
    updateOutLine : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.cc.updateBoardOutLine", "更新线路成功！", this ,this.getOutLineQueryGrid() );
    },
    showOutLineUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.cc.queryBoardOutLineInfo', 'App.view.resource.cc.board.updateOutLine',this.getOutLineQueryGrid());
    },
    showOutLineAdd: function (obj) {
        var win = Ext.create('App.view.resource.cc.board.addOutLine', {
            animateTarget: obj,
            boardId: this.getCcsetBoardWindow().data._id
        });
        win.show();
    },
    addOutLine: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.cc.addBoardOutLine", "添加外呼线路成功！", this, this.getOutLineQueryGrid());
    },





    deleteOutRoute : function (obj){
        App.util.AppUtil.commongDelete(this, "name", "bill.resource.cc.deleteBoardOutRoute", {},this.getOutRouteQueryGrid());
    },
    updateOutRoute : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.cc.updateBoardOutRoute", "更新路由成功！", this ,this.getOutRouteQueryGrid() );
    },
    showOutRouteUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.cc.queryBoardOutRouteInfo', 'App.view.resource.cc.board.updateOutRoute',this.getOutRouteQueryGrid());
    },
    enableDockItemsServer: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections, this, this.getServerQueryGrid());
    },
    enableDockItemsInRoute: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections, this, this.getInRouteQueryGrid());
    },
    enableDockItemsOutLine: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections, this, this.getOutLineQueryGrid());
    },
    enableDockItemsOutRoute: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections, this, this.getOutRouteQueryGrid());
    },
    showOutRouteAdd: function (obj) {
        var win = Ext.create('App.view.resource.cc.board.addOutRoute', {
            animateTarget: obj,
            boardId: this.getCcsetBoardWindow().data._id
        });
        win.show();
    },
    addOutRoute: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.cc.addBoardOutRoute", "添加外呼路由成功！", this, this.getOutRouteQueryGrid());
    },
    showSet: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var win = Ext.create("App.view.resource.cc.board.set", {
            data: {_id: id},
            animateTarget: obj
        });
        win.show();
    },
    delete: function (obj) {
        App.util.AppUtil.commongDelete(this, "name", "bill.resource.cc.deleteBoard", {});
    },
    update: function (obj) {
        App.util.AppUtil.commonUpdate(obj, "bill.resource.cc.updateBoard", "更新机柜成功！", this);
    },
    showUpdate: function (obj) {
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.cc.queryBoardInfo', 'App.view.resource.cc.board.update');
    },
    add: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.cc.addBoard", "添加机柜成功！", this);
    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.resource.cc.board.add', {
            animateTarget: obj
        });
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections, this);
    }

});
