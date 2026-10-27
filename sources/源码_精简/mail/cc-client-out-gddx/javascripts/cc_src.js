var session = {
    currentPage: {},
    myQueue:[]
};
var errMsg="服务异常";
var proviceCityDicKey="d7b9c68a-b50f-21d1-d5fd-41ea93f5f49c";
//var qiniu7moorDomain='http://7xj0za.com1.z0.glb.clouddn.com/';
var qiniu7moorDomain='http://fs-test.7moor.com/';
//var pushServerUrl="http://115.29.190.253:5006";
var pushServerUrl="http://14.29.4.226";
//var pushServerUrl="http://127.0.0.1:5004";
function init(flag) {
    template.config("openTag","{{");
    template.config("closeTag","}}");
    DS.init({
        ds_url: "./action",
        ds_handler: handler,
        ds_root_view_dir :"/views",
        ds_report_url:"./report"
    });
    updateView(flag);
    resize();

    $(window).resize(function () {
        resize();
    });
    $("#login").live("click", function (e) {
        _login(e);
    });
    $("#proving").live("click", function (e) {
        var authCode = $("input[name='authCodeshow']").val();
        $("input[name='authCode']").val(authCode);
        $("#login").click();
    });
    //$("#btn-proving").live("click",function(){
    //    var pane = $("#show_proving");
    //    pane.empty();
    //    pane.html($("#login_authCode").html());
    //    pane.modal();
    //});
    $("#logoff").live("click", function (e) {
        _logoff();
    });
    $("#bind_phone").live("click",function(e){
        var src = $(e.currentTarget);
        var phoneNum=src.siblings("input[type='text']").val();
        var reg =/^1[3578][0-9]{9}$/;
        if(!phoneNum){
            $().alertmessage('showError', "手机号码不能为空！");
            return;
        }else if(!reg.test(phoneNum) || phoneNum.length != 11){
            $().alertmessage('showError', "请填写正确的手机号码！");
            return;
        }

        var action={
            action:"login",
            data:{
                "mobile":phoneNum,
                "_id" : $("#bind_phone_sessionId").val(),
                "logType" : "bind"
            }
        }
        DS.login(action,function(response){
            if(response.success){
                $().alertmessage('showSuccess', "绑定成功！");
                $("#login_phone_modal").modal("hide");
                $("#login").click();
            }
        })
    });
    $(".jspScrollable").each(function () {
        _initScroll($(this));
    });
    $('body').on("keypress",'input[type="text"]',function (e) {
        var key = e.which;
        if (key == 13) {
            e.preventDefault();
        }
    });
    _initClickHandler();
    //禁止后退键 作用于Firefox、Opera
    document.onkeypress = forbidBackSpace;
    //禁止后退键  作用于IE、Chrome
    document.onkeydown = forbidBackSpace;
    checkLoginStatus();
    checkBrowserVersion();
    initNewFeaturePopup();
};
function initNewFeaturePopup(){
    var _bottom=115;
    var pane=$("#msg_tips_source_pane");
    var tmpl=$("#new_feature_tips_popup").html();
    pane.prepend(tmpl);
    pane.find(".msg_tips:first").animate({bottom:_bottom+'px'},'slow');
    $("#new_feature_tips_popup").animate({bottom:'10px'},'slow');//新iframe的通知动画
}
function forbidBackSpace(e) {
    var ev = e || window.event; //获取event对象
    var obj = ev.target || ev.srcElement; //获取事件源
    var t = obj.type || obj.getAttribute('type'); //获取事件源类型
    var ed = obj.getAttribute('contenteditable');//获取可编辑属性对象
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
    var flag2 = ev.keyCode == 8 && t != "password" && t != "text" && t != "textarea" && !ed;
    //判断
    if (flag2 || flag1) return false;
}
function checkBrowserVersion(){
    var userAgent = navigator.userAgent;
//    console.dir(userAgent);
    var ua = userAgent.toLowerCase();
    if(ua.indexOf("chrome")==-1){
        $("#browser").show();
    }
}
function hideBrowser(){
    $('#browser').hide();
}
//关闭短信人工审核提示160115
function closeSmsWarn(){
    $(".modal-backdrop,#sms_warn").remove();
    $(".topshow").removeClass("topshow");
}
function _initClickHandler(){
    $(document).on("keyup", "input[name='f92338b0-3a2a-11e4-882e-2b73f5aae9c3']", function (event) {//to guohong
        var src = $(event.currentTarget);
        var val= $.trim(src.val());
        var provinceId="a6643c80-3a27-11e4-a79d-279da954f07c";
        var cityId="a6643c80-3a27-11e4-a79d-279da954f07c_1";
        if(val && val.length==11){
            var p1=src.closest(".span6.col").nextAll().find("select[name='"+provinceId+"']");
            var p2=src.closest(".span6.col").nextAll().find("select[name='"+cityId+"']");
            var action = {
                action: "app.popup.locactionCallNoArea",
                data: {tel:val.substring(0,7)}
            };
            DS.send(action,function(rep){
                if(rep.success){
                    var row=rep.row;
                    if(row){
                        var province=row.province;
                        var city=row.city;
                        if(p1){
                            p1.find('option').each(function (i) {
                                if ($(this).text().indexOf(province) !=-1) {
                                    this.selected = true;
                                    return;
                                } else {
                                    this.selected = false;
                                }
                            })
                            p1.change();
                        }
                        if(p2){
                            p2.find('option').each(function (i) {
                                if ($(this).text().indexOf(city) !=-1) {
                                    this.selected = true;
                                    return;
                                } else {
                                    this.selected = false;
                                }
                            })
                        }
                    }else{
                        if(p1){
                            p1.val("");
                            p1.change();
                        }
                    }
                }else{
                    $().alertmessage('showError', "定位省市异常！");
                }
            });
        }
    });

    $(document).on("blur", ".channel_focus_action", function(event){
        event.stopPropagation();
        var src = $(event.currentTarget);
        var blur_action = src.attr("blur_action");
        var data = src.attr('ds_data');
        var actionHandler = eval('DS._ds_handler.' + blur_action);
        if (actionHandler) {
            actionHandler(data, src);
        } else {
            console.log('action handler [' + blur_action + '] is not support!');
        }
    });
    $(document).on("click", ".channelDic-plus", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        var pane=src.closest(".diction-subject");
        var item=src.closest(".dic_item");
        var prevDics=item.prevAll(".dic_item");
        var lastLevel=src.data("level")||"";
        var level=lastLevel;
        if(!level){
            level=prevDics.length+"";
        }else{
            level=level+"_"+prevDics.length;
        }
        var tmplObj=$("#tmpl_channel_dic_set");
        var tmpl=tmplObj.html()||'';
        tmpl=DS.renderMethodViewNew(tmpl,{level:level,lastLevel:lastLevel,key:"",name:""});
        src.hide();
        pane.find(".channel_dic_list").append(tmpl);
        pane.find(".channel_dic_input_text").focus();
    });

    $(document).on("click", ".dic_item_desc", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        var container=src.closest(".dic_content");
        var item=src.closest(".dic_item");
        var itemParent=src.closest(".diction-subject");
        var prevDics=item.prevAll(".dic_item");
        var nextSection=itemParent.nextAll(".diction-subject");
        nextSection.each(function(){
            $(this).find(".channel_dic_list").empty();
            $(this).find(".btn-add").hide();
        });
        var level=src.attr("level");
        if(!level){
            level=prevDics.length+"";
        }else{
            level=level+"_"+prevDics.length;
        }
        console.info("level====="+level);
        var l=level.split("_");
        var len= l.length;
        var pane=container.find(".dic_level_"+ (len+1));
        if(pane.length==0){
            return;
        }

        var dicItem=handler.config.channelDic.getCaseCadeItem("webchat",level);
        console.dir(dicItem);
        if(dicItem){
            var _dics=dicItem.options||[];
            for (var i = 0; i < _dics.length; i++) {
                var obj = _dics[i];
                obj.lastLevel=level;
                var tmplObj=$("#tmpl_channel_dic_show");
                var tmpl=tmplObj.html()||'';
                tmpl=DS.renderViewNew(tmpl,obj);
                pane.find(".channel_dic_list").append(tmpl);
            }
        }
        item.siblings(".dic_item").removeClass("dic_item_select");
        item.addClass("dic_item_select");
        pane.find(".channelDic-plus").show();
        pane.find(".channelDic-plus").data("level",level);//上级的索引
    });
    $(document).on("click", ".dic_item_desc_session", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        var container=src.closest(".dic_content");
        var item=src.closest(".dic_item");
        var itemParent=src.closest(".diction-subject");
        var prevDics=item.prevAll(".dic_item");
        var nextSection=itemParent.nextAll(".diction-subject");
        nextSection.each(function(){
            $(this).find(".channel_dic_list").empty();
        });
        var level=src.attr("level");
        if(!level){
            level=prevDics.length+"";
        }else{
            level=level+"_"+prevDics.length;
        }
        console.info("level====="+level);
        var l=level.split("_");
        var len= l.length;
        var pane=container.find(".dic_level_"+ (len+1));
        var dicItem=handler.config.channelDic.getCaseCadeItem("webchat",level);
        console.dir(dicItem);
        if(dicItem){
            var _dics=dicItem.options||[];
            for (var i = 0; i < _dics.length; i++) {
                var obj = _dics[i];
                obj.lastLevel=level;
                var tmplObj=$("#channel_dic_show");
                var tmpl=tmplObj.html()||'';
                tmpl=DS.renderViewNew(tmpl,obj);
                pane.find(".channel_dic_list").append(tmpl);
                if(obj["options"]!==null && typeof obj["options"]!== "undefined"&&obj["options"].length!==0){
                    pane.find(".channel_dic_list").find(".dic_item").eq(i).find("b").addClass("has_sub_style");
                }
            }
        }
        if(!src.find("b").hasClass("has_sub_style")){
            item.addClass("session_confirm_color");
            var value=src.parent().parent().find("input").val();
            var closeReason=src.parent().parent().find("input").attr("ds_data");
            $("#session_name").val(value);
            $("#session_name").attr("ds_data",closeReason);
            $("#endsession .btn-container button").attr("ds_data",value);
        }else{
            item.addClass("session_per_confirm_color");
            $("#endsession .btn-container button").attr("ds_data","");
        }
        item.siblings(".dic_item").removeClass("session_per_confirm_color session_confirm_color");
    });


    $(document).on("click", ".loginIp-plus", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        var tmplObj=$("#tmpl_login_check_ip");
        var tmpl=tmplObj.html()||'';
        tmpl=tmpl.replace(/_#.*#_/g,'');
        src.closest(".login_check_ip").append(tmpl);
    });
    $(document).on("click", ".loginIp-reduce", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        src.closest("div").remove();
    });

    $(document).on("click", ".task-plus", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        var tmplObj=$("#tmpl_task_timeArea");
        var tmpl=tmplObj.html()||'';
//        tmpl=tmpl.replace(/_#.*#_/g,'');
        src.closest(".controls").append(tmpl);
    });
    $(document).on("click", ".task-reduce", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        src.closest("div").remove();
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

        pane.find(".search_input_dd").removeClass("active");

        //handler.resetForm(true,pane);
        
        var inputs = pane.find(".ds_search_item");
        if (inputs) {
            for (var i = 0; i < inputs.length; i++) {
                var ele = $(inputs[i]);
                if(!ele.hasClass("ds_no_reset")){
                    ele.val('');
                }
                if(ele.hasClass('select_input')){
                    ele.next('div').find('input').val(null);
                }
            }
        }
        pane.find('.refresh').click();
    });
    $(document).on('click', '.remove_filter2', function(event){
        event.preventDefault();
        var src = $(event.currentTarget);
        var pane = src.closest('.left_column');
        if(pane.length==0){
            pane=src.closest(".config_left");
        }

        //handler.resetForm(true,pane);
        pane.find(".search_input_dd").removeClass("active");
        var frm=pane.find("form.ds_search_form");
        frm.get(0).reset();
        if(frm.find(".select_input").length>0){
            frm.find(".select_input").val("");
        }

        pane.find(".business_type").change();
        pane.find(".search_condition").html("");
        pane.find(".quick_search").val("");
        pane.find(".ds_search_filter").html("").hide();
        pane.find('.refresh').click();
    });
    $(document).on('click', '.remove_filter3', function(event){
        event.preventDefault();
        var src = $(event.currentTarget);
        var pane = src.closest('.list_check_pane');

        pane.find(".search_input_dd").removeClass("active");
        var frm=pane.find("form.ds_search_form");
        frm.get(0).reset();
        if(frm.find(".select_input").length>0){
            frm.find(".select_input").val("");
        }
        //handler.resetForm(false,pane);

        pane.find(".business_type").change();
        pane.find(".search_condition").html("");
        pane.find(".ds_search_filter").html("").hide();
        pane.find(".quickSearchCdrStauts_current").html('全部');
        pane.find('.refresh').click();
    });
    $(document).on("click", ".active-history-content .active_action", function (event) {
        event.preventDefault();
        var src = $(event.currentTarget);
        var rel = src.attr("rel");
        var data = src.attr("data");
        var busId = src.attr("busId");
        handler.customer.showActiveHistory(rel, data, src.closest(".active-history-content"),busId);
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
            var module="";
            var moduleInput=frm.find('input[name=module]');
            if(moduleInput.length>0){
                module=frm.find('input[name=module]').val()||"";
            }
            fd.append('module',module);
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
    $(document).on("click", ".datetimepicker-remove", function (event) {
        var src = $(event.currentTarget);
        src.siblings("input").val('');
    });
    $(document).on("click", ".datetimepicker-open", function (event) {
        var src = $(event.currentTarget);
        src.siblings("input").trigger("focus");
    });
     $(document).on("change", ".cust_province_casecade", function (event) {
        var src = $(event.currentTarget);
        var pane=src.closest("fieldset");
        var key=[src.val()];
        var html=generateCCOptions(proviceCityDicKey,key);
        if (key=="") {
            html = '<option value="">--请选择--</option>';
        }
        pane.find("select[name='city']").html(html);
    });
    $(document).on("focus", ".webchat_container textarea", function(event){
        var src = $(event.currentTarget);
        var pane=src.closest(".webchat_container");
        pane.find(".face_con").css("display", "none");
        pane.find(".face_arrow").css("display", "none");
    });

};

function _login(e) {
    var loginModel=$("#login_phone_modal");
    var login = DS.getDataOfForm($("#login-form"));
    var src = $(e.currentTarget);
    if(src.hasClass("disabled")){
        return;
    }
    var loginName=login.data.loginName;
    var password=login.data.password;
    var lastCodeKey=login.data.lastCodeKey;
    var authCode=login.data.authCode;
    if(!$.trim(loginName)){
        $().alertmessage('showError', "请输入账户登录名");
        return;
    }
    if(!$.trim(password)){
        $().alertmessage('showError', "请输入密码");
        return;
    }
    if($.trim(lastCodeKey) && !$.trim(authCode)){
        $().alertmessage('showError', "请输入验证码");
        return;
    }
    login.data.loginName=$.trim(loginName);
    login.data.password=$.trim(password);
    login.data.authCode=$.trim(authCode);

    if (login.succeed) {
        var action = {
            action: 'login',
            data: login.data
        };
        src.addClass("disabled");
        DS.login(action,function (data) {
//            console.dir(data);
            if (data.success) {
                if(data.logType && data.logType == "bind"){
                    src.removeClass("disabled");
                    loginModel.modal();
                    loginModel.find("input").focus();
                    loginModel.css("top",($(window).height+78)/2);
                    $("#bind_phone_sessionId").val(data.sessionId);
                    return;
                }
                if(data.lastCodeKey && !data.sessionId){
                    var frm=src.closest("#login-panel");
                    frm.find("input[name='lastCodeKey']").val(data.lastCodeKey);
                    var pane = $(".show_proving");
                    pane.show();
                    src.removeClass("disabled");
                    $().alertmessage('showSuccess', data.message,{stayTime:10000});
                    return;
                }
                session.id = data.sessionId;
                if (data.user) {
                    session.user = data.user;
                    session.account = data.account;
                    session.logined = true;
                    session.extenType = login.data.extenType;
                    _afterLogin();
                    //console.dir(session.user);
                    DS.setCookie("loginName", login.data.loginName, 30);
                    DS.setCookie("session", session.user._id, 1);
                    DS.setCookie("extenType", session.extenType, 30);
                    DS.setCookie("rememberBusyType", $("#login_busyType_switch").attr("checked") == 'checked', 30);
                    if (login.data.remember) {
                        DS.setCookie("password", session.user.password, 30);
                        DS.setCookie("remember", true, 30);
                    } else {
                        DS.setCookie("password", "", 30);
                        DS.setCookie("remember", false, 30);
                    }
                }
                src.removeClass("disabled");
                $("#new_feature_tips_popup").remove();
            } else {
                src.removeClass("disabled");
                $().alertmessage('showError', data.message||"登录名或密码错误",{stayTime:10000});
            }
        }, function () {
            src.removeClass("disabled");
            $().alertmessage('showError', errMsg);
        });
    }
}

function checkLoginStatus() {
    var href = location.href;
    if (href.indexOf('?') !== -1) {
        var param = href.split('?')[1];
        var requestParams = param.split("&");
        for (var i = 0; i < requestParams.length; i++) {
            param = requestParams[i];
            var params = param.split('=');
            if (params.length == 2 && params[0] == 'sessionId') {
                session.id = params[1];
                if (session.id.slice(-1) == '#') {
                    session.id = session.id.replace(/#/, "");
                }
                _loginBySession();
                break;
            }
        }
    }
};

function _loginBySession() {
    var action = {
        action: 'login',
        data: {sessionId: session.id}
    }
    DS.util.sendCommand(action, function (data) {
        if (data.success) {
            session.id = data.sessionId;
            if (data.user) {
                session.user = data.user;
                session.account = data.account;
                _afterLogin();
            } else {
                alert('登录发生异常');
            }
        } else {
            alert('服务异常');
        }
    });
};
function retryMail2Authcode(src) {
    var frm=$(src).closest("form");
    var lastCodeKey=frm.find("input[name='lastCodeKey']").val();
    var action = {
        action: 'config.accountConfig.retryMail2Authcode',
        data: {lastCodeKey: lastCodeKey}
    }
    DS.util.sendCommand(action, function (rep) {
        if (rep.success) {
            $().alertmessage('showSuccess', "验证码已经发到您的邮箱,请查收");
        } else {
            $().alertmessage('showSuccess',  rep.message||errMsg);
        }
    });
};
function _afterLogin() {
    $("#login-panel").css("display", "none");
    $("#main-panel").css("display", "block");
    $(".main_container").css("background", "#fff");
    $("#user_exten").text(session.user.exten);
    $("#user_name").text(session.user.displayName);
    if(!session.extenType){
        session.extenType=session.user.extenType;
    }
    var exten_type = session.extenType;
    if(session.account.proxyType != "channel"){//是否是渠道隐藏7moor关键字
        $("#oem_7moor").remove();
    }
    if(exten_type == 'sip'){
        exten_type = '软电话';
    } else if(exten_type == 'gateway') {
        exten_type = 'SIP话机';
    } else {
        if(session.user.mobile){
            exten_type = session.user.mobile;
        }
    }
    $("#user_status").tooltip({title:'网络延迟-1代表未连接.<br>超过200ms可能出现通话质量问题.',placement:'bottom',html:true});

    $("#user_exten_type").text(exten_type);

    _getDicCache();
    $('#batch_modal').on('hide', function (e) {
         if($('#batch_modal').find(".allTask").length===0&&$('#batch_modal').find(".subStep").length===0){
            $('#batch_modal').find(".modal-body").empty();
        }
//            $("#cdr_listen_audio").get(0).pause();
    });
    $('#callRecord_detail_modal').on('hide', function (e) {
        var src = $(event.currentTarget);
        src.empty();
    });

    openNotify();

    Highcharts.setOptions({
        lang: {
            noData:"无数据显示"
        }
    });
}

/**
 * 初始化软电话条
 * @private
 */
function _initPhone() {
    var account = session.account;
    var loginName = session.user.loginName + "@" + account.name;
    var password = session.user.password;
    var extenType = "gateway";
    var busyType = $('#login_busyType_switch').attr('checked')=='checked'?'0':'1';
    if(session.extenType)
        extenType = session.extenType;
    var pbxid = session.user.pbx;
    var curpbx;
    var pbxs=getCache("pbx");
    for(var i = 0; i < pbxs.length; i++) {
        if(pbxs[i]._id == pbxid) {
            curpbx =pbxs[i];
            phone_pbxs[pbxs[i]._id] = pbxs[i];
            break;
        }
    }
    var config = {
        monitor : true,
        proxy_url : curpbx.assAddr,
        extenType : extenType,
        password : password,
        user : loginName,
        busyType : busyType,
        pbxNick: curpbx.name,
        curPbx: curpbx._id,
        pbx_in_ip: curpbx._id,
        accountId: account.account,
        exten: session.user.exten
    };
    if((session.user.idAmin && session.user.isAdmin == true) || (session.user.type && session.user.type == 'manager')) {
        config.monitor = true;
    } else {
        config.monitor = false;
    }

    cti_register(config);

    //多渠道的状态获取
    if(session.user.channelMail===false){
        $(".yj_state_enable").hide();
        $(".yj_state_disable").show();
    }else{
        $(".yj_state_enable").show();
        $(".yj_state_disable").hide();
    }
    if(session.user.channelWx===false){
        $(".wx_state_enable").hide();
        $(".wx_state_disable").show();
    }else{
        $(".wx_state_enable").show();
        $(".wx_state_disable").hide();
    }
}
function _initOnlineChannelAgent() {
    getCache("onlineChannelAgent");
}
function _getDicCache() {
    var action = {
        action: 'common.getDicCache'
    };
    DS.send(action, function (response) {
        if (response.success) {
            session.dicMap = response.dicMap;
            //_initOnlineChannelAgent();
            _getMenu();
            _initPhone();
            init2();
            initImIcon();
            initDept();
            getCache("callLabel")//获取通话标签
            if(handler.push)
                handler.push.init();
        }
    });
}
function getCache(type, id ,loadFromServer) {
    if(!type){
        return [];
    }
    var cache = [];
    if (session.dicMap[type] && !loadFromServer) {
        cache = session.dicMap[type];
        if (id) {
            for (var i = 0; i < cache.length; i++) {
                if (cache[i]._id == id) {
                    return DS.copy(cache[i]);
                }
            }
            return null;
        }
        return cache;
    } else {
        var action = {
            action: 'common.getDicCache',
            data :{type:type}
        };
        DS.send(action,function(rep){
            if(rep.success){
                session.dicMap[type] = rep.data||[];
                if(session.dicMap.options){
                    handler.config.dic.cleanmarkdic(session.dicMap.options);
                }
            }else{
                session.dicMap[type]=[];
                $().alertmessage('showError', "获取缓存数据异常！");
            }
        },"POST",false,true);
        return getCache(type,id);
    }
}

function getDicCache(type,value){
    type = type || "";
    var cache = session.dicMap[type] || [];
    if(value){
        for(var i=0;i<cache.length;i++){
            if(cache[i].code_value == value){
                return DS.copy(cache[i]);
            }
        }
        return null;
    }
    return cache;
}

function getCacheByKey(type,key,value){
    type = type || "";
    var cache = getCache(type) || [];
    for(var i=0;i< cache.length;i++){
        var cacheItem =cache[i];
        if(cacheItem[key] == value){
            return cacheItem;
        }
    }
    return null;

}
function getDicCacheName(type, value) {
    type = type || "";
    value = value || "";
    var dic = getCache(type) || [];
    for (var i = 0; i < dic.length; i++) {
        if (dic[i].code_value == value) {
            return dic[i].code_name;
        }
    }
    return value;
}
function addCache(type, data) {
    if (data){
        if(!getCache(type,data._id)){
            session.dicMap[type].push(data);
        }
    }
}
function removeCache(type, id) {
    var cache = getCache(type);
    if (cache) {
        for (var i = 0; i < cache.length; i++) {
            if (cache[i]._id == id) {
                cache.splice(i,1);
                break;
            }
        }
    }
}
function updateCache(type, id, data) {
    var cache = getCache(type);
    if (cache) {
        for (var i = 0; i < cache.length; i++) {
            if (cache[i]._id == id) {
                cache[i] = data;
                break;
            }
        }
    }
}
function refreshCache(type, data) {
    if (!type) return;
    data = data || [];
    session.dicMap[type] = data;
}

function getDeptDic(type,filterFirst){
    type = type || "";
    var cache = getCache(type)||[];
    cache= cache.concat([]);

    if(filterFirst){
        for(var i=0;i<cache.length;i++){
            if(cache[i].pId == ''){
                cache.splice(i,1);
                break;
            }
        }
        return cache;
    }
    return cache;
}

function init2() {
    $(".edit_customer .phone .plus").live("click", function (e) {
        addPhoneRow($(e.currentTarget).parent());
    });
    $(".edit_customer .phone .reduce").live("click", function (e) {
        $(e.currentTarget).parent().remove();
    });
    $(".edit_customer .email .plus").live("click", function (e) {
        addEmailRow($(e.currentTarget).parent());
    });
    $(".edit_customer .email .reduce").live("click", function (e) {
        $(e.currentTarget).parent().remove();
    });
    $(".edit_customer .weixin .plus").live("click", function (e) {
        addWeixinRow($(e.currentTarget).parent());
    });
    $(".edit_customer .weixin .reduce").live("click", function (e) {
        $(e.currentTarget).parent().remove();
    });
    $(document).click(function(e){
        var t1=$(".contact_summary").find(".edit_status .submenu");
        if(t1){t1.hide()}
        var t2=$(".contact_summary").find(".edit_source .submenu");
        if(t2){t2.hide()}
        var t3=$(".contact_summary").find(".view_cust_phone .submenu");
        if(t3){t3.hide()}
        var t4=$(".contact_summary").find(".view_cust_mail .submenu");
        if(t4){t4.hide()}
        var t5=$(".contact_summary").find(".view_cust_weixin .submenu");
        if(t5){t5.hide()}
        $('#queue_popover').popover('hide');
        $('.left_column .advanced_search_pane').addClass("hidden");
        $('.config_left .advanced_search_pane').addClass("hidden");

        $('.cust_detail').each(function(){
            if($(this).hasClass("cust_detail_toggle")){
                $(this).toggleClass("cust_detail_toggle").animate({right:-735+'px'},'fast');
                var _p=$(this).prev(".baseinfo");
                if(_p.length>0){
                    _p.find(".btn_view_cust_detail").text("详细信息<<");
                }
            }
        })

    })


}

function initImIcon() {
    if(session.user.im_icon && session.user.im_icon != ''){
        $(".user_pic .S_line5").attr("src",session.user.im_icon+"?imageView2/1/w/40/h/40");
    }else if(session.user.im){
        if(session.user.im.picture){
            var picture = session.user.im.picture;
            $(".user_pic .S_line5").attr("src","http://115.29.160.119/download?Action=GetPic&Picture="+picture+"_35&Account="+session.user.account);
        }
    }
    $('#msg_tips_source_pane').empty();
}

function initDept(){
    var depts = getCache("depts");
}

function initTopBarWidth() {
    if(!isHasFunc("func_sort_phone_bar_send_sms")){
        $('#SmsEnable').remove();
        $('#dialoutEnable').removeClass('btn_child');
        $('#dialoutEnable').addClass('btn_last_child');
        $('#dialoutDisable').removeClass('btn_child');
        $('#dialoutDisable').addClass('btn_last_child');
        $('#hangupEnable').removeClass('btn_child');
        $('#hangupEnable').addClass('btn_last_child');
    }
    var barWidth = $('.main_header').width() - 653 - $('.top_user_info').width() - $('.user_pic').width() - $('.top_head_right').width();
    barWidth-=40;
    if($('#menu-wrap').width() > barWidth){
        $('#menu .top_menu > a').css('margin','10px 10px');
        $('#menu .top_menu:hover > a').css('margin','9px 9px');
        console.log('缩小菜单间隔1次');
        if($('#menu-wrap').width() > barWidth){
            $('#menu .top_menu > a').css('margin','10px 7px');
            $('#menu .top_menu:hover > a').css('margin','9px 6px');
            console.log('缩小菜单间隔2次');
            if($('#menu-wrap').width() > barWidth){
                $('#menu .top_menu > a').css('margin','10px 4px');
                $('#menu .top_menu:hover > a').css('margin','9px 3px');
                console.log('缩小菜单间隔3次');
                if($('#menu-wrap').width() > barWidth){
                    $('#menu .top_menu > a').css('margin','10px 1px');
                    $('#menu .top_menu:hover > a').css('margin','9px 0px');
                    console.log('缩小菜单间隔4次');
                }
            }
        }
    }
}

function addPhoneRow(target) {
    var str='';
    if(target.hasClass("rowcall")){
        str= '<div class="row_item phone rowcall" style=" height: 28px;"><label>&nbsp;</label> ';
        str+='<input name="tel[]" type="text" value=""  style="width:100px;">';
        str+='<input name="memo[]" type="text" value="" placeholder="备注"  style="width:100px;margin-left:-1px;"><a href="#" class="reduce"></a></div>';
    } else{
        str= '<div class="row_item phone"><a href="#" class="reduce"></a><label>&nbsp;</label> ';
        str+='<input name="tel[]" type="text" value=""  style="width:150px;">';
        str+='<input name="memo[]" type="text" value="" placeholder="备注"  style="width:150px;margin-left:-1px;"></div>';
    }
    $("input[name='tel[]']:last",target.parent()).parent().after(str);
//    $(window).resize();
}
function addEmailRow(target) {
    var str='';

    str= '<div class="row_item email"><a href="#" class="reduce"></a><label>&nbsp;</label> ';
    str+='<input name="email[]" type="text" value=""  style="width:150px;">';
    str+='<input name="eMemo[]" type="text" value="" placeholder="备注"  style="width:150px;margin-left:-1px;"></div>';

    $("input[name='email[]']:last",target.parent()).parent().after(str);
//    $(window).resize();
}
function addWeixinRow(target) {
    var str='';
    str= '<div class="row_item weixin"><a href="#" class="reduce"></a><label>&nbsp;</label> ';
    str+='<input name="num[]" type="text" value=""  style="width:150px;">';
    str+='<input name="wxMemo[]" type="text" value="" placeholder="备注"  style="width:150px;margin-left:-1px;"></div>';

    $("input[name='num[]']:last",target.parent()).parent().after(str);
}
function selectItem(src) {
    var panelist=src.closest('.list-inside');
    panelist.find(".item_row").removeClass("expanded");
    src.addClass('expanded');
}

function _getMenu() {
    var action = {
        action: 'common.getUserOutMenu'
    };
    DS.send(action, function (response) {
        if (response.success) {
//            console.dir(response.data)
//            if(session.user.billId=='bb9850f0-1f6f-11e4-9820-af71a6a5ab6d'){
//                _recursiveMenu(response.data,['config_call']);
//            }
            _initClientMenu(response.data);
        }
    });
}
var _recursiveMenu=function(menus,ids){
    var list=[];
    for (var i = 0; i < menus.length; i++) {
        var num=0;
        var menu = menus[i];
        for (var j = 0; j < ids.length; j++) {
            var id = ids[j];
            if(menu.id===id){
                num++;
            }
        }
        if(num>0){
            list.push(i);
        }else{
            var children=menu.children;
            if(children && children.length>0){
                _recursiveMenu(children,ids);
            }
        }
    }
    if(list.length>0){
        for (var i = 0; i < list.length; i++) {
            var idx = list[i]-i;
            menus.splice(idx,1);
        }
    }
}
function _logoff() {
    $("#login-panel").css("display", "block");
    $("#main-panel").css("display", "none");
    session = {
        logined: false,
        extenType: 'sip',
        currentPage: {},
        addCustomerView: null,
        customerView: null,
        searchCustomerView: null,
        loadingCustomerView: null
    };
    if(handler.batch2.autoRefreshHandler){
        window.clearInterval(handler.batch2.autoRefreshHandler);
    }
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

function resize(parent) {
    var head_h=$(".main_header").outerHeight();
    var left_w=$(".left_col").outerWidth();
    var h=$(window).height();
    var w=$(window).width();
    //console.info("resize::===============")
    //console.dir(parent);
    if(parent && parent.length>0){
        var leftColumn=parent.find(".left_column");
        if(leftColumn.length>0){
            var tab=parent.find(".card_pane.tab_active");
            if(tab.length>0){
                var h1=tab.find(".contacts_caption").outerHeight(true)||0;
                var h3=tab.find(".list-footer").outerHeight(true)||0;
                var h2=parent.find(".model_submenu").outerHeight(true)||0;
                parent.find(".list_container .list-inside").css("height", h-head_h-h1-h3-h2);
            }else{
                var h1=parent.find(".contacts_caption").outerHeight(true)||0;
                var h3=parent.find(".list-footer").outerHeight(true)||0;
                parent.find(".list-inside").css("height", h -head_h-h1-h3);
            }
            //console.dir("h1===="+h1+" h3===="+h3 +" list-inside======"+(h-head_h-h1-h3));
        }
    }else{
        $(".right_col .left_column").each(function(i){
            var h1=$(this).find(".contacts_caption").outerHeight(true)||0;
            var h3=$(this).find(".list-footer").outerHeight(true)||0;

            var tab=$(this).find(".card_pane.tab_active");
            if(tab.length>0){
                var h2=$(this).find(".model_submenu").outerHeight(true)||0;
                h1=tab.find(".contacts_caption").outerHeight(true)||0;
                h3=tab.find(".list-footer").outerHeight(true)||0;
                //console.info("h1===="+h1+" h2===="+h2 +" h3===="+h3 +" list-inside======"+(h-head_h-h1-h3-h2));
                $(this).find(".list_container .list-inside").css("height", h-head_h-h1-h3-h2);
            }else{
                $(this).find(".list-inside").css("height", h -head_h-h1-h3);
            }
        });
    }

//    $(".left_col .left_menu_detail").css("height", $(window).height() - 270);//for menu
    $(".left_col,.content_container").css("height", h - head_h);
    $(".right_col").css("width",w - left_w);
    //$(".right_col .right_column").css("width",w - left_w-351);
    //$(".right_content .right_column .contact_detail .content").css({"height":h - head_h,"overflow":"hidden"});

    $(".right_content .right_column .contact_detail .cust_tab_content").each(function(i){
        var container=$(this).closest(".call_detail");
        var content=$(this).closest(".content");
        var _detail=container.find(".customer_container").find(".cust_detail");
        var h1=container.find(".customer_container").outerHeight(true)||0;
        //console.info("h1===="+h1+" head_h===="+head_h +" h===="+h +" content======"+(h - head_h-h1-36));
        $(this).css("height",h - head_h-h1-36);
        content.css("height",h - head_h);
        if(_detail.length>0){
            _detail.css("height",h - head_h-h1);
        }

        resizeDialPopup();
    });


//    resizeScroll($(".left_nav"));


    ///mail fullscreen resize
    var container=$("#frame_mail_inbox_container");
    if(container.hasClass("full_on")){
        var h=$(window).height();
        var w=$(window).width();
        container.css({
            width:w,
            height:h
        })
        container.find("iframe").css({
            height:h-35
        })
    }
}

function resizeLeftColumn(pane) {
    //console.info("resizeLeftColumn=========");
    //console.dir(pane);
    var head_h=$(".main_header").outerHeight();
    var h=$(window).height();
    var h1=pane.find(".contacts_caption").outerHeight(true)||0;
    var h3=pane.find(".list-footer").outerHeight(true)||0;
    if(pane.hasClass("card_pane")){
        var left=pane.closest(".left_column");
        var h2=left.find(".model_submenu").outerHeight(true)||0;
        //console.info("h1===="+h1+" h2===="+h2 +" h3===="+h3 +" list-inside======"+(h-head_h-h1-h3-h2));
        pane.find(".list_container .list-inside").css("height", h-head_h-h1-h3-h2);
    }else{
        //console.info("222 h1===="+h1+" h3===="+h3 +" list-inside======"+(h-head_h-h1-h3));
        var tab=pane.find(".card_pane.tab_active");
        if(tab.length>0){
            var h2=pane.find(".model_submenu").outerHeight(true)||0;
            h1=tab.find(".contacts_caption").outerHeight(true)||0;
            h3=tab.find(".list-footer").outerHeight(true)||0;
            //console.info("h1===="+h1+" h2===="+h2 +" h3===="+h3 +" list-inside======"+(h-head_h-h1-h3-h2));
            tab.find(".list_container .list-inside").css("height", h-head_h-h1-h3-h2);
        }else{
            pane.find(".list_container .list-inside").css("height", h-head_h-h1-h3);
        }
    }
}

function resizeRightContent(pane) {//.cust_tab_content
    var head_h=$(".main_header").outerHeight();
    var h=$(window).height();
    var container=pane.closest(".call_detail");
    var content=pane.closest(".content");
    var h1=container.find(".customer_container").outerHeight(true)||0;
    //console.info("h1===="+h1+" head_h===="+head_h +" h===="+h +" content======"+(h - head_h-h1-36));
    var h0=h - head_h-h1-36;
    pane.css("height",h0);
    content.css("height",h - head_h);

    if(pane.find(".chat_msg").length>0){
        var _h1=pane.find(".chat_top").outerHeight(true)||0;
        var _h2=pane.find(".chat_toolbar").outerHeight(true)||0;
        var _h3=pane.find(".chat_deal").outerHeight(true)||0;
        //console.info("h0===="+h0+" _h1===="+_h1 +" _h2===="+_h2 +" _h3======"+_h3);
        pane.find(".chat_msg").css("height",h0-_h1-_h2-_h3-4);
    }

    resizeDialPopup();
}
function resizeDialPopup(){
    var dialPopup=$("#sys_dialPopup");
    if(dialPopup.length>0){
        var _top=dialPopup.find(".customer_container").height();
        var _body=dialPopup.closest(".modal-body").height();
        //console.info("body===="+_body+" top===="+_top );
        var _h=_body-_top;
        dialPopup.find(".cust_tab_content").height(_h);
        dialPopup.find(".cust_detail").css({position:'absolute',top:_top+"px",height:_h+"px"});
        dialPopup.closest(".modal-body").css('overflow-y','hidden');
    }
}
function updateView(flag) {
    var url='login_cc';
    if(flag=='chinatelecom'){
        url='login_chinatelecom';
    }else if(flag=='ydyx'){
        url='login_ydyx';
    }else if(flag=='sytx'){
        url='login_sytx';
    }else if(flag=='chinamobile'){
        url='login_chinamobile';
    }else if(flag=='roexin'){
        url='login_roexin';
    }else if(flag=='command'){
        url='login_command';
    }else if(flag=='3cx'){
        url='login_3cx';
    }else if(flag=='ylwt'){
        url='login_ylwt';
    }else if(flag=='zbtx'){
        url='login_zbtx';
    }else if(flag=='dianxk'){
        url='login_dianxk';
    }else if(flag=='shenma'){
        url='login_shenma';
    }else if(flag=='rygx'){
        url='login_rygx';
    }else if(flag=='yuantel'){
        url='login_yuantel';
    }else if(flag=='glb'){
        url='login_glb';
    }else if(flag=='9mkj'){
        url='login_9mkj';
    }else if(flag=='stkj'){
        url='login_stkj';
    }else if(flag=='gzdx'){
        url='login_gzdx';
    }else if(flag=='gdlt'){
        url='login_gdlt';
    }else if(flag=='uincall'){
        url='login_uincall';
    }
    DS.getView(url, function (data) {
        $("#login-panel").empty();
        $("#login-panel").html(data);
        var email = DS.getCookie("loginName");
        var password = DS.getCookie("password");
        var remember = DS.getCookie("remember");
        var extenType = DS.getCookie("extenType");
        var rememberBusyType = DS.getCookie("rememberBusyType");
        if (email) {
            $("#login_loginName").val(email);
        }
        if (password) {
            $("#login_password").val(password);
        }
        if (remember) {
            $("#login_remember").attr("checked", remember);
            if(rememberBusyType == 'true'){
                $("#login_busyType_switch").attr("checked", true);
                //$('#login_busyType_switch').bootstrapSwitch('state', true, true);
            }else if(rememberBusyType == 'false'){
                $("#login_busyType_switch").attr("checked", false);
                //$('#login_busyType_switch').bootstrapSwitch('state', false, true);
            }
        }
        if (extenType) {
            $("#login_extentype").find("input[value='"+extenType+"']").prop("checked",true);
        }
    });

    DS.getView("softphonebar_in", function (data) {
        $("#softphone-bar").empty();
        $("#softphone-bar").html(data);
    });
//    DS.getView("my_call_info", function (data) {
//        $("#my_call_info").empty();
//        $("#my_call_info").html(data);
//    });
//    DS.getView("my_queue_info", function (data) {
//        $("#my_queue_info").empty();
//        $("#my_queue_info").html(data);
//    });
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

function _initClientMenu(menuData) {
    var menus = menuData || [];
    menus = _initMenuData(menus);
    session.clientMenu = menus;
    //console.dir(menus);
    var navMenuPane = $(".left_col .navbar_top");
    var navBottomPane = $(".left_col .navbar_bottom");
//    navMenuPane.empty();
//    navMenuPane.append("<ul id='menu'></ul>");
//    navMenuPane = navMenuPane.find("#menu");
    var html=[];
    var html1=[];
    var html2=[];
    for (var i = 0; i < menus.length; i++) {
        var menu=menus[i];
        if(menu.id=='nav_config' || menu.id=='nav_url_interface'){
            var _html=template("tmpl_menu_main",menu);
            html2.push(_html);
        }else if(i>7) {
            var _html = template("tmpl_menu_main", menu);
            html1.push(_html);
        }else{
            var _html=template("tmpl_menu_main",menu);
            html.push(_html);
        }
    }
    navMenuPane.html(html.join(""));
    if(html1.length>1){
        navMenuPane.append("<div class=\"navbar_center\"></div>");
        var navCenterpane = $(".left_col .navbar_center");
        navCenterpane.html(html1.join(""));
        navCenterpane.find(".open_top_menu:first-child").addClass('active_cen');
    }else{
        navMenuPane.append(html1.join(""));
    }
    navBottomPane.prepend(html2.join(""));
//    navMenuPane.find(".navbar_item").hover(
//        function () {
//            $(this).addClass("hover");
//        },
//        function () {
//            $(this).removeClass("hover");
//        }
//    );
    handler.initTopMenu();
    //$("[data-original-title]").tooltip({placement: 'right',html:true});
    $(".navbar_center .navbar_item[data-original-title]").tooltip({placement: 'top',html:true});
    handler.business.initUndealNum(true);
    handler.customer.approvalBusiness.initUndealNum(true);
    handler.webchat.refreshMenuBadge(true);

//    console.log($("#menu").find("a.ds_do_action:first"));
//    $("#menu").find("a.ds_do_action:first").click();
//    $("#menu").find("[menuid='my_call']:first").click();
//    if($("#menu").find("[menuid='url_interface']:first")){
//        $("#menu").find("[menuid='url_interface']:first").click();
//    }
//    _initMenuView("incoming_email","callMail/incomingEmail");
//    _initMenuView("incoming_weixin","callWeixin/incomingWeixin");

//    initTopBarWidth();
//    var navMenuPane = $("#nav_menu");
//    navMenuPane.empty();
//    var temp = "<li id=\"nav_menu___id\" class=\"menu_nav\"><a href='javascript:void(0);' class='ds_do_action' ds_action='initSubMenu' ds_data='__id'>__name</a></li>";
//    var menus = menuData.menu || [];
//    session.clientMenu = menus;
//    for (var i = 0; i < menus.length; i++) {
//        var html = replaceDataByObject(menus[i], temp);
//        navMenuPane.append(html);
//        if(i == 0) {
//           $("#nav_menu_"+menus[i].id).css("margin-left","3px");
//        }
//    }
//    handler.initSubMenu("business");
//    $("#nav_menu a:first").click();
//    $('.ds_datetime').datepicker();

}
function _initMenuView(id,page){
    var p = $("#view_" + id);
    var realPage = page;
    var handlerPage = "";
    if(realPage) {
        handlerPage = render.renderLeftMenuHandlerPage(realPage);
    }
    DS.getView(realPage, function (data) {
        data = data.replace(new RegExp('_#menu#_','g'), id);
        session[id] = true;
        p.empty();
        p.html(data);
//        resize();
        eval("handler." + handlerPage + "(id)");
    });
}
function _initMenuData(pages) {
    for (var i = 0; i < pages.length; i++) {
        var node = pages[i];
        if (node.type == "cache") {
            var children = getCache(node.value);
            if (children.length == 0) {
                continue;
            } else {
                node.tab = false;
                node.children = [];
                var keyName = node.key;
                for (var j = 0; j < children.length; j++) {
                    var child = {};
                    child.id = children[j]._id;
                    child.name = eval("children[j]." + keyName);
                    child.type = "leaf";
                    child.page = node.page;
                    child.refresh = node.refresh;
                    child.onlyExcuHandler = node.onlyExcuHandler;
                    child.container = node.container;
                    node.children[j] = child;
                }
            }
        }
    }
    return pages;
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


function getNotifyDate(date) {
    var a = date.substring(0, 10).split("-");
//    var d = new Date(a[0], a[1], a[2]);
//    var dd = d.getFullYear()+"/"+d.getMonth()+"/"+d.getDate();
    var dd=parseInt(a[0])+"/"+parseInt(a[1])+"/"+parseInt(a[2]);
    var today = new Date();
    var now = countDay(0);
    //console.dir(d.getTime()+"\n"+dd+"\n"+Date.parse(now)+"\n"+Date.parse(dd));
    var yesterday = countDay(-1);
    var tomorrow = countDay(1);
    var _tomorrow = countDay(2);
    var result = new Object();
    result.time = date.substring(11, 16);
    result.isToday = false;
    result.displayName = date;
    if (dd == now) {
        result.name = "今天";
        result.type = "today_action";
        result.isToday = true;
    } else if (dd == yesterday) {
        result.name = "昨天";
        result.type = "overdue";

    } else if (dd == tomorrow) {
        result.name = "明天";
        result.type = "";
    } else if (dd == _tomorrow) {
        result.name = "后天";
        result.type = "";
    } else if(a[0] > today.getFullYear()) {
//        result.name =  a[0] + "-" +a[1] + "-" + a[2];
        result.name ='年后';
        result.type = "";
    } else if(a[0] < today.getFullYear()) {
        result.name ='年前';
        result.type = "overdue";
    } else if (Date.parse(dd) > Date.parse(now)) {
        result.name = a[1] + "-" + a[2];
        result.type = "";
    } else if (Date.parse(dd) < Date.parse(now)) {
        result.name = a[1] + "-" + a[2];
        result.type = "overdue";
    }

    result.displayName = result.name+' '+result.time;
    if(result.isToday)
        result.displayName = result.time;

    return result;
}
function countDay(mount) {
    var today = new Date();
    today.setDate(today.getDate() + mount);
    return today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate();
}
function generateComboxOptionsFromDocs(docs, codeName, codeValue, currentValue) {
    var selectOptionHtml = '<option value="__value" selected>__name</option>';
    var optionHtml = '<option value="__value">__name</option>';
    var resultOptions = '';

    for (var i = 0; i < docs.length; i++) {
        if (docs[i][codeValue] === currentValue) {
            resultOptions += selectOptionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, docs[i][codeName]);
        } else {
            resultOptions += optionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, docs[i][codeName]);
        }
    }
    return resultOptions;
}

function timeToHHmmss(seconds){
    var hh;
    var mm;
    var ss;
    if(seconds==null||seconds<0){
        return;
    }
    hh=seconds/3600|0;
    seconds=parseInt(seconds)-hh*3600;
    if(parseInt(hh)<10){
        hh="0"+hh;
    }
    mm=seconds/60|0;
    ss=parseInt(seconds)-mm*60;
    if(parseInt(mm)<10){
        mm="0"+mm;
    }
    if(ss<10){
        ss="0"+ss;
    }
    return hh+":"+mm+":"+ss;

}

function getSearchCondition(pane) {
    var data = {};
    var queryDisplay = '';

    var inputs = pane.find(".ds_search_item");
    if (inputs) {
        for (var i = 0; i < inputs.length; i++) {
            var ele = $(inputs[i]);
            var name = ele.attr("name");
            var value = ele.val().trim();
            if (!name)
                continue;
            if(!value)
                continue;
            if(value == 'true'){
                value = true;
            } else if (value == 'false'){
                value = false;
            }
            if(ele[0].type == 'text' && ele.hasClass('select_input')) {
                queryDisplay += ele.next('div').find('input').val()+' ';
            } else if(ele[0].type == 'text'){
                queryDisplay += value+' ';
            } else if (ele[0].type == 'select-one') {
                queryDisplay += ele.find('option:selected').text()+' ';
            } else if (ele[0].type == 'hidden' && name=="owner") { //for owner
                queryDisplay += ele.next('div').find('input').val()+' ';
            }

            if (name.match(/\w\[\]/g)) {
                name = name.substring(0, name.length - 2);
                if (!data[name]) {
                    data[name] = new Array();
                }
                data[name].push(value);
            } else {
                data[name] = value;
            }
        }
    }
    return {
        data: data,
        queryDisplay: queryDisplay
    };
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
            +'<span class="badge badge-info" title="'+queryDisplay+'">'+queryDisplay+'</span>'
            +'<a href="#" class="remove_filter" style="margin-left: 10px;">X</a></span>'
            +'<span class="show-contacts" style="float: right;">'
            +currentCount+'/'+response.count+'条结果'
            +'</span></div>';
        filterPane.html(text);
    }else{
        var text = '<div class="clearfix">'
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


function updatePagination(list, count, limit, index) {
    list.removeClass("active");
    if (count == 0) {
        list.addClass("disabled");
        list.children("a").attr("app", "disabled");
        return;
    }
    var pages = Math.ceil(count / limit);
    var start = Math.floor((index - 1) / 5) * 5;
    var end = start + 4;
    if (end > pages)
        end = pages;
    var n = 0;
    for (var i = 0; i < list.length; i++) {
        var li = list[i];
        $(li).children("a").attr("value", "" + (start + n));
        if (n == 0) {
            if (start == 0) {
                $(li).addClass("disabled");
                $(li).children("a").attr("app", "disabled");
            } else {
                $(li).removeClass("disabled");
                $(li).children("a").attr("app", "enable");
            }
        } else if (n == 6) {
            if (pages - 1 > end) {
                $(li).removeClass("disabled");
                $(li).children("a").attr("app", "enable");
            } else {
                $(li).addClass("disabled");
                $(li).children("a").attr("app", "disabled");
            }
            break;
        } else {
            $(li).find("a").text(start + n);
            if (start + n > pages) {
                $(li).addClass("disabled");
                $(li).children("a").attr("app", "disabled");
            } else if (start + n == index) {
                $(li).removeClass("disabled");
                $(li).children("a").attr("app", "disabled");
            } else {
                $(li).removeClass("disabled");
                $(li).children("a").attr("app", "enable");
            }
        }
        n++;
    }
    var item = list.children("a[value='" + index + "']");
    if (item) {
        item.parent("li").addClass("active");
    }
}

function getGeneralCache(type, value) {
    type = type || "";
    var cache = session.dicMap[type] || [];
    if (value == "") return "";
    if (value) {
        for (var i = 0; i < cache.length; i++) {
            if (cache[i].code_value == value) {
                return copy(cache[i]);
            }
        }
        return value;
    }
    return cache;
}

function copy(obj) {
    obj = obj || {};
    var result = {};
    for (var key in obj) {
        result[key] = obj[key];
    }
    return result;
}

function arrayContainsStr(array, str) {
    array = array || [];
    for (var i = 0; i < array.length; i++) {
        if (array[i] == str) {
            return true;
        }
    }
    return false;
}

function getCurrentDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
    day = day > 9 ? day : '0' + day;
    return year + "-" + month + "-" + day
}


function getCurrentDateTime() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    var hour = date.getHours();
    var minites = date.getMinutes();
    var second = date.getSeconds();
    month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
    day = day > 9 ? day : '0' + day;
    hour = hour > 9 ? hour : '0' + hour;
    minites = minites > 9 ? minites : '0' + minites;
    second = second > 9 ? second : '0' + second;
    return year + "-" + month + "-" + day + " " + hour + ":" + minites + ":" + second;
}

function showOptionDesc(type,dics){
    var ary=getCache(type);
    if(!ary || ary.length==0) return '';
    var newAry=[];
    if(dics && dics.length>0){
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            if($.inArray(obj._id,dics)!=-1){
                newAry.push(obj.display_name);
            }
        }
        return newAry.join(",");
    }else{
        return '';
    }
}
function getDicOptions(type,currentVal,showDft,filters,showFilter){
    var html=[];
    if(showDft!='no'){
        html.push("<option value=''>--请选择--</option>");
    }
    var selectOptionHtml = "<option value='__value' selected>__name</option>";
    var optionHtml = "<option value='__value'>__name</option>";
    var ary=getCache(type);
    if(!ary || ary.length==0) return null;
    var newAry=[];
    var filterAry={};
    if(filters && filters.length>=0){
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            if($.inArray(obj._id,filters)==-1){
                newAry.push(obj);
            }else{
                filterAry[obj._id]=obj.display_name;
            }
        }
        ary=newAry;
        if(showFilter){
            var _filterAry=[];
            for(var j=0;j<filters.length;j++){
                var id=filters[j];
                _filterAry.push({_id:id,display_name:filterAry[id]});
            }
            ary=_filterAry;
        }
    }else{
        if(showFilter){
            return "";
        }
    }

    for (var i=0;i<ary.length;i++) {
        var obj=ary[i];

        if(currentVal && currentVal==obj._id){
            html.push(selectOptionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.display_name));
        } else{
            html.push(optionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.display_name));
        }
    }
    return html.join("");
}

