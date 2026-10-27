var TREE={
	option:{
		drag:false,
	    mousePressed:false,
	    mouseMoved:false,
	    dragNode_source:false,
	    dragDropTimer:false,
	    afterClick:{}
	},
    _setTreeMouseEven:function(str,obj){
    	$(str, obj)
		.bind('selectstart', function() {
			return false;
		}).click(function(){
			return false;
		}).dblclick(function(){
			return false;
		}).bind("contextmenu",function(){
			return false;
		});
		//$(str, obj).mousedown(function(event){
		//	TREE.option.mousePressed = true;
		//	cloneNode = $(this).parent().parent().clone();
		//	var LI = $(this).parent().parent();
		//	if(TREE.option.drag)
		//	{
		//		$('>ul', cloneNode).hide();
		//		$('.tree-icon-left', cloneNode).hide();
		//		$('body').append('<div id="drag_container" moveId="'+LI[0].cId+'" style="z-index:20;"><ul></ul></div>');
		//		$('#drag_container').hide().css({opacity:'0.8'});
		//		$('#drag_container >ul').append(cloneNode);
		//		$("<img>").attr({id	: "tree_plus",src	: "third-lib/ligerUI/skins/Aqua/images/tree/plus.gif"}).css({width: "7px",display: "block",position: "absolute",left	: "5px",top: "5px", display:'none'}).appendTo("body");
		//		$(document).bind("mousemove", {LI:LI}, TREE._dragStart).bind("mouseout",{LI:LI},TREE._dragOut).bind("mouseup",TREE._dragEnd);
		//	}
		//	return false;
		//}).mouseup(function(){
		//	if(TREE.option.mousePressed && TREE.option.mouseMoved && TREE.option.dragNode_source)
		//	{
		//		TREE._moveNodeToFolder($(this).parent().parent());
		//	}
		//	TREE._eventDestroy(this);
		//});
		TREE._setEventLine($('.line, .line-last', obj));
    },//接触事件
    //_dragStart : function(event){
	//	var LI = $(event.data.LI);
	//	if(TREE.option.mousePressed)
	//	{
	//		TREE.option.mouseMoved = true;
	//		if(TREE.option.dragDropTimer) clearTimeout(TREE.option.dragDropTimer);
	//		if($('#drag_container:not(:visible)')){
	//			$('#drag_container').show();
	//			//LI.prev('.line').hide();//拖动的li上个隐藏掉
	//			TREE.option.dragNode_source = LI;
	//		}
	//		$('#drag_container').css({position:'absolute', "left" : (event.pageX + 5), "top": (event.pageY + 15) });
	//		//if(LI.is(':visible'))LI.hide();//拖动的li隐藏掉
	//		var temp_move = false;
	//		if(event.target.tagName.toLowerCase()=='span' && $.inArray(event.target.className, Array('tree_text'))!= -1)
	//		{
	//			var parent = event.target.parentNode;
	//			var offs = $(parent).offset({scroll:false});
	//			var screenScroll = {x : (offs.left - 3),y : event.pageY - offs.top};
	//			var isrc = $("#tree_plus").attr('src');
	//			var ajaxChildSize = $('>ul.ajax',parent).size();
	//			var ajaxChild = $('>ul.ajax',parent);
	//			screenScroll.x += 19;
	//			screenScroll.y = event.pageY - screenScroll.y + 5;
	//			var isFolderOpen=false;
	//			var isFolderClose=false;
	//			$('div', parent).each(function(i){
	//				if(this.className.indexOf("expandable-open")>=0)isFolderOpen=true;
	//				if(this.className.indexOf("expandable-close")>=0)isFolderClose=this;
	//			});
	//			TREE._inChild(true, event.tagName=="LI"?event:event.target.parentNode.parentNode);//更改鼠标样式
	//			if(isFolderOpen && ajaxChildSize==0)
	//			{
	//				$("#tree_plus").css({"left": screenScroll.x, "top": screenScroll.y}).show();
	//			}else if(isFolderClose && ajaxChildSize==0){
	//				$("#tree_plus").css({"left": screenScroll.x, "top": screenScroll.y}).show();
	//				TREE.option.dragDropTimer = setTimeout(function(){
	//					isFolderClose.className = isFolderClose.className.replace('expandable-close','expandable-open');
	//					if(isFolderClose.nextSibling){
	//						if(isFolderClose.nextSibling.className.indexOf("l-tree-icon-folder-open")==-1)
	//							isFolderClose.nextSibling.className=isFolderClose.nextSibling.className.replace('l-tree-icon-folder','l-tree-icon-folder-open');
	//					}
	//						//$('>ul',parent.parent).show();
	//					if(parent.nextSibling)
	//						parent.nextSibling.style.display="block";
	//				}, 700);
	//			}else{
	//				if(TREE.option.docToFolderConvert)
	//				{
	//					$("#tree_plus").css({"left": screenScroll.x, "top": screenScroll.y}).show();
	//				}else{
	//					$("#tree_plus").hide();
	//				}
	//			}
	//		}else{
	//			$("#tree_plus").hide();
	//		}
	//		return false;
	//	}
	//	return true;
	//},
	//_dragOut:function(event){
	//	if(event.target.tagName.toLowerCase()=='span' && $.inArray(event.target.className, Array('tree_text'))!= -1)
	//	{
	//		if(event.target.parentNode.parentNode.cId!="0")
	//			event.target.style.cursor="pointer";//更改为默认样式
	//	}
	//},
	//_dragEnd : function(){
	//	if(TREE.option.dragDropTimer) clearTimeout(TREE.option.dragDropTimer);
	//	TREE._eventDestroy(false);
	//},
    _eventDestroy : function(event)
	{
		$(document).unbind('mousemove',TREE.dragStart).unbind('mouseup').unbind('mousedown');
		if(event&&TREE._inChild(false, event.tagName=="LI"?event:event.parentNode.parentNode)){
			$('#drag_container, #tree_plus').remove();
			TREE.option.dragNode_source =false;
			TREE.option.mousePressed =false;
			TREE.option.mouseMoved = false;
			return;
		}
		//保存编号
		var moveId=0;
		if($("#drag_container")[0])
			moveId=$("#drag_container")[0].moveId;
		$('#drag_container, #tree_plus').remove();
		if(TREE.option.dragNode_source)
		{	
			$(TREE.option.dragNode_source).show().prev('.line').show();
			TREE.option.dragNode_source =false;
			TREE.option.mousePressed =false;
			TREE.option.mouseMoved = false;
			if(event){//保存
				var catalogVO={};
				catalogVO.cId=moveId;
				if(event.tagName=="LI"){//拖到某一点
					catalogVO.cParent=event.parentId;
					if(catalogVO.cId!=catalogVO.cParent){
						catalogVO.cOrder=event.order;
						catalog.updateCatalogItem(catalogVO,false);
					}
				}else{//拖到文件夹
					catalogVO.cParent=event.parentNode.parentNode.cId;
					catalogVO.cOrder="0";//默认排在最后
					if(catalogVO.cId!=catalogVO.cParent){
						catalog.updateCatalogItem(catalogVO,false);
					}
				}
			}
		}else{
			TREE.option.dragNode_source =false;
			TREE.option.mousePressed =false;
			TREE.option.mouseMoved = false;
		}
	},
	_moveNodeToFolder : function(node)
	{
		if(!TREE.option.docToFolderConvert && node[0].className.indexOf('doc')!=-1)
		{
			return true;
		}else if(TREE.option.docToFolderConvert && node[0].className.indexOf('doc')!=-1){
			TREE._convertToFolder(node);
		}
		var lastLine = $('>ul >.line-last', node);
		if(lastLine.size()>0)
		{
			TREE._moveNodeToLine(lastLine[0]);
		}
	},
	_moveNodeToLine : function(node){
	},
	_convertToFolder : function(node){
		node[0].className = node[0].className.replace('doc','folder-open');
		node.append('<ul><li class="line-last"></li></ul>');
		TREE.setTrigger(node[0]);
		TREE._setEventLine($('.line, .line-last', node));
	},
	_setEventLine : function(obj){
		obj.mouseover(function(){
			if(this.className.indexOf('over')<0 && TREE.option.mousePressed && TREE.option.mouseMoved)
			{
				this.className = this.className.replace('line','line-over');
				TREE._inChild(true, this);
			}
		}).mouseout(function(){
			if(this.className.indexOf('over')>=0)
			{
				this.className = this.className.replace('-over','');
				TREE._inChild(false, this);
			}
		}).mouseup(function(){
			if(TREE.option.mousePressed && TREE.option.dragNode_source && TREE.option.mouseMoved)
			{
				//TREE._moveNodeToLine(this);
				TREE._eventDestroy(this);
			}
		});
	},
	_inChild:function(isover,event){
		var css=isover?"not-allowed":"pointer";
		if($("#drag_container")[0]==undefined)return true;
		var cId=$("#drag_container")[0].moveId;
		var li=$("[cId='"+cId+"']").find('[parentId="'+event.parentId+'"]')[0];
		//判断移动位置是否有名称相同的
		var children=event.children.length>0?event.children.length==1?[]:event.children[1].children:event.parentNode.children;
		var eqname=false;
		var cname=$(".tree_text",$("#drag_container"))[0];
		if(cname!=undefined){
			for(var i=0;i<children.length;i++){
				var span=$(".tree_text",children[i])[0];
				if(span!=undefined&&span.parentNode.parentNode.cId!=cname.parentNode.parentNode.cId&&span.innerHTML==cname.innerHTML){
					eqname=true;
					break;
				}
			}
		}
		if(li!=undefined||eqname){
			if(event.children.length>0){
				$(event).find("span")[0].style.cursor=css;//移动到此目录中的子目录排序最下面
			}else{
				event.style.cursor=css;//移动到指定的两个目录中间位置
			}
			return true;
		}else if(event.toAdd=="false"){//目录如果到最底层则不允许在添加目录
			if(event.children.length>0){
				$(event).find("span")[0].style.cursor=css;
			}else{
				event.style.cursor=css;
			}
			return true;
		}
		return false;
	}
};