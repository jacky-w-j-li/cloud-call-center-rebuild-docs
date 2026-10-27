Ext.define('App.view.UserInfoWin', {
			extend : 'Ext.window.Window',
			alias : 'widget.userInfoWin',
			width : 340,
			layout : {
				type : 'anchor'
			},
			modal : true,
			title : '修改用户信息',
			user : null,
			initComponent : function() {
				var me = this;
				Ext.applyIf(me, {
							items : [{
										xtype : 'form',
										frame : true,
										bodyStyle : 'padding:2px 2px 0',
										fieldDefaults : {
											msgTarget : 'side',
											labelWidth : 90,
											labelAlign : 'right'
										},
										items : [{
													xtype : 'fieldset',
													title : '用户信息',
													collapsible : true,
													defaultType : 'textfield',
													items : [{
																value : this.user.userType == 'extension' ? this.user.extension._id : this.user.account._id,
																name : 'id',
																hidden : true
															}, {
																fieldLabel : '用户登陆名',
																name : 'username',
																fieldCls : 'field_disable_cls',
																value : this.user.name,
																readOnly : true
															}, {
																name : 'userType',
																value : this.user.userType,
																hidden : true
															}, {
																fieldLabel : '用户密码',
																name : 'password',
																regex : /^((?=.*?[a-z])|(?=.*?[A-Z]))(?=.*?\d)[a-zA-Z\d_]{8,20}$/,
																regexText : '密码必须为字母和数字组合，且必须8~20位',
																inputType : 'password',
																allowBlank : false
															}, {
																fieldLabel : '密码确认',
																name : 'repassword',
																inputType : 'password',
																allowBlank : false
															}, {
																fieldLabel : '联系手机',
																name : 'mobile',
																value : this.user.userType == 'extension' ? this.user.extension.mobile : this.user.account.mobile,
																regex : /^1[0-9]{10}$/,
																regexText : '不是有效的手机号',
																allowBlank : false
															}, {
																fieldLabel : '联系邮箱',
																value : this.user.email,
																name : 'email',
																value : this.user.userType == 'extension' ? this.user.extension.email : this.user.account.email,
																regex : /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/,
																regexText : '不是有效的邮箱',
																allowBlank : false
															}]
												}]
									}],
							buttons : [{
										text : '修改',
										id : 'userInfo_modify_button'
									}, {
										text : '关闭',
										handler : function(obj) {
											var win = obj.up('window');
											win.close();
										}

									}]
						});
				me.callParent(arguments);
			}

		});