function checkMobile(phone){
    var mobile=/1[3,4,5,7,8][0-9]{9}/;
    return mobile.test(phone);
}

function optionSelect(control, value) {
    control.find('option').each(function (i) {
        if ($(this).val() == value) {
            this.selected = true;
            return;
        } else {
            this.selected = false;
        }
    })
}

function showOwnerFuncs(container){
    var funcIds=session.user.funcIds;
    container.find("[funcId]").each(function(i){
        var funcId=$(this).attr("funcId");
        if($.inArray(funcId,funcIds)==-1){
            $(this).remove();
        }else{
            $(this).show();
        }
    })
}
function isHasFunc(key){
//    console.dir(session.user.funcIds)
    var user=session.user;
    if(user.type=='admin' && user.exten=='0000'){
        var reverse=['func_hide_tel','func_nodelete_customer'];
        if($.inArray(key,reverse)!=-1){
            return false;
        }else{
            return true;
        }
    }
    var funcIds=user.funcIds;
    if($.inArray(key,funcIds)!=-1){
        return true;
    }
    return false;
}
function isHasMenu(key){
    var user=session.user;
    var funcIds=user.allFun;
    if(user.type=='admin' && user.exten=='0000'){
        return true;
    }
    if($.inArray(key,funcIds)!=-1){
        return true;
    }
    return false;
}
function checkHideTel(phone,pane){
    if(!phone) return "";
    if(isHasFunc("func_hide_tel")){
        if(pane){
            pane.attr("bgTel",Base64.encode(phone));
        }
        return _encryptPhone(phone);
    }else{
        return phone;
    }
}
function checkEncryptTel(phone){
    if(!phone) return "";
    if(isHasFunc("func_hide_tel")){
        phone=Base64.encode(phone);
        return phone;
    }else{
        return phone;
    }
}
function checkEncryptTel(phone){
    if(!phone) return "";
    if(isHasFunc("func_hide_tel")){
        phone=Base64.encode(phone);
        return phone;
    }else{
        return phone;
    }
}

