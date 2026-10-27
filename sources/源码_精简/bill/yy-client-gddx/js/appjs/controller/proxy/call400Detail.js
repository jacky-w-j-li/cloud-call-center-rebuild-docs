Ext.define('App.controller.proxy.call400Detail', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'call400DetailQueryPanel',
            selector: 'call400DetailQueryPanel'
        },
        {
            ref: 'call400DetailGrid',
            selector: 'call400DetailQueryPanel > grid[class="query"]'
        }

    ],
    init : function() {
        this.control({

        });
        this.initFlag = true;
    }

})