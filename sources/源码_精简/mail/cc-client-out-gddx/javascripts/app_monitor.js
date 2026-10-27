var session = {

};
var handler={};
var errMsg="服务异常";
function init(flag) {
    DS.init({
        ds_url: "./action",
        ds_handler: handler,
        ds_root_view_dir :"/views"
    });
    updateView(flag);
    resize();

    $(window).resize(function () {
        resize();
    });
    $("#login").live("click", function (e) {
        _login(e);
    });
    $("#logoff").live("click", function (e) {
        _logoff();
    });
    $(".jspScrollable").each(function () {
        _initScroll($(this));
    });

    $(document).on("click", ".item_row", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        selectItem(src);
    });
    $(document).on('click', '.remove_filter', function(event){
        event.preventDefault();
        var src = $(event.currentTarget);
        var pane = src.closest('.ds_search_pane');
        var inputs = pane.find(".ds_search_item");
        if (inputs) {
            for (var i = 0; i < inputs.length; i++) {
                var ele = $(inputs[i]);
                ele.val('');
                if(ele.hasClass('select_input')){
                    ele.next('div').find('input').val(null);
                }
            }

        }
        pane.find('.refresh').click();
    });
    $(document).on("click", ".active-history-content .active_action", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        var rel = src.attr("rel");
        var data = src.attr("data");
        handler.customer.showActiveHistory(rel, data, src.closest(".active-history-content"));
    });
    $(document).on("click", ".pagination li a", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        if (src.attr("app") == "enable") {
            var data = getDataOfForm($(src.attr('href')));
            var action = src.attr("ds_action");
            //console.dir(data)

            var actionHandler = eval('handler.' + action);
            if (actionHandler) {
                actionHandler(data.data, src);
            } else {
                console.log('action handler [' + action + '] is not support!');
            }
        }
    });
    $(document).on("change", ".upload", function(event) {
        var src = $(event.currentTarget);
        var xhr = new XMLHttpRequest();
        var frm=src.closest("form");
        if(window.FormData){
            var fd = new FormData();
            var file=event.currentTarget.files[0];
            if(!file)return false;
            var fType=file.type;
            var fSize=file.size;
            var fName=file.name;
            if(src.attr("fileType")){
                var types=src.attr("fileType").split("|");
                var suffix=fName.substring(fName.lastIndexOf(".")+1);
                if($.inArray(suffix,types)==-1){
                    alert("上传文件类型不匹配!");
                    return false;
                }
            }
            if(src.attr("fileSize")/*min unit is K*/){
                var maxSize=parseInt(src.attr("fileSize"))*1024;
                if(fSize>maxSize){
                    alert("上传文件超过了最大大小"+maxSize/1024+"K!");
                    return false;
                }
            }
            fd.append('upload', file);
            fd.append('type',frm.find('input[name=type]').val());
            fd.append('sessionId', session.id);
            if(src.attr('onloaded')){
                xhr.addEventListener("load", function(evt){
                    eval('handler.' + src.attr('onloaded')+'(evt)');
                }, false);
            }

            if(src.attr('onprogress')){
                xhr.addEventListener("progress", function(evt){
                    eval('handler.' + src.attr('onprogress')+'(evt)');
                }, false);
            }

            if(src.attr('onerror')){
                xhr.addEventListener("error", function(evt){
                    eval('handler.' + src.attr('onerror')+'(evt)');
                }, false);
            }

            if(src.attr('onabort')){
                xhr.addEventListener("abort", function(evt){
                    eval('handler.' + src.attr('onabort')+'(evt)');
                }, false);
            }
            xhr.open("POST", "./fileUpload");
            xhr.send(fd);
        }else{
            alert("您的浏览器不支持文件上传！");
        }
    });
};

function _login(e) {
    var login = DS.getDataOfForm($("#login-form"));
    var src = $(e.currentTarget);
    if(src.hasClass("disabled")){
        return;
    }
    if (login.succeed) {
        var action = {
            action: 'monitorLogin',
            data: login.data
        };
        src.addClass("disabled");
        DS.login(action,function (data) {
//            console.dir(data);
            if (data.success) {
                session.logined = true;
                session.accounts = data.sessions||[];
                _afterLogin();
                DS.setCookie("loginName", login.data.loginName, 30);
                if (login.data.remember) {
                    DS.setCookie("password", login.data.password, 30);
                    DS.setCookie("remember", true, 30);
                } else {
                    DS.setCookie("password", "", 30);
                    DS.setCookie("remember", false, 30);
                }
                src.removeClass("disabled");
            } else {
                src.removeClass("disabled");
                alert("邮箱或密码错误");
            }
        }, function () {
            src.removeClass("disabled");
            alert('服务异常');
        });
    }
}

