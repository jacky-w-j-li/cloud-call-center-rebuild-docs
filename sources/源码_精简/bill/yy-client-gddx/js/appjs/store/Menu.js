Ext.define("App.store.Menu",{
	extend: 'Ext.data.TreeStore', 
	alias:'menuStore',
    root: {  
        expanded: true  
    },
	proxy: {  
        type: 'ajax',  
        url: '/appjs/data/Menu.json'  
    }
});