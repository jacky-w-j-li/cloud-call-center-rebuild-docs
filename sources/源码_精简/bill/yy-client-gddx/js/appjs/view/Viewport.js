Ext.define('App.view.Viewport', {
			extend : 'Ext.Viewport',
			alias : 'widget.mainViewport',
			layout : 'fit',
			hidden : true,
			hideBorders : true,
			requires : ['App.view.Header', 'App.view.Menu', 'App.view.TabPanel', 'App.view.South'],
			initComponent : function() {
				var me = this;
				Ext.apply(me, {
							items : [{
										id : 'desk',
										layout : 'border',
										items : [Ext.create('App.view.Header'), Ext.create('App.view.Menu'), Ext.create('App.view.TabPanel')
//										,Ext.create('App.view.South')
												]
									}]
						});
				me.callParent(arguments);
			}
		})