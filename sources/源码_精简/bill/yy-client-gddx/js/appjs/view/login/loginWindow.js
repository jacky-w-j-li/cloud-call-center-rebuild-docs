Ext.define('App.view.login.loginWindow', {
	extend : 'Ext.window.Window',
	alias : 'widget.loginWindow',
	height : 300,
	width : 450,
	title : '用户登录',
	id : 'login_window',

	initComponent : function() {
		var me = this;

		Ext.apply(me, {
			closable : false,
			draggable : false,
			iconCls : 'login_icon_cls',
			items : [
                {
                    xtype : 'fieldset',
                    height : 80,
                    cls : 'login_logo_cls',
                    margin : '0 2 0 2'
                },
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    style:{
                        border:0,padding:0
                    },
                    fieldDefaults: {
//                        msgTarget: 'side'
                    },
                    items: [
                        {
                            xtype : 'fieldset',
                            height : 150,
                            id : 'login_fieldset',
                            margin : '0 2 0 2',
                            layout : {
                                type : 'column'
                            },
                            items : [{
                                xtype : 'textfield',
                                labelWidth : 80,
                                width : 300,
                                fieldLabel : '用户名',
                                id : 'username',
                                fieldCls : 'login_user_cls',
                                margin : '40 0 0 50',
                                allowBlank:false
                            }, {
                                xtype : 'textfield',
                                labelWidth : 80,
                                width : 300,
                                fieldLabel : '密码',
                                id : 'password',
                                inputType : 'password',
                                fieldCls : 'login_pass_cls',
                                margin : '20 0 0 50',
                                allowBlank:false
                            }]
                        }
                    ]

                }
            ],
			buttons : [{
						xtype : 'button',
						width : 80,
						id : 'login_button',
						icon : 'image/icon/lock_open.png',
						text : '登&nbsp;&nbsp;&nbsp;录'
					}]

		});

		me.callParent(arguments);
	}
});