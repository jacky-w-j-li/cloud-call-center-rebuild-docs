Ext.define('App.controller.account.ytxSmsTemplate', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'ytxSmsTemplatePanel',
            selector: 'ytxSmsTemplatePanel'
        },
        {
            ref: 'queryGrid',
            selector: 'ytxSmsTemplatePanel > grid[class="query"]'
        }

    ],
    init: function () {
        this.control(
            {
                'ytxSmsTemplatePanel > grid[class="query"]':{
                    itemdblclick: this.showDetail
                },
                'ytxSmsTemplatePanel > grid[class="query"]' : {
                    selectionchange:this.enableDockItems,
                },
                'ytxSmsTemplatePanel >  button#ytxSmsTemplate_tool_sync' : {
                    click:this.syncStatus
                }
            }

        );
        this.initFlag = true;
    },

    showDetail:function(obj){
        var win = Ext.create('App.view.account.ytxSmsTemplate.detail',{
            animateTarget: obj,
            record:this.getQueryGrid().getSelectionModel().getSelection()[0],
        });

        win.show();
    },
    enableDockItems : function(selModel,selections){
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;

        console.log("selectionchange")

        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    syncStatus : function(){
        var sel = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var templateid = sel.raw["ytxtemplateid"];
        var appid = this.getAppID(sel.raw["smsChannel"]);

        App.util.AppUtil.request('bill.account.syncYtxSmsTemplate',{templateid:templateid,appid:appid},function(data,self){
            if(data.success){
                App.util.AppUtil.msg("同步短信通道成功");
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        },this);
    },
    getAppID:function(value){
        var ytxChannel;
        value.every(function(channel){
            if(channel == "ytx" || channel == "ytxyx"){
                ytxChannel = channel;
                return false;
            }
            return true;
        });

        return {ytx:'8a216da854ff8dcc0155054e58a5091a',ytxyx:'8a216da85607361a0156075237130034'}[ytxChannel];
    }

});