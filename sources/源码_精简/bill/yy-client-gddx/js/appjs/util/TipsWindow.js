Ext.define('App.util.TipsWindow', {
			extend : 'Ext.window.Window',
			alias : 'widget.tipsWindow',
			// singleton : true,
			width : 200,
			height : 150,
			layout : 'fit',
			flashHeight : 30,
			count : 0,
			autoHide : 3,
			draggable : false,
			showdata : null,
			initComponent : function() {
				var me = this;
				Ext.applyIf(me, {
							modal : false,
							plain : true,
							shadow : false,
							title : '系统提示',
							resizable : false,
							closable : true,
							items : [{
										xtype : 'fieldset',
										collapsible : true,
										layout : 'column',
										defaultType : 'textfield',
										items : [{
													xtype : 'label',
													text : this.getHtml(this.showdata.type),
													columnWidth : .99
												}, {
													xtype : 'label',
													text : this.getNotifyInfo(),
													columnWidth : .5
												}, {
													xtype : 'button',
													id : 'undoBusinessOrderInfo_button',
													text : '这里',
													columnWidth : .39
												}]
									}]
//							html : this.getHtml(this.showdata.type)

						});
				me.callParent(arguments);

			},
			getHtml : function(type) {
				if (type == 'order') {
					var length = this.showdata.data.length;
					return "您有[" + length + "]个新的业务单！";
				} else {
					return "";
				}
			},
			getNotifyInfo : function(){
				return "查看请点击：";
			},
			test : function() {
				alert(1);
			},
			flashPosition : function(count) {
				this.count = count;
				var doc = document, bd = (doc.body || doc.documentElement);
				var left = bd.scrollLeft + Ext.Element.getViewportWidth() - 4 - this.width;
				var top = bd.scrollTop + Ext.Element.getViewportHeight() - 4 - this.height - this.flashHeight * this.count;
				this.setPosition(left, top, true);
			},
			showTips : function() {
				var doc = document, bd = (doc.body || doc.documentElement);
				var left = bd.scrollLeft + Ext.Element.getViewportWidth() - 4 - this.width;
				var top = bd.scrollTop + Ext.Element.getViewportHeight() - 4 - this.height;
				var self = this;
				self.setPosition(left, top);
				self.doAutoRender();
				self.el.setZIndex(10000);
				self.el.slideIn('b', {
							callback : function() {
								self.fireEvent('show', self);
							}
						});
			},
			setShowdata : function(data) {
				this.showdata = data;
			}

		});