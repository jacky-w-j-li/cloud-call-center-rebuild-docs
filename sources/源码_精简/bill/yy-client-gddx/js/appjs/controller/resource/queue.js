Ext.define('App.controller.resource.queue', {
    extend : 'Ext.app.Controller',
    requires : [],
    views : [],
    refs : [{
        ref: 'queryGrid',
        selector: 'queueQueryPanel > grid[class="query"]'
    }],
    initFlag : false,
    init : function() {
        this.control({
        });
        this.initFlag = true;
    }

});