function _afterLogin() {
    $("#login-panel").css("display", "none");
    $("#main-panel").css("display", "block");
//    $("#user_name").text(session.user.name);
    var accs=session.accounts;

    var tab=$("#monitor_tab");
    var tabContent=$("#monitor_tab_content");
    var html=[];
    var html2=[];
    for (var i = 0; i < accs.length; i++) {
        var row = accs[i];
        var url="./?sessionId="+row._id;
        var tmpl='<li><a href="#" class="ds_do_action" ds_action="loadAccount" ds_data="'+row._id+'"  data-toggle="tab">'+row.account.name+'</a></li>';
        var tmpl2='<div class="tab_frame" id="tab_content_'+row._id+'"><iframe scrolling="no" onload="autoHeight(this)" style="border:0;width:100%;" name="monitor_iframe_'+i+'" src="'+url+'"></iframe></div>';
        html.push(tmpl);
        html2.push(tmpl2);
    }
    tab.html(html.join(""));
    tabContent.html(html2.join(""));
    tab.find("li a:first").click();
}
handler.loadAccount=function(sid){
    $(".tab_frame").hide();
    $("#tab_content_"+sid).show();
}


function _logoff() {
    $("#login-panel").css("display", "block");
    $("#main-panel").css("display", "none");
    session = {
    };
}

function _initScroll(pane) {
    var self = pane;
    self.mouseenter(function () {
        self.data("mousein", true);
        resizeScroll(self);
    });
    self.mouseleave(function () {
        self.data("mousein", false);
        resizeScroll(self);
    });
    var container = self.children(".jspContainer");
    var pane = container.children(".jspPane");
    container.append("<div class=\"jspVerticalBar\"><div class=\"jspTrack\"><div " + "class=\"jspDrag\" style=\"top: 0px\"></div></div></div>");
    var verticalBar = container.children(".jspVerticalBar");
    var track = verticalBar.children(".jspTrack");
    var drag = track.children(".jspDrag");

    resizeScroll(self);

    self.bind("mousewheel", function (e) {
        if (verticalBar.data("show")) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var o = drag.position().top;
            var e = window.event, v = e.wheelDelta;
            if (v > 0) {
                scrollTo(o, -20);
            } else {
                scrollTo(o, 20);
            }
        }
    })
    drag.mouseenter(function () {
        drag.addClass("jspHover");
    });
    drag.data("drag", false);
    var originalPosition = 0;
    var startLocation = 0;
    drag.mouseout(function () {
        if (!drag.data("drag")) {
            drag.removeClass("jspHover");
        }

    });
    drag.mousedown(function (e) {
        drag.data("drag", true);
        e.preventDefault();
        drag.addClass("jspActive");
        startLocation = e.pageY - drag.position().top;
        originalPosition = drag.position().top;
    });
    $(document).mouseup(function () {
        drag.data("drag", false);
        drag.removeClass("jspActive");
    });

    $(document).mousemove(function (event) {
        var e = event;
        e.preventDefault();
        if (drag.data("drag")) {
            var n = e.pageY - drag.position().top;
            scrollTo(originalPosition, n - startLocation);
            originalPosition = drag.position().top;
        }
    });
    function scrollTo(orignal, mount) {
        var th = track.height();
        var dh = drag.height();
        var ph = pane.height();
        var bottom = th - dh;
        var bb = 0;
        var aa = orignal + mount;
        if (aa <= 0) {
            aa = 0;
            bb = 0;
        } else if (aa >= bottom) {
            aa = bottom;
            bb = -ph + th;
        } else {
            bb = -aa * ph / th;
        }
        drag.css("top", aa + "px");
        pane.css("top", bb + "px");
    }
}

function resize() {
    $(".left_col").css("height", $(window).height() - 41);
    $(".left_col .left_menu_detail").css("height", $(window).height() - 225);

    $(".right_col").css("width",$(window).width() - 160);
    $(".right_col .left_column").css("height", $(window).height() - 41);
    $(".right_col .list_container").css("height", $(window).height() - 87);
    //$(".right_content .right_column").css("height", $(window).height() - 41);
    $(".right_content .right_column .contact_detail .content").css("height", $(window).height() - 77);
    $(".right_content .right_container").css("height", $(window).height() - 41);

    resizeScroll($(".left_nav"));
}