function getEncryptTel(phone){
    if(!phone) return "";
    if(isHasFunc("func_hide_tel")) {
        phone = Base64.decode(phone);
    }
    return phone;
}
function _encryptPhone(phone){
    if(!phone) return "";
    var len=phone.length;
    if(len<6) return phone;
    var tel="";
    var mobile=/1[3,4,5,7,8][0-9]{9}/;
    if(mobile.test(phone)){
        tel=phone.substring(0,3)+"****"+phone.substring(7);
    }else{
        var p=len/2;
        tel=phone.substring(0,p-2)+"****"+phone.substring(p+2);
    }
    return tel;
}
function showCdrTel(data){
    var connectType=data.CONNECT_TYPE;
    if (connectType=='dialout' || connectType=='dialTransfer') {
        data.bgCallNo=data.CALL_NO;
        data.bgCalledNo=checkHideTel(data.CALLED_NO);
        data.CALLED_NO=checkEncryptTel(data.CALLED_NO);
    }else{
        data.bgCallNo=checkHideTel(data.CALL_NO);
        data.bgCalledNo=data.CALLED_NO;
        data.CALL_NO=checkEncryptTel(data.CALL_NO);
    }
}

var getDateDesc = function (date) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
    day = day > 9 ? day : '0' + day;
    return year + "-" + month + "-" + day;
}

