var session = {};
var errMsg="服务异常";
var domain="";
var qiniu7moorDomain='http://7xj0za.com1.z0.glb.clouddn.com/';
function init(param,_domain) {
    DS.init({
        ds_url: "/action",
        ds_handler: handler,
        ds_root_view_dir :"/views"
    });

    if(param && param['sid']){
        var type=param['type'];
        if(type=='taobao'){
            _taobaoLogin(param);
        }else if(type=='resetPwd'){
            _redirectRestPwd(param);
        }else{
            var dest=param['dest'];
            _billlogin(param['sid'],dest);
        }
    }else{
        updateView(_domain);
    }

    $("#logoff").on("click", function (e) {
        _logoff();
    });

    $(document).on("click", ".nav.nav-tabs a", function (event) {
        var src = $(event.currentTarget);
        src.closest('ul.nav-tabs').children('li').removeClass('active');
        src.parent('li').addClass('active');
    });

    $('body').on("keypress",'input[type="text"]',function (e) {
        var key = e.which;
        if (key == 13) {
            e.preventDefault();
        }
    });
    //禁止后退键 作用于Firefox、Opera
    document.onkeypress = forbidBackSpace;
    //禁止后退键  作用于IE、Chrome
    document.onkeydown = forbidBackSpace;
    checkIEVersion();
};
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
function _taobaoLogin(param) {
    var pane=$("#login-panel");
    DS.getView('taobao_finish', function (view) {
        view=view.replace(/_#_id#_/g,param['sid']);
        view=view.replace(/_#companyName#_/g,param['companyName']||'');
        pane.html(view);
    });
}
function _redirectRestPwd(param) {
    var pane=$("#login-panel");
    DS.getView('pwd/resetpwd', function (view) {
        view=view.replace(/_#key#_/g,param['sid']);
        pane.html(view);
    });
}
function _billlogin(sid,dest) {
//    if(sid && sid.indexOf('#')!=-1)return;
    session.id=sid;
    var action = {
        action: 'app.billLogin',
        data: {}
    };
    DS.send(action,function(rep){
        if(rep.success){
            session.id = rep.sessionId;
            session.account = rep.account;
            var tmplData={
                domain:'7moor'
            }
            domain="7moor";
            $("#pane_tmpl_main_head").html(template("tmpl_main_head",tmplData));
            $("#pane_tmpl_main_foot").html(template("tmpl_login_foot",tmplData));
            if(domain=='7moor'){
                $(".domain_aboutUs").show();
            }else{
                $(".domain_aboutUs").remove();
            }
            _afterLogin(dest);
            DS.setCookie("loginName", rep.account.name, 30);
            DS.setCookie("session", rep.sessionId, 1);
        }else{
            $().alertmessage('showError', "'会话已过期");
        }
    })
}
function _login() {
    var login = DS.getDataOfForm($("#login-form"));
    if (login.succeed) {
        login.data.type = 'ucenter';
        var action = {
            action: 'login',
            data: login.data
        };
        var loginName=login.data.loginName;
        var password=login.data.password;
        if(!$.trim(loginName)){
            $().alertmessage('showError', "请输入账户登录名");
            return;
        }
        if(!$.trim(password)){
            $().alertmessage('showError', "请输入密码");
            return;
        }
        DS.login(action,function (data) {
            if (data.success) {
                session.id = data.sessionId;
                if (data.account) {
                    session.account = data.account;
                    _afterLogin();
                    DS.setCookie("loginName", loginName, 30);
                    DS.setCookie("session", data.sessionId, 1);
                    if (login.data.remember) {
                        DS.setCookie("password", password, 30);
                        DS.setCookie("remember", true, 30);
                    } else {
                        DS.setCookie("password", "", 30);
                        DS.setCookie("remember", false, 30);
                    }
                }
            } else {
                if (data.code === 404) {
                    $().alertmessage('showError', "账户登录名或密码错误");
                } else {
                    $().alertmessage('showError', errMsg);
                }

            }
        });
    }
}

function _afterLogin(dest) {
//    showPayCheck($(".user-header"));
    $("#login-panel").css("display", "none");
    $("#main-panel").css("display", "block");
    //$("#user_name").text(session.user.name);
//    $("#main_user_role").text(session.user.name);
//    $("#main_user_login_time").text(session.user.lastLoginTime);
    _getDicCache(dest);
    handler.initAccountTitle();
    if(session.account.createMethod!='proxy'){
        $("#main-panel").find(".notfiySet").show();
    }else{
        if(session.account.isNotify){
            $("#main-panel").find(".notfiySet").show();
        }else{
            $("#main-panel").find(".notfiySet").remove();
        }
        var uid=session.account.createUser;
        if(!session.account.billIdentity && (uid=='0f5c6220-ac3e-11e4-8d00-2f5c31d3c492'||uid=='9b3249d0-c8b8-11e5-ac08-fde01d82480a'||uid=='f4beca80-c888-11e5-93a6-95c9328465a9'
            ||uid=='14e44060-b4ed-11e5-9eef-71a93a55b452'||uid=='3e9dea70-e43e-11e5-99da-8f071f1d3c06'||uid=='00904ca0-fd61-11e5-a10f-cb5f103a810d'
            ||uid=='37923910-279c-11e6-89ac-a11f1191e13a'||uid=='c2c09560-6f1b-11e6-9026-1940e2b45afe')){
            $("#main-panel").find(".btn_bank_pay").hide();
        }
    }
}
function _getDicCache(dest){
    var action = {
        action: 'app.getDicCache'
    };
    DS.send(action, function (response) {
        if (response.success) {
            session.dicMap = response.dicMap;
            if(dest){
                handler.loadMainView2Dest("index/idx_main",dest);
            }else{
                handler.loadMainView("index/idx_main");
            }
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
                    return copy(cache[i]);
                }
            }
            return null;
        }
        return cache;
    } else {
        var action = {
            action: 'app.getDicCache',
            data :{type:type}
        };
        DS.send(action,function(rep){
            if(rep.success){
                session.dicMap[type] = rep.data||[];
            }else{
                session.dicMap[type]=[];
                $().alertmessage('showError', "获取缓存数据异常！");
            }
        },"POST",false,true);
        return getCache(type,id);
    }
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
function getGeneralDicName(type, value) {
    type = type || "";
    value = value || "";
    var dic = getCache(type) || [];
    for (var i = 0; i < dic.length; i++) {
        if (dic[i].codeValue == value) {
            return dic[i].codeName;
        }
    }
    return value;
}


function copy(obj) {
    obj = obj || {};
    var result = {};
    for (var key in obj) {
        result[key] = obj[key];
    }
    return result;
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

//filed用来判断需要选中的项
function generateComboxOptionsFromDocs(docs, codeName, codeValue,filed, currentFiledValue) {
    var selectOptionHtml = '<option value="__value" selected>__name</option>';
    var optionHtml = '<option value="__value">__name</option>';
    var resultOptions = '';

    for (var i = 0; i < docs.length; i++) {
        if (docs[i][filed] === currentFiledValue) {
            resultOptions += selectOptionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, docs[i][codeName]);
        } else {
            resultOptions += optionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, docs[i][codeName]);
        }
    }
    return resultOptions;
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
}
function _getLoginView(tmplData) {
    if(domain=='7moor'){
        var ico="./img/favicon.ico";
        $("#domain_favicon").attr("href",ico);
    }
    DS.getView("login", function (data) {
        $("#login-panel").empty();
        $("#login-panel").html(data);
        $("#pane_tmpl_login_head").html(template("tmpl_login_head",tmplData));
        $("#pane_tmpl_login_foot").html(template("tmpl_login_foot",tmplData));
        $("#pane_login_download").html(template("tmpl_login_download",tmplData));

        $("#pane_tmpl_main_head").html(template("tmpl_main_head",tmplData));
        $("#pane_tmpl_main_foot").html(template("tmpl_login_foot",tmplData));

        if(domain=='7moor'){
            $(".domain_aboutUs").show();
        }else{
            $(".domain_aboutUs").remove();
        }

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
        $("#login").on("click", function (e) {
            _login();
        });
        $("#login-form").find(":input").keydown(function(event){
            if(event.keyCode == 13){
                event.preventDefault();
                $("#login").click();
            }
        });
    });
}

function updateView(_domain) {
    var urls=['127.0.0.1','user.7moor.com','localhost'];
    var tmplData={
        domain:'7moor'
    }
    if(urls.indexOf(_domain)==-1){
        var command={
            action:'app.thirdCustom.getDomainInfoById',
            data:$.toJSON({_id:_domain})
        }
        $.ajax({
            type: "GET",
            url: "/action",
            data: command,
            timeout: 30000,
            dataType: "json",
            success: function (rep, status){
                if(rep.success){
                    tmplData=rep.row;
                    _getLoginView(tmplData);
                }else{
                    domain="7moor";
                    _getLoginView(tmplData);
                }
            },
            error: function (xhr, status, error) {
                domain="7moor";
                _getLoginView(tmplData);
//                $().alertmessage('showError', '请求超时或网络问题,' + status || error);
            }
        });
    }else{
        domain="7moor";
        _getLoginView(tmplData);
    }
}

function showMenu(id,src){
    var url='';
    $(src).closest("#left_pane").find(".list-group-item").removeClass("active");
    $(src).addClass("active");
    url='./views/'+id+'.html';
    $.ajax({
        type: "GET",
        url: url,
        timeout: 10000,
        cache:false,
        success: function (view, status) {
            $("#right_pane > div").hide();
            $("#right_pane").find("#"+id).html(view);
            $("#right_pane").find("#"+id).show();
        }
    });
}
function showFunCheck(fun,parent,callback){
    var _obj=parent.find(".bill_hide");
    if(!isHasFunc(fun)){
        _obj.remove();
    }else{
        _obj.show();
    }
    if(typeof callback=='function'){
        callback();
    }
}
function showPayCheck(parent,callback){
    var flag=session.account.payFlag;
    if(!flag){
        parent.find(".pay_hide").show();
    }
    if(typeof callback=='function'){
        callback(flag);
    }
}
function showBillCheck(parent,callback){
//    var billLoginName=session.account.billLoginName;
    var billIdentity=session.account.billIdentity;

    var roles=['admin',"operation"];
    if($.inArray(billIdentity,roles)!=-1){
        parent.find(".bill_hide").show();
        parent.find(".service_hide").show();
        parent.find(".bill_service_hide").show();
    }else{
        if(billIdentity=='service'){
            parent.find(".service_hide").show();
            parent.find(".bill_service_hide").show();
        }
        var _obj=parent.find(".bill_hide");
        _obj.remove();
    }

    if(typeof callback=='function'){
        callback();
    }
}
function showProxyCheck(parent,callback){
    var billIdentity=session.account.billIdentity;
    var roles=['proxy'];
    if($.inArray(billIdentity,roles)!=-1){
        parent.find(".proxy_hide").show();
    }else{
        var _obj=parent.find(".proxy_hide");
        _obj.remove();
    }
    if(typeof callback=='function'){
        callback();
    }
}

function isHasFunc(key){
    var funcIds=session.account.billLimits||[];
    if($.inArray(key,funcIds)!=-1){
        return true;
    }
    return false;
}
var getDateDesc = function (date) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
    day = day > 9 ? day : '0' + day;
    return year + "-" + month + "-" + day;
}
/*
* 获得时间差,时间格式为 年-月-日 小时:分钟:秒 或者 年/月/日 小时：分钟：秒
* 其中，年月日为全格式，例如 ： 2010-10-12 01:00:00
* 返回精度为：秒，分，小时，天
*/
function GetDateDiff(startTime, endTime, diffType) {
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

function calculateTalkTime(beginTime, endTime) {
    if (beginTime == null || endTime == null || beginTime == undefined || endTime == undefined) {
        return '00:00:00';
    }
    var begin = new Date(Date.parse(beginTime.replace(/-/g, "/")));
    var end = new Date(Date.parse(endTime.replace(/-/g, "/")));

    var time = end.getTime() - begin.getTime();
    return formatTime(time / 1000);
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
function app_timer(countTimer) {
    if(countTimer<=0){
        return '00:00:00';
    }
    var hour = "0";
    var minute = "0";
    var second = "0";

    countTimer = parseInt(countTimer) - 1;
    hour = parseInt(countTimer/3600);
    minute = parseInt((countTimer%3600)/60);
    second = (countTimer%3600)%60;

    var mtime = (hour<10)? "0" + hour : hour;
    mtime += ":";
    mtime += (minute<10)? "0" + minute : minute;
    mtime += ":";
    mtime += (second<10)? "0" + second : second;
    return mtime;
}

function parseHref(url){
    var reg=/\?(\S*)/;
    var arr=reg.exec(url);
    if(!arr||arr.length==0) return {};
    var p1=arr[1].split('&');
    var p={};
    $(p1).each(function(){
        var t=this.split('=');
        p[t[0]]=t[1];
    });
    return p;
}

function mailTo(){
    var agent=navigator.userAgent.toLowerCase();
    var rMsie = /(msie\s|trident.*rv:)([\w.]+)/;
    var match = rMsie.exec(agent);
    if (!match) {
        $("#ds_iframe").attr("src","mailto:service@7moor.com");
    }
    return;
}

function checkIEVersion(){
    var userAgent = navigator.userAgent,
        rMsie = /(msie\s|trident.*rv:)([\w.]+)/;
    var browser;
    var version;
    var ua = userAgent.toLowerCase();
    var uaMatch=function(ua) {
        var match = rMsie.exec(ua);
        if (match != null) {
            return { browser : "IE", version : match[2] || "0" };
        }
        if (match == null) {
            return { browser : "", version : "0" };
        }
    }
    var browserMatch = uaMatch(ua);
    if (browserMatch && browserMatch.browser) {
        browser = browserMatch.browser;
        version = browserMatch.version;
    }
    if(browser=='IE' && version && parseInt(version)<8){
//        var p=$('#service_modal');
//        p.find(".modal-dialog").width(450);
//        p.find('.modal-title').text('您使用的浏览器版本过低');
//        var html='<p style="margin:15px 0 40px;">很抱歉，您正在使用的浏览器无法完全支持我们的页面；请使用ie8及以上版本或其他浏览器(推荐使用谷歌chrome浏览器)进行访问。</p>';
//        p.find(".modal-body").html(html);
//        p.modal();

        $("#browser").show();
    }
}
function hideBrowser(){
    $('#browser').hide();
}

function getDicCheckbox(name,type,/*array*/checkVal){
    var html=[];
    var selectOptionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="'+name+'[]" fieldgroup="1" value="__value" checked="checked">__name</label>';
    var optionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="'+name+'[]" fieldgroup="1" value="__value">__name</label>';
    var ary=getCache(type);
    if(!ary || ary.length==0) return null;
    for (var i=0;i<ary.length;i++) {
        var obj=ary[i];
        if(checkVal && $.inArray(obj.codeValue,checkVal)!=-1){
            html.push(selectOptionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
        } else{
            html.push(optionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
        }
    }
    return html.join("");
}
function getDicOptions(dic,currentVal,showDft){
    var html=[];
    if(showDft!='no'){
        html.push("<option value=''>--请选择--</option>");
    }
    var selectOptionHtml = "<option value='__value' selected>__name</option>";
    var optionHtml = "<option value='__value'>__name</option>";""
    var ary=dic;
    if(!ary || ary.length==0) return null;
    for (var i=0;i<ary.length;i++) {
        var obj=ary[i];
        if(currentVal && currentVal==obj._id){
            html.push(selectOptionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
        } else{
            html.push(optionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
        }
    }
    return html.join("");
}

function getFilterDicOptions(type,currentVal,showDft,filters,showFilter){
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
                filterAry[obj._id]=obj.name;
            }
        }
        ary=newAry;
        if(showFilter){
            var _filterAry=[];
            for(var j=0;j<filters.length;j++){
                var id=filters[j];
                _filterAry.push({_id:id,name:filterAry[id]});
            }
            ary=_filterAry;
        }
    }

    for (var i=0;i<ary.length;i++) {
        var obj=ary[i];

        if(currentVal && currentVal==obj._id){
            html.push(selectOptionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.name));
        } else{
            html.push(optionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.name));
        }
    }
    return html.join("");
}

function getAgentDicByProduct(type,currentVal,/*string*/filter){
    var html=[];
    html.push("<option value=''>--请选择--</option>");
    var selectOptionHtml = "<option value='__value' selected>__name</option>";
    var optionHtml = "<option value='__value'>__name</option>";
    var ary=getCache(type);
    if(!ary || ary.length==0) return null;
    var newAry=[];
    for (var i=0;i<ary.length;i++) {
        var obj=ary[i];
        if(obj.product==filter){
            newAry.push(obj);
        }
    }
    ary=newAry;

    for (var i=0;i<ary.length;i++) {
        var obj=ary[i];
        if(currentVal && currentVal==obj._id){
            html.push(selectOptionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.displayName));
        } else{
            html.push(optionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.displayName));
        }
    }
    return html.join("");
}


function isImage(url) {
    var res, suffix = "";
    var imageSuffixes = ["png", "jpg", "jpeg", "gif", "bmp"];
    var suffixMatch = /\.([a-zA-Z0-9]+)(\?|\@|$)/;
//    console.info("url====="+url);
    if (!url || !suffixMatch.test(url)) {
        return false;
    }
    res = suffixMatch.exec(url);
//    console.dir(res);
    suffix = res[1].toLowerCase();
    for (var i = 0, l = imageSuffixes.length; i < l; i++) {
        if (suffix === imageSuffixes[i]) {
            return true;
        }
    }
    return false;
}