function updateView(flag) {
    var url='login_cc';
    DS.getView(url, function (data) {
        $("#login-panel").empty();
        $("#login-panel").html(data);
        var email = DS.getCookie("loginName");
        var password = DS.getCookie("password");
        var remember = DS.getCookie("remember");
        if (email) {
            $("#login_loginName").val(email);
        }
        if (password) {
            $("#login_password").val(password);
        }
        if (remember) {
            $("#login_remember").attr("checked", remember);
        }
    });
}

function resizeScroll(a) {
    var self = a;
    var container = self.children(".jspContainer");
    container.css("height", self.height());
    var pane = container.children(".jspPane");
    var verticalBar = container.children(".jspVerticalBar");
    var track = verticalBar.children(".jspTrack");
    var drag = track.children(".jspDrag");

    if (container.height() >= pane.height()) {
        verticalBar.css("visibility", "hidden");
        verticalBar.data("show", false);
        drag.css("top", "0px");
        pane.css("top", "0px");
        return;
    } else {
        track.css("height", container.height());
        var trackHeight = track.height();
        var paneHeight = pane.height();
        var dragHeight = trackHeight * trackHeight / paneHeight;
        drag.css("height", dragHeight);
        verticalBar.data("show", true);
        if (self.data("mousein")) {
            verticalBar.css("visibility", "visible");
        } else {
            verticalBar.css("visibility", "hidden");
        }
    }
}

function replaceDataByObject(obj,html){
    obj = obj || {};
    for(var key in obj){
        var prefix = key.substr(0,1) == '_' ?'_':'__';
        var reg = new RegExp(prefix+key,'g');
        html = html.replace(reg,obj[key]);
    }
    return html;
}

function renderSearchResult(pane, index, pageSize, query, queryDisplay, response) {
    var listPane = pane.find('.list-inside');
    var moreDiv = pane.find(".ds_more");
    var contacts = response.list;
    if(index == 1) {
        listPane.empty();
    }
    pane.attr('ds_index', index);
    var currentCount = 0;
    if (!contacts || contacts.length==0) {
        if(index == 1)
            listPane.append("<div class='contacts_not_found'><strong>没有数据</strong></div>");
        moreDiv.css("display","none");
    } else {
        currentCount = (index-1) * pageSize + contacts.length;
        if(currentCount < response.count){
            moreDiv.css("display","block");
        }else{
            moreDiv.css("display","none");
        }
    }
    var filterPane = pane.find('.ds_search_filter');
    filterPane.empty();
    filterPane.attr({'queryTotal':response.count});
    if(!$.isEmptyObject(query) && queryDisplay != '') {
        var text = '<div><span>查询条件：'
            +'<span class="strong filtered_by" title="'+queryDisplay+'">'+queryDisplay+'</span>'
            +'<a href="#" class="remove_filter">x</a></span>'
            +'<span class="show-contacts" style="float: right;">'
            +currentCount+'/'+response.count+'条结果'
            +'</span></div>';
        filterPane.html(text);
    }
}
function downloadFile(fileUrl,unSession){
    var url = fileUrl;
    if(!unSession){
        url = fileUrl + "&sessionId="+session.id;
    }
    var id = "downloadFile_Frame";
    if($("#"+id).length > 0){
        $("#"+id).remove();
    }
    var frame=$("<iframe id="+id+" style='display:none;' src='"+url +"' </iframe>");
    $('body').append(frame);
}


