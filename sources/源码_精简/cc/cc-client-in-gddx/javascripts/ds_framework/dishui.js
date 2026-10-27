var DS = {
    _ds_url: "",
    _ds_handler: {},
    _ds_session: {},
    _ds_root_view_dir: "",
    _ds_report_url: "",
    init: function (config) {
        DS._ds_url = config.ds_url;
        DS._ds_report_url = config.ds_report_url;
        DS._ds_handler = config.ds_handler;
        DS._ds_root_view_dir = config.ds_root_view_dir;
        this.framework._initClickHandler();
    },
    send: function (action, callback,method,async,hideLoading,timeout) {
        DS.util.sendAction(action,callback,method,async,hideLoading,timeout);
    },
    sendUrl: function (url,action, callback,method,async,hideLoading) {
        DS.util.sendActionWithUrl(url,action,callback,method,async,hideLoading);
    },
    downloadFile: function (fileUrl) {
        var url = fileUrl + "&sessionId=" + session.id;
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

    getCurrentDate: function () {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        day = day > 9 ? day : '0' + day;
        return year + "-" + month + "-" + day;
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
        pagination.find("span.result_count").text(count);
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
            if (typeof data[i] == 'object' && typeof data[i] != null && data[i] != null) {
                oldDir = dir;
                dir = dir + i;
                view = DS.renderView(view, data[i], dir);
                dir = oldDir;
                oldDir = null;
            } else {
                if(data[i] == null){
                    view = view.replace(new RegExp('__' + dir + i, 'g'), '');
                }else{
                    view = view.replace(new RegExp('__' + dir + i, 'g'), data[i]);
                }
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
            if (typeof data[i] == 'object' && typeof data[i] != null && data[i] != null) {
                oldDir = dir;
                dir = dir + i;
                view = DS.renderView(view, data[i], dir);
                dir = oldDir;
                oldDir = null;
            } else {
                if(data[i] == null){
                    view = view.replace(new RegExp('_#' + dir + i + '#_', 'g'), '');
                }else{
                    view = view.replace(new RegExp('_#' + dir + i + '#_', 'g'), data[i]);
                }
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
    showSearchTips:function(form, isCdr){
        DS.util.showSearchTips(form, isCdr);
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
            $(document).on("change", "#batch_autoCallStrategy", function (event) {
                var src = $(event.currentTarget);
                var pane=src.parent("div").next(".free_agent_count");
                var val=src.val();
                if(val=='smart'){
                    pane.show();
                }else{
                    pane.hide();
                }
            });
            $(document).on("click", "#my_queue_info", function (event) {
                var src = $(event.currentTarget);
                var curQueueId=src.attr("queueId");
                var _queueId="";
                var idx=$.inArray(curQueueId,session.myQueue);
                var len=session.myQueue.length;
                if(idx!=-1){
                    if(idx==len-1){
                        _queueId=session.myQueue[0];
                    }else if(idx<len-1){
                        _queueId=session.myQueue[idx+1];
                    }
                }
                var item=phone_queues[_queueId];
                if(item){
                    _changeMyQueue(item);
                }
//                $('#queue_popover').popover('hide');
            });
            $(document).on("click", ".EverTopADiv .dicplus", function (event) {
                var src = $(event.currentTarget);
                if($('#issys').val() == "sys" && src.parent().parent().hasClass('sys_dic_2')){
                    var issys_nums = src.closest('.dicEverTop').find('ul.pressed').children();
                    if(issys_nums.length == 0){
                        addDicRow(src.closest('.dicEverTop').find('ul.pressed'));
                    }
                }else{
                    addDicRow(src.closest('.dicEverTop').find('ul.pressed'));
                }
            });
            $(document).on("click", ".EverTopADiv .dicreduce", function (event) {
                var src = $(event.currentTarget);
                removeDicRow(src);
            });
            $(document).on("click", ".actionforcheckbox", function (event) {
                var src = $(event.currentTarget);
                var action = src.attr("ds_action");
                var data = src.attr('ds_data');
                var actionHandler = eval('handler.' + action);
                if (actionHandler) {
                    actionHandler(data, src);
                } else {
                    console.log('action handler [' + action + '] is not support!');
                }
            });
            $(document).on("focus", ".ds_datetime", function (event) {
                var src = $(event.currentTarget);
                    src.datetimepicker({
                     });
            });
            $(document).on("focus", ".ds_date", function (event) {
                var src = $(event.currentTarget);
                var options={
//                    changeMonth: true,
//                    changeYear: true,
                    showButtonPanel: true
                };
                var minDate=src.attr("minDate");
                if(minDate){
                    options.minDate=0;
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
                    src.addClass("page_on");
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

            $(document).on("click", ".show_result li label,.set_result li span.set_add", function (event) {
                event.preventDefault();
                var src = $(event.currentTarget);
                var action = src.attr("ds_action");
                var actionHandler = eval('handler.' + action);
                if (actionHandler) {
                    actionHandler(src);
                } else {
                    console.log('action handler [' + action + '] is not support!');
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
                var from = src.attr("ds_form") ? $(src.attr("ds_form")) : src.closest("form");
                try{
                    if(validate && !validate.validate(from)) return false;
                }catch(e){}
                var data = DS.util.getDataOfForm(from);
                if (data.succeed) {
                    var beginandend = [];
                    beginandend.push(from.find('input[name*="begin"]').closest("div"));
                    beginandend.push(from.find('input[name*="BEGIN"]').closest("div"));
                    beginandend.push(from.find('input[name*="BEGIN"]').parent("div.input-append").parent('div'));
                    for(var j=0;j<beginandend.length;j++){
                        for(var i=0;i<beginandend[j].length;i++){
                            var begin=beginandend[j].eq(i).find('input[name*="begin"]').val()||beginandend[j].eq(i).find('input[name*="BEGIN"]').val();
                            var end=beginandend[j].eq(i).find('input[name*="end"]').val()||beginandend[j].eq(i).find('input[name*="END"]').val();
                            if(begin && end){
                                var arraySta = parseInt(begin.replace(/-/g,"").replace(/:/g,"").replace(/ /g,""));
                                var arrayEnd = parseInt(end.replace(/-/g,"").replace(/:/g,"").replace(/ /g,""));
                                var count= (begin.split(":").length )-1;
                                var flag = (begin.split("-").length )-1;
                                var msg =beginandend[j].eq(i).find('input[name*="BEGIN"]').parent("div.input-append").prev("label").text()|| beginandend[j].eq(i).find('label').eq(0).text();
                                if(flag!==0){
                                    if(arrayEnd <arraySta){
                                        $().alertmessage('showError', msg+'的开始时间必须小于结束时间！');
                                        return;
                                      }
                                    if(count==2&&arrayEnd==arraySta){
                                        $().alertmessage('showError',msg+'的开始时间不能等于结束时间！');
                                        return;
                                      }
                                }else{
                                if(flag===0&&arrayEnd <= arraySta){
                                  $().alertmessage('showError',msg+'的范围有误');
                                  return;
                                  }
                                }
                            }
                        }
                    }
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
            $(document).on("click", ".weixin_radio", function (event) {
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
            $(document).on("change", "#advanced_search_email",function(event){
                var src = $(event.currentTarget);
                var categorys = getCache('mailCategorys');
                var cathtml = [];
                cathtml.push("<option value=''>--请选择--</option>");
                if(src.val()){
                    for(var i=0; i<categorys.length; i++){
                        if(src.val() == categorys[i].relateMailAddr){
                            cathtml.push("<option value='"+categorys[i]._id+"'>"+categorys[i].categoryName+"</option>");
                        }
                    }
                }
                src.closest('.row-fluid').find('select[name="category"]').html(cathtml.join(''));
            })
            $(document).on("change", ".weixin-name,.ds_webchat_action,.ds_change_action", function (event) {
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
                var reqAction=src.attr("ds_attr");
                var xhr = new XMLHttpRequest();
                var frm = src.closest("form");
                if (window.FormData) {
                    var fd = new FormData();
                    var file = event.currentTarget.files[0];
                    if (!file)return false;
                    var fType = file.type;
                    var fSize = file.size;
                    var fName = file.name;
                    if (src.attr("fileType")) {
                        var types = src.attr("fileType").split("|");
//                var mimes=getMimeType(types);
                        var suffix = fName.substring(fName.lastIndexOf(".") + 1);
                        if ($.inArray(suffix, types) == -1) {
                            alert("上传文件类型不匹配!");
                            return false;
                        }
                    }
                    if (src.attr("fileSize")/*min unit is K*/) {
                        var maxSize = parseInt(src.attr("fileSize"), 10) * 1024;
                        if (fSize > maxSize) {
                            alert("上传文件超过了最大大小" + maxSize / 1024 + "K!");
                            return false;
                        }
                    }
                    fd.append('upload', file);
                    fd.append('sessionId', session.id);
                    if (src.attr('fileId')) {
                        fd.append('fileId', src.attr('fileId'));
                    }
                    if (src.attr('storageType')) {
                        fd.append('type', src.attr('storageType'));
                    }
                    if (src.attr('onloaded')) {
                        xhr.addEventListener("load", function (evt) {
                            eval('handler.' + src.attr('onloaded') + '(evt,src)');
                        }, false);
                    }

                    if (src.attr('onprogress')) {
                        xhr.upload.addEventListener("progress", function (evt) {
                            eval('handler.' + src.attr('onprogress') + '(evt,src)');
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
                    if(reqAction=="imgUpload"){
                        xhr.open("POST", "./imgUpload");
                    }else{
                        xhr.open("POST", "./fileUpload");
                    }
                    xhr.send(fd);
                } else {
                    alert("您的浏览器不支持文件上传！");
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
                    }, function () {
                        alert('get view failed');
                    });
                } else {
                    $("#" + targetId).modal('show');
                    $("#" + targetId).on("shown", function () {
                        eval("handler." + onshown + "(dsdata)");
                    })
                }
            });
            $(document).on("click", ".nav.nav-list a", function (event) {
                var src = $(event.currentTarget);
                src.closest('ul.nav-list').children('li').removeClass('active');
                src.parent('li').addClass('active');
            });
            $(document).on("blur", ".combox_agent_input", function (event){
                var src = $(event.currentTarget);
                var pane=src.closest("div.combobox_agent");
                var dropPane=pane.find(".phone_search_input");
                var prev=pane.prev();
                if(prev.length>0){
                    var val=prev.val();
                    if(dropPane.length>0 && dropPane.css("display")!="none"){
                        var total =dropPane.attr("total");
                        if(total != 1) {
                            if(val=="serachInputNoresult"){
                                prev.val("");
                                src.val("");
                            }
                        }
                    }else{
                        if(val=="serachInputNoresult"){
                            prev.val("");
                            src.val("");
                        }
                    }
                }
            });
//            $(document).on("mouseover", ".left_column .quick_card", function (event) {
//                var src = $(event.currentTarget);
//                src.find(".caret").css("visibility","visible");
//            });

            $(document).on("mouseover", ".list_item_check .item_check", function (event) {
                var src = $(event.currentTarget);
                if (src.closest(".card_pane").attr("id")=="view_webchat_all") {//im全部不显示
                    return;
                }
                src.find(".ico_select_checkbox").show();
                src.find(".cdr_add_memo_pencil").show();
                src.find(".cdr-call-customer").show();
            });
            $(document).on("mouseout", ".list_item_check .item_check", function (event) {
                var src = $(event.currentTarget);
                src.find(".ico_select_checkbox").hide();
                src.find(".cdr_add_memo_pencil").hide();
                src.find(".cdr-call-customer").hide();
            });
            $(document).on("click", ".list_item_check .item_check_toggle", function (event) {
                var src = $(event.currentTarget);
                checkItemEvent(src);
            });
            $(document).on("click", ".list_item_check .ico_select_checkbox", function (event) {
                event.stopPropagation();
                var src = $(event.currentTarget);
                checkItemEvent(src);
            });
            $(document).on("click", ".list_check_all", function (event) {
                var src = $(event.currentTarget);
                var pane=null;
                var toolbarPane=$("#pane_deal_list");
                var isCdr = false;
                var isWebchat = false;
                var isEmail = false;
                if(toolbarPane.find(".bus_wrap").length>0){
                    pane=$("#contact_list_business");
                }else if(toolbarPane.find(".mail_wrap").length>0){
                    pane=$("#contact_list_channel");
                }else if(toolbarPane.find(".webchat_wrap").length>0){
                    pane=$("#contact_list_webchat");
                    isWebchat = true;
                }else if(toolbarPane.find(".cdr_wrap").length>0){
                    pane=$("#contact_list_cdr");
                    isCdr=true;
                }else if(toolbarPane.find(".email_wrap").length>0){
                    pane=$("#contact_list_"+handler.email.curSubMenu);
                    isEmail = true;
                }else if(toolbarPane.find(".ques_task_wrap").length>0){
                    pane=$("#import_list_"+handler.config.questionnaire.import.curSubMenu);
                }else{
                    var _menu=handler.customer.curSubMenu;
                    pane=$("#contact_list_"+_menu);
                }
                var list=pane.find(".list-inside");
                var total=pane.find(".pagination .result_count").text()||"0";
                if(isCdr){
                     if($('#contact_list_cdr .btn_cdr_my').hasClass('active')){
                         total = $('#view_cdr_my').find(".pagination .result_count").text()||"0";
                     }else{
                         total = $('#view_cdr_all').find(".pagination .result_count").text()||"0";
                     }
                }
                if(isWebchat){
                    //total = $('#view_webchat_todo').find(".list_item").length||"0";
                    total = $('#view_webchat_todo').find(".list_item_check").length||0;
                }
                if(isEmail){
                    total = $('#view_email_todo').find(".list_item").length||"0";
                }
                if(src.hasClass("select_on")){
                    pane.find(".cancel_edit .list_check_all").removeClass("select_on select_half");
                    toolbarPane.find(".list_check_all").removeClass("select_on select_half");
                    list.find(".list_item_check").removeClass("select_on");
                    toolbarPane.find(".bottom_toolbar_selsize_num").text("0");
                    pane.find(".cancel_edit .bottom_toolbar_selsize_num").text("0");
                }else{
                    pane.find(".cancel_edit .list_check_all").removeClass("select_half").addClass("select_on");
                    toolbarPane.find(".list_check_all").removeClass("select_half").addClass("select_on");
                    list.find(".list_item_check").addClass("select_on");
                    toolbarPane.find(".bottom_toolbar_selsize_num").text(total);
                    pane.find(".cancel_edit .bottom_toolbar_selsize_num").text(total);
                }
            });
            $(document).on("click", ".left_column .advanced_search_pane", function (event) {
                event.stopPropagation();
            });
            $(document).on("click", ".config_left .advanced_search_pane", function (event) {
                event.stopPropagation();
            });
            $(document).on("click", ".noPropagation", function (event) {
                event.stopPropagation();
            });

            //jquery ui datepicker
            $(document).on("click", ".ui-datepicker.ui-widget", function (event) {
                event.stopPropagation();
            });
            $(document).on("click", ".ui-datepicker-prev", function (event) {
                event.stopPropagation();
            });
            $(document).on("click", ".ui-datepicker-next", function (event) {
                event.stopPropagation();
            });
            $(document).on("click", ".ui-datepicker-current", function (event) {
                event.stopPropagation();
            });
            $(document).on("click", ".ui-datepicker-close", function (event) {
                event.stopPropagation();
            });


            $(document).on("click", ".left_column .quick_card", function (event) {
                var src = $(event.currentTarget);
                var position=src.position();
//                console.dir(position);
                src.find("~ ul").css({top:20+"px",left:position.left+"px"})
            });
            $(document).on("keydown", ".left_column .textbox_input", function (event) {
                var src = $(event.currentTarget);
                //console.dir(src)
                if(event.keyCode == 13){
                    event.preventDefault();
                    src.closest("form").find(".normal_search").click();     
                               }
            });
            $(document).on("keyup", ".ds_selectItem_action", function (event) {
                var src = $(event.currentTarget);
                               var data = src.val();
                               var key_action = src.attr("keyup_selectitem_action");
                               var actionHandler = eval('DS._ds_handler.' + key_action);
                               if (actionHandler) {
                                   actionHandler(data, src,event);
                               } else {
                                   console.log('action handler [' + key_action + '] is not support!');
                               }                  
                      
            });

            $(document).on("click", ".right_column .cust_detail", function (event) {
                event.stopPropagation();
            });

            $(document).on("focus", ".ds_focus_action", function(event){
                event.preventDefault();
                var src = $(event.currentTarget);
                var focus_action = src.attr("focus_action");
                var data = src.attr('ds_data');
                var actionHandler = eval('DS._ds_handler.' + focus_action);
                if (actionHandler) {
                    actionHandler(data, src);
                } else {
                    console.log('action handler [' + focus_action + '] is not support!');
                }
            });

            $(document).on("blur", ".ds_focus_action", function(event){               
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

            $(document).on("keyup", ".ds_key_action", function(event){
                var src = $(event.currentTarget);
                var key_action = src.attr("keyup_action");
                var data = src.val();
                var actionHandler = eval('DS._ds_handler.' + key_action);
                if (actionHandler) {
                    actionHandler(data, src);
                } else {
                    console.log('action handler [' + key_action + '] is not support!');
                }
            });
            $(document).on("keyup", ".ds_hide_action", function(event){
                var src = $(event.currentTarget);
                var data = src.val();
                if(event.keyCode == 13){
                    data=13
                }
                var key_action = src.attr("keyup_hide_action");
                var actionHandler = eval('DS._ds_handler.' + key_action);
                if (actionHandler) {
                    actionHandler(data, src);
                } else {
                    console.log('action handler [' + key_action + '] is not support!');
                }
            });
            $(document).on("mouseover", ".his_comment", function (event) {
                var src = $(event.currentTarget);
                src.popover('show');
            });
            $(document).on("mouseout", ".his_comment", function (event) {
                var src = $(event.currentTarget);
                src.popover('hide');
            });
            $(document).bind('click',function () {
            $('.search-suggest').hide();
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
                }, function () {
                    alert('get view failed');
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
                }, function () {
                    alert('get view failed');
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
                            $().toastmessage('showError', '请求超时或网络问题,' + status || error);
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
        sendActionWithUrl: function (url, action, callback,method,async,hideLoading) {
            if(!method) {
                method = "POST";
            }
            if(async !== false){
                async = true;
            }
            if (session.id) {
                if (!hideLoading) {
                    $(".loading_indicator").css("visibility", "visible");
                    $(".loading_indicator_span").css("visibility", "visible").addClass("dload");
                }
                action.sessionId = session.id;
                action.action_id = Math.random();
                action.data = action.data || {idle: ""};
                if (method && method == "POST") {
                    DS.util.sendPostCommand(action, function (response) {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback(response);
                    }, function () {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback({
                            succeed: false
                        });
                    },async, url);
                } else {
                    DS.util.sendCommand(action, function (response) {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback(response);
                    }, function () {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback({
                            succeed: false
                        });
                    },async, url);
                }
            } else {
                $().alertmessage('showError', "您还未登陆, 不能发送请求");
            }
        },
        sendAction: function (action, callback,method,async,hideLoading,timeout) {
            if(!method) {
                method = "POST";
            }
            if(async !== false){
                async = true;
            }
            if (session.id) {
                if (!hideLoading) {
                    $(".loading_indicator").css("visibility", "visible");
                    $(".loading_indicator_span").css("visibility", "visible").addClass("dload");
                }
                action.sessionId = session.id;
                action.action_id = Math.random();
                action.data = action.data || {idle: ""};
                if (method && method == "POST") {
                    DS.util.sendPostCommand(action, function (response) {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback(response);
                    }, function () {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback({
                            succeed: false
                        });
                    },async,null,timeout);
                } else {
                    DS.util.sendCommand(action, function (response) {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback(response);
                    }, function () {
                        $(".loading_indicator").css("visibility", "hidden");
                        $(".loading_indicator_span").css("visibility", "hidden").removeClass("dload");
                        callback({
                            succeed: false
                        });
                    },async);
                }
            } else {
                $().alertmessage('showError', "您还未登陆, 不能发送请求");
            }
        },
        sendCommand: function (command, callback, errorCallback,async, url) {
            var data = $.toJSON(command.data);
            command.data = data;
            $.ajax({
                type: "GET",
                url: url || DS._ds_url,
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
        sendPostCommand:function(command, callback, errorCallback,async, url, timeout) {
            var data = $.toJSON(command.data);
            command.data = data;
            $.ajax({
                type: "POST",
                url: url || DS._ds_url,
                async: async,
                data: command,
                timeout: timeout != null ? timeout : 30000,
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
                    if(value.indexOf("****")!=-1 && ele.attr("bgTel")){
                        value=ele.attr("bgTel")||'';
                        if(value){
                            value=getEncryptTel(value);
                        }
                    }
                    if (ele[0].type == 'checkbox') {
                        var isGroup = ele.attr("fieldgroup");
                        if (isGroup) {
                            if (!ele[0].checked) {
                                value = "7MOORNOCHECKED";//已选中后修改为全不选中后不能continue
                                //continue;
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
                    } else if (ele[0].type == 'select-multiple' && ele.prop("multiple")) {
                        var options=ele[0].options;
                        for(var m=0;m<options.length;m++){
                            options[m].selected=true;
                        }
                        value = ele.val();
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
                        if(value!='7MOORNOCHECKED'){
                            data[name].push(value);
                        }
//                    } else if ((ele[0].tagName) == "SELECT" && ele[0].name == 'role') {
//                        data[name] = new Array();
//                        var options = ele[0].options;
//                        for (var j = 0, len = options.length; j < len; j++) {
//                            data[name].push(options[j].value);
//                        }
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
        },
        showSearchTips:function(/*jquery object*/form, iscdr){
            if(iscdr){
                var isCdrAll=false;
                if(form.find('#isCdrAllAdvanceSearch').length > 0){
                    isCdrAll = true;
                }
            }
            var items = form.find(".ds_search_item");
            var pane=form.closest(".card_pane");
            var other=0;
            if(pane.length==0){
                pane=form.closest(".left_column");/*for business menu*/
            };
            if(pane.length==0){
                other++;
                pane=form.closest(".config_left");/*for config menu*/
            }
            var html = [];
            var tmpl='<span class="badge badge-info">__desc</span>&nbsp;';
            if (items.length>0){
                for (var i = 0; i < items.length; i++) {
                    var item = $(items[i]);
                    var inputs = item.find("input,select,textarea");
                    var desc="";
                    for (var j = 0; j < inputs.length; j++) {
                        var ele = $(inputs[j]);
                        var name = ele.attr("name");
                        var type=ele[0].type;
                        var value = $.trim(ele.val());
                        if(!value)continue;
                        if(type == 'text'){
                            if(form[0].id=='frm_webchat_todo_advanced_search'){
                                if(name == 'visitorsReply'||name == 'custVisitorsReply'){
                                    value = "访客："+value+"分钟以前";
                                }else if(name == 'clientReply'||name == 'custClientReply'){
                                    value = "座席："+value+"分钟以前";
                                }
                            }
                        }else if (type== 'hidden') {
                            continue;
                        }else if (type== 'checkbox') {
                            if (!ele[0].checked) {
                                continue;
                            }else{
                                value=ele.next().text();
                                if(!value){
                                    value=ele.parent().text();
                                }
                            }
                        } else if (type == 'select-one') {
                            value=ele.find('option:selected').text();
                        } else if(type == "radio"){
                            if(!ele[0].checked){
                                continue;
                            }else{
                                value = ele.next().text();
                                if(!value){
                                    value=ele.parent().text();
                                }
                            }
                        }
                        desc+=value+" ";
                    }
                    var descTemp = desc;
                    descTemp = descTemp.trim();
                    if(desc && descTemp){
                        html.push(tmpl.replace(/__desc/g,desc));
                    }
                }
            }
            var filterPane = pane.find('.ds_search_filter');
            if(html.length>0){
                if(iscdr){
                    html.push('<a href="#" title="清除条件" class="remove_filter3" style="margin-left: 10px;">X</a></span></div>');
                    if(isCdrAll){
                        pane.find('.all_cdr_search_filter').html("查询条件："+html.join(""));
                        pane.find('.all_cdr_search_filter').show();
                    }else{
                        pane.find('.my_cdr_search_filter').html("查询条件："+html.join(""));
                        pane.find('.my_cdr_search_filter').show();
                    }
                }else{
                    html.push('<a href="#" title="清除条件" class="remove_filter2" style="margin-left: 10px;">X</a></span></div>');
                    if(form[0].id=='frm_webchat_todo_advanced_search'){
                        filterPane.html("时间检索条件："+html.join(""));
                        filterPane.show();
                    }else{
                        filterPane.html("查询条件："+html.join(""));
                        filterPane.show();
                    }
                }
            }else{
                if(iscdr){
                    if(isCdrAll){
                        pane.find('.all_cdr_search_filter').empty();
                        pane.find('.all_cdr_search_filter').hide();
                    }else{
                        pane.find('.my_cdr_search_filter').empty();
                        pane.find('.my_cdr_search_filter').hide();
                    }
                }else{
                    filterPane.empty();
                    filterPane.hide();
                }
            }
            if(other==0){
                resizeLeftColumn(pane);
            }
        }

    }

}
