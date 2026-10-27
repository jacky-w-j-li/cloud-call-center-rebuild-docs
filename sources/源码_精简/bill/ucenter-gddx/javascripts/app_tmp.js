var session = {};
function init() {
    DS.init({
        ds_url: "http://127.0.0.1:3000/action",
        ds_handler: handler,
        ds_root_view_dir :"/views"
    });
    updateView();
    resize();

    $(window).resize(function () {
        resize();
    });
    $("#login").live("click", function (e) {
        _login();
    });
    $("#logoff").live("click", function (e) {
        _logoff();
    });
    $(".jspScrollable").each(function () {
        _initScroll($(this));
    });
};

function _login() {
    var login = DS.getDataOfForm($("#login-form"));
    if (login.succeed) {
        var action = {
            action: 'login',
            data: login.data
        };
        DS.login(action,function (data) {
            if (data.success) {
                session.id = data.sessionId;
                if (data.user) {
                    session.user = data.user;
                    _afterLogin();
                    DS.setCookie("loginName", session.user.loginName, 30);
                    DS.setCookie("session", session.user._id, 1);
                    if (login.data.remember) {
                        DS.setCookie("password", session.user.password, 30);
                        DS.setCookie("remember", true, 30);
                    } else {
                        DS.setCookie("password", "", 30);
                        DS.setCookie("remember", false, 30);
                    }
                }
            } else {
                alert("邮箱或密码错误");
            }
        }, function () {
            alert('服务异常');
        });
    }
}

function _afterLogin() {
    $("#login-panel").css("display", "none");
    $("#main-panel").css("display", "block");
    //$("#user_name").text(session.user.name);
    $("#main_user_role").text(session.user.name);
    $("#main_user_login_time").text(session.user.lastLoginTime);
    _getDicCache();
}

function _getDicCache() {
    var action = {
        action: 'common.getDicCache'
    };
    DS.send(action, function (response) {
        if (response.success) {
            session.dicMap = response.dicMap;
            _getMenu();
        }
    });
}


function getCache(type,id) {
    type = type || "";
    var cache = [];
    if (session.dicMap[type])
        cache = session.dicMap[type];
    if(id == "") return "";

    if(id ){
        for(var i=0;i<cache.length;i++){
            if(cache[i]._id == id){
                return DS.copy(cache[i]);
            }
        }
        return id;
    }
    return cache;
}

function getDicCache(type,value){
    type = type || "";
    var cache = session.dicMap[type] || [];
    if(value == "") return "";
    if(value){
        for(var i=0;i<cache.length;i++){
            if(cache[i].code_value == value){
                return DS.copy(cache[i]);
            }
        }
        return value;
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

function _getMenu() {
    var action = {
        action: 'common.getMenu'
    };
    DS.send(action, function (response) {
        if (response.success) {
            _initClientMenu(response.data);
        }
    });
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
    $(".right_col").css("height",$(window).height() - 41);
    $(".right_col").css("width",$(window).width() - 201);
    resizeScroll($(".left_nav"));
    resizeScroll($(".contact_list"));
    resizeScroll($(".contact_detail"));
}


function updateView() {
    DS.getView("login", function (data) {
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

function _initClientMenu(menuData) {
    var navMenuPane = $("#nav_menu");
    navMenuPane.empty();
    var temp = "<li class='divider-vertical'></li><li ><a href='#' class='ds_do_action' ds_action='initSubMenu' ds_data='__id' data-toggle='tab'>__name</a></li>";
    var menus = menuData.menu || [];
    session.clientMenu = menus;
    for (var i = 0; i < menus.length; i++) {
        if(!menus[i].isHidden){
            var html = render.replaceDataByObject(menus[i], temp);
            navMenuPane.append(html);
        }

    }
    $("#nav_menu a:first").click();
}







