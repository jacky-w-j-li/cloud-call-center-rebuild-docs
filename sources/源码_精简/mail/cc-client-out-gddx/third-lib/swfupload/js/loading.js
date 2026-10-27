var	loadingBox = function(message){
	   var msgw,msgh,bordercolor;
	   msgw=328;
	   msgh=52;
	   bordercolor="#c6c6c6";
	   
	   var sWidth,sHeight;
	   sWidth=document.body.offsetWidth;
	   sHeight=screen.height;
	   var bgObj=document.createElement("div");
	   bgObj.setAttribute('id','hollyc5.bgDiv');
	   bgObj.style.position="absolute";
	   bgObj.style.top="0";
	   bgObj.style.background="#f2f2f2";
	   bgObj.style.filter="progid:DXImageTransform.Microsoft.Alpha(style=3,opacity=25,finishOpacity=75";
	   bgObj.style.opacity="0.6";
	   bgObj.style.left="0";
	   bgObj.style.width=sWidth + "px";
	   bgObj.style.height=sHeight + "px";
	   bgObj.style.zIndex = "10000";
	   document.body.appendChild(bgObj);

	   var msgObj=document.createElement("div");
	   msgObj.setAttribute("id","hollyc5.msgDiv");
	   msgObj.setAttribute("align","center");
	   msgObj.style.background="white";
	   msgObj.style.border="1px solid " + bordercolor;
	   msgObj.style.position = "absolute";
	    msgObj.style.left = "50%";
	    msgObj.style.top = "50%";
	    msgObj.style.font="12px/1.6em Verdana, Geneva, Arial, Helvetica, sans-serif";
	    msgObj.style.marginLeft = "-225px" ;
	    msgObj.style.marginTop = -75+document.documentElement.scrollTop+"px";
	    msgObj.style.width = msgw + "px";
	    msgObj.style.height =msgh + "px";
	    msgObj.style.textAlign = "left";
	    msgObj.style.lineHeight ="25px";
	    msgObj.style.zIndex = "10001";
	    msgObj.style.paddingTop = "11px";
	    msgObj.style.paddingLeft = "10px";
	    msgObj.style.paddingRight = "10px";
	    msgObj.innerHTML = "<div style='height:20px;overflow:hidden;text-align:center'><img src='../../ui/images/loading.gif' style='float:left;margin-top:5px;' /><div id='hollyc5.loading.message' style='float:left;color:#666666;padding-left:5px;'>" + message + "</div><div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
	
	    document.body.appendChild(msgObj);
	}
var	loadingHid = function(){
		var bgObj = document.getElementById("hollyc5.bgDiv");
		var msgObj = document.getElementById("hollyc5.msgDiv");
		if(msgObj) {
			document.body.removeChild(msgObj);	
		}
		if(bgObj) {
			document.body.removeChild(bgObj);	
		}		
	}