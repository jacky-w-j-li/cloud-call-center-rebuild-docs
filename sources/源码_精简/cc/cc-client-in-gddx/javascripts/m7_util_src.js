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

    closeBox: function () {
        if (utils.showBoxMsgDom) {
            document.body.removeChild(utils.showBoxMsgDom);
            utils.showBoxMsgDom = null;
        }
        if (utils.showBoxbgDom) {
            document.body.removeChild(utils.showBoxbgDom);
            utils.showBoxbgDom = null;
        }
    },

    showSucc: function (msg) {
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

    checkHide: function () {
        if (utils.notifyDialogRemain <= 0) {
            utils.hideNotify();
        }
        utils.notifyDialogRemain -= 500;
    },

    hideNotify: function () {
        if (utils.notifyDialogInterval != null) {
            clearInterval(utils.notifyDialogInterval);
            utils.notifyDialogInterval = null;
            utils.closeBox();
        }
    },

    showConfirm: function (msg) {
        utils.hideNotify();
        var msgHtml =
            "<div style='float:right'>" +
            "<a href='javascript:utils.closeBox();'>" +
            "<img src='./img/client/close_grey.gif' onmouseover=\"this.src='./img/client/close_red.gif'\" onmouseout=\"this.src='./img/client/close_grey.gif'\" style='cursor: pointer;border:0px;' /></a>" +
            "</div>" + strTrimAll
        "<div style='height:30px;overflow:hidden;margin-top:20px;padding-left:20px;'><img src='./img/client/tip_succ.jpg' style='float:left;margin-top:4px;' /><div style='float:left;color:#666666;padding-left:5px;font-size:15px;padding-top:4px'>" + msg + "</div></div>" +
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div>" +
        "<div style='padding-left:290px;padding-top:20px;'><a href='javascript:utils.closeBox();'><img src='./img/client/tip_confirm_1.jpg' onmouseover=\"this.src='./img/client/tip_confirm_2.jpg'\" onmouseout=\"this.src='./img/client/tip_confirm_1.jpg'\" style='cursor: pointer;border:0px;' /></a></div>";
        utils.showBox(420, 120, msgHtml);
    },

    showError: function (msg) {
        var msgHtml =
            "<div style='float:right'>" +
            "<a href='javascript:utils.closeBox();'>" +
            "<img src='./img/client/close_grey.gif' onmouseover=\"this.src='./img/client/close_red.gif'\" onmouseout=\"this.src='./img/client/close_grey.gif'\" style='cursor: pointer;border:0px;' /></a>" +
            "</div>" +
            "<div style='height:30px;overflow:hidden;margin-top:20px;padding-left:20px;'><img src='./img/client/tip_error.jpg' style='float:left;margin-top:4px;' /><div style='float:left;color:#666666;padding-left:5px;font-size:15px;padding-top:4px'>" + msg + "</div></div>" +
            "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div>" +
            "<div style='padding-left:290px;padding-top:20px;'><a href='javascript:utils.closeBox();'><img src='./img/client/tip_confirm_1.jpg' onmouseover=\"this.src='./img/client/tip_confirm_2.jpg'\" onmouseout=\"this.src='./img/client/tip_confirm_1.jpg'\" style='cursor: pointer;border:0px;' /></a></div>";
        utils.showBox(420, 120, msgHtml);
    },

    startWith: function (str, prefix) {
        return str.indexOf(prefix) == 0;
    },
    /**
     *
     * @param object
     */
    loadSearchInput_new: function (object) {
        // console.log(object);
        var searchInputStyle = 'color:#938c8c;';
        if (object.width) {
            searchInputStyle += 'width:' + object.width + 'px;';
        }
        var btnCaretStyle = "";
        if (object.height) {
            searchInputStyle += 'height:' + object.height + 'px;';
        }
        var showAllList = "";
        if (object.showAllList) {
            showAllList = '<a id="' + object.id + '_search_dropdown" class="btn btn-small" tabindex="-1" style="' + btnCaretStyle + '"><span class="caret"></span> </a>';
        }
        var inputElement = '<input type="text" class="combox_agent_input" id="' + object.id + '_input" style="' + searchInputStyle + '" placeholder="' + object.tip + '"/>';
        inputElement += showAllList;
        if (object.id == "monitor_agent_state_owner_select_user" || object.id == "monitor_agent_state_owner_select_state" || object.id == "customer_my_owner_customerUpdate_user") {
            var divList = '<div id="' + object.id + '_div" style="display:none;position:absolute;" class="phone_search_input" index=-1 total=0 ><ul id="' + object.id + '_ul" ></ul></div>';
        } else {
            var divList = '<div id="' + object.id + '_div" style="display:none;position:absolute;" class="phone_search_input" index=-1 total=0 ><ul id="' + object.id + '_ul" ></ul></div>';
        }
        $("#" + object.id).html(inputElement + divList);
        var dropdown = $("#" + object.id + "_search_dropdown");
        if (dropdown.length > 0) {
            var height = $("#" + object.id + "_input").innerHeight() - 2;
            dropdown.height(height);
        }

        $("#" + object.id).keydown(function (e) {
            if (e.keyCode == 38) {
                utils._stopEvent(e);
            } else if (e.keyCode == 13) {
                utils._stopEvent(e);
            }
        });
        $("#" + object.id).unbind('keyup');
        $("#" + object.id).keyup(function (e) {
            utils._onkeyupInput(e.keyCode, object);
        });
        $("#" + object.id + "_search_dropdown").click(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            utils._hidden("phone_search_input");
            object.data = getqualityTasks(getCache('qualityTasks'));
            if ($("#" + object.id + "_div").css("display") == "none") {
                var total = utils._searchInput(object.id, object, true);
                $("#" + object.id + "_div").attr("total", total);
                $("#" + object.id + "_div").attr("index", -1);
            } else {
                utils._hidden("phone_search_input");
            }
        });
        $('body').click(function (e) {
            if ($("#" + object.id + "_div")) {
                if ($("#" + object.id + "_div").css("display") != "none") {
                    var total = $("#" + "" + object.id + "_div").attr("total");
                    utils._hidden("phone_search_input");
                }
            }
        });
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
        var inputElement = '<div class="tabbox_agent_result"></div><input type="text" '+object.editOwner+' autocomplete="off" class="text tabbox_agent_input" id="'+object.id+'_input" style="'+searchInputStyle+'" placeholder="'+object.tip+'"/>';
        var maxHeight = object.maxHeight != "0" ? object.maxHeight : 198;
        object.maxHeight = maxHeight;
        var divList = '<div class="search_tab" id="'+object.id+'_div" style="display:none;position:absolute;background:#fff;bottom:-'+(maxHeight+2)+'px;" class="phone_search_input" index=-1 total=0 >'+
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
            if(object.data.length==0 && object.isShowSeas==false){
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
    loadSearchInput: function (object) {
        var searchInputStyle = 'color:#938c8c;';
        if (object.width) {
            searchInputStyle += 'width:' + object.width + 'px;';
        }
        var btnCaretStyle = "";
        if (object.height) {
            searchInputStyle += 'height:' + object.height + 'px;';
        }
        var showAllList = "";
        if (object.showAllList) {
//            showAllList = "<div id=\""+object.id+"_search_dropdown\" class=\"search_input_icon\" style=\"height:"+height+"\">&nbsp;</div>";
            showAllList = '<a id="' + object.id + '_search_dropdown" class="btn btn-small" tabindex="-1" style="' + btnCaretStyle + '"><span class="caret"></span> </a>';
        }
        var inputElement = '<input type="text" '+object.editOwner+' class="combox_agent_input" id="'+object.id+'_input" style="'+searchInputStyle+'" placeholder="'+object.tip+'"/>';
        inputElement += showAllList;
        // if (object.id=="monitor_agent_state_owner_select_user" || object.id=="monitor_agent_state_owner_select_state" || object.id=="customer_my_owner_customerUpdate_user") {
            var divList = '<div id="' + object.id + '_div" style="display:none;position:absolute;" class="phone_search_input" index=-1 total=0 ><ul id="' + object.id + '_ul" ></ul></div>';
        // } else{
        //     var divList = '<div id="'+object.id+'_div" style="display:none;position:fixed;" class="phone_search_input" index=-1 total=0 ><ul id="'+object.id+'_ul" ></ul></div>';
        // }
        $("#" + object.id).html(inputElement + divList);
        var dropdown = $("#" + object.id + "_search_dropdown");
        if (dropdown.length > 0) {
            var height = $("#" + object.id + "_input").innerHeight() - 2;
            dropdown.height(height);
        }
        $("#" + object.id + "_input").blur(function () {
            var str = $("#" + object.id).prev().val();
            if (str == "serachInputNoresult") {
                $("#" + object.id + "_input").val("");
            }
        });
        $("#" + object.id).keydown(function (e) {
            if (e.keyCode == 38) {
                utils._stopEvent(e);
            } else if (e.keyCode == 13) {
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
            utils._hidden("phone_search_input");
            if ($("#" + object.id + "_div").css("display") == "none") {
                var total = utils._searchInput(object.id, object, true);
                $("#" + object.id + "_div").attr("total", total);
                $("#" + object.id + "_div").attr("index", -1);
            } else {
                utils._hidden("phone_search_input");
            }
        });
        $('body').click(function (e) {
            if ($("#" + object.id + "_div")) {
                if ($("#" + object.id + "_div").css("display") != "none") {
                    var total = $("#" + "" + object.id + "_div").attr("total");
                    //if(total == 1) {
                    //    utils._searchClick(object, 0);
                    //}
                    utils._hidden("phone_search_input");
                }
            }
        });
    },

    _hidden: function (className) {
        $("." + className).css("display", "none");
    },
    _onkeyupTab: function(eventCode, object) {
        var id = object.id;
        var inputValue =  $.trim($("#"+object.id+"_input").val());
        var isCheckBySpan = $("#"+object.id+" .tabbox_agent_result").find('span').length;//判断是否为多选，多选则不取消active类
        if(inputValue==""&&!isCheckBySpan){
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

    _stopEvent: function (event) {
        event.preventDefault();
    },
    _resetCommonTab: function(id, commonTab){
        if (commonTab) {
            var commonTabHtml = "常<br>用";
            var html = "<li><dl><dd class='search_input_dd' userid='myself'>我自己</dd><dd class='search_input_dd' userid='my-subordinates'>我和我的下属</dd><dd class='search_input_dd' userid='my-department'>我的部门</dd><dd class='search_input_dd' userid='my-subordinates-dept'>我和我的下级部门</dd</dl></li>";
            $("#"+id+"_div ol li").eq(0).html(commonTabHtml);
        }else{
            var commonTabHtml = "结<br>果";
            var html = "";
            $("#"+id+"_div ol li").eq(0).html(commonTabHtml);
            $("#"+id+"_div ol li[ds_show=show]").eq(1).click();
        }
        $("#"+id+"_div .search_tab_pane").eq(0).find("ul.commonly_list").html(html);
    },
    _searchTab: function(id, object, allSearch, tabIndex) {
        var inputValue =  $.trim($("#"+id+"_input").val());
        var html = "";
        var htmlDep = "";
        var htmlDeps = "";
        var index = 0;
        var inputType = object.isRadio ? "radio" : "checkbox";
        var tabIndex = tabIndex>=0 ? tabIndex : 1;
        var pane = tabIndex==0 ? $("#"+id+"_div .search_tab_pane").eq(tabIndex).find("ul.result_list") : $("#"+id+"_div .search_tab_pane").eq(tabIndex).find("ul");
        if (object.hideTab != 2) {
            var depts=getCache("depts");
            object.depts = depts;
            for(var i in depts) {
                if(allSearch || utils._availableD(inputValue, object, i)) {
                    if(depts[i].pId == ""){ //如果是全公司,设置一下提交值为root
                       // htmlDeps += "<dd class=\"search_input_dd\" userId=\"root\">" + depts[i].name + "</dd>";
                    }else{
                        htmlDeps += "<dd class=\"search_input_dd\" userId=\""+depts[i]._id+"\">" + depts[i].name + "</dd>";
                    }

                }
                    if(depts[i].pId == ""){ //如果是全公司,设置一下提交值为root
                        // htmlDep += "<dd class=\"search_input_dd\" userId=\"root\">" + depts[i].name + "</dd>";
                    }else{
                        htmlDep += "<dd class=\"search_input_dd\" userId=\""+depts[i]._id+"\">" + depts[i].name + "</dd>";
                    }
            }
            if (htmlDep && $("#"+id+"_div .search_tab_pane").eq(2).find("ul").html()=="") {
                $("#"+id+"_div .search_tab_pane").eq(2).find("ul").html("<li><dl>"+htmlDep+"</dl></li>");
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
                        }
                    }
                }
                html += "<dd class=\"search_input_dd\" userId=\""+userId+"\">" + listContent + "</dd>";
            }
        }
        if(tabIndex==0){
            html += htmlDeps;
            if (inputValue) {
                pane.show().siblings("ul").hide();
            } else{
                pane.siblings("ul").show();
            }
        }else{
            var length = $("#"+id+"_div .search_tab_pane").eq(tabIndex).find(".search_input_dd").length;
            $("#"+id+"_div .search_tab_pane").eq(tabIndex).find(".code_total span").html(length);
        }

        if(html == "" && htmlDeps == "") {
            $("#"+id+"_div .result_list").hide();
        } else {
            $("#"+id+"_div").css("display", "block");
        }
        if (html){
            if (tabIndex!=2 || $("#"+id+"_div .search_tab_pane").eq(1).find("ul").html()=="") {
                pane.html("<li><dl>"+html+"</dl></li>");
            }
        }
        $("#"+id+"_div .search_input_dd").click(function (e) {
            // e.preventDefault();
            e.stopImmediatePropagation();
            var target = $(e.currentTarget);
            if (!target.hasClass("active")) {
                var userId = target.attr("userId");
                $("#"+id+"_div .search_tab_pane dd[userid="+userId+"]").addClass("active");//大集合选中
                var result_num = $("#"+id+"_div .search_tab_pane").eq(0).find("dd:visible").length;
                if (result_num==0) {
                    var commonTabHtml = object.commonTab ? "常<br>用" :"结<br>果";
                    $("#"+id+"_div .search_tab_pane").eq(0).find(".result_list").hide().siblings("ul").show();
                    $("#"+id+"_div .search_tab ol li").eq(0).html(commonTabHtml);
                }
                utils._countNo(id);
                if (object.isRadio) {
                    utils._setValueRadio(object, userId, target);
                } else{
                    utils._setValueCheckBox(object, userId, target);
                }
            }
        });

        var height = $("#"+id+"_input").innerHeight()+2;
        var width = $("#"+id+"_input").innerWidth();

        $("#"+id+"_div").css("left", 0);
        $("#"+id+"_div").width(270);

        return index;
    },
    _countNo: function(id){
        $("#"+id+"_div .search_tab_pane").each(function(i){
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
                    default: return i;
                }
            }
        });
    },
    _searchInput: function (id, object, allSearch) {
        var inputValue = $("#" + id + "_input").val();
        var html = "";
        var index = 0;
        for (var i in object.data) {
//            if(inputValue == '')
//                continue;
            if (allSearch || utils._available(inputValue, object, i)) {
                var stateHtml = "";
                if (object.showState) {
                    if (phone_data.monitor) {
                        if (object.data[i].callStatus == 'Idle'
                            && (object.data[i].extenType == 'Local' || ((object.data[i].extenType == 'sip' || object.data[i].extenType == 'gateway')
                            && object.data[i].register))
                            && !object.data[i].busy) {
                            stateHtml = "<div style=\"float:right;color:#009900\">空闲</div>";
                        }
                    }
                }
                var userId = eval("object.data['" + i + "']." + object.userIdField);
                var listContent = "";
                for (var j = 0; j < object.listField.length; j++) {
                    if (j > 0) {
                        var _v = eval("object.data['" + i + "']." + object.listField[j]);
                        if (_v) {
                            listContent += "[" + _v + "]";
                        }
                    } else {
                        listContent += eval("object.data['" + i + "']." + object.listField[j]);
                    }
                }

                if ((++index) % 2 == 0) {
                    html += "<li userId=\""+userId+"\" class=\"search_input_dd\" onmouseover=\"this.style.background='#649ced'\" onmouseout=\"this.style.background='';\" >" +
                        "<div style=\"float:left\">" + listContent + "</div>" + stateHtml + "</li>";
                } else {
                    html += "<li userId=\""+userId+"\" class=\"search_input_dd\" onmouseover=\"this.style.background='#649ced'\" onmouseout=\"this.style.background='';\">" +
                        "<div style=\"float:left\">" + listContent + "</div>" + stateHtml + "</li>";
                }
            }
        };

        if (html == "") {
            $("#" + id + "_div").css("display", "none");
        } else {
            $("#" + id + "_div").css("display", "block");
        }
        $("#" + id + "_ul").html(html);
        $(".search_input_dd").click(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var target = $(e.currentTarget);
            var userId = target.attr("userId");
            utils._setValue(object.id, userId, object);
        });
        $(".search_input_dd").on('mouseover',function(){
            $(this).children().css('color','#fff')
        }).on('mouseout',function(){
            $(this).children().css('color','#000')
        })
        var y = $("#" + id + "_input").offset().top;
        var x = $("#" + id + "_input").offset().left;