var getCurrentWeek=function(/*string*/date){
    var oToday = new Date(date);
    var currentDay = oToday.getDay();
    if (currentDay == 0) { currentDay = 7 }
    var mondayTime = oToday.getTime() - (currentDay - 1) * 24 * 60 * 60 * 1000;
    var sundayTime = oToday.getTime() + (7 - currentDay) * 24 * 60 * 60 * 1000;

    var start=getDateDesc(new Date(mondayTime));
    var end=getDateDesc(new Date(sundayTime));
    return {start:start,end:end};
}
var getLastWeek=function(/*string*/date){
    var oToday = new Date(date);
    var currentDay = oToday.getDay();
    if (currentDay == 0) { currentDay = 7 }
    var mondayTime = oToday.getTime() - (currentDay - 1) * 24 * 60 * 60 * 1000;
    var lastMondayTime=mondayTime-7* 24 * 60 * 60 * 1000;
    var lastSundayTime=mondayTime-1* 24 * 60 * 60 * 1000;
    var start=getDateDesc(new Date(lastMondayTime));
    var end=getDateDesc(new Date(lastSundayTime));
    return {start:start,end:end};
}
var getCurrentMonth=function(/*string 2014-09-01*/date){
    var _date = new Date(date);
    _date.setMonth(_date.getMonth()+1);
    _date.setDate(0);
    var end=getDateDesc(_date);
    var start=end.substring(0,end.lastIndexOf("-"))+"-01";
    return {start:start,end:end};
}
var getLastMonth=function(/*string 2014-09-01*/date){
    var _date = new Date(date);
    _date.setDate(0);
    var end=getDateDesc(_date);
    var start=end.substring(0,end.lastIndexOf("-"))+"-01";
    return {start:start,end:end};
}

