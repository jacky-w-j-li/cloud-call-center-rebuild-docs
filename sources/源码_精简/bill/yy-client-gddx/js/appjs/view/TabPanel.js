Ext.define('App.view.TabPanel',{ 
    extend: 'Ext.tab.Panel', 
	alias:'appTabPanel',
    initComponent : function(){ 
        Ext.apply(this,{ 
			autoDestroy: true ,
            id: 'content-panel', 
            region: 'center',  
            defaults: { 
               autoScroll:true, 
               bodyPadding: 10 
            }, 
            activeTab: 0, 
			//closable:true,
            border: false, 
           //plain: true, 
            items: [] 
        }); 
        this.callParent(arguments); 
    } 
}) 