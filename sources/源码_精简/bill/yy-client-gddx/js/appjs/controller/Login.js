Ext.define('App.controller.Login', {
			extend : 'Ext.app.Controller',
			requires : ['Ext.window.MessageBox', 'App.util.AppUtil'],
			sefl : this,
			views : ['App.view.login.loginWindow', 'App.view.login.loginViewport'],
			refs : [{
						ref : 'loginWindow',
						selector : 'loginWindow'
					}],
			init : function() {
				this.control({
							'button#login_button' : {
								click : this.toLogin
							},
							'loginWindow' : {
								show : this.winShowHandler
							},
							'loginWindow  #login_fieldset > textfield' : {
								specialkey : this.keyHandler
							}
						})
			},
			winShowHandler : function() {
				this.getLoginWindow().down('#username').focus(true, true);
			},
			keyHandler : function(field, key) {
				if (key.getKey() === key.ENTER) {
					this.toLogin();
				}
			},
			toLogin : function() {
                var form = this.getLoginWindow().down('form');
                if (form.form.isValid()) {
                    var username = Ext.String.trim(Ext.getCmp("username").getValue());
                    var password = Ext.String.trim(Ext.getCmp("password").getValue());
                    var json = new Object();
                    json.loginName = username;
                    json.password = password;
                    App.util.AppUtil.request("login", json, this.loginHandler, this);
                }
			},
			loginHandler : function(data, self) {
				if (data.success) {
					app_sessionId = data.sessionId;
					gloab_client_user = data.user;
					self.getLoginWindow().close();
					Ext.MessageBox.show({
								title : '请稍后....',
								msg : '正在连接远程服务器...',
								progressText : '已完成...0%',
								width : 300,
								progress : true,
								closable : false
							});
					Ext.MessageBox.updateProgress(0.2, '已完成' + Math.round(100 * 0.2) + '%', '正在获取客户端菜单.....');
					App.util.AppUtil.request("bill.system.getClientMenu", {type:gloab_client_user.identity}, function(data,self){
						if(data.success){
                            var menus=data.menu.menus;
//                            if(gloab_client_user.identity=='proxy' ||gloab_client_user.identity=='hp'){
//                                menus=menus[0];
//                                if(menus.children && menus.children.length>0){
//                                    menus.children=[menus.children[0],menus.children[3],menus.children[4],menus.children[5],menus.children[6]];
//                                }
//                                menus=[menus];
//                            }else{
//                                var accMenu=menus[0];
//                                if(accMenu.children && accMenu.children.length>0){
//                                    accMenu.children=[accMenu.children[0],accMenu.children[1],accMenu.children[2],accMenu.children[4],accMenu.children[5]];
//                                }
//                            }
							client_menu = menus;
							App.util.AppUtil.request("bill.system.getClientDicCache", {}, self.loadClientDicHandler, self);
						}else{
							App.util.AppUtil.msg("获取客户端菜单错误！！");
						}
					}, self);
				} else {
					if (data.code === 404) {
						App.util.AppUtil.msg("用户名或密码错误！");
					} else if (data.code === 500) {
						App.util.AppUtil.msg("Sorry!服务器暂时不能处理您的请求！");
					} else {
                        App.util.AppUtil.msg("登陆发生未知错误！");
                    }
				}

			},
			sessionUserInfoHandler : function(data, self) {
				gloab_client_user = data.data;
				Ext.MessageBox.updateProgress(0.1, '已完成' + Math.round(100 * 0.1) + '%', '正在验证本机ip.....');
				App.util.AppUtil.request("toValidateIp", '', self.ValidateIPHandler, self);
			},
			loadClientDic : function() {
				Ext.MessageBox.updateProgress(0.15, '已完成' + Math.round(100 * 0.15) + '%', '正在获取客户端字典.....');
				var type = gloab_client_user.userType;
				var id = "";
				if (type == "extension") {
					id = gloab_client_user.extension._id;
				} else {
					id = gloab_client_user.account._id;
				}
				App.util.AppUtil.request("getClientDicCache", {
							id : id,
							type : type
						}, this.loadClientDicHandler, this);
			},
			loadClientDicHandler : function(data, self) {
				if (data.success) {
					var dicMap = data.dicMap;
					gloab_cdic = dicMap;
					Ext.MessageBox.updateProgress(0.4, '已完成' + Math.round(100 * 0.4) + '%', '缓存加载完毕.....');
					// var clientMap = data.data.clientCache.dicMap;
					// var keyList = data.data.clientCache.dicKey;
					//
					// for (var i = 0; i < keyList.length; i++) {
					// var key = new String(keyList[i]);
					// var value = clientMap[key];
					// var dicKey = key.substring(key.indexOf('_') + 1);
					// gloab_cdic[dicKey] = value;
					// }
					self.loadMainView(self);
					App.util.AppUtil.getDicStore('systemUser');
					App.util.AppUtil.getDicStore('pbx');
					App.util.AppUtil.getDicStore('line');
				} else {
					Ext.Msg.alert('提示', '加载客户端字典失败!', function() {
								window.location.reload();
							});
				}

			},
			loadMainView : function(self) {
				Ext.MessageBox.updateProgress(0.5, '已完成' + Math.round(100 * 0.5) + '%', '正在初始化资源.....');
				var viewPort = null;
				var flag = 0.5;

				// 加载所有控制器,初始化菜单数据
				Ext.Loader.require('App.view.Viewport');
				var task = {
					run : function() {
						flag += 0.02;

						Ext.MessageBox.updateProgress(flag, '已完成' + Math.round(100 * flag) + '%', '正在初始化资源.....');
						if (parseInt(flag) == 1) {
							viewPort = Ext.create('App.view.Viewport');
							Ext.TaskManager.stop(task);
							Ext.MessageBox.close();
							var controller = gloab_application.getController('App.controller.Main');
							if (!controller.initFlag) {
								controller.init();
							}
							viewPort.show();
//							self.showAccountInfo();
                            refreshBalance();
                            window.setInterval(function(){
                                refreshBalance();
                            },5000)
						}
					},
					interval : 50

				}
				Ext.TaskManager.start(task);

			},
			showAccountInfo : function() {
//				console.log(gloab_client_user);
//				if (gloab_client_user.userType == "telephone") {
//					var main = Ext.getCmp("content-panel");
//					var panel = Ext.create('App.view.tel.HomePage');
//					var p = main.add(panel);
//					main.setActiveTab(p);
//				} else if (gloab_client_user.userType == "extension") {
//					var main = Ext.getCmp("content-panel");
//					var panel = Ext.create('App.view.exten.HomePage');
//					var p = main.add(panel);
//					main.setActiveTab(p);
//				}

			}

		})

var refreshBalance=function () {
    var win = Ext.getCmp("main_head_panel");
    var pane = win.down("#user_balance_head");
    var callPane = win.down("#user_current_callFee_head");
    var call400Pane = win.down("#user_current_call400Fee_head");
    App.util.AppUtil.request('bill.account.getSystemInfoById', null, function (data, self) {
        if (data.success) {
//            console.dir(data.user)
            gloab_client_user.balance = data.user.balance;
            var balance = App.util.AppUtil.formatTrueFee(gloab_client_user.balance);
            var nowCallIncome = App.util.AppUtil.formatTrueFee(data.user.nowCallIncome);
            var nowCall400Income = App.util.AppUtil.formatTrueFee(data.user.nowCall400Income);
            pane.update('余额：[' + '<span style="color:blue;">' + balance + '</span>' + ']元');
            callPane.update('今日外呼话费收入：[<span style="color:blue;">' +nowCallIncome + '</span>]元');
            call400Pane.update('今日400话费收入：[<span style="color:blue;">' +nowCall400Income + '</span>]元');
        } else {
            App.util.AppUtil.msg(data.message);
        }
    }, this,true);
}