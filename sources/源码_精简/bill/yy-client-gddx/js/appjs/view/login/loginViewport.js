Ext.define('App.view.login.loginViewport', {
			extend : 'Ext.Viewport',
			layout : 'fit',
			hideBorders : true,

			initComponent : function() {
				var me = this;
				Ext.apply(me, {
							cls : 'login_bk_color',
							items : [
                                Ext.create('App.view.login.loginWindow'),
							Ext.create('Ext.Button',{
								id:'abc',
								hidden:true,
								cls:'layout_table_item'
							})
							]
						});
				me.callParent(arguments);
			}
		})