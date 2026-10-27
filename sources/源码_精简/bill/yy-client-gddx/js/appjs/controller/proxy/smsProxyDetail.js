Ext.define('App.controller.proxy.smsProxyDetail', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'smsProxyDetailQueryPanel',
            selector: 'smsProxyDetailQueryPanel'
        },
        {
            ref: 'smsProxyDetailGrid',
            selector: 'smsProxyDetailQueryPanel > grid[class="query"]'
        }

    ],
    init : function() {
        this.control({

        });
        this.initFlag = true;
    }

})