function getCCDic(type,/*array*/parentKeys,isCC){
    type = type || "NA";
    parentKeys=parentKeys||[];
    if(isCC && parentKeys.length==0){
        return null;
    }
    var opts = getCache("options",type)||[];
    if (opts) {
        var options = opts.options;
        if(parentKeys.length==0){
            return options;
        }else{
            for (var i = 0; i < parentKeys.length; i++) {
                var key = parentKeys[i];
                for (var j = 0; j < options.length; j++) {
                    var o = options[j];
                    if(o.key==key){
                        options= o.options;
                        break;
                    }
                }
            }
            return options;
        }
    }
}
function generateCCOptions(type,parentKeys,currentVal,isCC){
    var html=["<option value=''>--请选择--</option>"];
    var selectOptionHtml = "<option value='__value' selected>__name</option>";
    var optionHtml = "<option value='__value'>__name</option>";
    var ary=getCCDic(type,parentKeys);
    if(!ary || ary.length==0) return html.join("");
    for (var i=0;i<ary.length;i++) {
        if(currentVal && currentVal==ary[i].key){
            html.push(selectOptionHtml.replace(/__value/g,ary[i].key).replace(/__name/g,ary[i].name));
        } else{
            html.push(optionHtml.replace(/__value/g,ary[i].key).replace(/__name/g,ary[i].name));
        }
    }
    return html.join("");
}


