Ext.define('App.controller.resource.zj.board', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'zjsetBoardWindow',
            selector: 'zjsetBoardWindow'
        },
        {
            ref: 'queryGrid',
            selector: 'boardQueryPanel > grid[class="query"]'
        },
        {
            ref: 'outRouteQueryGrid',
            selector: 'zjsetBoardWindow >  panel#zj_calloutRoute_config_panel > grid[class="query"]'
        },
        {
            ref: 'outLineQueryGrid',
            selector: 'zjsetBoardWindow >  panel#zj_calloutLine_config_panel > grid[class="query"]'
        },
        {
            ref: 'inRouteQueryGrid',
            selector: 'zjsetBoardWindow >  panel#zj_callinRoute_config_panel > grid[class="query"]'
        },
        {
            ref: 'serverQueryGrid',
            selector: 'zjsetBoardWindow >  panel#zj_server_config_panel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control({
            'panel#zj_calloutRoute_config_panel >  button#zj_add_outRoute_tool': {
                click: this.showOutRouteAdd
            },
            'zjaddBoardOutRouteWindow >  button#commit_button': {
                click: this.addOutRoute
            },
            'panel#zj_calloutRoute_config_panel >  button#zj_update_outRoute_tool': {
                click: this.showOutRouteUpdate
            },
            'zjupdateBoardOutRouteWindow >  button[class="commit_button"]': {
                click: this.updateOutRoute
            },
            'panel#zj_calloutRoute_config_panel >  button#zj_delete_outRoute_tool': {
                click: this.deleteOutRoute
            },
            'panel#zj_calloutRoute_config_panel >  button#zj_effect_outRoute_tool':{
                click : this.effectOutRoute
            },
            'zjsetBoardWindow >  panel#zj_calloutRoute_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsOutRoute,
                itemdblclick: this.showOutRouteUpdate
            },


            'panel#zj_calloutLine_config_panel >  button#zj_add_outLine_tool': {
                click: this.showOutLineAdd
            },
            'zjaddBoardOutLineWindow >  button#commit_button': {
                click: this.addOutLine
            },
            'panel#zj_calloutLine_config_panel >  button#zj_update_outLine_tool': {
                click: this.showOutLineUpdate
            },
            'zjupdateBoardOutLineWindow >  button[class="commit_button"]': {
                click: this.updateOutLine
            },
            'panel#zj_calloutLine_config_panel >  button#zj_delete_outLine_tool': {
                click: this.deleteOutLine
            },
            'panel#zj_calloutLine_config_panel >  button#zj_effect_outLine_tool': {
                click: this.effectOutLine
            },
            'zjsetBoardWindow >  panel#zj_calloutLine_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsOutLine,
                itemdblclick: this.showOutLineUpdate
            },


            'panel#zj_callinRoute_config_panel >  button#zj_add_inRoute_tool': {
                click: this.showInRouteAdd
            },
            'zjaddBoardInRouteWindow >  button#commit_button': {
                click: this.addInRoute
            },
            'panel#zj_callinRoute_config_panel >  button#zj_update_inRoute_tool': {
                click: this.showInRouteUpdate
            },
            'zjupdateBoardInRouteWindow >  button[class="commit_button"]': {
                click: this.updateInRoute
            },
            'panel#zj_callinRoute_config_panel >  button#zj_delete_inRoute_tool': {
                click: this.deleteInRoute
            },
            'panel#zj_callinRoute_config_panel >  button#zj_effect_inRoute_tool': {
                click: this.effectInRoute
            },
            'zjsetBoardWindow >  panel#zj_callinRoute_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsInRoute,
                itemdblclick: this.showInRouteUpdate
            },


            'panel#zj_server_config_panel >  button#zj_add_server_tool': {
                click: this.showServerAdd
            },
            'zjaddBoardServerWindow >  button#commit_button': {
                click: this.addServer
            },
            'panel#zj_server_config_panel >  button#zj_update_server_tool': {
                click: this.showServerUpdate
            },
            'zjupdateBoardServerWindow >  button[class="commit_button"]': {
                click: this.updateServer
            },
            'panel#zj_server_config_panel >  button#zj_delete_server_tool': {
                click: this.deleteServer
            },
            'zjsetBoardWindow >  panel#zj_server_config_panel > grid[class="query"]': {
                selectionchange: this.enableDockItemsServer,
                itemdblclick: this.showServerUpdate
            },
            'boardQueryPanel >  button#add_board_tool': {
                click: this.showAdd
            },
            'addBoardWindow >  button#commit_button':{
                click: this.add
            },
            'boardQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showUpdate
            },
            'boardQueryPanel >  button#update_board_tool': {
                click: this.showUpdate
            },
            'updateBoardWindow >  button[class="commit_button"]':{
                click : this.update
            },
            'boardQueryPanel >  button#delete_board_tool':{
                click : this.delete
            },
            'boardQueryPanel >  button#set_board_tool': {
                click: this.showSet
            }
        });
        this.initFlag = true;
    },
    effectOutLine : function (obj){
        var data = {
            type : "gateway",
            boardId : this.getZjsetBoardWindow().data._id
        };
        App.util.AppUtil.request("bill.resource.zj.effectRoute", data, function (data) {
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
            boardId : this.getZjsetBoardWindow().data._id
        };
        App.util.AppUtil.request("bill.resource.zj.effectRoute", data, function (data) {
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
            boardId : this.getZjsetBoardWindow().data._id
        };
        App.util.AppUtil.request("bill.resource.zj.effectRoute", data, function (data) {
            if (data.success) {
                App.util.AppUtil.msg("生效路由成功！");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);

    },

    deleteServer : function (obj){
        App.util.AppUtil.commongDelete(this, "name", "bill.resource.zj.deleteBoardServer", {},this.getServerQueryGrid());
    },
    updateServer : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.zj.updateBoardServer", "更新机器成功！", this ,this.getServerQueryGrid() );
    },
    showServerUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.zj.queryBoardServerInfo', 'App.view.resource.zj.board.updateServer',this.getServerQueryGrid());
    },
    showServerAdd: function (obj) {
        var win = Ext.create('App.view.resource.zj.board.addServer', {
            animateTarget: obj,
            boardId: this.getZjsetBoardWindow().data._id
        });
        win.show();
    },
    addServer: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.zj.addBoardServer", "添加机器成功！", this, this.getServerQueryGrid());
    },


    deleteInRoute : function (obj){
        App.util.AppUtil.commongDelete(this, "number", "bill.resource.zj.deleteBoardInRoute", {},this.getInRouteQueryGrid());
    },
    updateInRoute : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.zj.updateBoardInRoute", "更新路由成功！", this ,this.getInRouteQueryGrid() );
    },
    showInRouteUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.zj.queryBoardInRouteInfo', 'App.view.resource.zj.board.updateInRoute',this.getInRouteQueryGrid());
    },
    showInRouteAdd: function (obj) {
        var win = Ext.create('App.view.resource.zj.board.addInRoute', {
            animateTarget: obj,
            boardId: this.getZjsetBoardWindow().data._id
        });
        win.show();
    },
    addInRoute: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.zj.addBoardInRoute", "添加路由成功！", this, this.getInRouteQueryGrid());
    },



    deleteOutLine : function (obj){
        App.util.AppUtil.commongDelete(this, "number", "bill.resource.zj.deleteBoardOutLine", {},this.getOutLineQueryGrid());
    },
    updateOutLine : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.zj.updateBoardOutLine", "更新线路成功！", this ,this.getOutLineQueryGrid() );
    },
    showOutLineUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.zj.queryBoardOutLineInfo', 'App.view.resource.zj.board.updateOutLine',this.getOutLineQueryGrid());
    },
    showOutLineAdd: function (obj) {
        var win = Ext.create('App.view.resource.zj.board.addOutLine', {
            animateTarget: obj,
            boardId: this.getZjsetBoardWindow().data._id
        });
        win.show();
    },
    addOutLine: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.zj.addBoardOutLine", "添加外呼线路成功！", this, this.getOutLineQueryGrid());
    },





    deleteOutRoute : function (obj){
        App.util.AppUtil.commongDelete(this, "name", "bill.resource.zj.deleteBoardOutRoute", {},this.getOutRouteQueryGrid());
    },
    updateOutRoute : function(obj){
        App.util.AppUtil.commonUpdate(obj, "bill.resource.zj.updateBoardOutRoute", "更新路由成功！", this ,this.getOutRouteQueryGrid() );
    },
    showOutRouteUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj, this, 'bill.resource.zj.queryBoardOutRouteInfo', 'App.view.resource.zj.board.updateOutRoute',this.getOutRouteQueryGrid());
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
        var win = Ext.create('App.view.resource.zj.board.addOutRoute', {
            animateTarget: obj,
            boardId: this.getZjsetBoardWindow().data._id
        });
        win.show();
    },
    addOutRoute: function (obj) {
        App.util.AppUtil.commonAdd(obj, "bill.resource.zj.addBoardOutRoute", "添加外呼路由成功！", this, this.getOutRouteQueryGrid());
    },
    showSet: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var win = Ext.create("App.view.resource.zj.board.set", {
            data: {_id: id},
            animateTarget: obj
        });
        win.show();
    },
    delete : function(obj){
        App.util.AppUtil.commongDelete(this,"name","bill.resource.zj.deleteBoard",{});
    },
    update : function(obj){
        App.util.AppUtil.commonUpdate(obj,"bill.resource.zj.updateBoard","更新机柜成功！",this);
    },
    showUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj,this,'bill.resource.zj.queryBoardInfo','App.view.resource.zj.board.update');
    },
    add : function(obj){
        App.util.AppUtil.commonAdd(obj,"bill.resource.zj.addBoard","添加机柜成功！",this);
    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.resource.zj.board.add', {
            animateTarget: obj
        });
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections,this);
    }

});
