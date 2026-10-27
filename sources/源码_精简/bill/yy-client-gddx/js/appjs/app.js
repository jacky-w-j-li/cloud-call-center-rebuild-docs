Ext.Loader.setConfig({
			enabled : true
		});// 打开动态加载机制
var app_sessionId = '';
var gloab_application = '';
var gloab_client_user = {};
var gloab_cdic = {};
var client_menu = {};
var gloab_concurrentPrice= 10;

Ext.require('Ext.ux.data.PagingMemoryProxy');

Ext.application({
			name : 'App',// namespace
			appFolder : 'js/appjs',// 应用文件夹的名字
			controllers : ['Login'],// 控制器
			// autoCreateViewport:true , //将自动加载namespace下的view/viewPort.js
			launch : function() {
				gloab_application = this;
				if(Ext.isIE){
					Ext.global.myCrossDomain = true;
				}
				var view = Ext.create('App.view.login.loginViewport');
				var loginWindow = Ext.create('App.view.login.loginWindow');
				loginWindow.down("#username").setValue('');
				loginWindow.down("#password").setValue('');
				loginWindow.show();

				// Ext.create('App.view.Viewport').show();
                //禁止后退键 作用于Firefox、Opera
                document.onkeypress = forbidBackSpace;
                //禁止后退键  作用于IE、Chrome
                document.onkeydown = forbidBackSpace;
				//EXT 方法重写
				Ext.form.field.Base.prototype.initComponent = function() {
					var me = this;
					Ext.form.field.Base.superclass.initComponent.call(this);
					me.subTplData = me.subTplData || {};
					this.addEvents('focus', 'blur', 'specialkey');
					// Initmixins

					me.initLabelable();
					me.initField();
					// Default name to inputId
					if (!me.name) {
						me.name = me.getInputId();
					}
					if (this.allowBlank === false && this.fieldLabel) {
						me.fieldLabel += '<font color=red> *</font>';
					}
				}

			}
		});

String.prototype.endWith=function(s){
    if(s==null||s==""||this.length==0||s.length>this.length)
        return false;
    if(this.substring(this.length-s.length)==s)
        return true;
    else
        return false;
    return true;
}

String.prototype.startWith=function(s){
    if(s==null||s==""||this.length==0||s.length>this.length)
        return false;
    if(this.substr(0,s.length)==s)
        return true;
    else
        return false;
    return true;
}

function forbidBackSpace(e) {
    var ev = e || window.event; //获取event对象
    var obj = ev.target || ev.srcElement; //获取事件源
    var t = obj.type || obj.getAttribute('type'); //获取事件源类型
    //获取作为判断条件的事件类型
    var vReadOnly = obj.readOnly;
    var vDisabled = obj.disabled;
    //处理undefined值情况
    vReadOnly = (vReadOnly == undefined) ? false : vReadOnly;
    vDisabled = (vDisabled == undefined) ? true : vDisabled;
    //当敲Backspace键时，事件源类型为密码或单行、多行文本的，
    //并且readOnly属性为true或disabled属性为true的，则退格键失效
    var flag1 = ev.keyCode == 8 && (t == "password" || t == "text" || t == "textarea") && (vReadOnly == true || vDisabled == true);
    //当敲Backspace键时，事件源类型非密码或单行、多行文本的，则退格键失效
    var flag2 = ev.keyCode == 8 && t != "password" && t != "text" && t != "textarea";
    //判断
    if (flag2 || flag1) return false;
}

/////Override///////

/**
 * override 'Ext.chart.Legend'
 */
Ext.override(Ext.chart.Legend, {
	createItems : function() {
		var me = this,
				chart = me.chart,
				surface = chart.surface,
				items = me.items,
				listCount = me.listCount || 10,
				padding = me.padding,
				itemSpacing = me.itemSpacing,
				spacingOffset = 2,
				maxWidth = 0,
				maxHeight = 0,
				totalWidth = 0,
				totalHeight = 0,
				vertical = me.isVertical,
				math = Math,
				mfloor = math.floor,
				mmax = math.max,
				index = 0,
				i = 0,
				len = items ? items.length : 0, x, y, spacing, item, bbox, height, width,
				exOffset = 0,
				maxTotalWidth = 0,
				maxTotalHeight = 0;

		if (len) {
			for (i; i < len; i++) {
				items[i].destroy();
			}
		}

		items.length = [];
		chart.series.each(function(series, i) {
			if (series.showInLegend) {
				Ext.each([].concat(series.yField), function(field, j) {
					item = Ext.create('Ext.chart.LegendItem', {
						legend : this,
						series : series,
						surface : chart.surface,
						yFieldIndex : j
					});
					bbox = item.getBBox();
					width = bbox.width;
					height = bbox.height;

					if (i + j === 0) {
						spacing = vertical ? padding + height / 2 : padding;
					} else {
						spacing = itemSpacing / (vertical ? 2 : 1);
					}

					exOffset = math.floor(i/listCount);

					item.x = mfloor(vertical ? padding*(1 + exOffset) + maxWidth * exOffset : totalWidth + spacing);
					item.y = mfloor(vertical ? totalHeight + spacing : (padding + height / 2)*(1 + exOffset));

					totalWidth += width + spacing;
					totalHeight += height + spacing;

					maxTotalWidth = mmax(maxTotalWidth,totalWidth);
					maxTotalHeight = mmax(maxTotalHeight,totalHeight);

					if(((i + 1) % listCount) === 0) {
						totalWidth = 0;
						totalHeight = padding + spacing;
					}
					maxWidth = mmax(maxWidth, width);
					maxHeight = mmax(maxHeight, height);   items.push(item);

				}, this );
			}
		}, me);
		me.width =  mfloor(vertical ? maxWidth * (1+ exOffset) + exOffset * padding : maxTotalWidth) + padding * 2;
		if (vertical && items.length === 1) {
			spacingOffset = 1;
		}
		me.height =  mfloor(vertical ? maxTotalHeight : maxHeight * (1 + exOffset)) + padding * 2;
		me.itemHeight = maxHeight;


		var outerHeight = me.chart.height - 20;
		if (items.length >= 2 && me.height > outerHeight) {
			var row = math.floor((outerHeight - padding * 2) / (items[1].y - items[0].y));
			if (row > 0) {
				me.columnWidth = me.width;
				me.width *= math.ceil(items.length / row);
				me.height = outerHeight;
				me.offsetY = items[row].y - items[0].y;
				me.maxY = items[row - 1].y;
			}
		}
	}
});


/**
 * override 'Ext.chart.LegendItem'
 */
Ext.override(Ext.chart.LegendItem, {
	updatePosition: function (relativeTo) {
		var me = this,
				items = me.items,
				ln = items.length,
				i = 0,
				item;

		if (!relativeTo) {
			relativeTo = me.legend;
		}


		if (me.legend.height > 0 && me.y > me.legend.maxY) {
			var r = Math.ceil((me.y - me.legend.maxY) / me.legend.offsetY);
			me.x += me.legend.columnWidth * r;
			me.y -= me.legend.offsetY * r;
		}


		for (; i < ln; i++) {
			item = items[i];
			switch (item.type) {
				case 'text' :
					item.setAttributes({
						x: 20 + relativeTo.x + me.x,
						y: relativeTo.y + me.y
					}, true);
					break;
				case 'rect' :
					item.setAttributes({
						translate: {
							x: relativeTo.x + me.x,
							y: relativeTo.y + me.y - 6
						}
					}, true);
					break;
				default :
					item.setAttributes({
						translate: {
							x: relativeTo.x + me.x,
							y: relativeTo.y + me.y
						}
					}, true);
			}
		}
	}
});