//        var height = $("#"+id+"_input").height()+8+2;
//        var width = $("#"+id+"_input").width()+12;

        var height = $("#" + id + "_input").innerHeight() + 2;
        var width = $("#" + id + "_input").innerWidth();
//        console.dir(y+"---"+x)
//        console.dir($("#"+id+"_input").innerWidth()+"---"+$("#"+id+"_input").innerHeight());
            $("#" + id + "_div").css("left", 0);
            $("#" + id + "_div").css("top", height);
        $("#" + id + "_div").width(width);

        return index;
    },

    _available: function (str, object, index) {
        var isAvailable = false;
        if (object.searchField == undefined
            || object.data == undefined) {
            return isAvailable;
        }
        var searchs = object.searchField;
        var pinyinFields = object.pinyinField;
        var data = object.data;
        var depts = object.depts;
        for (var i = 0; i < searchs.length; i++) {
            var pinyin = false;
            if (utils.contains(pinyinFields, searchs[i])) {
                pinyin = true;
            }
            var searchValue = eval("data[index]." + searchs[i]);
            if (pinyin && data[index].pinyin && (data[index].pinyin).match("^" + str)) {
                isAvailable = true;
                return isAvailable;
            }
            if (searchValue && searchValue.match("^" + str)) {
                isAvailable = true;
                return isAvailable;
            }
        }
        return isAvailable;
    },

    _availableD: function(str, object, index) {
        var isAvailable = false;
        if(object.searchField == undefined || object.depts == undefined) {
            return isAvailable;
        }
        var searchs = "name";
        var data = object.depts;
        if((data[index].name).match("^"+str)) {
            isAvailable = true;
        }
        return isAvailable;
    },

    _searchClick: function (object, index) {
        var obj = $("#" + object.id + "_ul li:eq(" + index + ")");
        var userId = obj.attr("userId");
        utils._setValue(object.id, userId, object);
    },

    _setValue: function (id, userId, object) {
        var user = utils._getObjectInfo(object, userId);
        if (object.showField && object.showField != "") {
            var field = object.showField;
            $("#" + id + "_input").val(eval("user." + field));
            $("#" + id + "_input").css("color", "#000");
        }
        $("#" + id + "_div").css("display", "none");
        var callback = object.callbackFuc;
        if (callback)
            eval("callback(user)");
    },

    _setValueRadio: function(object, userId, This) {
        var user = utils._getObjectInfo(object, userId);
        var id = object.id;
        if(object.showField && object.showField != "") {
            var field = object.showField;
            var name = eval("user." + field) ? eval("user." + field) : This.text();
            $("#"+id+"_input").val(name).css("color", "#000");
        }
        $("#"+id+"_div").css("display", "none").find(".search_input_dd").removeClass("active").end().find("[userid="+userId+"]").addClass("active");
        utils._resultArr(object,id);
    },

    _setValueCheckBox: function(object, userId, This) {
        var user = utils._getObjectInfo(object, userId);
        var id = object.id;
        if(object.showField && object.showField != "") {
            var field = object.showField;
            var name = eval("user." + field) ? eval("user." + field) : This.text();
            var sPane = "<span userId="+userId+"><b class='delete_result'>x</b>"+name+"</span>";
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

    _getObjectInfo: function (object, userId) {
        var dics = object.data || [];
        var item = {};
        if (object.arrayDataType || object.data.length == 0) {
            return object.data[userId];
        } else {
            if (object.cacheData) {
                item = getCache(object.cacheData, userId);
            } else {
                for (var i = 0; i < dics.length; i++) {
                    if (dics[i]._id == userId) {
                        item = DS.copy(dics[i]);
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


    sortTable: function (tableID, iCol, dataType, object) {
        var docFrag = document.createDocumentFragment();
        var sortArr = utils._getSortTRs(tableID, iCol, dataType, $(object).attr("state"));
        utils._change_sortState(tableID, object);
        for (var i = 0; i < sortArr.length; i++) {
            docFrag.appendChild(sortArr[i]);
        }
        var oTable = document.getElementById(tableID);
        oTable.tBodies[0].appendChild(docFrag);
    },

    _getSortTRs: function (tableID, iCol, dataType, state) {
        var trArr = new Array;
        var oTable = document.getElementById(tableID);
        var rows = oTable.tBodies[0].rows;
        var sortExcludeRow = [];
        for (var i = 0; i < rows.length; i++) {
            if ($(rows[i].cells[0]).attr('sort_exclude')) {
                sortExcludeRow.push(rows[i]);
            } else {
                trArr[trArr.length] = rows[i];
            }
        }
        trArr.sort(utils._compareTRs(iCol, dataType, state));
        if (sortExcludeRow.length > 0) {
            for (var j = 0, jLen = sortExcludeRow.length; j < jLen; j++) {
                trArr.push(sortExcludeRow[j]);
            }
        }
        return trArr;
    },

    _compareTRs: function (iCol, dataType, state) {
        return function compare(tr1, tr2) {
            var value1 = utils._convert(tr1.cells[iCol], dataType);
            var value2 = utils._convert(tr2.cells[iCol], dataType);
            if (state == "init" || state == "down") {
                return utils._asc(value1, value2);
            } else if (state == "up") {
                return utils._desc(value1, value2);
            }
        };
    },

    _convert: function (valueDoc, dataType) {
        var value;
        if (valueDoc.innerHTML.indexOf("</a>") > -1) {
            value = valueDoc.childNodes[0].innerHTML;
        } else {
            value = valueDoc.innerHTML;
        }

        switch (dataType) {
            case "int":
                return parseInt(value);
            case "float":
                return parseFloat(value);
            case "date":
                return new Date(Date.parse(value));
            case "intAndString":
            {
                return parseInt(value.substring(0, value.indexOf("(")));
            }
            default:
                return value.toString();
        }
    },

    _asc: function (x, y) {
        if (typeof x == "string") {
            while (x.indexOf(" ") != -1 || y.indexOf(" ") != -1) {
                x = x.replace(" ", "");
                y = y.replace(" ", "");
            }

            return x.localeCompare(y)
        } else {
            if (x > y) {
                return 1;
            } else if (x < y) {
                return -1;
            } else {
                return 0;
            }
        }
    },

    _desc: function (x, y) {
        if (typeof x == "string") {
            while (x.indexOf(" ") != -1 || y.indexOf(" ") != -1) {
                x = x.replace(" ", "");
                y = y.replace(" ", "");
            }
            return y.localeCompare(x)
        } else {
            if (x > y) {
                return -1;
            } else if (x < y) {
                return 1;
            } else {
                return 0;
            }
        }
    },

    _change_sortState: function (tableID, object) {
        $("#" + tableID + " .sort").removeClass("monitor_sort_up");
        $("#" + tableID + " .sort").removeClass("monitor_sort_down");
        $("#" + tableID + " .sort").addClass("monitor_sort");
        var state = $(object).attr("state");
        if (state == "init") {
            $(object).attr("state", "up");
            $(object).find("span").removeClass("monitor_sort");
            $(object).find("span").addClass("monitor_sort_up");
        } else if (state == "up") {
            $(object).attr("state", "down");
            $(object).find("span").removeClass("monitor_sort_up");
            $(object).find("span").addClass("monitor_sort_down");
        } else if (state == "down") {
            $(object).attr("state", "up");
            $(object).find("span").removeClass("monitor_sort_down");
            $(object).find("span").addClass("monitor_sort_up");
        }
    },
    logout: function () {
        var msgHtml =
            "<div style='float:right'>" +
            "<button type=\"button\" onclick='utils.closeBox();' class='close'>×</button>" +
            "</div>" +
            "<div style='overflow:hidden;margin-top:10px;padding-left:20px;'><div style='float:left;padding-left:5px;font-size:15px;padding-top:4px'>" +
            "<div>是否确认退出当前系统?</div>" +
            "<div style='font-size: 13px;'><input id='logout_check' type='checkbox' />&nbsp;退出后继续使用当前接听方式接听来电</div>" +
            "</div></div>" +
            "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div>" +
            "<div style='padding-left:265px;padding-top:20px;'>" +
            "<button class=\"btn btn-small btn-primary ds_do_action\" ds_action=\"logout\">确认</button>" +
            "<button class=\"btn btn-small \" onclick='utils.closeBox();' style='margin-left: 10px;'>取消</button>" +
            "</div>";
        utils.showBox(370, 120, msgHtml);
        var logoutCheck = DS.getCookie("logoutCheck");
        if (logoutCheck == 'true') {
            $('#logout_check').attr("checked", true);
        } else {
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
    setSearchInput: function (id, value) {

        $("#" + id + "_input").val(value);
        $("#" + id + "_input").css("color", "#000");
        $("#" + id + "_div").css("display", "none");
    },
    getStrLength: function (str) {
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
        var agents = getCache("agents");
        var _agents = [];
        if (isEnable) {
            for (var i = 0; i < agents.length; i++) {
                var u = agents[i];
                if (u.status == 'enable') {
                    _agents.push(u);
                }
            }
        } else {
            for (var i = 0; i < agents.length; i++) {
                var u = agents[i];
                _agents.push(u);
            }
        }
        var _agents2 = [];
        if (isEmpty) {
            var emptyAgents = [{_id: "empty", displayName: "无所属人", pinyin: "wusuoshuren", exten: '', status: 'enable'}];
            _agents2 = emptyAgents.concat(_agents);
        } else {
            _agents2 = _agents;
        }
        utils.loadSearchInput({
            id: containerId,
            width: option.width,
            height: option.height,
            tip: "按姓名、拼音、工号搜索",
            data: _agents2,
            searchField: ["displayName", "exten", "pinyin"],
            pinyinField: ["displayName"],
            listField: ["displayName", "exten"],
            userIdField: "_id",
            showField: "displayName",
            showAllList: true,
            editOwner:editOwner,
            callbackFuc: function (object) {
                $("#" + inputId).val(object._id);
            },
            onKeyChanged: function () {
                if ($("#" + containerId + "_input").val() != "") {
                    $("#" + inputId).val("serachInputNoresult");
                } else {
                    $("#" + inputId).val("");
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
    loadUsers: function (isEnable, isEmpty) {
        var agents = getCache("agents");
        var _agents = [];
        if (isEnable) {
            for (var i = 0; i < agents.length; i++) {
                var u = agents[i];
                if (u.status == 'enable') {
                    _agents.push(u);
                }
            }
        } else {
            for (var i = 0; i < agents.length; i++) {
                var u = agents[i];
                _agents.push(u);
            }
        }
        var _agents2 = [];
        if (isEmpty) {
            var emptyAgents = [{_id: "", displayName: "无所属人", pinyin: "wusuoshuren", exten: '', status: 'enable'}];
            _agents2 = emptyAgents.concat(_agents);
        } else {
            _agents2 = _agents;
        }
        return _agents2;
    },
    loadUsers2Chat: function (isEnable, isEmpty, currentId, hideMe) {
        var agents = getCache("agents");
        var _agents = [];
        if (isEnable) {
            for (var i = 0; i < agents.length; i++) {
                var u = agents[i];
                if (u.status == 'enable') {
                    _agents.push(u);
                }
            }
        } else {
            for (var i = 0; i < agents.length; i++) {
                var u = agents[i];
                _agents.push(u);
            }
        }
        if (hideMe) {
            for (var i = 0; i < _agents.length; i++) {
                var u = _agents[i];
                if (u._id == currentId) {
                    _agents.splice(i, 1);
                    break;
                }
            }
        }
        var _agents2 = [];
        if (isEmpty) {
            var emptyAgents = [{_id: "", displayName: "放入领取池", pinyin: "wusuoshuren", exten: '', status: 'enable'}];
            _agents2 = emptyAgents.concat(_agents);
        } else {
            _agents2 = _agents;
        }
        return _agents2;
    },
    loadAccessAgents2Chat: function (peerId) {
        var peer = getCache("accessChannelAgent", peerId);
        var agents = [];
        if (peer) {
            agents = peer.agents;
        }
        return agents;
    },
    getStrRealLength: function (str) {
        var realLength = 0, len = str.length, charCode = -1;
        for (var i = 0; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128) {
                realLength += 1;
            } else {
                realLength += 2;
            }
        }
        return realLength;
    },
    substringByRealLength: function (str, start, end) {
        var len = str.length, realLength = 0, charCode = -1;
        var result = "";
        for (var i = 0; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128) {
                realLength += 1;
            } else {
                realLength += 2;
            }
            if (realLength <= end && realLength >= start) {
                result += str.charAt(i);
            }
            if (realLength > end) {
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
    strTrimAll: function (str) {
        var result;
        result = str.replace(/(^\s+)|(\s+$)/g, "");
        result = result.replace(/\s/g, "");
        return result;
    },
    /**
     * 去掉字符串前后空格
     * @param str
     * @returns {string}
     */
    strTrim: function (str) {
        var result;
        result = str.replace(/(^\s+)|(\s+$)/g, "");
        return result;
    },
    /**
     * 取文件名后缀
     */
    getFileExt: function (str) {
        var d = /\.[^\.]+$/.exec(str);
        return d;
    },
    changeTab : function(src){
        var index = $(src).index();
        $(src).addClass("active").siblings().removeClass("active").closest(".search_tab").find(".search_tab_pane").eq(index).addClass("active").siblings().removeClass("active");
    },
    _deleteResult : function(object,id){
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
    },

    Base64: {
        // private property
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",


        encode: function (input) {
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
        decode: function (input) {
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


        _utf8_encode: function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if ((c > 127) && (c < 2048)) {
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

        _utf8_decode: function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                } else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    },
    deepClone: function (obj) {
        var o;
        if (typeof obj == "object") {
            if (obj === null) {
                o = null;
            } else {
                if (obj instanceof Array) {
                    o = [];
                    for (var i = 0, len = obj.length; i < len; i++) {
                        o.push(utils.deepClone(obj[i]));
                    }
                } else {
                    o = {};
                    for (var j in obj) {
                        o[j] = utils.deepClone(obj[j]);
                    }
                }
            }
        } else {
            o = obj;
        }
        return o;
    },
    showBox: function (width, height, msg) {
        var bodyWidth = document.body.offsetWidth;
        var bodyHeight = screen.height;
        if (!utils.showBoxbgDom) {
            utils.showBoxbgDom = document.createElement("div");
            utils.showBoxbgDom.setAttribute("id", "icc.utils.bgDiv");
            utils.showBoxbgDom.style.position = "absolute";
            utils.showBoxbgDom.style.top = "0";
            utils.showBoxbgDom.style.background = "#f2f2f2";
            utils.showBoxbgDom.style.filter = "progid:DXImageTransform.Microsoft.Alpha(style=3,opacity=25,finishOpacity=75";
            utils.showBoxbgDom.style.opacity = "0.6";
            utils.showBoxbgDom.style.left = "0";
            utils.showBoxbgDom.style.zIndex = "10000";
        }
        utils.showBoxbgDom.style.width = bodyWidth + "px";
        utils.showBoxbgDom.style.height = bodyWidth + "px";
        document.body.appendChild(utils.showBoxbgDom);

        if (!utils.showBoxMsgDom) {
            utils.showBoxMsgDom = document.createElement("div");
            utils.showBoxMsgDom.setAttribute("id", "icc.utils.msgDiv");
            utils.showBoxMsgDom.setAttribute("align", "center");
            utils.showBoxMsgDom.style.background = "white";
            utils.showBoxMsgDom.style.border = "1px solid #c6c6c6";
            utils.showBoxMsgDom.style.position = "absolute";
            utils.showBoxMsgDom.style.left = (bodyWidth - width) / 2 + "px";
            utils.showBoxMsgDom.style.top = 135 + document.documentElement.scrollTop + "px";
            utils.showBoxMsgDom.style.textAlign = "left";
            utils.showBoxMsgDom.style.lineHeight = "25px";
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
    matchingOperator :function(obj){
        var sub3 = obj.substr(0,3);
        var sub4 = obj.substr(0,4);
        var yd_smsChannel = ["134","135","136","137","138","139","150","151","152","157","158","159","182","183","184","187","178","188","147","1705"];
        var lt_smsChannel = ["130","131","132","145","155","156","176","185","186","1709"];
        var dx_smsChannel = ["133","153","177","180","181","189","1349","1700"];

        if (yd_smsChannel.indexOf(sub3) != -1 || yd_smsChannel.indexOf(sub4) != -1) {
            return "yd_smsChannel";
        } else if (dx_smsChannel.indexOf(sub3) != -1  || dx_smsChannel.indexOf(sub4) != -1 ) {
            return "dx_smsChannel";
        } else if (lt_smsChannel.indexOf(sub3) != -1  || lt_smsChannel.indexOf(sub4) != -1) {
            return "lt_smsChannel";
        } else {
            return "def_smsChannel";
        }
    }
}


