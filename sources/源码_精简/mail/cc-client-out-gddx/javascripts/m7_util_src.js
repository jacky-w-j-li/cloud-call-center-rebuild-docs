/**
 * craete by zhangyang@7moor.com
 * 2014-10-09
 * this is a util by 7moor
 * can use the util for common method
 */
var utils = {
    showBoxbgDom: null,
    showBoxMsgDom: null,
    notifyDialogRemain: 500,
    notifyDialogInterval: null,
    serachInputNoresult: "serachInputNoresult",
    showBox: function(width, height, msg) {
        var bodyWidth = document.body.offsetWidth;
        var bodyHeight = screen.height;
        if(!utils.showBoxbgDom) {
            utils.showBoxbgDom = document.createElement("div");
            utils.showBoxbgDom.setAttribute("id", "icc.utils.bgDiv");
            utils.showBoxbgDom.style.position = "absolute";
            utils.showBoxbgDom.style.top = "0";
            utils.showBoxbgDom.style.background = "#f2f2f2";
            utils.showBoxbgDom.style.filter ="progid:DXImageTransform.Microsoft.Alpha(style=3,opacity=25,finishOpacity=75";
            utils.showBoxbgDom.style.opacity = "0.6";
            utils.showBoxbgDom.style.left = "0";
            utils.showBoxbgDom.style.zIndex = "10000";
        }
        utils.showBoxbgDom.style.width = bodyWidth + "px";
        utils.showBoxbgDom.style.height = bodyWidth + "px";
        document.body.appendChild(utils.showBoxbgDom);

        if(!utils.showBoxMsgDom) {
            utils.showBoxMsgDom = document.createElement("div");
            utils.showBoxMsgDom.setAttribute("id", "icc.utils.msgDiv");
            utils.showBoxMsgDom.setAttribute("align","center");
            utils.showBoxMsgDom.style.background="white";
            utils.showBoxMsgDom.style.border="1px solid #c6c6c6";
            utils.showBoxMsgDom.style.position = "absolute";
            utils.showBoxMsgDom.style.left = (bodyWidth - width)/2 + "px";
            utils.showBoxMsgDom.style.top = 135 + document.documentElement.scrollTop + "px";
            utils.showBoxMsgDom.style.textAlign = "left";
            utils.showBoxMsgDom.style.lineHeight ="25px";
            utils.showBoxMsgDom.style.zIndex = "10001";
            utils.showBoxMsgDom.style.paddingTop = "11px";
            utils.showBoxMsgDom.style.paddingLeft = "10px";
            utils.showBoxMsgDom.style.paddingRight = "10px";
        }

        utils.showBoxMsgDom.style.width = width + "px";
        utils.showBoxMsgDom.style.height = height + "px";

        utils.showBoxMsgDom.innerHTML = msg;
        document.body.appendChild(utils.showBoxMsgDom);
    },

    closeBox: function() {
        if(utils.showBoxMsgDom) {
            document.body.removeChild(utils.showBoxMsgDom);
            utils.showBoxMsgDom = null;
        }
        if(utils.showBoxbgDom) {
            document.body.removeChild(utils.showBoxbgDom);
            utils.showBoxbgDom = null;
        }
    },

    showSucc: function(msg) {
        utils.notifyDialogRemain = 500;
        utils.hideNotify();
        var msgHtml = "<div style='height:30px;overflow:hidden;'>" +
            "<img src='./img/client/tip_succ.jpg' style='float:left;margin-top:4px;' />" +
            "<div style='float:left;color:#666666;padding-left:5px;font-size:15px;padding-top:4px'>" + msg + "</div>" +
            "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div>" +
            "</div>";
        utils.showBox(230, 45, msgHtml);
        utils.notifyDialogInterval = setInterval("utils.checkHide()", 500);
    },

    checkHide: function() {
        if(utils.notifyDialogRemain <= 0) {
            utils.hideNotify();
        }
        utils.notifyDialogRemain -= 500;
    },

    hideNotify: function() {
        if(utils.notifyDialogInterval !== null) {
            clearInterval(utils.notifyDialogInterval);
            utils.notifyDialogInterval = null;
            utils.closeBox();
        }
    },

    showConfirm: function(msg){
        utils.hideNotify();
        var msgHtml =
            "<div style='float:right'>" +
            "<a href='javascript:utils.closeBox();'>" +
            "<img src='./img/client/close_grey.gif' onmouseover=\"this.src='./img/client/close_red.gif'\" onmouseout=\"this.src='./img/client/close_grey.gif'\" style='cursor: pointer;border:0px;' /></a>" +
            "</div>" +strTrimAll+
        "<div style='height:30px;overflow:hidden;margin-top:20px;padding-left:20px;'><img src='./img/client/tip_succ.jpg' style='float:left;margin-top:4px;' /><div style='float:left;color:#666666;padding-left:5px;font-size:15px;padding-top:4px'>"+msg+"</div></div>"+
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div>"+
        "<div style='padding-left:290px;padding-top:20px;'><a href='javascript:utils.closeBox();'><img src='./img/client/tip_confirm_1.jpg' onmouseover=\"this.src='./img/client/tip_confirm_2.jpg'\" onmouseout=\"this.src='./img/client/tip_confirm_1.jpg'\" style='cursor: pointer;border:0px;' /></a></div>";
        utils.showBox(420, 120, msgHtml);
    },

    showError: function(msg) {
        var msgHtml =
            "<div style='float:right'>" +
            "<a href='javascript:utils.closeBox();'>" +
            "<img src='./img/client/close_grey.gif' onmouseover=\"this.src='./img/client/close_red.gif'\" onmouseout=\"this.src='./img/client/close_grey.gif'\" style='cursor: pointer;border:0px;' /></a>" +
            "</div>" +
            "<div style='height:30px;overflow:hidden;margin-top:20px;padding-left:20px;'><img src='./img/client/tip_error.jpg' style='float:left;margin-top:4px;' /><div style='float:left;color:#666666;padding-left:5px;font-size:15px;padding-top:4px'>"+msg+"</div></div>"+
            "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div>"+
            "<div style='padding-left:290px;padding-top:20px;'><a href='javascript:utils.closeBox();'><img src='./img/client/tip_confirm_1.jpg' onmouseover=\"this.src='./img/client/tip_confirm_2.jpg'\" onmouseout=\"this.src='./img/client/tip_confirm_1.jpg'\" style='cursor: pointer;border:0px;' /></a></div>";
        utils.showBox(420, 120, msgHtml);
    },

    startWith: function(str, prefix) {
        return str.indexOf(prefix) === 0;
    },
    /**
     *
     * @param object
     */
    loadSearchTab: function(object){
        var searchInputStyle = 'color:#938c8c;';
        var btnCaretStyle="";
        if(object.height){
            searchInputStyle+='height:'+object.height+'px;';
        }
        var sec_tab = object.isShowSeas ? "归<br />属" : "同<br />事";
        var sec_info = object.isShowSeas ? "个归属" : "位同事";
        object.tip = object.isShowSeas ? "输入部门或同事姓名" : "输入同事姓名";
        var inputElement = '<input type="text" '+object.editOwner+' autocomplete="off" class="tabbox_agent_input query_field" id="'+object.id+'_input" style="'+searchInputStyle+'" placeholder="'+object.tip+'"/>';
        var maxHeight = object.maxHeight != "0" ? object.maxHeight : 198;
        object.maxHeight = maxHeight;
        var divList = '<div class="tabbox_agent_result"></div><div class="search_tab" id="'+object.id+'_div" style="display:none;position:absolute;background:#fff;bottom:-'+(maxHeight+2)+'px;" class="phone_search_input" index=-1 total=0 >'+
            '<div class="search_tab_pane active" style="height:'+maxHeight+'px;"><ul class="commonly_list"></ul><ul class="result_list"></ul><span class="srch_null">没有搜索结果，请变换搜索条件</span></div>'+
            '<div class="search_tab_pane" style="height:'+maxHeight+'px;">'+
            '<div class="code_total" ds_unit="'+sec_info+'">共有<span></span>'+sec_info+'</div>'+
            '<ul id="'+object.id+'_ul_colleague" class="colleague_list"></ul></div>'+
            '<div class="search_tab_pane" style="height:'+maxHeight+'px;">'+
            '<div class="code_total">共有<span></span>个部门</div>'+
            '<ul id="'+object.id+'_ul_department" class="department_list"></ul></div>'+
            '<ol><li class="active" onclick="utils.changeTab(this);"></li><li onclick="utils.changeTab(this);">'+sec_tab+'</li><li  onclick="utils.changeTab(this);">部<br />门</li></ol></div>';
        if (object.isRadio) {
            $("#" + object.id).html(inputElement + '<div class="search_warp">'+divList+'</div>');
        }else{
            $("#" + object.id).html(inputElement + divList);
            $("#" + object.id).css("position","relative");
        }
        if (object.hideTab) {
            $("#" + object.id+" ol li").eq(object.hideTab).hide().siblings().attr("ds_show","show");
        }else{
            $("#" + object.id+" ol li").attr("ds_show","show");
        }
        utils._resetCommonTab(object.id,object.commonTab);
        if (object.width) {
            $("#" + object.id).width(object.width);
        }
        $("#" + object.id).keydown(function (e) {
            if(e.keyCode == 38) {
                utils._stopEvent(e);
            }else if(e.keyCode == 13){
                utils._stopEvent(e);
            }
        });
        $("#" + object.id).unbind('keyup');
        $("#" + object.id).keyup(function (e) {
            utils._onkeyupTab(e.keyCode, object);
        });
        $("#" + object.id).click(function (e) {
            if(object.editOwner == "readonly") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if(object.data.length===0 && object.isShowSeas===false){
                $().alertmessage('showError', '请先配置部门座席');
                return;
            }else if($("#" + object.id + "_div").css("display") == "none") {
                utils._hidden("search_tab");
                utils._deleteResult(object,object.id);
                var total = utils._searchTab(object.id, object, true, 1);
                utils._searchTab(object.id, object, true, 2);
                $("#" + object.id).find(".tabbox_agent_result span").each(function(i){
                    var userid=$(this).attr("userid");
                    $("#" + object.id).find("dd[userid="+userid+"]").addClass("active");
                });
                utils._countNo(object.id);
                // $("#"+object.id+"_div").attr({"total": total,"index": -1});
                // } else {
                //     utils._hidden("phone_search_input");
            }
        });
        $('body').click(function(e) {
            if($("#" + object.id + "_div")) {
                if($("#" + object.id + "_div").css("display") != "none") {
                    var total = $("#" + ""+object.id+"_div .result_list").attr("total");
                    if(total == 1) {
                        utils._searchClick(object, 0);
                    }
                    utils._hidden("search_tab");
                }
            }
        });
    },
    loadSearchInput: function(object) {
        var searchInputStyle = 'color:#938c8c;';
        if(object.width){
            searchInputStyle+='width:'+object.width+'px;';
        }
        var btnCaretStyle="";
        if(object.height){
            searchInputStyle+='height:'+object.height+'px;';
        }
        var showAllList = "";
        if(object.showAllList) {
//            showAllList = "<div id=\""+object.id+"_search_dropdown\" class=\"search_input_icon\" style=\"height:"+height+"\">&nbsp;</div>";
            showAllList = '<a id="'+object.id+'_search_dropdown" class="btn btn-small" tabindex="-1" style="'+btnCaretStyle+'"><span class="caret"></span> </a>';
        }
        var inputElement = '<input type="text" '+object.editOwner+' class="combox_agent_input" id="'+object.id+'_input" style="'+searchInputStyle+'" placeholder="'+object.tip+'"/>';
        inputElement += showAllList;
        var divList = '<div id="'+object.id+'_div" style="display:none;position:fixed;" class="phone_search_input" index=-1 total=0 ><ul id="'+object.id+'_ul" ></ul></div>';
        $("#" + object.id).html(inputElement + divList);
        var dropdown=$("#"+object.id+"_search_dropdown");
        if(dropdown.length>0){
            var height = $("#"+object.id+"_input").innerHeight()-2;
            dropdown.height(height);
        }

        $("#" + object.id).keydown(function (e) {
            if(e.keyCode == 38) {
                utils._stopEvent(e);
            }else if(e.keyCode == 13){
                utils._stopEvent(e);
            }
        });
        $("#" + object.id).unbind('keyup');
        $("#" + object.id).keyup(function (e) {
            utils._onkeyupInput(e.keyCode, object);
        });
        $("#" + object.id + "_search_dropdown").click(function (e) {
            if(object.editOwner == "readonly") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if($("#" + object.id + "_div").css("display") == "none") {
                var total = utils._searchInput(object.id, object, true);
                $("#"+object.id+"_div").attr("total", total);
                $("#"+object.id+"_div").attr("index", -1);
            } else {
                utils._hidden("phone_search_input");
            }
        });
        $('body').click(function(e) {
            if($("#" + object.id + "_div")) {
                if($("#" + object.id + "_div").css("display") != "none") {
                    var total = $("#" + ""+object.id+"_div").attr("total");
                    if(total == 1) {
                        utils._searchClick(object, 0);
                    }
                    utils._hidden("phone_search_input");
                }
            }
        });
    },

    _hidden: function(className) {
        $("." + className).css("display", "none");
    },
    _onkeyupTabByDial: function(eventCode, object){
        var id            = object.id,
            inputValue    = $.trim($("#"+object.id+"_input").val()),
            isCheckBySpan = $("#"+object.id+" .tabbox_agent_result").find('span').length,//判断是否为多选，多选则不取消active类
            onKeyChanged  = object.onKeyChanged,
            pane          = $("#"+id+"_div .result_list").parent(),
            paneDD        = $("#"+id+"_div .result_list dd:visible"),
            maxHeight     = object.maxHeight,
            index         = pane.attr("index");
            scrollTopHtml = 0;
            total         = pane.find("dd:visible").length;


        

        inputValue&&!isCheckBySpan?$(".search_input_dd").removeClass("active"):"";
        onKeyChanged?eval("onKeyChanged()"):"";

        switch(eventCode) {
            case 38 :
            case 40 :
                if(pane.css("display") == 'none')return;
                utils.processSwitchCase(eventCode,paneDD,index,scrollTopHtml,maxHeight,total,pane);
                break;
            case 13 :
                if(pane.css("display") == 'none')return;
                paneDD.eq(index).click();
                paneDD.length&&($("#"+object.id+"_input").val(inputValue));
                break;
            default :
                object.onKeyChanged&&(eval("onKeyChanged()"));
                total = utils._searchTabByDail(id, object, false,0);
                pane.attr({"total" : total,"index" : -1});
                break;
        }
    },
     processSwitchCase: function(eventCode,paneDD,index,scrollTopHtml,maxHeight,total,pane){
        paneDD.eq(index).css({"background": "", "color": ""});
        index = eventCode===38?(index>0?index-1:total - 1):((index >= total - 1)?0:++index);

        if(eventCode===38){
            if(paneDD.eq(index).position().top <= 0) {
                scrollTopHtml = pane.scrollTop() - 36;
            }else if(paneDD.eq(index).position().top >= maxHeight) {
                scrollTopHtml = index !== total - 1?pane.scrollTop() - 36 : 36 * total+10;     
            }
        }else{
            scrollTopHtml = paneDD.eq(index).position().top > 36&&(paneDD.eq(index).position().top >= maxHeight)&&index?pane.scrollTop() + 36:0;
        }
        pane.attr({"total":total,"index":index});
        pane.scrollTop(scrollTopHtml);
        paneDD.eq(index).css({"background": "#649ced", "color": "#fff"});
     },
    _onkeyupTab: function(eventCode, object) {
        var id = object.id;
        var inputValue = $.trim($("#"+object.id+"_input").val());
        
        var isCheckBySpan = $("#"+object.id+" .tabbox_agent_result").find('span').length;//判断是否为多选，多选则不取消active类
        if(inputValue===""&&!isCheckBySpan){
            $(".search_input_dd").removeClass("active");
        }

        var onKeyChanged = object.onKeyChanged;
        var pane = $("#"+id+"_div .result_list").parent();
        var paneDD = $("#"+id+"_div .result_list dd:visible");
        var maxHeight = object.maxHeight;
        if(onKeyChanged)
            eval("onKeyChanged()");
        var total = pane.find("dd:visible").length;
        pane.attr("total", total);
        // pane.attr("index", -1);
        switch(eventCode) {
            case 38 :
                if(pane.css("display") == 'none')
                    return;
                var index = pane.attr("index");
                var total = pane.attr("total");
                paneDD.eq(index).css({"background": "", "color": ""});
                if(index > 0)
                    --index;
                else
                    index = total - 1;
                pane.attr("total", total);
                pane.attr("index", index);
                if(paneDD.eq(index).position().top <= 0) {
                    pane.scrollTop(pane.scrollTop() - 36);
                } else if(paneDD.eq(index).position().top >= maxHeight) {
                    if(index != total - 1) {
                        pane.scrollTop(pane.scrollTop() - 36);
                    } else {
                        pane.scrollTop(36 * total+10);
                    }
                }
                paneDD.eq(index).css({"background": "#649ced", "color": "#fff"});
                break;
            case 40 :
                if(pane.css("display") == 'none')
                    return;
                var index = pane.attr("index");
                var total = pane.attr("total");
                paneDD.eq(index).css({"background": "", "color": ""});
                ++index;
                if(index > total - 1)
                    index = 0;
                pane.attr("total", total);
                pane.attr("index", index);
                if(paneDD.eq(index).position().top <= 36){
                    pane.scrollTop(0);
                }
                else if(paneDD.eq(index).position().top >= maxHeight) {
                    if(index != 0)
                        pane.scrollTop(pane.scrollTop() + 36);
                }
                paneDD.eq(index).css({"background": "#649ced", "color": "#fff"});
                break;
            case 13 :
                if(pane.css("display") == 'none')
                    return;
                var index = pane.attr("index");
                paneDD.eq(index).click();
                if (paneDD.length<1){
                    $("#"+object.id+"_input").val(inputValue);
                }
                break;
            default :
                var onKeyChanged = object.onKeyChanged;
                if(onKeyChanged)
                    eval("onKeyChanged()");
                var total = utils._searchTab(id, object, false,0);
                pane.attr("total", total);
                pane.attr("index", -1);
                break;
        }
    },

    _onkeyupInput: function(eventCode, object) {
        var id = object.id;
        switch(eventCode) {
            case 38 :
                if($("#"+id+"_div").css("display") == 'none')
                    return;
                var index = $("#"+id+"_div").attr("index");
                var total = $("#"+id+"_div").attr("total");
                $("#"+id+"_ul li:eq("+index+")").css({"background": "", "color": ""});
                if(index > 0)
                    --index;
                else
                    index = total - 1;
                $("#"+id+"_div").attr("total", total);
                $("#"+id+"_div").attr("index", index);
                if($("#"+id+"_ul li:eq("+index+")").position().top <= 0) {
                    $("#"+id+"_div").scrollTop($("#"+id+"_div").scrollTop() - 29);
                } else if($("#"+id+"_ul li:eq("+index+")").position().top >= 150) {
                    if(index != total - 1) {
                        $("#"+id+"_div").scrollTop($("#"+id+"_div").scrollTop() - 29);
                    } else {
                        $("#"+id+"_div").scrollTop(29 * total);
                    }
                }
                $("#"+id+"_ul li:eq("+index+")").css({"background": "#649ced", "color": "#fff"});
                break;
            case 40 :
                if($("#"+id+"_div").css("display") == 'none')
                    return;
                var index = $("#"+id+"_div").attr("index");
                var total = $("#"+id+"_div").attr("total");
                $("#"+id+"_ul li:eq("+index+")").css({"background": "", "color": ""});
                ++index;
                if(index > total - 1)
                    index = 0;
                $("#"+id+"_div").attr("total", total);
                $("#"+id+"_div").attr("index", index);
                if($("#"+id+"_ul li:eq("+index+")").position().top <= 0)
                    $("#"+id+"_div").scrollTop(0);
                else if($("#"+id+"_ul li:eq("+index+")").position().top >= 150) {
                    if(index != 0)
                        $("#"+id+"_div").scrollTop($("#"+id+"_div").scrollTop() + 29);
                }
                $("#"+id+"_ul li:eq("+index+")").css({"background": "#649ced", "color": "#fff"});
                break;
            case 13 :
                if($("#"+id+"_div").css("display") == 'none')
                    return;
                var index = $("#"+id+"_div").attr("index");
                utils._searchClick(object, index);
                break;
            default :
                var onKeyChanged = object.onKeyChanged;
                if(onKeyChanged)
                    eval("onKeyChanged()");
                var total = utils._searchInput(id, object, false);
                $("#"+id+"_div").attr("total", total);
                $("#"+id+"_div").attr("index", -1);
                break;
        }
    },

    _stopEvent: function(event) {
        event.preventDefault();
    },
    _resetCommonTab: function(id, commonTab){
        var commonTabHtml = "",
            $id = $("#"+id+"_div"),
            html = "<li><dl><dd class='search_input_dd' userid='myself'>我自己</dd><dd class='search_input_dd' userid='my-subordinates'>我和我的下属</dd><dd class='search_input_dd' userid='my-department'>我的部门</dd><dd class='search_input_dd' userid='my-subordinates-dept'>我和我的下级部门</dd</dl></li>";
        if (commonTab) {
            commonTabHtml = "常<br>用";
            $id.find("ol li").eq(0).html(commonTabHtml);
        }else{
            html = "";
            commonTabHtml = "结<br>果";
            $id.find("ol li").eq(0).html(commonTabHtml);
            $id.find("ol li[ds_show=show]").eq(1).click();
        }
        $id.find(".search_tab_pane").eq(0).find("ul.commonly_list").html(html);
    },
    _resetCommonTabByDail: function(id, commonTab){
        var commonTabHtml = "",
            $id = $("#"+id+"_div"),
            html = "<li><dl><dd class='search_input_dd' userid='myself'>我自己</dd><dd class='search_input_dd' userid='my-subordinates'>我和我的下属</dd><dd class='search_input_dd' userid='my-department'>我的部门</dd><dd class='search_input_dd' userid='my-subordinates-dept'>我和我的下级部门</dd</dl></li>";
        if (commonTab) {
            commonTabHtml = "常<br>用";
            $id.find("ol li").eq(0).html(commonTabHtml);
        }else{
            html = "";
            commonTabHtml = "结<br>果";
            $id.find("ol li").eq(0).html(commonTabHtml);
            $id.find("ol li[ds_show=show]").eq(1).click();
        }
        $id.find(".search_tab_pane").eq(0).find("ul.commonly_list").html(html);
    },
    _searchTab: function(id, object, allSearch, tabIndex) {
        var $idInput = $("#"+id+"_input");
        var $idDiv = $("#"+id+"_div");
        var inputValue = $.trim($idInput.val());
        var html = "";
        var htmlDep = "";
        var htmlDeps = "";
         var htmlSeas = "";
        var index = 0;
        var inputType = object.isRadio ? "radio" : "checkbox";
        tabIndex = tabIndex>=0 ? tabIndex : 1;
        var pane = tabIndex===0 ? $idDiv.find(".search_tab_pane").eq(tabIndex).find("ul.result_list") : $idDiv.find(".search_tab_pane").eq(tabIndex).find("ul");
        if (object.hideTab !== 2) {
            var depts=getDeptDic("depts",true);
            //console.dir(depts);
            object.depts = depts;
            for(var i in depts) { 
                if(allSearch || utils._availableD(inputValue, object, i)) {
                    if(depts[i].pId === ""){ //如果是全公司,设置一下提交值为root
                        htmlDeps += "<dd class=\"search_input_dd\" userId=\"root\">" + depts[i].name + "</dd>";
                    }else{
                        htmlDeps += "<dd class=\"search_input_dd\" userId=\""+depts[i]._id+"\">" + depts[i].name + "</dd>";
                    }

                }
                if(depts[i].pId === ""){ //如果是全公司,设置一下提交值为root
                    htmlDep += "<dd class=\"search_input_dd\" userId=\"root\">" + depts[i].name + "</dd>";
                }else{
                    htmlDep += "<dd class=\"search_input_dd\" userId=\""+depts[i]._id+"\">" + depts[i].name + "</dd>";
                }
            }
            if (htmlDep && $idDiv.find(".search_tab_pane").eq(2).find("ul").html()==="") {
                $idDiv.find(".search_tab_pane").eq(2).find("ul").html("<li><dl>"+htmlDep+"</dl></li>");
            }
        }
        for(var i in object.data) {
            if(allSearch || utils._available(inputValue, object, i)) {
                var stateHtml = "";
                if(object.showState) {
                    if(phone_data.monitor) {
                        if (object.data[i].callStatus == 'Idle'
                            && (object.data[i].extenType == 'Local' || ((object.data[i].extenType == 'sip' || object.data[i].extenType == 'gateway')
                            && object.data[i].register))
                            && !object.data[i].busy) {
                            stateHtml = "<div style=\"float:right;color:#009900\">空闲</div>";
                        }
                    }
                }
                var userId = eval("object.data['"+i+"']." + object.userIdField);
                var listContent = "";
                var listContentSeas = "";
               
                for(var j = 0; j < object.listField.length; j++) {
                    if(j > 0) {
                        var _v=eval("object.data['"+i+"']." + object.listField[j]);
                        if(_v){
                            listContent += "[" + _v + "]";
                        }
                    } else {
                        listContent += eval("object.data['"+i+"']." + object.listField[j]);
                        if (object.data[i].category && object.data[i]._id !="NA") {
                            listContent += "[公海]";
                            listContentSeas += listContent;
                        }
                    }
                }
                html += "<dd class=\"search_input_dd\" userId=\""+userId+"\">" + listContent + "</dd>";
                if(listContentSeas){
                    htmlSeas += "<dd class=\"search_input_dd\" userId=\""+userId+"\">" + listContentSeas + "</dd>";
                }
                
            }
        }
        if(tabIndex===  0){
            html += htmlDeps;
            if (inputValue) {
                pane.show().siblings("ul").hide();
            } else{
                pane.siblings("ul").show();
            }
        }else{
            var length = $idDiv.find(".search_tab_pane").eq(tabIndex).find(".search_input_dd").length;
            $idDiv.find(".search_tab_pane").eq(tabIndex).find(".code_total span").html(length);
        }

        if(html === "" && htmlDeps === "") {
            $idDiv.find(".result_list").hide();
        } else {
            $("#"+id+"_div").css("display", "block");
        }
        if (html){
            if (tabIndex!==2 || $idDiv.find(".search_tab_pane").eq(1).find("ul").html()==="") {
                pane.html("<li><dl>"+html+"</dl></li>");
            }
        }
        if (htmlSeas){
            if (tabIndex!==2 || $idDiv.find(".search_tab_pane").eq(3).find("ul").html()==="") {
              $idDiv.find(".search_tab_pane").eq(3).find("ul").html("<li><dl>"+htmlSeas+"</dl></li>");
            }
        }
        $idDiv.find(".search_input_dd").click(function (e) {
            // e.preventDefault();
            e.stopImmediatePropagation();
            var target = $(e.currentTarget);
            if (!target.hasClass("active")) {
                var userId = target.attr("userId");
                $(".ch_agent input[value='"+userId+"']").attr("checked");
                $idDiv.find(".search_tab_pane dd[userid="+userId+"]").addClass("active");//大集合选中
                var result_num = $idDiv.find(".search_tab_pane").eq(0).find("dd:visible").length;
                if (result_num===0) {
                    var commonTabHtml = object.commonTab ? "常<br>用" :"结<br>果";
                    $idDiv.find(".search_tab_pane").eq(0).find(".result_list").hide().siblings("ul").show();
                    $idDiv.find(".search_tab ol li").eq(0).html(commonTabHtml);
                }
                utils._countNo(id);
                if (object.isRadio) {
                    utils._setValueRadio(object, userId, target);
                } else{
                    utils._setValueCheckBox(object, userId, target);
                }
            }
        });

        var height = $idInput.innerHeight()+2;
        var width = $idInput.innerWidth();

        $("#"+id+"_div").css("left", 0);
        $("#"+id+"_div").width(270);
        return index;
    },

    _searchTabByDail: function(id, object, allSearch, tabIndex) {
        var  $idInput = $("#"+id+"_input"),
             $idDiv = $("#"+id+"_div"),
             inputValue = $.trim($idInput.val()),
             html = "",
             htmlDep = "",
             htmlDeps = "",
             htmlSeas = "",
             index = 0,
             inputType = object.isRadio ? "radio" : "checkbox",
             depts,
             i = 0,
             j = 0,
             userId,
             listContent,
             listContentSeas,
             stateHtml = '',
             liHtml = '',
             searchPane,
             pane ;
        
        tabIndex   = tabIndex>=0 ? tabIndex : 1;
        searchPane = $idDiv.find(".search_tab_pane");
        pane       = tabIndex===0 ? searchPane.eq(tabIndex).find("ul.result_list") : searchPane.eq(tabIndex).find("ul");
        object.agents=object.agents.filter(Boolean);
         object.agents=object.agents.map(function(val){
                if(val.status==='enable'){
                   return  val;
                }
            }).filter(Boolean);

        if (object.hideTab !== 2) {
            depts=getDeptDic("depts",true);
            object.depts = depts;

            for(i=0;i<depts.length;i++) { 
                htmlDeps += allSearch || utils._availableD(inputValue, object, i)?utils.getHtmlDeps(depts[i]):"";
                htmlDep  += utils.getHtmlDeps(depts[i]);
            }
            liHtml = "<li><dl>"+htmlDep+"</dl></li>";
            searchPane.eq(2).find("ul").html(liHtml);
        }

         object.data=object.data.map(function(val){
                if(val.status==='enable'){
                   return  val;
                }
            }).filter(Boolean);

        for(i=0;i<object.data.length;i++) {
            if(allSearch || utils._available(inputValue, object, i)) {
                stateHtml = "";
                if(object.showState) {
                    if(phone_data.monitor) {
                        if (object.data[i].callStatus == 'Idle'
                            && (object.data[i].extenType == 'Local' || ((object.data[i].extenType == 'sip' || object.data[i].extenType == 'gateway')
                            && object.data[i].register))
                            && !object.data[i].busy) {
                            stateHtml = "<div style='float:right;color:#009900'>空闲</div>";
                        }
                    }
                }
                 userId = eval("object.data['"+i+"']." + object.userIdField);
                 listContent = "";
                 listContentSeas = "";
               
                for(j = 0; j < object.listField.length; j++) {
                    if(j > 0) {
                        var _v=eval("object.data['"+i+"']." + object.listField[j]);
                        if(_v){
                            listContent += "[" + _v + "]";
                        }
                    } else {
                        listContent += eval("object.data['"+i+"']." + object.listField[j]);
                        if (object.data[i].category&& object.data[i]._id !="NA") {
                            listContent += "[公海]";
                            listContentSeas += listContent;
                        }
                    }
                }
                html += "<dd class='search_input_dd' userId='"+userId+"'>" + listContent + "</dd>";
                listContentSeas&&(htmlSeas += "<dd class='search_input_dd' userId='"+userId+"'>" + listContentSeas + "</dd>");
                
            }
        }
        if(tabIndex ===  0){
            html += htmlDeps;
            inputValue?pane.show().siblings("ul").hide():pane.siblings("ul").show();
        }else{
            var length = searchPane.eq(tabIndex).find(".search_input_dd").length;
            searchPane.eq(tabIndex).find(".code_total span").html(length);
            
        }
        var length = searchPane.eq(3).find(".search_input_dd").length;
        searchPane.eq(3).find(".code_total span").html(length);
        html === "" && htmlDeps === ""?$idDiv.find(".result_list").hide():$("#"+id+"_div").css("display", "block");
       
        if (html){
            if (tabIndex!==2 || searchPane.eq(1).find("ul").html()==="") {
                pane.html("<li><dl>"+html+"</dl></li>");
            }
        }

        utils.renderPane(html,2,searchPane,tabIndex);
        utils.renderPane(htmlSeas,3,searchPane,tabIndex);

        $idDiv.find(".search_input_dd").click(function (e) {
            // e.preventDefault();
            e.stopImmediatePropagation();
            var target = $(e.currentTarget);
            if (!target.hasClass("active")) {
                var userId = target.attr("userId");
                target.closest('.check_agent_dep_seas').find(".ch_agent input[value='"+userId+"']").attr("checked");
                $idDiv.find(".search_tab_pane dd[userid="+userId+"]").addClass("active");//大集合选中
                var result_num = searchPane.eq(0).find("dd:visible").length;
                if (result_num===0) {
                    var commonTabHtml = object.commonTab ? "常<br>用" :"结<br>果";
                    searchPane.eq(0).find(".result_list").hide().siblings("ul").show();
                    $idDiv.find(".search_tab ol li").eq(0).html(commonTabHtml);
                }

                if(target.closest('.check_agent_dep_seas').find("input[name='selectAllAgent']").attr("checked")){
                    target.closest('.check_agent_dep_seas').find("input[name='selectAllAgent']").click();
                }
                if(!target.closest(".modal-body").hasClass("modal_body_task_change")){
                    target.closest(".modal-body").height(400);
                }else{
                    target.closest(".modal-body").height("auto");
                }
                utils._countNo(id);
                utils._setValueCheckBoxByDail(object, userId, target);  
            }
            var  allIsChecked = target.closest('.check_agent_dep_seas').find("input[type='checkbox']");
            for (var i = 0; i < allIsChecked.length; i++) {
                !allIsChecked.eq(i).attr("checked")? allIsChecked.eq(i).next('.user_cust').val(""):"";
            }
        });

        
        var height = $idInput.innerHeight()+2;
        var width = $idInput.innerWidth();

        if($idInput.closest("#batch_modal")){
             if(!$idInput.closest(".modal-body").hasClass("modal_body_task_change")){
                    $idInput.closest(".modal-body").height(400);
                }else{
                    $idInput.closest(".modal-body").height("auto");
                }
            $idInput.closest(".modal-body").css("margin-ringht", 0);
            $idInput.click(function(){
                    $idInput.closest(".modal-body").css('overflow-x', "inherit").addClass("modal_body_task_change");
                
                });
           $(document).on('click','body',function(){        
                $idInput.closest(".modal-body").css("height","auto").removeClass("modal_body_task_change");
            });
        }

        $("#"+id+"_div").css("left", 0).width(270);
        return index;
    },
    renderPane: function(html,index,searchPane,tabIndex){
            if (html&&(tabIndex!==2 || searchPane.eq(index).find("ul").html()==="")) {
              searchPane.eq(index).find("ul").html("<li><dl>"+html+"</dl></li>");
            }
    },
    getHtmlDeps: function(dept){
         var deptId=dept.pId ? dept._id : 'root';
        return "<dd class='search_input_dd' userId="+deptId+">" + dept.name + "</dd>";
    },
    _deleteAgents: function(object,This){
        var users = [],
            ThisById,
        userIdArrPane =  $('#'+This).find(".tabbox_agent_result").eq(1).find('span');
        if(userIdArrPane !==0&&!$('#'+This).find(".check_agent_dep_seas").find(".cust_assgin_agent_container").find(".span4[ds_data='all'] input[type='checkbox']").attr("checked")){
           for (var i = 0; i < userIdArrPane.length; i++) {
            ThisById =  $('#'+This).find('.check_agent_dep_seas').find(".search_tab").find(".search_tab_pane dd[userid="+userIdArrPane.eq(i).attr('userid')+"]").eq(0);
            users=users.concat(utils.getUsersBySeasOrDempOrAgent(object,utils._getObjectInfo(object, userIdArrPane.eq(i).attr('userid')), userIdArrPane.eq(i).attr('userid'), ThisById));   
            //object.deptOrSeasOrPersonId = userIdArrPane.eq(i).attr('userid');
        }
        if(users.length>0){
            object.agents = users;
            utils._initAgentCheckbox(object,false);
        }else{
            object.agents   = getCache("agents");
            object.deptOrSeasOrPersonId = "all";
            utils._initAgentCheckbox(object,true);
        } 
        }
    },
    _countNo: function(id){
        var $idDiv = $("#"+id+"_div");
        $idDiv.find(".search_tab_pane").each(function(i){
            var stNum = $(this).find("dd.active").length + "/" + $(this).find("dd").length;
            if ($(this).find("dd.active").length>0) {
                $(this).find(".code_total").html("已选中"+stNum);
            }else{
                switch(i) {
                    case 1:
                        var t_text = $(this).find(".code_total").attr("ds_unit");
                        $(this).find(".code_total").html("共有<span>"+$(this).find("dd").length+"</span>"+t_text);
                        break;
                    case 2:
                        $(this).find(".code_total").html("共有<span>"+$(this).find("dd").length+"</span>个部门");
                        break;
                    case 3:
                        $(this).find(".code_total").html("共有<span>"+$(this).find("dd").length+"</span>个公海");
                        break;
                    default: return i;
                }
            }
        });
    },
    _searchInput: function(id, object, allSearch) {
        var inputValue = $("#"+id+"_input").val();
        var html = "";
        var index = 0;
        for(var i in object.data) {
//            if(inputValue == '')
//                continue;
            if(allSearch || utils._available(inputValue, object, i)) {
                var stateHtml = "";
                if(object.showState) {
                    if(phone_data.monitor) {
                        if (object.data[i].callStatus == 'Idle'
                            && (object.data[i].extenType == 'Local' || ((object.data[i].extenType == 'sip' || object.data[i].extenType == 'gateway')
                            && object.data[i].register))
                            && !object.data[i].busy) {
                            stateHtml = "<div style=\"float:right;color:#009900\">空闲</div>";
                        }
                    }
                }
                var userId = eval("object.data['"+i+"']." + object.userIdField);
                var listContent = "";
                for(var j = 0; j < object.listField.length; j++) {
                    if(j > 0) {
                        var _v=eval("object.data['"+i+"']." + object.listField[j]);
                        if(_v){
                            listContent += "[" + _v + "]";
                        }
                    } else {
                        listContent += eval("object.data['"+i+"']." + object.listField[j]);
                    }
                }

                if((++index) % 2 == 0) {
                    html += "<li userId=\""+userId+"\" class=\"search_input_dd\" onmouseover=\"this.style.background='#649ced'\" onmouseout=\"this.style.background='';\" >" +
                        "<div style=\"float:left\">" + listContent + "</div>"+stateHtml+"</li>";
                } else {
                    html += "<li userId=\""+userId+"\" class=\"search_input_dd\" onmouseover=\"this.style.background='#649ced'\" onmouseout=\"this.style.background='';\">" +
                        "<div style=\"float:left\">" + listContent + "</div>"+stateHtml+"</li>";
                }
            }
        };

        if(html === "") {
            $("#"+id+"_div").css("display", "none");
        } else {
            $("#"+id+"_div").css("display", "block");
        }
        $("#"+id+"_ul").html(html);
        $(".search_input_dd").click(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var target = $(e.currentTarget);
            var userId = target.attr("userId");
            utils._setValue(object.id, userId, object);
        });
        $(".search_input_dd").on('mouseover',function(){
            $(this).children().css('color','#fff');
        }).on('mouseout',function(){
            $(this).children().css('color','#000');
        });
        var y = $("#"+id+"_input").offset().top;
        var x = $("#"+id+"_input").offset().left;
//        var height = $("#"+id+"_input").height()+8+2;
//        var width = $("#"+id+"_input").width()+12;

        var height = $("#"+id+"_input").innerHeight()+2;
        var width = $("#"+id+"_input").innerWidth();
//        console.dir(y+"---"+x)
//        console.dir($("#"+id+"_input").innerWidth()+"---"+$("#"+id+"_input").innerHeight());

        $("#"+id+"_div").css("left", x + 1 + "px");
        $("#"+id+"_div").css("top", y+height);
        $("#"+id+"_div").width(width);

        return index;
    },

    _available: function(str, object, index) {
        var isAvailable = false;
        if(object.searchField == undefined || object.data == undefined) {
            return isAvailable;
        }
        var searchs = object.searchField;
        var pinyinFields = object.pinyinField;
        var data = object.data;
        var depts = object.depts;
        for(var i = 0; i < searchs.length; i++) {
            var pinyin = false;
            if(utils.contains(pinyinFields, searchs[i])) {
                pinyin = true;
            }
            var searchValue = eval("data[index]." + searchs[i]);
            if(pinyin && data[index].pinyin && (data[index].pinyin).match("^"+str)) {
                isAvailable = true;
                return isAvailable;
            }
            if(searchValue && searchValue.match("^"+str)) {
                isAvailable = true;
                return isAvailable;
            }
        }
        return isAvailable;
    },

    _availableD: function(str, object, index) {
        var isAvailable = false;
        if(!object.searchField|| !object.deptOrSeasOrPersonId) {
            return isAvailable;
        }
        var searchs = "name";
        var data = object.depts;
        if((data[index].name).match("^"+str)) {
            isAvailable = true;
        }
        return isAvailable;
    },

    _searchClick: function(object, index) {
        var obj = $("#"+object.id+"_ul li:eq("+index+")");
        var userId = obj.attr("userId");
        utils._setValue(object.id, userId, object);
    },

    _setValue: function(id, userId, object) {
        var user = utils._getObjectInfo(object, userId);
        if(object.showField && object.showField !== "") {
            var field = object.showField;
            $("#"+id+"_input").val(eval("user." + field));
            $("#"+id+"_input").css("color", "#000");
        }
        $("#"+id+"_div").css("display", "none");
        var callback = object.callbackFuc;
        if(callback)
            eval("callback(user)");
    },

    _setValueRadio: function(object, userId, This) {
        var user = utils._getObjectInfo(object, userId);
        var users = [];
        var valInputPane=$(".cust_assgin_agent_container .row-fluid").find("input[type='checkbox']")||[];
        var valInput = [];
        var id = object.id;
        if(object.showField && object.showField !== "") {
            var field = object.showField;
            var name = eval("user." + field) ? eval("user." + field) : This.text();
            $("#"+id+"_input").val(name).css("color", "#000");
        }
        $("#"+id+"_div").css("display", "none").find(".search_input_dd").removeClass("active").end().find("[userid="+userId+"]").addClass("active");
        utils._resultArr(object,id);
        
        
    },
    _getUsersByDepm: function(object, userId){
        var users = session.user.allAgents.map(function(val){
                    return val.deptId&&val.deptId===userId?utils._getObjectInfo(object, val._id):false;
            }).filter(Boolean);
          return users;
      },
    _getUsersBySeas: function(object, userId){
        var user;
       return session.user.allSeas.map(function(val){
                if(val._id&&val._id===userId){
                    val.managers.map(function(mVal){
                        if(val.members.indexOf(mVal)===-1){
                           val.members.push(mVal);
                        }
                    });
                    return val.members.length?val.members.map(function (sVal) {
                        user = utils._getObjectInfo(object, sVal)||false
                        user.allSeasId = userId;
                return user;
            }).filter(Boolean):false;
                }
            }).filter(Boolean)[0];
      },

    _setValueCheckBox: function(object, userId, This) {
        var user = utils._getObjectInfo(object, userId),
            users = [],
            id = object.id,
            field,
            name,
            sPane;

            if(object.showField && object.showField !==  "") {
                field = object.showField;
                name = eval("user." + field) ? eval("user." + field) : This.text();
                sPane = "<span userId="+userId+"><b class='delete_result'>x</b>"+name+"</span>";
                if (This.parent().parent().parent().hasClass("commonly_list")) {
                    sPane = "<span userId="+userId+" ds_radio='radio'><b class='delete_result'>x</b>"+name+"</span>";
                    $("#"+id+" .tabbox_agent_result span[ds_radio=radio] b").click();
                }
                $("#"+id+"_input").val("");
                $("#"+id).find(".tabbox_agent_result").append(sPane);
                utils._deleteResult(object,id);
                utils._resultArr(object,id);
            }
    },
   _setValueCheckBoxByDail: function(object, userId, This) {
        var user        = utils._getObjectInfo(object, userId),
            users       = [],
            id          = object.id,
            userIdArr   = [],
            field,
            name,
            sPane,
            ThisById,
            userIdArrPane,
            valInput    = [];
            if(object.showField && object.showField !==  "") {
                field = object.showField;
                name = eval("user." + field) ? eval("user." + field) : This.text();

                sPane = "<span userId="+userId+"><b class='delete_result'>x</b>"+name+"</span>";
                if (This.parent().parent().parent().hasClass("commonly_list")) {
                    sPane = "<span userId="+userId+" ds_radio='radio'><b class='delete_result'>x</b>"+name+"</span>";
                    This.closest('.check_agent_dep_seas').find(".tabbox_agent_result span[ds_radio=radio] b").click();
                }

                $("#"+id+"_input").val("");
                This.closest('.check_agent_dep_seas').find(".tabbox_agent_result").append(sPane);
                userIdArrPane =  This.closest('.check_agent_dep_seas').find(".tabbox_agent_result").eq(1).find('span');

                for (var i = 0; i < userIdArrPane.length; i++) {
                    ThisById = This.closest('.check_agent_dep_seas').find(".search_tab").find(".search_tab_pane dd[userid="+userIdArrPane.eq(i).attr('userid')+"]").eq(0);
                    users=users.concat(utils.getUsersBySeasOrDempOrAgent(object,utils._getObjectInfo(object, userIdArrPane.eq(i).attr('userid')), userIdArrPane.eq(i).attr('userid'), ThisById));   
                    //object.deptOrSeasOrPersonId = userIdArrPane.eq(i).attr('userid');
                }
                object.agents = users;
                
                utils._initAgentCheckbox(object,false);

                utils._deleteResult(object);
                utils._resultArr(object,id);
            }
    },
    getUsersBySeasOrDempOrAgent: function(object,user, userId, This){
        var users;
         if(This.closest(".department_list").length){
                users = utils._getUsersByDepm(object,userId);
            }else if(This.closest(".seas_list").length){
                users = utils._getUsersBySeas(object,userId);
            }else{
                user.isUser = true;
                user.isUserId = userId;
                users=[user];
            }
            return users;
    },
    _getObjectInfo: function(object, userId) {
        var dics=object.data||[];
        var item={};
        if(object.arrayDataType || object.data.length === 0) {
            return object.data[userId];
        } else {
            if(object.cacheData){
                item=getCache(object.cacheData, userId);
            }else{
                for (var i = 0; i < dics.length; i++) {
                    if (dics[i]._id == userId) {
                        item=DS.copy(dics[i]);
                    }
                }
            }
            return item;
//            return getCache("agents", userId);
        }
    },

    contains: function (elems, value) {
        for (var i = 0; i < elems.length; i++) {
            if (elems[i] == value) {
                return true;
            }
        }
        return false;
    },

    sortTable: function(tableID, iCol, dataType, object) {
        var docFrag = document.createDocumentFragment();
        var sortArr = utils._getSortTRs(tableID, iCol, dataType, $(object).attr("state"));
        utils._change_sortState(tableID, object);
        for(var i=0; i< sortArr.length; i++) {
            docFrag.appendChild(sortArr[i]);
        }
        var oTable = document.getElementById(tableID);
        oTable.tBodies[0].appendChild(docFrag);
    },

    _getSortTRs: function(tableID, iCol, dataType, state) {
        var trArr = [];
        var oTable = document.getElementById(tableID);
        var rows = oTable.tBodies[0].rows;
        var sortExcludeRow = [];
        for(var i=0; i<rows.length; i++) {
            if($(rows[i].cells[0]).attr('sort_exclude')){
                sortExcludeRow.push(rows[i]);
            } else {
                trArr[trArr.length] = rows[i];
            }
        }
        trArr.sort(utils._compareTRs(iCol, dataType, state));
        if (sortExcludeRow.length > 0) {
            for (var j= 0,jLen = sortExcludeRow.length;j<jLen;j++) {
                trArr.push(sortExcludeRow[j]);
            }
        }
        return trArr;
    },

    _compareTRs: function(iCol, dataType, state) {
        return function compare(tr1, tr2) {
            var value1 = utils._convert(tr1.cells[iCol], dataType);
            var value2 = utils._convert(tr2.cells[iCol], dataType);
            if(state == "init" || state == "down") {
                return utils._asc(value1, value2);
            } else if(state == "up") {
                return utils._desc(value1, value2);
            }
        };
    },

    _convert: function(valueDoc, dataType) {
        var value;
        if(valueDoc.innerHTML.indexOf("</a>") > -1){
            value = valueDoc.childNodes[0].innerHTML;
        }else{
            value = valueDoc.innerHTML;
        }

        switch(dataType) {
            case "int": return parseInt(value);
            case "float": return parseFloat(value);
            case "date": return new Date(Date.parse(value));
            case "intAndString": {
                return parseInt(value.substring(0, value.indexOf("(")));
            }
            default: return value.toString();
        }
    },

    _asc: function(x, y) {
        if(typeof x == "string"){
            while(x.indexOf(" ")!=-1 || y.indexOf(" ")!=-1)
            {
                x = x.replace(" ","");
                y = y.replace(" ","");
            }

            return x.localeCompare(y);
        }else{
            if(x > y) {
                return 1;
            } else if(x < y) {
                return -1;
            } else {
                return 0;
            }
        }
    },

    _desc: function(x, y) {
        if(typeof x == "string"){
            while(x.indexOf(" ")!=-1 || y.indexOf(" ")!=-1)
            {
                x = x.replace(" ","");
                y = y.replace(" ","");
            }
            return y.localeCompare(x);
        }else{
            if(x > y) {
                return -1;
            } else if(x < y) {
                return 1;
            } else {
                return 0;
            }
        }
    },

    _change_sortState: function(tableID, object) {
        $("#"+tableID+" .sort").removeClass("monitor_sort_up");
        $("#"+tableID+" .sort").removeClass("monitor_sort_down");
        $("#"+tableID+" .sort").addClass("monitor_sort");
        var state = $(object).attr("state");
        if(state == "init") {
            $(object).attr("state", "up");
            $(object).find("span").removeClass("monitor_sort");
            $(object).find("span").addClass("monitor_sort_up");
        } else if(state == "up") {
            $(object).attr("state", "down");
            $(object).find("span").removeClass("monitor_sort_up");
            $(object).find("span").addClass("monitor_sort_down");
        } else if(state == "down") {
            $(object).attr("state", "up");
            $(object).find("span").removeClass("monitor_sort_down");
            $(object).find("span").addClass("monitor_sort_up");
        }
    },
    logout: function() {
        var msgHtml =
            "<div style='float:right'>" +
            "<button type=\"button\" onclick='utils.closeBox();' class='close'>×</button>"+
            "</div>" +
            "<div style='overflow:hidden;margin-top:10px;padding-left:20px;'><div style='float:left;padding-left:5px;font-size:15px;padding-top:4px'>" +
            "<div>是否确认退出当前系统?</div>" +
            "<div style='font-size: 13px;'><input id='logout_check' type='checkbox' />&nbsp;退出后继续使用当前接听方式接听来电</div>" +
            "</div></div>"+
            "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div>"+
            "<div style='padding-left:265px;padding-top:20px;'>" +
            "<button class=\"btn btn-small btn-primary ds_do_action\" ds_action=\"logout\">确认</button>" +
            "<button class=\"btn btn-small \" onclick='utils.closeBox();' style='margin-left: 10px;'>取消</button>" +
            "</div>";
        utils.showBox(370, 120, msgHtml);
        var logoutCheck = DS.getCookie("logoutCheck");
        if(logoutCheck == 'true'){
            $('#logout_check').attr("checked", true);
        }else{
            $('#logout_check').attr("checked", false);
        }
    },
    getSearchCondition: function (data) {
        var conditon = {};
        for (var key in data) {
            if (data[key]) {
                conditon[key] = data[key];
            }
        }
        return conditon;
    },
    setSearchInput: function(id, value) {
        $("#"+id+"_input").val(value);
        $("#"+id+"_input").css("color", "#000");
        $("#"+id+"_div").css("display", "none");
    },
    getStrLength: function(str) {
        var len = 0;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            //单字节加1
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                len++;
            } else {
                len += 2;
            }
        }
        return len;
    },
    _getForOwner:function(agents){
        var normalId=handler.customer.normalId;
        var _categorys=getCache("custCategorys");
        if(_categorys.length>0){
            var _categorys2=[{_id:normalId,displayName:"无归属",pinyin:"",exten:'',status:'enable',category:'1'}];
            for(var i=0;i<_categorys.length;i++){
                var obj=_categorys[i];
                var category=obj.category;
                var item={_id:obj._id,displayName:obj.cName,pinyin:"",exten:'',status:'enable'};
                if(category=='4'){
                    item.category='3';
                }else{
                    item.category='2';
                }
                _categorys2.push(item);
            }
            _categorys=_categorys2;
        }
        if(_categorys.length>0){
            _categorys=_categorys.concat(agents);
        }
        return _categorys;
    },
    loadAgentTabBox: function(inputId,containerId,option,isEnable,/*是否显示公海*/isShowSeas,isNaOwner/*是否显示无归属*/){
        var agents=getCache("agents");
        var _agents=[];

        if(isNaOwner){
            _agents = [{_id:"empty",displayName:"无所属人",pinyin:"wusuoshuren",exten:'',status:'enable'}];
        }
        if(isEnable){
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(u.status=='enable'){
                    _agents.push(u);
                }
            }
        }else{
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                _agents.push(u);
            }
        }
        var _agents2=[];
        if(isShowSeas){
            //var emptyAgents=[{_id:"empty",displayName:"无所属人",pinyin:"wusuoshuren",exten:'',status:'enable'}];
            _agents2=utils._getForOwner(_agents);
        }else{
            _agents2=_agents;
        }
        // var searchField = option.hideTab != 2 ? ["displayName","exten","pinyin","name"] : ["displayName","exten","pinyin"];
        utils.loadSearchTab({ id: containerId,
            width: option.width,
            height: option.height,
            maxHeight: option.maxHeight,//为0时要判断
            tip: "输入部门或同事姓名",
            data: _agents2,
            searchField: ["displayName","exten","pinyin"],
            pinyinField: ["displayName"],
            listField: ["displayName","exten"],
            userIdField: "_id",
            showField: "displayName",
            showAllList: true,
            isRadio: option.isRadio,
            hideTab: option.hideTab,
            commonTab: option.commonTab,
            isShowSeas: isShowSeas,
            callbackFuc: function (object) {
                $("#"+inputId).val(object._id);
            },
            onKeyChanged: function () {
                var commonTabHtml= option.commonTab ? "常<br>用" : "结<br>果";
                if ($.trim($("#"+containerId+"_input").val()) != "") {
                    if (option.isRadio) {
                        $("#"+inputId).val("serachInputNoresult");
                    }
                    $("#"+containerId+" .search_tab ol li").eq(0).click().html("结<br>果");
                } else {
                    if (option.isRadio) {
                        $("#"+inputId).val("");
                    }
                    $("#"+containerId+" .search_tab ol li").eq(0).html(commonTabHtml);
                    $("#"+containerId+"_div .result_list").hide().siblings("ul").show();
                     var isCheckBySpan = $("#"+containerId+" .tabbox_agent_result").find('span').length;
                    if(!isCheckBySpan){
                        $("#"+containerId+"_div dl dd").removeClass("active");
                    }
                    $("#"+containerId+"_div").closest(".advanced_search_item").find("input").val("");
                }
            }
        });
    },
    loadAgentTabBoxByDial: function(inputId,containerId,option,isEnable,/*是否显示公海*/isShowSeas,isNaOwner/*是否显示无归属*/){
        var agents   = getCache("agents"),
            _agents  = isNaOwner?[{_id:"empty",displayName:"无所属人",pinyin:"wusuoshuren",exten:'',status:'enable'}]:[],
            _agents2 = [],
            i        = 0,
            u        = {};
        _agents=utils.showAgentsByOnline(isEnable,agents);
        _agents2=isShowSeas?utils._getForOwner(_agents):_agents;
        
        utils.loadSearchTabByDial({ id: containerId,
            width: option.width,
            height: option.height,
            maxHeight: option.maxHeight,//为0时要判断
            tip: "输入部门或同事姓名",
            data: _agents2,
            agents:agents,
            searchField: ["displayName","exten","pinyin"],
            pinyinField: ["displayName"],
            listField: ["displayName","exten"],
            userIdField: "_id",
            showField: "displayName",
            showAllList: true,
            isRadio: option.isRadio,
            isChenckBox:option.isChenckBox,
            hideTab: option.hideTab,
            commonTab: option.commonTab,
            endString:option.endString,
            tmplId:option.tmplId,
            formId:option.formId,
            delfVal:option.delfVal,
            isShowSeas: isShowSeas,
            callbackFuc: function (object) {
                $("#"+inputId).val(object._id);
                // $("#"+formId).closest('.modal-body').attr('overflow-y','');
                // console.log($("#"+formId).html);
            },
            onKeyChanged: function () {
                var commonTabHtml= option.commonTab ? "常<br>用" : "结<br>果";
                if ($.trim($("#"+containerId+"_input").val()) !== "") {
                    if (option.isRadio) {
                        $("#"+inputId).val("serachInputNoresult");
                    }
                    $("#"+containerId+" .search_tab ol li").eq(0).click().html("结<br>果");
                } else {
                    if (option.isRadio) {
                        $("#"+inputId).val("");
                    }
                    $("#"+containerId+" .search_tab ol li").eq(0).html(commonTabHtml);
                    $("#"+containerId+"_div .result_list").hide().siblings("ul").show();
                     var isCheckBySpan = $("#"+containerId+" .tabbox_agent_result").find('span').length;
                    if(!isCheckBySpan){
                        $("#"+containerId+"_div dl dd").removeClass("active");
                    }
                    $("#"+containerId+"_div").closest(".advanced_search_item").find("input").val("");
                }
            }
        });
    },
    loadSearchTabByDial: function(object){
            object.deptOrSeasOrPersonId = "all";
            utils._initAgentCheckbox(object,true);
            object.tip       = object.isShowSeas ? "输入部门或座席姓名" : "输入座席姓名";
        var searchInputStyle = object.height?('color:#938c8c;'+'height:'+object.height+'px;'):'color:#938c8c;',
            objectId         = object.id,
            btnCaretStyle    = "",
            sec_tab          = object.isShowSeas ? "座<br />席" : "座<br />席",
            sec_info         = object.isShowSeas ? "个归属" : "位座席",
            inputElement     = '<input type="text" '+object.editOwner+' autocomplete="off" class="tabbox_agent_input query_field" id="'+objectId+'_input" style="'+searchInputStyle+'" placeholder="'+object.tip+'"/>',
            maxHeight        = object.maxHeight !== "0" ? object.maxHeight : 198,
            $objectId        = $("#"+objectId),
            divList          = '<div class="tabbox_agent_result clearfix" style="display:none"></div><div class="search_tab" id="'+objectId+'_div" style="display:none;position:absolute;background:#fff;bottom:-'+(maxHeight+2)+'px;" class="phone_search_input" index=-1 total=0 >'+
                    '<div class="search_tab_pane active" style="height:'+maxHeight+'px;"><ul class="commonly_list"></ul><ul class="result_list"></ul><span class="srch_null">没有搜索结果，请变换搜索条件</span></div>'+
                    '<div class="search_tab_pane" style="height:'+maxHeight+'px;">'+
                    '<div class="code_total" ds_unit="'+sec_info+'">共有<span></span>'+sec_info+'</div>'+
                    '<ul id="'+objectId+'_ul_colleague" class="colleague_list"></ul></div>'+
                    '<div class="search_tab_pane" style="height:'+maxHeight+'px;">'+
                    '<div class="code_total">共有<span></span>个部门</div>'+
                    '<ul id="'+objectId+'_ul_department" class="department_list"></ul></div>'+
                    '<div class="search_tab_pane" style="height:'+maxHeight+'px;">'+
                    '<div class="code_total">共有<span></span>个公海</div>'+
                    '<ul id="'+objectId+'_ul_seas" class="seas_list"></ul></div>'+
                    '<ol><li class="active" onclick="utils.changeTab(this);"></li><li onclick="utils.changeTab(this);">'+sec_tab+'</li><li  onclick="utils.changeTab(this);">部<br />门</li><li  onclick="utils.changeTab(this);">公<br />海</li></ol></div>';
            object.isRadio?$objectId.html((inputElement + '<div class="search_warp">'+divList+'</div>')):$objectId.html(inputElement + divList).css("position","relative");
            object.tip       = object.isShowSeas ? "输入部门或座席姓名" : "输入座席姓名";



        object.hideTab?($objectId.find("ol li").eq(object.hideTab).hide().siblings().attr("ds_show","show")):$objectId.find("ol li").attr("ds_show","show");
   
        //重置常用和搜索的tab内容
        utils._resetCommonTab(objectId,object.commonTab);

        if (object.width) {
            $objectId.width(object.width);
        }

        $objectId.keydown(function (e) {
            if (e.keyCode == 38 || e.keyCode == 13){
                utils._stopEvent(e)
            }
        });
        $objectId.unbind('keyup');
        $objectId.keyup(function (e) {
            utils._onkeyupTabByDial(e.keyCode, object);
        });

        $objectId.click(function (e) {
            if(object.editOwner == "readonly") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if(object.data.length===0 && object.isShowSeas===false){
                $().alertmessage('showError', '请先配置部门座席');
                return;
            }else if($("#" + objectId + "_div").css("display") === "none") {
                utils._hidden("search_tab");
                utils._deleteResult(object,objectId);


                var total = utils._searchTabByDail(objectId, object, true, 1);
                utils._searchTabByDail(objectId, object, true, 2);

                $objectId.find(".tabbox_agent_result span").each(function(i){
                    var userid=$(this).attr("userid");
                    $objectId.find("dd[userid="+userid+"]").addClass("active");
                });

                utils._countNo(objectId);
            }
        $('#'+objectId+'_ul_colleague').find('.search_input_dd:contains("[公海]")').remove();
         $('#'+objectId+'_ul_colleague').find('.search_input_dd:contains("无归属")').remove();
        });
        $('body').click(function(e) {
            var $objectIdDiv = $("#" + objectId + "_div");
            if($objectIdDiv&&$objectIdDiv.css("display") !== "none") {
                    var total =$objectIdDiv.find('.result_list').attr("total");
                    if(total === 1) {
                        utils._searchClick(object, 0);
                    }
                    utils._hidden("search_tab");
            }
        });
    },
    showAgentsByOnline: function(isEnable,agents){
        if(isEnable){
            agents=agents.map(function(val){
                return val.status === 'enable'?val:false;
            }).filter(Boolean);
        }
        return agents;
    },
    _initAgentCheckbox: function (object,flag){
        if(!object.agents)return;
        var pane = $("#"+object.formId),
            span4ByPane ,
            span4ByAll=[],
            tmpl = "",
            allTmpl = "",
            html=[],
            i = 0,
            tmplId,
            agents = [],
            agentsName = [],
            delAgentByContainer ;
            agents=object.agents.filter(Boolean);
            agents=agents.map(function(val){
                if(object.deptOrSeasOrPersonId==='all'&&flag){
                    val.deptOrSeasOrPersonId = object.deptOrSeasOrPersonId;
                }else {
                    val.deptOrSeasOrPersonId = val.allSeasId ||val.isUserId||val.deptId;
               }

                val.endString = object.endString;
                val.delfVal = object.delfVal;
                val.delfVal = pane.find(".daily_task input").val()||val.delfVal;
                if(val.status==='enable'){
                   return  val;
                }
            }).filter(Boolean);
        delete object.deptOrSeasOrPersonId;
        handler.customer.task._bubbleSort(agents).map(function(val){  
            if(!pane.find(".cust_assgin_agent_container .row-fluid").find(".span4[ds_data='all']").find('input[value='+val._id+']').attr("checked")){
                tmplId = val.isUserId ? "#"+object.tmplId+"_checked" : "#"+object.tmplId;
                tmpl += $(tmplId).tmpl(val).get(0).outerHTML;
            }
        });

        span4ByAll = pane.find(".cust_assgin_agent_container .row-fluid").find(".span4[ds_data='all']");
        for (var i = 0; i < span4ByAll.length; i++) {
            if(span4ByAll.eq(i).find('input[type="checkbox"]').attr("checked")){
                tmpl += span4ByAll.get(i).outerHTML;
            }
        }


        pane.find(".cust_assgin_agent_container .row-fluid").html(tmpl);
        !flag&&pane.find(".cust_assgin_agent_container .row-fluid").find(".span4[ds_data='all']").find('input[type="checkbox"]').attr("checked",true);

        utils._uniqAgentHtml(pane,flag,object.isChenckBox);


        if(pane.find(".daily_task input").length){
            $('.ds_checked_radio').click(function(e){
                 handler.customer.task.changeUnit($('.ds_checked_radio:checked').attr("ds_data"),$('.ds_checked_radio:checked'));
            });
        
               if(pane.find(".daily_task").css("display")!=="none"){
                    pane.find(".cust_assgin_agent_container .row-fluid").find('.user_cust').val("");
                    pane.find(".cust_assgin_agent_container .row-fluid").find('input[type="checkbox"]:checked').closest('.span4').find('.user_cust').val(pane.find(".daily_task input").val());
                    pane.find(".daily_task input[type='num']").keyup(function(e){
                        pane.find(".cust_assgin_agent_container .row-fluid").find('.user_cust').val("");
                        pane.find(".cust_assgin_agent_container .row-fluid").find('input[type="checkbox"]:checked').closest('.span4').find('.user_cust').val(pane.find(".daily_task input").val());
                       var checkboxCh = pane.find(".cust_assgin_agent_container .row-fluid"),
                           total = 0;

                       for (var i = 0; i < checkboxCh.find('input[type="checkbox"]').length; i++) {
                           if(checkboxCh.find('input[type="checkbox"]').eq(i).attr("checked")){
                            total +=  +pane.find(".daily_task input").val();
                           }
                       }
                       $("#dttotal").find("strong").text(total);
                    })
                    var checkboxCh = pane.find(".cust_assgin_agent_container .row-fluid"),
                           total = 0;

                       for (var i = 0; i < checkboxCh.find('input[type="checkbox"]').length; i++) {
                           if(checkboxCh.find('input[type="checkbox"]').eq(i).attr("checked")){
                            total +=  +pane.find(".daily_task input").val();
                           }
                       }
                       $("#dttotal").find("strong").text(total);
               }
            
        }
        if(object.isChenckBox){
            pane.find(".cust_assgin_agent_container .row-fluid").find('input[type=checkbox]').hide();
            pane.find(".cust_assgin_agent_container .row-fluid").find('.user_cust').keyup(function(e){
                e.preventDefault();
                e.stopImmediatePropagation();
                var target = $(e.currentTarget);
                var formSpan12 = target.closest("form");
                    var len = formSpan12.find(".user_cust").length;
                    var sum = 0;
                    for(var xx=0;xx<len;xx++){
                        var inputval = formSpan12.find(".user_cust").get(xx).value || 0;
                        if(inputval){
                            sum+= parseInt(formSpan12.find(".user_cust").get(xx).value) || 0;
                        }
                    }
                    var acturalNum=parseInt(formSpan12.find(".cust_count").text());
                    acturalNum=acturalNum>handler.customer.batchMaxNum?handler.customer.batchMaxNum:acturalNum;
                    if(sum>acturalNum){
                        sum=0;
                    }else{
                        sum=acturalNum-sum;
                    }
                    formSpan12.find(".cust_more_count").text(sum);

            });
            pane.find(".check_agent_dep_seas").find('.checkbox').hide();
        }

        if($("#task_selected_agent").length===1){
            for (var i = 0; i < $("#task_selected_agent").find("span").length; i++) {
                delAgentByContainer = $("#task_selected_agent").find("span").eq(i).attr('custid');
                pane.find(".cust_assgin_agent_container .row-fluid").find("input[value="+delAgentByContainer+"]").closest('.span4').remove();
            }
        }
        pane.find(".ch_agent").css("max-height",$(window).height() - 375);
    },
    _uniqAgentHtml: function(paneClass,isAllAgents,isChenckBox){
       var  pane          = paneClass.find(".cust_assgin_agent_container .row-fluid"),
            valInputPane  = pane.find("input[type='checkbox']")||[],
            i             = 0,
            html          = [],
            flag          = false,    
            valInput      = [];
            countCall     = {};
            isCheckedPane = [];
        for (i = 0; i < valInputPane.length; i++) {
                    valInput.push(valInputPane[i].value);
                }
        valInput = utils._uniqueArr(valInput);
        valInput.map(function(val){
            isCheckedPane = pane.find("input[value='"+val+"']");
                for (i = 0; i < isCheckedPane.length; i++) {
                    if(isCheckedPane.eq(i).attr('checked')){
                        flag = true;
                    }
                }
            countCall[val] = isCheckedPane.closest('.span4').find('.user_cust').val();
            html.push(pane.find("input[value='"+val+"']").attr('checked',flag).closest('.span4').get(0).outerHTML);
            flag = false;
           
        });
        pane.find('input[value]').closest('.span4').remove();
        pane.prepend(html.join(""));
        $.each(countCall,function(k,v){
            pane.find("input[value='"+k+"']").closest('.span4').find('.user_cust').val(v);
        });
        
    },
     _isAllAgents: function(pane,isAllAgents,isChenckBox){
        var  allAgentsSpan4 = pane.find('.span4[ds_data="all"]');
        for (var i = 0; i < allAgentsSpan4.length; i++) {
            $(allAgentsSpan4.get(i)).remove();
        }
    },
    _uniqueArr: function (arr) {
        var result = [], hash = {};
        for (var i = 0, elem; (elem = arr[i]) != null; i++) {
            if (!hash[elem]) {
                result.push(elem);
                hash[elem] = true;
            }
        }
            return result;
    },

   
    allAgent: function (sel,task_num,all,total,unit,formId){
        total = $("#dttotal").length===1&&(+$("#dttotal .total").text());
        task_num =  $(sel).siblings("input").val()>0? $(sel).siblings("input").val():($("#"+formId).find(".daily_task input").val()||task_num);
        $(sel).siblings("input").val(task_num);
        $.each(all,function(key, item){
            total += parseInt($(item).siblings("input").val());
        });
        utils.setDttotalHtml(total,unit);
    },
    setDttotalHtml:function(total,unit){
        var HTML =  ("（共计<strong class=’total‘ style='color:red'>" + total + "</strong><span class='unit'>" + unit + ")</span>");
       total?$("#dttotal").html(HTML).show():$("#dttotal").empty();
    },

    _resultArr: function (object, id) {
        var results = $("#"+object.id+"_div .search_tab_pane");
        for (var i = 0; i < results.length; i++) {
            var resultAs = $("#"+object.id+"_div").find(".search_tab_pane").eq(i).find("ul").eq(0).find("dd.active");
            var resultStr = '';
            for (var j = 0; j < resultAs.length; j++) {
                if(j==resultAs.length-1){
                    resultStr += $("#"+object.id+"_div").find(".search_tab_pane").eq(i).find("dd.active").eq(j).attr("userid");
                    break;
                }
                resultStr += $("#"+object.id+"_div").find(".search_tab_pane").eq(i).find("dd.active").eq(j).attr("userid")+",";
            }
            $("#"+id).siblings("input[type=hidden]").eq(i).val(resultStr);
        }
    },
    loadAgentComboBox:function(inputId,containerId,option,isEnable,isEmpty,editOwner){
        var agents=getCache("agents");
        var _agents=[];
        if(isEnable){
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(u.status=='enable'){
                    _agents.push(u);
                }
            }
        }else{
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                _agents.push(u);
            }
        }
        var _agents2=[];
        if(isEmpty){
            var emptyAgents=[{_id:"empty",displayName:"无所属人",pinyin:"wusuoshuren",exten:'',status:'enable'}];
            _agents2=emptyAgents.concat(_agents);
        }else{
            _agents2=_agents;
        }
        utils.loadSearchInput({ id: containerId,
            width: option.width,
            height: option.height,
            tip: "按姓名、拼音、工号搜索",
            data: _agents2,
            searchField: ["displayName","exten","pinyin"],
            pinyinField: ["displayName"],
            listField: ["displayName","exten"],
            userIdField: "_id",
            showField: "displayName",
            showAllList: true,
            editOwner:editOwner,
            callbackFuc: function (object) {
                $("#"+inputId).val(object._id);
            },
            onKeyChanged: function () {
                if ($("#"+containerId+"_input").val() != "") {
                    $("#"+inputId).val("serachInputNoresult");
                } else {
                    $("#"+inputId).val("");
                }
            }
        });
    },
    /**
     * 客户归属权限控制优先级：不能修改归属 > 数据权限
     * @param type
     * @param pane
     * @param data
     */
    loadForOwnerComboBox:function(/*add,update*/type,pane,data){
        var normalId=handler.customer.normalId;
        var owner=data.owner;
        var scope=session.user.scope.customer;
        var inputItem=pane.find(".for_owner_input");
        if(isHasFunc("func_not_allow_user_edit_owner")){
            inputItem.prop("readonly",true);
            return;
        }

        if(owner){
            if (session.user.moduleUsers["customer"] != "all" && session.user.moduleUsers["customer"].indexOf(owner) == -1 ){
                if(data.owner == data.categoryId){
                    var category = getCache("custCategorys",data.categoryId);
                    if(category && category.managers.indexOf(session.user._id) == -1){
                        inputItem.prop("readonly",true);
                        return;
                    }
                }else{
                    inputItem.prop("readonly",true);
                    return;
                }
            }
        }

        var _agents=filterUserByScope('customer');
        var _categorys=filterCategoryByManager();
        var _agentAll = getCache("agents");
        var _uids=[];

        for (var i = 0; i < _agents.length; i++) {
            var obj = _agents[i];
            _uids.push(obj._id);
        }

        var _categorys2=[];
        var NA={_id:normalId,displayName:"无归属",pinyin:"",exten:'',status:'enable',category:'1'}
        if(scope=='all'||isHasFunc("func_popup_commonCust_owner")){
            _uids.push("NA");
        }
        if(scope=='all'){
            _categorys2.push(NA);
        }

        var _categoryIds=[];
        if(_categorys.length>0){
            for(var i=0;i<_categorys.length;i++){
                var obj=_categorys[i];
                var category=obj.category;
                var item={_id:obj._id,displayName:obj.cName,pinyin:"",exten:'',status:'enable'};
                if(category=='0'||category=='3'){
                    item.category='2';
                }else if(category=='4'){
                    item.category='3';
                }
                _categorys2.push(item);
                _categoryIds.push(obj._id);
            }
            _categorys=_categorys2;
        }

        var registerEvent=function(){
            inputItem.combobox({
                minLength:0,
                //displayField:inputItem,
                source: function( request, response ) {
                    var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
                    if(request.term){
                        response( $.grep(agents, function( item ){
                            return matcher.test(item.displayName)||matcher.test(item.exten)||matcher.test(item.pinyin);
                        }) );
                    }else{
                        response(agents);
                    };
                },
                select: function( event, ui ) {
                    //console.dir(ui.item);
                    var owner2=ui.item._id;
                    var desc=ui.item.displayName;
                    var category2=ui.item.category||'';
                    var categoryId="";
                    if(category2){
                        categoryId=owner2;
                        pane.find(".for_owner_categoryId").val(categoryId);
                    }
//                    var src = $(event.currentTarget);
                    if(category2=='2'||category2=='3'){
                    }else if(category2=='1'){
                    }
                    if(category2=='3'){
                        pane.find(".for_owner_category").val("4");
                    }

                    pane.find(".for_owner_id").val(owner2);
                    pane.find(".for_owner_input").val(desc);
                    return false;
                },
                open: function(event, ui) {
                    var instance=inputItem.data("custom-combobox");
                    var _owner=pane.find(".for_owner_id").val();
                    var val=inputItem.val();
                    if(instance && !val){
                        var container=instance.menu.element;
                        container.find("li").each(function(i){
                            var _uid=$(this).attr("uid");
                            if(_uid==_owner){
//                                $(this).addClass("ui-state-focus");
                                $(this).css({'background-color':'#08c','color':'#fff'});
                                var _scrollTop=$(this).offset().top-container.offset().top+container.scrollTop();
                                container.animate({scrollTop:_scrollTop-65},"fast");
                            }
                        })
                    }
                }
            })
        }
        if(type=='add'){
            var agents=[];
            if(_categorys.length>0){
                agents=_categorys;
            }
            agents=agents.concat(utils.loadUsers(true,false));
            registerEvent();
        }else{
            if($.inArray(owner,_uids)!=-1||$.inArray(owner,_categoryIds)!=-1|| $.inArray(owner,_agentAll)==-1){
                var agents=[];
                if(_categorys.length>0){
                    agents=_categorys;
                }
                if(_agents.length>0){
                    agents=agents.concat(utils.loadUsers(true,false));
                }
                registerEvent();
            }else{
                inputItem.prop("readonly",true);
            }
        }
    },
    loadUsers:function(isEnable,isEmpty){
        var agents=getCache("agents");
        var _agents=[];
        if(isEnable){
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(u.status=='enable'){
                    _agents.push(u);
                }
            }
        }else{
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                _agents.push(u);
            }
        }
        var _agents2=[];
        if(isEmpty){
            var emptyAgents=[{_id:"",displayName:"无所属人",pinyin:"wusuoshuren",exten:'',status:'enable'}];
            _agents2=emptyAgents.concat(_agents);
        }else{
            _agents2=_agents;
        }
        return _agents2;
    },
    loadUsers2Chat:function(isEnable,isEmpty,currentId,hideMe){
        var agents=getCache("agents");
        var _agents=[];
        if(isEnable){
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(u.status=='enable'){
                    _agents.push(u);
                }
            }
        }else{
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                _agents.push(u);
            }
        }
        if(hideMe){
            for(var i=0;i<_agents.length;i++){
                var u=_agents[i];
                if(u._id==currentId){
                    _agents.splice(i,1);
                    break;
                }
            }
        }
        var _agents2=[];
        if(isEmpty){
            var emptyAgents=[{_id:"",displayName:"放入领取池",pinyin:"wusuoshuren",exten:'',status:'enable'}];
            _agents2=emptyAgents.concat(_agents);
        }else{
            _agents2=_agents;
        }
        return _agents2;
    },
    loadAccessAgents2Chat:function(peerId){
        var peer= getCache("accessChannelAgent", peerId);
        var agents= [];
        if(peer){
            agents = peer.agents;
        }
        return agents;
    },
    getStrRealLength: function (str) {
        var realLength = 0 , len = str.length, charCode = -1;
        for (var i = 0; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128){
                realLength += 1;
            }else {
                realLength += 2;
            }
        }
        return realLength;
    },
    substringByRealLength : function(str,start,end){
        var len = str.length,realLength = 0, charCode = -1;
        var result = "";
        for (var i = 0; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128){
                realLength += 1;
            }else {
                realLength += 2;
            }
            if(realLength <= end && realLength >= start){
                result += str.charAt(i);
            }
            if(realLength > end){
                break;
            }
        }
        return result;
    },
    /**
     * 去掉字符串中所有空格
     * @param str
     * @returns {string}
     */
    strTrimAll :function(str) {
        var result;
        result = str.replace(/(^\s+)|(\s+$)/g,"");
        result = result.replace(/\s/g,"");
        return result;
    },
    /**
     * 去掉字符串前后空格
     * @param str
     * @returns {string}
     */
    strTrim : function(str){
        var result;
        result = str.replace(/(^\s+)|(\s+$)/g,"");
        return result;
    },
    /**
     * 取文件名后缀
     */
    getFileExt : function(str)
    {
        var d=/\.[^\.]+$/.exec(str);
        return d;
    },
    changeTab : function(src){
        var index = $(src).index();
        $(src).addClass("active").siblings().removeClass("active").closest(".search_tab").find(".search_tab_pane").eq(index).addClass("active").siblings().removeClass("active");
    },
    _deleteResult : function(object,id){
        if(id){
            $("#"+id+" .delete_result").click(function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                var target = $(e.currentTarget);
                var userId = target.parent().attr("userId");
                target.parent().remove();
                $("#"+id+"_div .search_tab_pane dd[userid="+userId+"]").removeClass("active").css({"background":"","color":""});
                utils._countNo(id);
                utils._resultArr(object,id);
            });
        }else{
            $(".check_agent_dep_seas .delete_result").click(function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                var target = $(e.currentTarget);
                var userId = target.parent().attr("userId");
                var getDeleteAgentsArr = [];
                var delContainer = target.closest("form").attr("id");

                target.closest(".check_agent_dep_seas").find(".checkbox input[name='selectAllAgent']").attr("checked",false);
                getDeleteAgentsArr = target.closest(".check_agent_dep_seas").find(".cust_assgin_agent_container").find(".span4[ds_data="+userId+"]");
                if(getDeleteAgentsArr.length>1){
                    for (var i = 0; i < getDeleteAgentsArr.length; i++) {
                      target.closest(".check_agent_dep_seas").find(".tabbox_agent_result").find("span[userid="+getDeleteAgentsArr.eq(i).find("input[type='checkbox']").val()+"]").remove();;
                    }
                }
                 
                target.closest(".check_agent_dep_seas").find(".search_tab_pane dd[userid="+userId+"]").removeClass("active").css({"background":"","color":""});
                target.closest(".check_agent_dep_seas").find(".comtabbox_agent").find(".tabbox_agent_result").find("span[userId='"+userId+"']").remove();
                target.parent().remove();
                utils._deleteAgents(object, delContainer);
            });
        }
       
    },

    Base64:{
        // private property
        _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
        encode : function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = utils.Base64._utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                    utils.Base64._keyStr.charAt(enc1) + utils.Base64._keyStr.charAt(enc2) +
                    utils.Base64._keyStr.charAt(enc3) + utils.Base64._keyStr.charAt(enc4);
            }
            return output;
        },

// public method for decoding
        decode : function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = utils.Base64._keyStr.indexOf(input.charAt(i++));
                enc2 = utils.Base64._keyStr.indexOf(input.charAt(i++));
                enc3 = utils.Base64._keyStr.indexOf(input.charAt(i++));
                enc4 = utils.Base64._keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            output = utils.Base64._utf8_decode(output);
            return output;
        },

// private method for UTF-8 encoding
        _utf8_encode : function (string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }
            return utftext;
        },
// private method for UTF-8 decoding
        _utf8_decode: function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;
            while ( i < utftext.length ) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                } else if((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i+1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = utftext.charCodeAt(i+1);
                    c3 = utftext.charCodeAt(i+2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    }
}



