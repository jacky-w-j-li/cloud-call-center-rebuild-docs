Ext.require("App.store.Menu");

Ext.define('App.view.Menu', {
			extend : 'Ext.Panel',
			alias : 'widget.viewMenuTree',
			initComponent : function() {
				Ext.apply(this, {
							id : 'menu-panel',
							title : '系统菜单',
							iconCls : 'icon-menu',
							margins : '0 0 -1 1',
							region : 'west',
							border : false,
							enableDD : false,
							split : true,
							width : 212,
							minSize : 130,
							maxSize : 300,
							rootVisible : false,
							containerScroll : true,
							collapsible : true,
							animCollapse : true,
							split : true,
							autoScroll : false,
							layout : 'accordion',
							items : this.getMenuPanel()
						});
				this.callParent(arguments);
			},
			getMenuPanel : function() {
				var menuData = client_menu;
				var treePanel = [];
				for (var i = 0; i < menuData.length; i++) {
                    var menuId = menuData[i].menuId;
                    if(menuId && !App.util.AppUtil.hasLimit(menuId)){
                        treePanel.push( Ext.create('Ext.tree.Panel', {
                            title : menuData[i].displayName,
                            id : menuId,
                            width : 200,
                            height : 150,
                            store : Ext.create('Ext.data.TreeStore', {
                                root : {
                                    expanded : true,
                                    children : this.getChildren(menuData[i].children)
                                }
                            }),
                            rootVisible : false
                        }));
                    }
				}
				return treePanel;
			},
			getChildren : function(menuData) {
				var children = [];
				for (var i = 0; i < menuData.length; i++) {
                    var menuId = menuData[i].menuId;
                    if(menuId && !App.util.AppUtil.hasLimit(menuId)){
                        if (menuData[i].children.length === 0) {
                            var obj = new Object();
                            obj.text = menuData[i].displayName;
                            obj.leaf = true;
                            obj.id = 'App.view.' + menuData[i].menuId.replace(/_/g, '.');
                            children.push(obj);
                        } else {
                            var obj = new Object();
                            obj.text = menuData[i].displayName;
                            obj.leaf = false;
                            obj.children = this.getChildren(menuData[i].children);
                            children.push(obj);
                        }
                    }
				}
				return children;
			}
		})
