Ext.define('App.util.TipsWindowUtil', {
			alias : 'widget.tipsWindowUtil',
			singleton : true,
			tipsWindowArray : new Array(),
			showTips : function( data) {
				var arraySize = this.tipsWindowArray.length;
				for (var i = 0; i < arraySize; i++) {
					this.tipsWindowArray[i].flashPosition(i + 1);
				}
				var newWindow = Ext.create('App.util.TipsWindow',{
					showdata : data
				});
				this.tipsWindowArray.splice(0, 0, newWindow);
				newWindow.showTips();
			},
			removeTips : function(count) {
				for (var i = count + 1; i < this.tipsWindowArray.length; i++) {
					this.tipsWindowArray[i].flashPosition(this.tipsWindowArray[i].count - 1);
				}
				this.tipsWindowArray.splice(count, 1);
			},
			resizeTips : function (){
				for(var i=0;i<this.tipsWindowArray.length;i++){
					this.tipsWindowArray[i].flashPosition(i);
				}
			}

		});