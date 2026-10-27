Ext.define('App.controller.xxx.xxx', {
			extend : 'Ext.app.Controller',
			requires : [],
			sefl : this,
			views : [],
			refs : [{
						ref : 'xxx',
						selector : 'xxx'
					}],
			initFlag : false,
			init : function() {
				this.control({
							'xxxxxxxxxxxx' : {
								click : this.xxxxxxxxxxx
							}
						});
				this.initFlag = true;
			}

		});