var DS = {
    _ds_url: "",
    _ds_handler: {},
    _ds_session: {},
    _ds_root_view_dir: "",
    init: function (config) {
        DS._ds_url = config.ds_url;
        DS._ds_handler = config.ds_handler;
        DS._ds_root_view_dir = config.ds_root_view_dir;
        this.framework._initClickHandler();
    },
    send: function (action, callback,method,async,hideLoading) {
        DS.util.sendAction(action,callback,method,async,hideLoading);
    },
    downloadFile: function (fileUrl) {
//        var url = fileUrl + "&sessionId=" + session.id;
        var url = fileUrl;
        var id = "downloadFile_Frame";
        if ($("#" + id).length > 0) {
            $("#" + id).remove();
        }
        var frame = $("<iframe id=" + id + " style='display:none;' src='" + url + "' </iframe>");
        $('body').append(frame);
    },
    getView: function (view, callback) {
        DS.util.getBufferedView(view, callback);
    },
    copy: function (obj) {
        return DS.util.copy(obj);
    },
    getCurrentDateTime: function () {
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
    },
    //获取当月的月份
    getCurrentDateMonth : function(){
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        return year + "-" + month
    },
    /**
     **判断是否为当年当月的最后一天
     */
    isLastDay:function(yearV,monthV,dayV){
        var new_year = yearV; //取当前的年份
        var new_month = monthV+1;//取下一个月的第一天，方便计算（最后一天不固定）
        if(new_month>12) //如果当前大于12月，则年份转到下一年
        {
            new_month -=12; //月份减
            new_year++; //年份增
        }
        var new_date = new Date(new_year,new_month,1); //取当年当月中的第一天
        var lastDay = (new Date(new_date.getTime()-1000*60*60*24)).getDate();//获取当月最后一天日期
        if(lastDay==dayV){
            return true;
        }else{
            return false;
        }
    },
/**
 **计算距离月底还有几天
 */
    getLastDayAway:function(yearV,monthV,dayV){
        var new_year = yearV; //取当前的年份
        var new_month = monthV+1;//取下一个月的第一天，方便计算（最后一天不固定）
        if(new_month>12) //如果当前大于12月，则年份转到下一年
        {
            new_month -=12; //月份减
            new_year++; //年份增
        }
        var new_date = new Date(new_year,new_month,1); //取当年当月中的第一天
        var lastDay = (new Date(new_date.getTime()-1000*60*60*24)).getDate();//获取当月最后一天日期
        var away_day = lastDay-dayV;
        return away_day;
    },
    getLastDayAway2:function(){
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        day = day > 9 ? day : '0' + day;
        var new_date = new Date(year,month,1); //取当年当月中的第一天
        var lastDay = (new Date(new_date.getTime()-1000*60*60*24)).getDate();//获取当月最后一天日期
        var away_day = lastDay-day;
        return away_day;
    },
    /**
     * @param startDate
     * 开始日期
     * @param endDate
     * 结束日期
     * @return 计算相差月份，必须满足正好一个月才进一
     */
    getDateMonthSub:function(startDate, endDate) {
        if (startDate == null || startDate == undefined || startDate == ""
            || endDate == null || endDate == undefined || endDate == "")
            return 0;
        var endDate = new Date(endDate);
        var startDate = new Date(startDate);
        var renNumber = 0;
        var yearToMonth = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        // 计算年份相差月份
        renNumber += yearToMonth;
        var startYear = startDate.getFullYear();// 开始日期-年份
        var endYear = endDate.getFullYear();// 结束日期-年份
        var startMon = startDate.getMonth();// 开始日期-月份
        var endMon = endDate.getMonth();// 结束日期-月份
        var startDay = startDate.getDate();// 开始日期-日
        var endDay = endDate.getDate();// 开始日期-日
        var monthToMonth = endDate.getMonth() - startDate.getMonth();
        // 计算月份相差
        renNumber += monthToMonth;
        // 如果开始日期是最后一天并且结束日期不是最后一天，那么返回值-1
        if (DS.isLastDay(startYear, startMon, startDay)
            && !DS.isLastDay(endYear, endMon, endDay)) {
            renNumber -= 1;
            return renNumber;
        } else {
        // 如果开始日期和结束日期都不是最后一天
            if (!DS.isLastDay(startYear, startMon, startDay)
                && !DS.isLastDay(endYear, endMon, endDay)) {
        // 如果都不是最后一天，就需要计算开始日期和结束日期的天数距离结束还有几天,分别为start_last,end_last
                var start_last = DS.getLastDayAway(startYear, startMon, startDay);
                var end_last = DS.getLastDayAway(endYear, endMon, endDay);
        // 如果结束日期距离月底的天数比开始日期距离月底的天数大，则返回值-1
                if (end_last > start_last) {
                    renNumber -= 1;
                    return renNumber;
                } else {
                    return renNumber;
                }
            } else {
        // 如果开始日期和结束日期的天都是当月的最后一天，那么相差月份就是实际月份相减的值
        // 其他情况都直接返回renNumber
                return renNumber;
            }
        }
    },
    //获取下月1日
    getNextMonth1 :function(){
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        month =parseInt(month,10)+1;
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        if(parseInt(month,10) > 12){
            year++;
            month = 01;
        }
        return year + "-" + month+ "-01" ;
    },
    //获取某个月的天数
    getDaysInOneMonth : function (year, month){
        month = parseInt(month, 10);
        var d= new Date(year, month, 0);
        return d.getDate();
    },
    //获取一个给定日期的月份
    getMonthInOneDate : function (date) {
        var year = date.getFullYear();
        var month = date.getMonth();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        return year + "-" + month;
    },
    dateAdd : function (interval, number, date) {
        switch (interval) {
            case   "y"   :
            {
                date.setFullYear(date.getFullYear() + number);
                return   date;
                break;
            }
            case   "q"   :
            {
                date.setMonth(date.getMonth() + number * 3);
                return   date;
                break;
            }
            case   "M"   :
            {
                date.setMonth(date.getMonth() + number);
                return   date;
                break;
            }
            case   "w"   :
            {
                date.setDate(date.getDate() + number * 7);
                return   date;
                break;
            }
            case   "d"   :
            {
                date.setDate(date.getDate() + number);
                return   date;
                break;
            }
            case   "h"   :
            {
                date.setHours(date.getHours() + number);
                return   date;
                break;
            }
            case   "m"   :
            {
                date.setMinutes(date.getMinutes() + number);
                return   date;
                break;
            }
            case   "s"   :
            {
                date.setSeconds(date.getSeconds() + number);
                return   date;
                break;
            }
            default   :
            {
                date.setDate(date.getDate() + number);
                return   date;
                break;
            }
        }
    },
    getCurrentDate: function () {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        day = day > 9 ? day : '0' + day;
        return year + "-" + month + "-" + day;
    },
    //获取两个日期之间的月份数，包括两个日期所在的月份
    getBetweenMonths : function(end , begin){
        end = end.split("-");
        begin = begin.split("-");
        var year1 = parseInt(end[0]) ,
            month1 = parseInt(end[1]) ,
            year2 = parseInt(begin[0]) ,
            month2 = parseInt(begin[1]) ,
        months = (year2 - year1) * 12 + (month2-month1) + 1;
        return months;
    },
    //获取日期之间的天数
    getBetweenDays : function (end, begin) {
        begin = begin || this.getCurrentDate();
        var diffent = Date.parse(end) - Date.parse(begin);
        return Math.floor(diffent / (1000 * 60 * 60 * 24));
    },
    getMonthDay : function(date,num){
        var oldDay=date.getDate();
        date.setMonth(date.getMonth()+num);
        //console.dir(date.getMonth());
        var newDay= date.getDate();
        if(oldDay>newDay){
            date.setDate(0);
        }
        return date;
    },
    //获取本月的天数
    getCurrentMonthDay : function(){
        var date=new Date();
        date.setDate(1);//设为本月1号
        date.setMonth(date.getMonth()+1);
        date.setDate(0);//设为上月最后一天
        var newDay= date.getDate();
        return newDay;
    },
    updatePagination: function (formId, count, limit, index) {
        var pagination = $(".pagination[for='" + formId + "']");
//        pagination.find("span.result_count").text(count);
        var list = pagination.find("li");
        list.removeClass("active");
        if (count == 0) {
            list.addClass("disabled");
            list.children("a").attr("app", "disabled");
            return;
        }
        var pages = Math.ceil(count / limit);
        var start = Math.floor((index - 1) / 5) * 5;
        var end = start + 5;
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
                if (pages > end) {
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
    },
    renderView: function (view, data, dir) {
        var oldDir = null;
        if (dir) {
            dir = dir + '.';
        } else {
            dir = '';
        }
        for (var i in data) {
            if (typeof data[i] == 'object' && typeof data[i] != null) {
                oldDir = dir;
                dir = dir + i;
                view = DS.renderView(view, data[i], dir);
                dir = oldDir;
                oldDir = null;
            } else {
                view = view.replace(new RegExp('__' + dir + i, 'g'), data[i]);
            }
        }
        return view;
    },
    renderViewNew: function (view, data, dir) {
        var oldDir = null;
        if (dir) {
            dir = dir + '.';
        } else {
            dir = '';
        }
        for (var i in data) {
            if (typeof data[i] == 'object' && typeof data[i] != null) {
                oldDir = dir;
                dir = dir + i;
                view = DS.renderViewNew(view, data[i], dir);
                dir = oldDir;
                oldDir = null;
            } else {
                view = view.replace(new RegExp('_#' + dir + i + '#_', 'g'), data[i]);
            }
        }
        return view;
    },
    renderMethodViewNew: function (view, data) {
        var html = DS.renderView(view, data);
        html = DS.renderViewNew(html, data);
        return DS.transformDataByMethod(html);
    },
    renderMethodView: function (view, data) {
        var html = DS.renderView(view, data);
        return DS.transformDataByMethod(html);
    },
    transformDataByMethod: function (html) {
        var reg = /_@.*?@_/;
        while (reg.test(html)) {
            var resp = reg.exec(html);
            var methodStr = resp[0].substring(2, resp[0].length - 2);
            var result = eval("handler." + methodStr);
            html = html.replace(resp[0], result);
        }
        return html;
    },
    getCookie: function (name) {
        return DS.util.getCookie(name);
    },
    setCookie: function (name, value, days) {
        DS.util.setCookie(name, value, days);
    },
    getDataOfForm: function (form) {
        return DS.util.getDataOfForm(form);
    },
    objectToForm: function (node, obj) {
        return DS.util.objectToForm(node, obj);
    },
    login: function (action, callback, errorCallback) {
        DS.framework._login(action, callback, errorCallback);
    },
    framework: {
        _login: function (action, callback, errorCallback) {
            DS.util.sendCommand(action, function (data) {
                if (data.success) {
                    DS._ds_session.id = data.sessionId;
                }
                callback(data);
            }, errorCallback);
        },
        _initClickHandler: function () {
            $(document).on("focus", ".ds_datetime", function (event) {
                var src = $(event.currentTarget);
                src.datetimepicker({
//                    showButtonPanel: true
                });
            });
            $(document).on("focus", ".ds_date", function (event) {
                var src = $(event.currentTarget);
                var options={
//                    changeMonth: true,
//                    changeYear: true,
                    showButtonPanel: true
                }
                var minDate=src.attr("minDate");
                if(minDate){
                    options.minDate=0
                }
                src.datepicker(options);
            });
            $(document).on("focus", ".ds_time", function (event){
                var src = $(event.currentTarget);
                src.timepicker();
            });
            $(document).on("click", ".pagination li a", function (event) {
                event.preventDefault();
                var src = $(event.currentTarget);
                if (src.attr("app") == "enable") {
                    var pagination = src.closest(".pagination");
                    var data = DS.getDataOfForm($("#" + pagination.attr("for")));
                    var action = pagination.attr("ds_pagination_action");

                    var actionHandler = eval('handler.' + action);
                    if (actionHandler) {
                        actionHandler(data.data, src);
                    } else {
                        console.log('action handler [' + action + '] is not support!');
                    }
                }
            });

            $(document).on("click", ".ds_show_view", function (event) {
                event.preventDefault();
                var src = $(event.currentTarget);
                var view = src.attr("ds_view");
                var data = src.attr("ds_data");
                var container = $("#" + src.attr("ds_container"));
                DS.framework.showView(container, view);
            });

            $(document).on("click", ".ds_form_action", function (event) {
                event.preventDefault();
                var src = $(event.currentTarget);
                var action = src.attr("ds_action");
                var form = src.attr("ds_form") ? $(src.attr("ds_form")) : src.closest("form");
                try{
                    form.validate();
                    if(form && !form.valid()) return false;
//                    if(validate && !validate.validate(from)) return false;
                }catch(e){}
                var data = DS.util.getDataOfForm(form);
                if (data.succeed) {
                    var actionHandler = eval('DS._ds_handler.' + action);
                    if (actionHandler) {
                        actionHandler(data.data, src);
                    } else {
                        console.log('action handler [' + action + '] is not support!');
                    }
                }
            });
            $(document).on("click", ".ds_do_action", function (event) {
                event.preventDefault();
                var src = $(event.currentTarget);
                var action = src.attr("ds_action");
                var data = src.attr('ds_data');
                var actionHandler = eval('DS._ds_handler.' + action);
                if (actionHandler) {
                    actionHandler(data, src);
                } else {
                    console.log('action handler [' + action + '] is not support!');
                }
            });
            $(document).on("click", ".ds_do_action2", function (event) {
                var src = $(event.currentTarget);
                var action = src.attr("ds_action");
                var data = src.attr('ds_data');
                var actionHandler = eval('DS._ds_handler.' + action);
                if (actionHandler) {
                    actionHandler(data, src);
                } else {
                    console.log('action handler [' + action + '] is not support!');
                }
            });
            $(document).on("change", ".ds_upload", function (event) {
                var src = $(event.currentTarget);
                var xhr = new XMLHttpRequest();
                if (window.FormData) {
                    var fd = new FormData();
                    fd.append('upload', event.currentTarget.files[0]);
                    fd.append('sessionId', session.id);
                    if (src.attr('fileId')) {
                        fd.append('fileId', src.attr('fileId'));
                    }
                    if (src.attr('storageType')) {
                        fd.append('type', src.attr('storageType'));
                    }
                    if (src.attr('onloaded')) {
                        xhr.addEventListener("load", function (evt) {
                            eval('handler.' + src.attr('onloaded') + '(evt)');
                        }, false);
                    }

                    if (src.attr('onprogress')) {
                        xhr.addEventListener("progress", function (evt) {
                            eval('handler.' + src.attr('onprogress') + '(evt)');
                        }, false);
                    }

                    if (src.attr('onerror')) {
                        xhr.addEventListener("error", function (evt) {
                            eval('handler.' + src.attr('onerror') + '(evt)');
                        }, false);
                    }

                    if (src.attr('onabort')) {
                        xhr.addEventListener("abort", function (evt) {
                            eval('handler.' + src.attr('onabort') + '(evt)');
                        }, false);
                    }
                    xhr.open("POST", "./fileUpload");
                    xhr.send(fd);
                } else {
                    $().alertmessage('showError', "您的浏览器不支持文件上传！");
                }
            });
            $(document).on("click", ".ds_show_model", function (event) {
                event.preventDefault();
                var src = $(event.currentTarget);
                var targetId = src.attr("ds_targetId");
                var dsdata = src.attr("ds_data");
                var onshown = src.attr("ds_onshown");
                if ($("#" + targetId).length < 1) {
                    var view = src.attr("ds_view");
                    $("body").append("<div id=\"" + targetId + "\" class=\"modal hide fade\" " +
                        "tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=true></div>");
                    var container = $("#" + targetId);
                    DS.util.getView(view + ".html", function (data) {
                        container.empty();
                        container.html(data);
                        $("#" + targetId).modal("show");
                        $("#" + targetId).on("shown", function () {
                            eval("handler." + onshown + "(dsdata)");
                        })
                    });
                } else {
                    $("#" + targetId).modal('show');
                    $("#" + targetId).on("shown", function () {
                        eval("handler." + onshown + "(dsdata)");
                    })
                }
            });
        },
        showView: function (container, view) {
            container.empty();
            if (!DS._ds_session[view]) {
                DS.util.getView(view + ".html", function (data) {
                    DS._ds_session[view] = data;
                    container.empty();
                    container.html(data);
                    resize();
                });
            } else {
                container.html(session[view]);
            }
        }
    },
    util: {
        copy: function (obj) {
            obj = obj || {};
            var result = {};
            for (var key in obj) {
                result[key] = obj[key];
            }
            return result;
        },
        getBufferedView: function (view, callback) {
            if (!DS._ds_session[view]) {
                DS.util.getView(view + ".html", function (data) {
                    DS._ds_session[view] = data;
                    callback(data);
                });
            } else {
                callback(DS._ds_session[view]);
            }
        },

        getView: function (view, callback, errorCallback) {
            $.ajax({
                type: "GET",
                url: "." + DS._ds_root_view_dir + "/" + view,
                timeout: 10000,
                cache: false,
                success: function (data, status) {
                    if (typeof callback == "function") {
                        callback(data);
                    }
                    if (data && !data.Succeed && data.SessionTimeout == 1) {
                        alert("会话已经失效，请您重新登录");
                        window.location.href = "./";
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    if (errorCallback && (typeof errorCallback == "function")) {
                        errorCallback(xhr, status, error);
                    } else {
                        if (xhr.statusText != 'success') {
                            $().alertmessage('showError', '请求超时或网络问题,' + status || error);
                        }
                    }
                }
            });
        },
        setCookie: function (name, value, days) {
            var cookieTime = days * 24 * 60 * 60 * 1000;
            var d = new Date();
            d.setTime(d.getTime() + cookieTime);
            var cookieExpires = "; expires=" + d.toGMTString();
            document.cookie = name + "=" + escape(value) + cookieExpires + "; path=/";
        },

        getCookie: function (name) {
            var strCookie = document.cookie;
            var arrCookie = strCookie.split("; ");
            for (var i = 0; i < arrCookie.length; i++) {
                var arr = arrCookie[i].split("=");
                if (arr[0] == name)
                    return arr[1];
            }
            return "";
        },
        sendAction: function (action, callback,method,async,hideLoading) {
            if(!method) {
                method = "GET";
            }
            if(async !== false){
                async = true;
            }
            if (session.id) {
                if (!hideLoading) {
                    $(".loading_indicator_span").css("visibility", "visible");
                    $(".loading_indicator").css("visibility", "visible");
                }
                action.sessionId = session.id;
                action.action_id = Math.random();
                action.data = action.data || {idle: ""};
                if (method && method == "POST") {
                    DS.util.sendPostCommand(action, function (response) {
                        $(".loading_indicator_span").css("visibility", "hidden");
                        $(".loading_indicator").css("visibility", "hidden");
                        callback(response);
                    }, function () {
                        $(".loading_indicator_span").css("visibility", "hidden");
                        $(".loading_indicator").css("visibility", "hidden");
                        callback({
                            succeed: false
                        });
                    },async);
                } else {
                    DS.util.sendCommand(action, function (response) {
                        $(".loading_indicator_span").css("visibility", "hidden");
                        $(".loading_indicator").css("visibility", "hidden");
                        callback(response);
                    }, function () {
                        $(".loading_indicator_span").css("visibility", "hidden");
                        $(".loading_indicator").css("visibility", "hidden");
                        callback({
                            succeed: false
                        });
                    },async);
                }
            } else {
                $().alertmessage('showError', "您还未登陆, 不能发送请求");
            }
        },
        sendCommand: function (command, callback, errorCallback,async) {
//            console.dir(command)
            var data = $.toJSON(command.data);
            command.data = data;
            $.ajax({
                type: "POST",
                url: DS._ds_url,
                data: command,
                timeout: 30000,
                dataType: "jsonp",
                async: async,
                jsonp: "callback",
                success: function (data, status) {
                    if (typeof callback == "function") {
                        callback(data);
                    }
                    if (data && !data.Succeed && data.SessionTimeout == 1) {
                        $().alertmessage('showError', '会话已经失效，请您重新登录');
                        window.setTimeout(function(){
                            window.location.href = "./";
                        },1000);
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    if (errorCallback && (typeof errorCallback == "function")) {
                        errorCallback(xhr, status, error);
                    } else {
                        if (xhr.statusText != 'success') {
                            $().alertmessage('showError', '请求超时或网络问题,' + status || error);
                        }
                    }
                }
            });
        },
        sendPostCommand:function(command, callback, errorCallback,async) {
            var data = $.toJSON(command.data);
            command.data = data;
            $.ajax({
                type: "POST",
                url: DS._ds_url,
                async: async,
                data: command,
                timeout: 30000,
                dataType: "json",
                success: function (data, status) {
                    if (typeof callback == "function") {
                        callback(data);
                    }
                    if (data && !data.Succeed && data.SessionTimeout == 1) {
                        $().alertmessage('showError', '会话已经失效，请您重新登录');
                        window.setTimeout(function(){
                            window.location.href = "./";
                        },1000);
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    if (errorCallback && (typeof errorCallback == "function")) {
                        errorCallback(xhr, status, error);
                    } else {
                        if (xhr.statusText != 'success') {
                            $().alertmessage('showError', '请求超时或网络问题,' + status || error);
                        }
                    }
                }
            });
        },
        getDataOfForm: function (form) {
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
                    } else if (ele[0].type == 'number') {
                        var pattern = /^[0-9]+\.{0,1}[0-9]{0,2}$/;
                        if (!pattern.test(value)) {
                            var label = ele.prev("label");
                            if (label) {
                                alert("[" + label.text() + "]输入错误");
                            }
                            ele.focus();
                            break;
                        }
                    }
                    if (!name)
                        continue;

//                    if (ele.attr("required") && !value) {
//                        succeed = false;
//                        var label = ele.prev("label");
//                        if (label) {
//                            alert("[" + label.text() + "]需要填写");
//                        }
//                        ele.focus();
//                        break;
//                    }


                    if (name.match(/\w\[\]/g)) {
                        name = name.substring(0, name.length - 2);
                        if (!data[name]) {
                            data[name] = new Array();
                        }
                        data[name].push(value);
                    } else if ((ele[0].tagName) == "SELECT" && ele[0].name == 'role') {
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
        },
        objectToForm: function (node, obj) {
            if (obj) {
                var iq = "input:not([type=file]):not([type=image]):not([type=reset]):not([type=button]),select,textarea";
                var nodes = $(iq, node);
                nodes.each(function (i) {
                    if (obj[nodes[i].name]) {
                        var values = obj[nodes[i].name];
                        if (typeof(values) == "object") {
                            values = values.toString();
                        }
                        if ((nodes[i].type || "").toLowerCase() == "checkbox") {
                            if (values == true) {
                                nodes[i].checked = true;
                            } else {
                                nodes[i].checked = false;
                            }
                        } else if ((nodes[i].type || "").toLowerCase() == "radio") {
                            if (values == nodes[i].value) {
                                nodes[i].checked = true;
                            } else {
                                nodes[i].checked = false;
                            }
                        } else {
                            nodes[i].value = values;
                        }
                    }
                });
            }
            return node;
        }
    }

}