function getCaseCadeDic(item,level){
    if(!item)return;
    var ary=level.split("_");
    var op=item;
    for(var i=0;i<ary.length;i++){
        var idx=ary[i];
        if(op){
            op=op.options[idx];
        }
    }
    return op;
}
var removeEmptyProperty = function(obj){
    if(!obj)return;
    for(var property in obj){
        var value = obj[property];
        if(!value){
            delete obj[property];
        }
        if($.isArray(value) && value.length==0){
            delete obj[property];
        }
    }
    return obj;
}

function filterUserByScope(module){
    var agents=getCache("agents");
    var _agents=[];
    var scope=session.user.moduleUsers[module];
    var lowUsers=scope||[];
    if(scope!='all'){
        for(var i=0;i<agents.length;i++){
            var u=agents[i];
            if($.inArray(u._id,lowUsers)!=-1){
                _agents.push(u);
            }
        }
        return _agents;
    }
    return agents;
}
function filterCategoryByManager(){
    var categorys=getCache("custCategorys");
    var _categorys=[];
    var uid=session.user._id;
    for(var i=0;i<categorys.length;i++){
        var obj=categorys[i];
        var category=obj.category;
        if(category=='0'||category=='3'||category=='4'){
            var managers=obj.managers||[];
            if($.inArray(uid,managers)!=-1){
                _categorys.push(obj);
            }
        }
    }
    return _categorys;
}
function filterCategoryByScope(){
    var categorys=getCache("custCategorys");
    var _categorys=[];
    var uid=session.user._id;
    for(var i=0;i<categorys.length;i++){
        var obj=categorys[i];
        var category=obj.category;
        var managers=obj.managers||[];
        var members=obj.members||[];
        if($.inArray(uid,managers)!=-1||$.inArray(uid,members)!=-1){
            _categorys.push(obj);
        }
    }
    return _categorys;
}

function artRender(view,data){
    var render = template.compile(view);
    return render(data || {});
}

template.helper("$getCache",getCache);
template.helper("$getSession",function(){
    return session;
});

