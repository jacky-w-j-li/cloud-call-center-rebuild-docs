Ext.define('App.controller.proxy.callDetail', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'callDetailQueryPanel',
            selector: 'callDetailQueryPanel'
        },
        {
            ref: 'callDetailGrid',
            selector: 'callDetailQueryPanel > grid[class="query"]'
        }

    ],
    init : function() {
        this.control({

        });
        this.initFlag = true;
    }

})