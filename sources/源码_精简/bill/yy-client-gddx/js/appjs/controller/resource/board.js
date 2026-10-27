Ext.define('App.controller.resource.board', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'queryGrid',
            selector: 'boardQueryPanel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control({
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
            }
        });
        this.initFlag = true;
    },
    delete : function(obj){
        App.util.AppUtil.commongDelete(this,"name","bill.resource.deleteBoard",{});
    },
    update : function(obj){
        App.util.AppUtil.commonUpdate(obj,"bill.resource.updateBoard","更新机柜成功！",this);
    },
    showUpdate : function(obj){
        App.util.AppUtil.commonShowUpdate(obj,this,'bill.resource.queryBoardInfo','App.view.resource.board.update');
    },
    add : function(obj){
        App.util.AppUtil.commonAdd(obj,"bill.resource.addBoard","添加机柜成功！",this);
    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.resource.board.add', {
            animateTarget: obj
        });
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections,this);
    }

});