function escapeHtml(/*string*/str){
    str = String(str).replace(/&/gm, "&amp;").replace(/</gm, "&lt;")
        .replace(/>/gm, "&gt;").replace(/"/gm, "&quot;").replace(/'/gm,"&#39;");
    return str;
}

function unescapeHtml(/*String*/ str){
    return 	str.replace(/&amp;/gm, "&").
        replace(/&lt;/gm, "<").
        replace(/&gt;/gm, ">").
        replace(/&quot;/gm, "\"").
        replace(/&#39;/gm, "'");
}

function escapeChatHtml(/*string*/str){
    str = String(str).replace(/</gm, "&lt;").replace(/>/gm, "&gt;");
    return str;
}
/**
 * var data={
        content:'<p>您有一条新的消息</p>',
        cls:'email/weixin/call'
    }
 * @param data
 */
var popupMsgTip=function(data){
    var _bottom=115;
    var cls=data.cls||'NA';
    var pane=$("#msg_tips_source_pane");
    var tips=pane.find(".msg_tips");
    var _tip=pane.find(".msg_tips."+cls);
    if(_tip.length>0){//同一类型只弹一次
        return;
    }
    var num=tips.length||0;
    if(num>0){
        _bottom+=_bottom*num;
    }
    if(cls =='call'){
        handler.call.NOcallnum++;
        var notification = new Notification("您有"+handler.call.NOcallnum+"个新来电,点击进行查看！", {
            dir: "auto",
            lang: "",
            tag: "7moortelCall", //实例化的notification的id
            icon: "img/logo_notify.png",
            body: "新来电提醒",
            requireInteraction : true,

        });
        notification.onshow = function(){
        };
        notification.onclick = function(){
            window.focus();
            handler.call.gotoIncomingPage(null);
            notification.close();
        };
        notification.onclose = function(){
            handler.call.NOcallnum=0;
        };
        notification.onerror = function(){};
    }else{
        var tmpl=$("#tmpl_msg_tips_popup").html();
        tmpl=DS.renderViewNew(tmpl,data);
        pane.prepend(tmpl);
        pane.find(".msg_tips:first").animate({bottom:_bottom+'px'},'slow');
    }   
}
var closeMsgTip=function(obj){
    var _bottom=115;
    var tip=$(obj).closest(".msg_tips");
    var prevTips=tip.prevAll();
    tip.remove();
    var len=prevTips.length;
    for (var i = len-1; i >=0; i--) {
        var o = $(prevTips[i]);
        if(o.length>0){
            var p=o.position();
            var h=Math.abs(p.top);
            h=parseInt(h,10)-_bottom;
            o.animate({bottom:h+'px'},'slow');
        }
    }
}

function copyEnableUser(isEnable,filterAgents){
    var agents=filterAgents||getCache("agents");

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

    return _agents;
}

function checkItemEvent(src){
    var item=src.closest(".list_item_check");
    var list=item.closest(".list-inside");
    var pane=item.closest(".list_check_pane");
    var toolbarPane=$("#pane_deal_list");
    var menu=pane.attr("ds_menu");
    if(item.hasClass("select_on")){
        item.removeClass("select_on");
        if(list.find(".list_item_check.select_on").length<1){
            pane.find(".list_check_all").removeClass("select_half select_on");
            toolbarPane.find(".list_check_all").removeClass("select_half select_on");
        }else{
            pane.find(".list_check_all").removeClass("select_on").addClass("select_half");
            toolbarPane.find(".list_check_all").removeClass("select_on").addClass("select_half");
        }
        var total=list.find(".list_item_check.select_on").length||"0";
        toolbarPane.find(".bottom_toolbar_selsize_num").text(total);
        pane.find(".cancel_edit .bottom_toolbar_selsize_num").text(total);
    }else{
        item.addClass("select_on");
        pane.find(".list_check_all").removeClass("select_on").addClass("select_half");

        if(!list.hasClass("list_check_edit")){
            list.addClass("list_check_edit");
            list.find(".item_row").removeClass("item_check ds_do_action").addClass("item_check_toggle");
            list.find(".ico_select_checkbox").show();

            var topH=pane.find(".caption-top").outerHeight(true);
//            console.dir(pane)
            pane.find(".caption-top").hide();
            var _checkbox=pane.find(".cancel_edit").find(".ico_select_checkbox");
            var _top=topH/2-(_checkbox.outerHeight(true)/2);
            pane.find(".cancel_edit").find(".ico_select_checkbox").css("top",_top+"px");
            pane.find(".cancel_edit").css({"height":topH+"px","line-height":topH+"px"}).show();

            var url="customer/customer_deal";
            if(src.hasClass("bus_item")){
                url="business/task_deal";
            }else if(src.hasClass("mail_item")){
                url="channelHistory/mail_deal";
            }else if(src.hasClass("cdr_item")){
                url="cdr/cdr_deal";
            }else if(src.hasClass("weixin_item")){
                url="channelHistory/weixin_deal";
            }else if(src.hasClass("webchat_item")){
                url="webchat/webchat_deal";
            }
            DS.getView(url,function(view){
                if(view){
                    view=view.replace(/_#menu#_/g,menu);
                    toolbarPane.html(view);
                    if(src.hasClass("bus_item")){
                        if(!isHasFunc("func_task_export")){
                            toolbarPane.find(".toolbar_item_export").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export").show();
                        }
                        if(!isHasFunc("func_task_delete")){
                            toolbarPane.find(".toolbar_item_delete").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_delete").show();
                        }
                    }else if(src.hasClass("customer_item")){
                        if(!isHasFunc("func_customer_delete")){
                            toolbarPane.find(".toolbar_item_delete").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_delete").show();
                        }
                        if(!isHasFunc("func_customer_export")){
                            toolbarPane.find(".toolbar_item_export").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export").show();
                        }
                        if(isHasFunc("func_not_update_customer_status")){
                            toolbarPane.find(".toolbar_item_update_status").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_update_status").show();
                        }
                        if(!isHasFunc("func_customer_assign")){
                            toolbarPane.find(".toolbar_item_assign").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_assign").show();
                        }
                        if(!isHasFunc("func_customer_clearOwner")){
                            toolbarPane.find(".toolbar_item_clear").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_clear").show();
                        }
                        if(!isHasFunc("func_customer_convert")){
                            toolbarPane.find(".toolbar_item_update_convert").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_update_convert").show();
                        }
                    }else if(src.hasClass("mail_item")){
                        if(!isHasMenu("all_undeal_mail")){
                            toolbarPane.find(".toolbar_item_assign").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_assign").show();
                        }
                    }else if(src.hasClass("cdr_item")){
                        if(!isHasFunc("func_export_cdr")){
                            toolbarPane.find(".toolbar_item_export").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export").show();
                        }
                        if(!isHasMenu("call_sheet_export_monitor_task")){
                            toolbarPane.find(".call_sheet_export_monitor_task").remove();
                        }else{
                            toolbarPane.find(".call_sheet_export_monitor_task").show();
                        }
                    }else if(src.hasClass("weixin_item")){
                        if(!isHasMenu("all_undeal_weixin")){
                            toolbarPane.find(".toolbar_item_assign").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_assign").show();
                        }
                    }
                    toolbarPane.show();
                    var total=list.find(".list_item_check.select_on").length||"0";
                    toolbarPane.find(".bottom_toolbar_selsize_num").text(total);
                    pane.find(".cancel_edit .bottom_toolbar_selsize_num").text(total);
                    toolbarPane.find(".list_check_all").removeClass("select_on").addClass("select_half");
                }
            })
        }else{
            var total=list.find(".list_item_check.select_on").length||"0";
            toolbarPane.find(".bottom_toolbar_selsize_num").text(total);
            pane.find(".cancel_edit .bottom_toolbar_selsize_num").text(total);
            toolbarPane.find(".list_check_all").removeClass("select_on").addClass("select_half");
        }
    }
}


function slideQuickSearch(menuAry,selVal,src,type,filter){
    var searchPane=src.closest(".left_column");
    var container=searchPane;
    if(filter){
        container=searchPane.find(filter);
    }
    var quick_row=searchPane.find(".quick_row");
    var maxLen=0;
    if(quick_row.length>0){
        maxLen=searchPane.outerWidth()-31;
    }
    var flag= src.attr("flag");
    var val=selVal;
    var htmlLeft=[];
    var htmlRight=[];
    var tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" ds_data="_#v#_" flag="_#flag#_">_#n#_</a></li>';
    if(type=="customer"){
        tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" ds_data="_#v#_" flag="_#flag#_" title＝“_#n#_”>_#n#_</a></li>';
        tmpl=tmpl.replace(/_#action#_/g,"customer.customer_quick_search");
    }else if(type=="business"){
        tmpl=tmpl.replace(/_#action#_/g,"business.quick_flow_search");
    }else if(type=="business_step"){
        tmpl=tmpl.replace(/_#action#_/g,"business.quick_step_search");
    }
    quick_row.empty();
    var idx=0;
    var total=menuAry.length;
    for (var i = 0; i < menuAry.length; i++) {
        var o = menuAry[i];
        if(o.v==val){
            idx=i;
            break;
        }
    }
//        console.info("idx===="+idx+",total======"+total);
    if(flag=='right'){
        var _idx=0;
        if(idx==total-1){//last
            container.find(".more_search_next").hide();
            quick_row.css({"margin-left":"20px","margin-right":"0"});
        }else{
            maxLen=maxLen-20;
            quick_row.css({"margin-left":"20px","margin-right":"20px"});
        }
        for (var i = idx; i >= 0; i--) {
            var _d = menuAry[i];
            _d.flag="";
            var len=quick_row.outerWidth(true)||0;
//            console.info("len=="+len+" maxLen=="+maxLen);
            if(len>maxLen||_idx>0){
                if(_idx<1){
                    var first=quick_row.find("li:first");
                    first.find("a").attr("flag","left");
                    htmlLeft.push(first.prop("outerHTML"));
                    first.remove();
                }
                _idx++;
                _d.flag="left";
                htmlLeft.push(DS.renderViewNew(tmpl,_d));
            }else{
                quick_row.prepend(DS.renderViewNew(tmpl,_d));
            }
        }
        //deal first item
        var len=quick_row.outerWidth(true);
        if(len>maxLen){
            var first=quick_row.find("li:first");
            first.find("a").attr("flag","left");
            htmlLeft.push(first.prop("outerHTML"));
            first.remove();
        }
        quick_row.find("li:last").addClass("active");
        if(htmlLeft.length>0){
            quick_row.css({"margin-left":"20px"});
            var prev=container.find(".more_search_prev");
            prev.find(".dropdown-menu").html(htmlLeft.join(""));
            prev.show();
        }
        if(idx<total-1){
            for (var i = idx+1; i< total; i++) {
                var _d = menuAry[i];
                _d.flag="right";
                htmlRight.push(DS.renderViewNew(tmpl,_d));
            }
            if(htmlRight.length>0){
                var next=container.find(".more_search_next");
                next.find(".dropdown-menu").html(htmlRight.join(""));
                next.show();
            }
        }
    }else if(flag=="left"){
        var _idx=0;
        if(idx==0){//first
            container.find(".more_search_prev").hide();
            quick_row.css({"margin-left":"0","margin-right":"20px"});
        }else{
            maxLen=maxLen-20;
            quick_row.css({"margin-left":"20px","margin-right":"20px"});
        }

        for (var i = idx; i <total; i++) {
            var _d = menuAry[i];
            _d.flag="";
            var len=quick_row.outerWidth(true)||0;
//            console.info(" len=="+len+" maxLen=="+maxLen);
            if(len>maxLen||_idx>0){
                if(_idx<1){
                    var last=quick_row.find("li:last");
                    last.find("a").attr("flag","right");
                    htmlRight.push(last.prop("outerHTML"));
                    last.remove();
                }
                _idx++;
                _d.flag="right";
                htmlRight.push(DS.renderViewNew(tmpl,_d));
            }else{
                quick_row.append(DS.renderViewNew(tmpl,_d));
            }
        }
        //deal last item
        var len=quick_row.outerWidth(true);
        if(len>maxLen){
            var last=quick_row.find("li:last");
            last.find("a").attr("flag","right");
            htmlRight.push(last.prop("outerHTML"));
            last.remove();
        }
        quick_row.find("li:first").addClass("active");
        if(htmlRight.length>0){
            var next=container.find(".more_search_next");
            next.find(".dropdown-menu").html(htmlRight.join(""));
            next.show();
        }
        if(idx>0){
            for (var i = idx-1; i>=0; i--) {
                var _d = menuAry[i];
                _d.flag="left";
                htmlLeft.push(DS.renderViewNew(tmpl,_d));
            }
            if(htmlLeft.length>0){
                var prev=container.find(".more_search_prev");
                prev.find(".dropdown-menu").html(htmlLeft.join(""));
                prev.show();
            }
        }
    }
}
/**
 * 生成客户页面对接校验所需token
 */
function getToken(){
    var result = {};
    var loginName = session.user.loginName;
    var password = session.user.password;
    var action = {
        action: 'app.user.getToken',
        data :{
            loginName:loginName,
            password:password
        }
    };
    DS.send(action,function(rep){
        if(rep.success){
            result.token = rep.token;
            result.tokenId = rep.tokenId;
        }else{
            $().alertmessage('showError', "获取token异常！");
        }
    },"POST",false,true);

    return result;
}

function initQuickSearch(searchPane,dic,type,filter){
    var container=searchPane;
    if(filter){
        container=searchPane.find(filter);
    }

    var quick_row=container.find(".quick_row");
    var maxLen=0;
    if(quick_row.length>0){
        var _left=quick_row.closest(".left_column");
//            console.info("outerWidth==="+_left.outerWidth()+" outerWidth true======"+_left.outerWidth(true));
        maxLen=_left.outerWidth()-31;
    }
    dic=dic||[];

    var htmlRight=[];
    var tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" ds_data="_#v#_" flag="_#flag#_">_#n#_</a></li>';
    if(type=="customer"){
        tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" ds_data="_#v#_" flag="_#flag#_" title＝“_#n#_”>_#n#_</a></li>';
        tmpl=tmpl.replace(/_#action#_/g,"customer.customer_quick_search");
    }else if(type=="business"){
        tmpl=tmpl.replace(/_#action#_/g,"business.quick_flow_search");
    }else if(type=="business_step"){
        tmpl=tmpl.replace(/_#action#_/g,"business.quick_step_search");
    }
    quick_row.empty();
    var _idx=0;
    for (var i = 0; i <dic.length; i++) {
        var _d = dic[i];
        _d.flag="";
        var len=quick_row.outerWidth(true)||0;
//            console.info(" len=="+len+" maxLen=="+maxLen);
        if(len>maxLen||_idx>0){
            if(_idx<1){
                var last=quick_row.find("li:last");
                last.find("a").attr("flag","right");
                htmlRight.push(last.prop("outerHTML"));
                last.remove();
            }
            _idx++;
            _d.flag="right";
            htmlRight.push(DS.renderViewNew(tmpl,_d));
        }else{
            quick_row.append(DS.renderViewNew(tmpl,_d));
        }
    }
    //deal last item
    var len=quick_row.outerWidth(true);
    if(len>maxLen){
        var last=quick_row.find("li:last");
        last.find("a").attr("flag","right");
        htmlRight.push(last.prop("outerHTML"));
        last.remove();
    }
    quick_row.find("li:first").addClass("active");
    if(htmlRight.length>0){
        var _more=container.find(".more_search_next");
        _more.show();
        _more.find(".dropdown-menu").html(htmlRight.join(""));
    }
}
function initQuickMenu(searchPane,dic,type,filter){
    var container=searchPane;
    if(filter){
        container=searchPane.find(filter);
    }
    var quick_menu=container.find(".quick_menu");
    dic=dic||[];

    var tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" ds_data="_#v#_" flag="_#flag#_">_#n#_</a></li>';
    if(type=="customer"){
        tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" ds_data="_#v#_" flag="_#flag#_" title＝“_#n#_”>_#n#_</a></li>';
        tmpl=tmpl.replace(/_#action#_/g,"customer.customer_quick_search");
    }else  if(type=="business"){
        tmpl=tmpl.replace(/_#action#_/g,"business.quick_flow_search");
//    }else if(type=="business_step"){
//        tmpl=tmpl.replace(/_#action#_/g,"business.quick_step_search");
    }else if(type=="customerTask"){
        tmpl=tmpl.replace(/_#action#_/g,"customer.task.customerTask_quick_search");
    }
    quick_menu.empty();
    for (var i = 0; i <dic.length; i++) {
        var _d = dic[i];
        quick_menu.append(DS.renderViewNew(tmpl,_d));
    }
    quick_menu.find("li:first>a").addClass("quick_card_active").click();
}

function setDateTimeCondition (/*query object*/query) {
    var fields={};
    for(var k in query){
        if(k.indexOf("begin_date")!=-1 || k.indexOf("end_date")!=-1){
            fields[k.substring(0, k.indexOf("-"))]="1";
        }
    }
    for (var field in fields) {
        if(query[field+"-begin_date"] && query[field+"-end_date"]){
            query[field]={"$gte":query[field+"-begin_date"],"$lte":query[field+"-end_date"]};
        }else if(query[field+"-begin_date"]){
            query[field]={"$gte":query[field+"-begin_date"]}  ;
        }else if(query[field+"-end_date"]){
            query[field]={"$lte":query[field+"-end_date"]} ;
        }
        delete  query[field+"-begin_date"];
        delete  query[field+"-end_date"];
    }
}
/*
 * 获得时间差,时间格式为 年-月-日 小时:分钟:秒 或者 年/月/日 小时：分钟：秒
 * 其中，年月日为全格式，例如 ： 2010-10-12 01:00:00
 * 返回精度为：秒，分，小时，天
 */
function getDateDiff(startTime, endTime, diffType) {
    //console.info("startTime==="+startTime+",endTime===="+endTime+",diffType===="+diffType);
    //将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式
    startTime = startTime.replace(/\-/g, "/");
    endTime = endTime.replace(/\-/g, "/");

    //将计算间隔类性字符转换为小写
    diffType = diffType.toLowerCase();
    var sTime = new Date(startTime);      //开始时间
    var eTime = new Date(endTime);  //结束时间
    //作为除数的数字
    var divNum = 1;
    switch (diffType) {
        case "second":
            divNum = 1000;
            break;
        case "minute":
            divNum = 1000 * 60;
            break;
        case "hour":
            divNum = 1000 * 3600;
            break;
        case "day":
            divNum = 1000 * 3600 * 24;
            break;
        default:
            break;
    }
    return parseInt((eTime.getTime() - sTime.getTime()) / parseInt(divNum));
}
function CRMPopvorInit(){
    var CRMPopover = $("#CRMPopover");
    CRMPopover.draggable({
        scroll: false,
        cancel: ".title" ,
        start: function () {
            CRMPopover.append($('<div class="CRMPopover_mask" style="width:100%;height: 100%;position:absolute;z-index: 100;top:0"></div>'));
            $('.loading_indicator').css({visibility:'visible'});
            $('.main_header').css({position:'relative','z-index':11});

        },
        stop: function(e) {
            if(this.offsetTop<51){
                $(this).css({top:'51px',bottom:'auto'});
            }
            if(this.offsetTop+51>window.innerHeight){
                $(this).css({top:window.innerHeight-29+'px',bottom:'auto'});
            }
            if(CRMPopover.width() == 200){
                if(this.offsetLeft<-55){
                    $(this).css({left:'-55px',right:'auto'});
                }
            }else{
                if(this.offsetLeft<115-this.offsetWidth){
                    $(this).css({left:115-this.offsetWidth+'px',right:'auto'});
                }
            }
            if(this.offsetLeft+40>=window.innerWidth){
                $(this).css({left:window.innerWidth-40+'px',right:'auto'});
            }
            CRMPopover.find('.CRMPopover_mask').remove();
            $('.loading_indicator').css({visibility:'hidden'});
            $('.main_header').removeAttr("style");
        }
    }).resizable({
        minHeight: 30,
        minWidth: 201,
        start: function () {
            CRMPopover.append($('<div class="CRMPopover_mask" style="width:100%;height: 100%;position:absolute;z-index: 100;top:0"></div>'));
            $('.loading_indicator').css({visibility:'visible'});
        },
        stop:function(){
            $(this).find('.CRMPopover_mask').remove();
            $('.loading_indicator').css({visibility:'hidden'});
            var crm_width = this.clientWidth,crm_height = this.clientHeight;
            if(this.offsetLeft<115-crm_width){
                crm_width = 115 - this.offsetLeft;
                $(this).width(crm_width);
            }
            if(this.offsetTop+crm_height>window.innerHeight){
                crm_height = window.innerHeight - this.offsetTop;
                $(this).height(crm_height);
            }
            $(this).attr({'crm_height':crm_height,'crm_width':crm_width}).find('.panel-body').height(crm_height-43);

        },
        resize:function(){
            $(this).find('.panel-body').height(this.clientHeight-43);
        }
    });
    $(window).resize(function(){
        if(CRMPopover[0].offsetTop<51){
            CRMPopover.css({top:'51px',bottom:'auto'});
        }
        if(CRMPopover[0].offsetTop+51>window.innerHeight){
            CRMPopover.css({top:window.innerHeight-29+'px',bottom:'auto'});
        }
        if(CRMPopover.width() == 200){
            if(this.offsetLeft<-55){
                $(this).css({left:'-55px',right:'auto'});
            }
        }else{
            if(this.offsetLeft<115-this.offsetWidth){
                $(this).css({left:115-this.offsetWidth+'px',right:'auto'});
            }
        }
        if(CRMPopover[0].offsetLeft+40>=window.innerWidth){
            CRMPopover.css({left:window.innerWidth-40+'px',right:'auto'});
        }
        var crm_width = CRMPopover[0].clientWidth,crm_height = CRMPopover[0].clientHeight;
        if(crm_width != 0){
            if(CRMPopover[0].offsetLeft<115-crm_width){
                crm_width = 115 - CRMPopover[0].offsetLeft;
                CRMPopover.width(crm_width);
            }
            if(CRMPopover[0].offsetTop+crm_height>window.innerHeight){
                crm_height = window.innerHeight - CRMPopover[0].offsetTop;
                CRMPopover.height(crm_height);
            }
            CRMPopover.attr({'crm_height':crm_height,'crm_width':crm_width}).find('.panel-body').height(crm_height-43);
        }
    })
    CRMPopover.find('.CRMPopover_close').click(function(){
        CRMPopover.hide();
    });
    CRMPopover.find('.minimize_btn').toggle(function () {
        CRMPopover.resizable( "disable" ).css('opacity',1);
        CRMPopover.height('30').width('200').css({right:0,bottom:0,left:'auto',top:'auto'});
        var l = CRMPopover.offset().left+'px';
        var t = CRMPopover.offset().top+'px';
        CRMPopover.css({left:l,top:t,right:'auto',bottom:'auto'}).find('iframe').hide().end().find('.minimize_btn').empty().html('<span class="CRMPopover_btn_icon_active"></span>');
    },function(){
        CRMPopover.resizable( "enable");
        if(CRMPopover.attr('crm_height')){
            var crm_height = CRMPopover.attr('crm_height'),crm_width = CRMPopover.attr('crm_width');
            CRMPopover.height(crm_height).width(crm_width).css({right:0,bottom:0,left:0,top:0,margin:'auto'});
        }else{
            CRMPopover.height('553').width('960').css({right:0,bottom:0,left:0,top:0,margin:'auto'});
        }
        var l = CRMPopover.offset().left+'px';
        var t = (CRMPopover.offset().top>51?CRMPopover.offset().top:51)+'px';
        CRMPopover.css({left:l,top:t,right:'auto',bottom:'auto'}).find('.minimize_btn').empty().text('-');
        CRMPopover.find('iframe').show();
    });
}
CRMPopvorInit();