function getDateNo() {
    var date=new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var str=year +''+ (month > 9 ? month : "0" + month) +''+ (day > 9 ? day : "0" + day);
    var h=date.getHours(),m=date.getMinutes(),s=date.getSeconds();
    str+=(h>9?h:"0"+h)+''+(m>9?m:"0"+m)+''+(s>9?s:"0"+s);
    return str;
}
function dateParse(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var str=year + "-" + (month > 9 ? month : "0" + month) + "-" + (day > 9 ? day : "0" + day);
    return str;
}
function timeParse(date){
    var h=date.getHours(),m=date.getMinutes(),s=date.getSeconds();
    var str=(h>9?h:"0"+h)+":"+(m>9?m:"0"+m);
    return str;
}
function dateCompute(num){
    var date=new Date();
    date.setDate(date.getDate()+num);
    return dateParse(date);
}
function timeCompute(num){
    var date=new Date();
    date.setMinutes(date.getMinutes()+num);
    return timeParse(date);
}
function parseHref(url){
    var reg=/\?(\S*)/;
    var arr=reg.exec(url);
    if(!arr||arr.length==0) return {};
    var p1=arr[1].split('&');
    var p=[];
    $(p1).each(function(){
        var t=this.split('=');
        p[t[0]]=t[1];
    });
    return p;
}
function replaceUrl(str) {
    try {
        //	var reg=new RegExp("(http[s]{0,1}):\/\/([\w-]+\.)+[\w-]+([\u4e00-\u9fa5\w-./?%&=]*)?","ig");
        var reg = /(http[s]{0,1}):\/\/([\w-]+\.)+[\w-]+([\u4e00-\u9fa5\w-./?%&=]*)?/ig;
        //var urls=str.match(reg);
        var result = null;
        var urls = [];
        var nstr = str;
        while ((result = reg.exec(str)) != null) {
            urls.push(result[0]);
        }
        for (var i = 0; i < urls.length; i++) {
            var html = "<a href='" + urls[i] + "' target='_balnk'>" + urls[i] + "</a>";
            nstr = nstr.replace(urls[i], html);
        }
        return nstr;
    } catch (e) {
        return str;
    }
}
function formatTime(seconds) {
    var result = '00:00:00';
    if (seconds > 0) {
        var hour = Math.floor(seconds / 3600);
        var minute = Math.floor((seconds % 3600) / 60);
        var second = Math.floor(seconds % 60);
        if (hour < 10) {
            hour = "0" + hour;
        }
        if (minute < 10) {
            minute = "0" + minute;
        }
        if (second < 10) {
            second = "0" + second;
        }
        result = hour + ":" + minute + ":" + second;
    }
    return result;
}
$(window).on('beforeunload',function(e) {
    if(session.logined)
        return '警告：请使用系统的退出按钮正常退出系统!';
});
function mailTo(mail){
    var agent=navigator.userAgent.toLowerCase();
    var rMsie = /(msie\s|trident.*rv:)([\w.]+)/;
    var match = rMsie.exec(agent);
    if (!match && mail) {
        $("#ds_iframe").attr("src","mailto:"+mail);
    }
    return;
}

function getDataOfForm(form) {
    var succeed = true;
    var data = {};
    var inputs = form.find("input,textarea,select");
    if (inputs) {
        for (var i = 0; i < inputs.length; i++) {
            var ele = $(inputs[i]);
            var name = ele.attr("name");
            var value = $.trim(ele.val());
            if (ele[0].type == 'checkbox') {
                var isGroup = ele.attr("fieldgroup");
                if (isGroup) {
                    if (!ele[0].checked) {
                        continue;
                    }
                } else {
                    value = ele[0].checked;
                }
            } else if (ele[0].type == 'radio') {
                if (ele[0].checked)
                    data[name] = value; else continue;
            }
            if (!name)
                continue;

//            if (ele.attr("required") && !value) {
//                succeed = false;
//                console.dir(ele);
//                var label = ele.prev("label");
//                if (label) {
//                    alert("[" + label.text() + "]需要填写");
//                }
//                ele.focus();
//                break;
//            }


            if (name.match(/\w\[\]/g)) {
                name = name.substring(0, name.length - 2);
                if (!data[name]) {
                    data[name] = new Array();
                }
                data[name].push(value);
            } else if ((ele[0].tagName).toLowerCase() == "select" && ele[0].name == 'role') {
                data[name] = new Array();
                var options = ele[0].options;
                for (var j = 0, len = options.length; j < len; j++) {
                    data[name].push(options[j].value);
                }
            } else {
                data[name] = value;
            }
        }
    }
    return {
        succeed: succeed,
        data: data
    };
}


function copy(obj) {
    obj = obj || {};
    var result = {};
    for (var key in obj) {
        result[key] = obj[key];
    }
    return result;
}

function autoHeight(iframe){
    if(!iframe) return;
//    var height = $(this).contents().find("body").height() + 10;
//    $(iframe).height( height < 550 ? 550 : height );
    $(iframe).height( $(window).height()-50);
//    try{
//        console.log($(iframe.contentWindow.document).height())
//        var bHeight = iframe.contentWindow.document.body.scrollHeight;
//        var dHeight = iframe.contentWindow.document.documentElement.scrollHeight;
//        console.dir(bHeight+"     "+dHeight);
//        var height = Math.max(bHeight, dHeight);
//        var vh=$(window).height();
//        console.dir(vh+"     "+height);
//
//        if(height>vh){height+=150;}
//        iframe.height = height;
//    }catch(e){}
}