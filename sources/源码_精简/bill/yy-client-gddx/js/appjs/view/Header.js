Ext.define('App.view.Header', {
			extend : 'Ext.toolbar.Toolbar',
			alias : 'widget.mainHeaderPanel',
			requires : [],
			height : 30,
			region : 'north',
            id:"main_head_panel",
			initComponent : function() {
				var me = this;

				Ext.applyIf(me, {
							items : [{
										xtype : 'tbtext',
										text : '欢迎登录：[' + this.getUserDisplayName() + ']'
									}, {
										xtype : 'tbseparator'
									},
                                    {
										xtype : 'tbtext',
										text : '上次登录时间：[<span style="color:blue;">'+this.getLashUpdateTime()+ '</span>]'
									},
                                    {
                                        xtype : 'tbseparator'
                                    },
                                    {
                                        xtype : 'tbtext',
                                        id:'user_balance_head',
                                        text :  '余额：[' + this.getBalance() + ']元'
                                    },
                                    {
                                        xtype : 'tbtext',
                                        id:'user_current_callFee_head',
                                        text :  '今日外呼话费收入：[<span style="color:blue;">' +0 + '</span>]元'
                                    },
                                    {
                                        xtype : 'tbtext',
                                        id:'user_current_call400Fee_head',
                                        text :  '今日400话费收入：[<span style="color:blue;">' +0 + '</span>]元'
                                    },
                                    {
                                        xtype : 'button',
                                        id : 'user_pay_bank',
                                        text : '立即充值'
                                    },
                                    {
										xtype : 'tbtext',
										text : ''
									}, '->',// 让退出在工具栏上靠右显示
									{
										xtype : 'button',
										id : 'current_user_info',
										text : '个人设置'
									}, {
										xtype : 'tbseparator'
									}, {
										xtype : 'button',
										id : 'logout_button',
										text : '退出'
									}]
						});

				me.callParent(arguments);
			},
			getUserDisplayName : function(){
				var user = gloab_client_user;
					var display = user.name;
					return '<span style="color:blue;">'+display+'</span>';
			},
			getLashUpdateTime : function(){
				var user = gloab_client_user;
				//if(user.userType == 'extension'){
//					return user.extension.lastLoginTime
//				}else{
					return user.lastLoginTime
//				}
			},
			getUserRoleName : function(user) {
				if (user.reRoleId != 0) {
					return '角色：[' + App.util.AppUtil.getRendererValue(user.roleId, 'userRole') + '&' + App.util.AppUtil.getRendererValue(user.reRoleId, 'userRole') + ']';
				}else{
					return '角色：[' + App.util.AppUtil.getRendererValue(user.roleId, 'userRole') + ']';
				}
			},
            getBalance : function(){
                var balance=App.util.AppUtil.formatTrueFee(gloab_client_user.balance);
                return '<span style="color:blue;">'+balance+'</span>';
            }
		});
