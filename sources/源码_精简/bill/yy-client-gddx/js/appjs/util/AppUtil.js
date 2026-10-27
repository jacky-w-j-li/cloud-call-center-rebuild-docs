Ext.define('App.util.AppUtil', {
    requires: ['Ext.data.JsonP', 'App.model.common.DicCache'],
    singleton: true,
    app_constant_domain: './action',
    app_report_domain : './report',
    app_constant_downloadDomain: './downloadFile',
    app_constant_timeout: 10000,
    uuidGenerator: null,
    msgCt: null,
    mask: null,
    request: function (interType, param, callback, self, flag, animateTarget) {
        if (!flag) {
            this.showMask();
        }
        if (param == '' || param == 'undefined') {
            param = {};
        }
        Ext.Ajax.request({
            url: this.app_constant_domain,
            scope: this,
            method: "POST",
            timeout: this.app_constant_timeout,
            params: {
                action: interType,
                sessionId: app_sessionId || "",
                data: Ext.JSON.encode(param)
            },
            success: function (data) {
                var msg = data.responseText || "{}";
                var result = Ext.JSON.decode(msg);
                if (!flag) {
                    App.util.AppUtil.hideMask();
                }
                if (App.util.AppUtil.connectFlag) {
                    App.util.AppUtil.msg('与服务器连接已恢复!');
                    App.util.AppUtil.connectFlag = false;
                }
                if (!result.success && result.code === '1111') {
                    Ext.MessageBox.alert("警告！", "你的账户已失效，请重新登录！",
                        function () {
                            location.reload();
                        });
                }
                callback(result, self, animateTarget);

            },
            failure: function (data) {
                if (!flag) {
                    App.util.AppUtil.hideMask();
                }
                if (!App.util.AppUtil.connectFlag) {
                    App.util.AppUtil.msg('与服务器失去连接，正在尝试重新连接....');
                }
                App.util.AppUtil.connectFlag = true;
            }

        });
    },
    requestSync: function (interType, param, callback, self) {
        param = param || {};
        Ext.Ajax.request({
            url: this.app_constant_domain,
            scope: this,
            method: "POST",
            async: false,
            timeout: this.app_constant_timeout,
            params: {
                action: interType,
                sessionId: app_sessionId || "",
                data: Ext.JSON.encode(param)
            },
            success: function (data) {
                var msg = data.responseText || "{}";
                var result = Ext.JSON.decode(msg);
                if (App.util.AppUtil.connectFlag) {
                    App.util.AppUtil.msg('与服务器连接已恢复!');
                    App.util.AppUtil.connectFlag = false;
                }
                if (!result.success && result.code === '1111') {
                    Ext.MessageBox.alert("警告！", "你的账户已失效，请重新登录！",
                        function () {
                            location.reload();
                        });
                }
                callback(result, self);

            },
            failure: function (data) {
                if (!App.util.AppUtil.connectFlag) {
                    App.util.AppUtil.msg('与服务器失去连接，正在尝试重新连接....');
                }
                App.util.AppUtil.connectFlag = true;
            }

        });

    },
    getUuid: function () {
        if (!this.uuidGenerator) {
            uuidGenerator = Ext.create('Ext.data.UuidGenerator', {
                id: 'uuidGenerator'
            });
        }
        return uuidGenerator.generate();
    },
    requestFileUpload: function (form, interType, callback, self, dataParam) {
        form.submit({
            type: 'submit',
            url: "./session?Action=" + interType + "&ActionID="
            + this.getUuid() + "&SessionID=" + app_sessionId,
            waitMsg: '正在上传你的文件...',
            failure: function (fp, action) {
                App.util.AppUtil.msg('上传文件发生异常！');
            },
            success: function (fp, action) {
                var data = action.result;
                callback(data, self);
            }
        });
    },
    requestDownloadFile: function (fileName, self) {
//		var json = new Object();
//		json.Action = 'DownFile';
//		json.ActionID = this.getUuid();
//		json.SessionID = app_sessionId;

//		json.file = fileName;
        var href = this.app_constant_downloadDomain + "?file=" + fileName + "&sessionId=" + app_sessionId;
//		href += "json=" + data + "&_id=nec";
        window.open(encodeURI(href));

    },
    getDownLoadFileUrl: function (fileName) {
        var json = new Object();
        json.Action = 'DownFile';
        json.ActionID = this.getUuid();
        json.SessionID = app_sessionId;
        json.file = fileName;
        var href = "./session?";
        var data = Ext.JSON.encode(json);
        href += "json=" + data + "&_id=nec";
        return encodeURI(href);
    },
    getReportFileUrl: function (fileName) {
        return this.app_constant_excelReport_domain + "?report=" + fileName;
    },
    getInterfaceUrl: function (interType, data) {
        if (!app_sessionId) {
            app_sessionId = "";
        }
        return this.app_constant_domain + "?action=" + interType + "&sessionId=" + app_sessionId + "&data="
            + encodeURI(Ext.JSON.encode(data));
    },
    getDicUrl: function (key) {
        if (typeof key == 'string') {
            return this.app_constant_domain + "?sessionId=" + app_sessionId + "&action=bill.system.getClientDicCache&data=" + Ext.JSON.encode({type: key});
        } else {
            return this.app_constant_domain + "?sessionId=" + app_sessionId + "&action=bill.system.getClientDicCache&data=" + Ext.JSON.encode(key);
        }
    },
    getDownloadFileUrl: function (fileName) {
        return this.app_constant_fileDownload_domain + "?fileName=" + fileName
            + '&sessionId=' + app_sessionId;
    },
    getBusinessIframe: function (appUrl) {
        var url = appUrl + 'business.html';
        return "<iframe src='" + url
            + "'  width='100%' height='100%' ></iframe>";
    },
    loadCache: function (key) {
        var interFace = 'bill.system.getClientDicCache';
        var param = {type: key};
        this.request(interFace, param, this.loadCacheHandler, this);
    },
    loadCacheHandler: function (data, self) {
        var key = data.key;
        gloab_cdic[key] = data.data;
    },
    getPanelParam: function (field,data) {
        var self=this;
        var panelItems = field.items;
        panelItems.eachKey(function (key2) {
            var field2 = panelItems.get(key2);
            if (field2.isXType('panel')) {
                self.getPanelParam(field2,data);
            }else{
                if (!field2.isXType('label') && !field2.isXType('button') && !field2.isXType('grid') && !field2.isXType('gridview')) {
                    var name = field2.name;
                    var value = '';
                    if(field2.isXType('fieldset')){
                        value = App.util.AppUtil.getFormParam(field2);
                    }
                    else if (field2.isXType('datefield')) {
                        value = field2.getRawValue();
                    } else {
                        value = field2.getValue();
                    }
                    if (value === 'undefined' || value === null) {
                        value = '';
                    }
                    if (value || value === 0) {
                        data.add(name, value);
                    }
                }
            }
        });
    },
    getFormParam: function (form, isAll) {
        var self=this;
        var queryItems = form.items;
        var data = Ext.create('Ext.util.HashMap');
        queryItems.eachKey(function (key) {
            var field = queryItems.get(key);
            if (field.isXType('panel')) {
                self.getPanelParam(field,data);
            }else{
                if (!field.isXType('label') && !field.isXType('button')) {
                    if (field.isXType('fieldset')) {
                        if (field.getSubmitData == undefined) {
                            data.add(field.name, App.util.AppUtil
                                .getFormParam(field, isAll));
                            return;
                        } else {
                            data.add(field.name, field.getSubmitData());
                            return;
                        }
                    }
                    if (field.isXType('grid')) {
                        field.getPlugin("rowEditing").completeEdit();
                        if (isAll) {
                            if (data.containsKey('griddata')) {
                                var id = field.id;
                                data.add('griddata_' + id,
                                    App.util.AppUtil
                                        .getGridData(field));
                                return;
                            }
                            data.add('griddata', App.util.AppUtil
                                .getGridData(field));
                            return;
                        } else {
                            if (data.containsKey('griddata')) {
                                var id = field.id;
                                data.add('griddata_' + id, App.util.AppUtil
                                    .getGridUpdateData(field));
                                return;
                            }
                            data.add('griddata', App.util.AppUtil
                                .getGridUpdateData(field));
                            return;
                        }
                    }
                    var name = field.getName();
                    var value = '';
                    if (field.isXType('datefield')) {
                        value = field.getRawValue();
                    } else {
                        value = field.getValue();
                    }
                    if (value === 'undefined' || value === null) {
                        value = '';
                    }
                    if (value || value === 0) {
                        data.add(name, value);
                    }
                }
            }
        });
        // return Ext.JSON.encode(data.map);
        return data.map;
    },
    getGridData: function (grid) {
        var store = grid.getStore();
        var dataArray = new Array();
        store.each(function (recored) {
            dataArray.push(recored.data);
        });
        return Ext.JSON.encode(dataArray);
    },
    queryGrid: function (obj) {
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            var grid = form.up("panel").down("grid[class='query']");
            if(data&&data.businessTag instanceof  Array){
                if(data.businessTag[0]==undefined){
                    delete data.businessTag
                }else if(data.businessTag[0].length==0){
                    delete data.businessTag
                }
            }
            grid.store.proxy.extraParams.data = Ext.JSON.encode(data);
            grid.store.loadPage(1);
            obj.fireEvent("afterQuery");
        }
    },
    resetQuery: function (obj) {
        var form = obj.up("form[class='query']");
        var fieldSet = form.down("fieldset[class='query']");
        var multiCombo = fieldSet.down("multicombobox");
        if(multiCombo!=null){
            multiCombo.reset();
        }
        App.util.AppUtil.resetFormParam(fieldSet);
        obj.fireEvent("afterReset");
    },
    getGridUpdateData: function (grid) {
        var store = grid.getStore();
        var updateData = store.getUpdatedRecords();
        var dataArray = new Array();
        for (var i = 0; i < updateData.length; i++) {
            dataArray.push(updateData[i].data);
        }
        return Ext.JSON.encode(dataArray);
    },
    resetFormParam: function (form) {
        var queryItems = form.items;
        queryItems.eachKey(function (key) {
            var field = queryItems.get(key);
            if (field.isXType('fieldset')) {
                App.util.AppUtil.resetFormParam(field);
            } else if (!field.isXType('label')
                && !field.isXType('button') && !field.isHidden() && !field.isXType('hiddenfield')) {
                field.setValue('');
            }
        });
    },
    getRendererValue: function (value, dickey , fromServer) {
//        var dic = gloab_cdic[dickey];
        var dic = App.util.AppUtil.getDicCache(dickey,fromServer);
        if (dic) {
            for (var i = 0; i < dic.length; i++) {
                if (value == dic[i].codeValue) {
                    return dic[i].codeName;
                }
            }
            return value;
        } else {
            return value;
        }
    },
    getNumTagValue: function (value, dickey , fromServer) {
        var dic = App.util.AppUtil.getDicCache(dickey,fromServer);
        if (dic) {
            for (var i = 0; i < dic.length; i++) {
                //console.log(dic[i].codeValue);
                if(value!=""){
                    if (value == dic[i].codeValue.toString()) {
                        return dic[i].codeName;
                    }
                }
            }
            return value;
        } else {
            return value;
        }
    },

    //取字段是数组的真实值,返回的是数组
    getRendererValueForArray: function (value, dickey) {
        var dic = App.util.AppUtil.getDicCache(dickey);
        if(!dic){
            return value;
        }else{
            var value = value ||[];
            var data = [];
            for(var i in value){
                var val = value[i];
                var result = true;
                for(var x in dic){
                    if(val == dic[x].codeValue){
                        result = false;
                        data.push(dic[x].codeName);
                        break;
                    }
                }
                if(result){
                    data.push(value);
                }
            }
            return data;
        }
    },
    getAgentValue: function (value) {
        var dic = gloab_cdic["agent"];
        if (dic != undefined) {
            for (var i = 0; i < dic.length; i++) {
                if (value == dic[i]._id) {
                    return dic[i].name;
                }
            }
            return value;
        } else {
            return value;
        }
    },

    getCurrentUser: function () {
        return gloab_client_user.user;
    },
    addPanelToMain: function (panel) {
        var main = Ext.getCmp("content-panel");
        var id = panel.getId();
        var oldPanel = Ext.getCmp(id);
        if (oldPanel) {
            main.remove(oldPanel, true);
        }
        var p = main.add(panel);
        main.setActiveTab(p);

    },
    getRendererId: function (value, dickey) {
        var dic = gloab_cdic[dickey];
        if (dic != undefined) {
            for (var i = 0; i < dic.length; i++) {
                if (value == dic[i].dicValue) {
                    return dic[i].codeId;
                }
            }
            return value;
        } else {
            return value;
        }
    },
    isExistDic: function (value, dickey) {
        var dic = gloab_cdic[dickey];
        if (dic != undefined) {
            for (var i = 0; i < dic.length; i++) {
                if (value == dic[i].dicValue) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    },
    showError: function (data) {
        alert(data.errorInfo + "错误码：" + data.errorCode);
    },
    showMask: function () {
        if (!this.mask) {
            this.mask = new Ext.LoadMask(Ext.getBody(), {
                msg: "正在处理..."
            });
        }
        this.mask.show();
    },
    hideMask: function () {
        if (this.mask != null) {
            this.mask.hide();
        }
    },
    showUrl: function (herf, name, id) {
        return '<a href = "#" id = "' + id + '" >' + name + '</a>'
    },
    checkFieldSet: function (fieldset) {
        var item = fieldset.items.items;
        var flag = true;
        for (var i = 0; i < item.length; i++) {
            if (!item[i].isValid()) {
                flag = false;
            }
        }
        return flag;
    },
    /**
     * 是否拒绝访问
     *
     * @param limit
     * @returns {boolean}
     */
    hasLimit: function (limit) {
        if(gloab_client_user._id=='bb9850f0-1f6f-11e4-9820-af71a6a5ab6d'){//for proxy jl
            var accLimits=['account_account_add','account_account_update','account_account_stop','account_account_set',
                'account_account_find','account_account_product','account_account_recharge','account_account_redirect'];
            var num=0;
            for (var i = 0; i < accLimits.length; i++) {
                var obj = accLimits[i];
                if(obj==limit){
                    num++;
                    break;
                }
            }
            if(num>0){
                return true;
            }
        }
        //增加对广州经传的权限控制
        if(gloab_client_user._id=='ebc33a40-c624-11e4-95f3-3bd64c8373ec'){
            var accLimits=['account_account_add','account_account_stop','account_account_set','account_account_product'];
            var num=0;
            for (var i = 0; i < accLimits.length; i++) {
                var obj = accLimits[i];
                if(obj==limit){
                    num++;
                    break;
                }
            }
            if(num>0){
                return true;
            }
        }
        for (var i = 0; i < gloab_client_user.limits.length; i++) {
            var userLimit = gloab_client_user.limits[i];
            if (userLimit == limit) {
                return false;
            }
        }
        return true;
    },
    /**
     * 是否有某个权限
     *
     * @param limit
     * @returns {boolean}
     */
    hasLimit2: function(limit){
        for (var i = 0; i < gloab_client_user.limits.length; i++) {
            var userLimit = gloab_client_user.limits[i];
            if (userLimit == limit) {
                return true;
            }
        }
        return false;
    },

    checkOrderLimitEnable: function (userId, status) {
        if (userId == gloab_client_user.user.userId
            && (status == 'assigned' || status == 'new')) {
            return false;
        } else {
            return true;
        }
    },
    saleNopass: function () {
        var val=false;
        if(gloab_client_user.identity=='sale') {//for sale not allow
            val=true;
        }
        return val;
    },
    getDicStoreData: function (key, data, callback) {
        data = data || {};
        data.type = key;
        var interFace = 'bill.system.getClientDicCache';
        var param = data;
        this.request(interFace, param, function (data) {
            callback(data.data);
        }, this, true);
    },
    getDicCache: function (key, fromServer, data) {
        var cache = [];
        if (fromServer) {
            data = data || {};
            data.type = key;
            this.requestSync("bill.system.getClientDicCache", data, function (data) {
                cache = data.data;
            });
        } else {
            var clientCache = gloab_cdic[key];
            if (clientCache) {
                cache = clientCache;
            } else {
                data = {};
                data.type = key;
                this.requestSync("bill.system.getClientDicCache", data, function (data) {
                    cache = data.data;
                    gloab_cdic[key] = cache;
                });
            }
        }
        return  cache;

    },
    getDicStore: function (key, fromServer, data) {
        if (fromServer) {
            data = data || {};
            data.type = key;
            //App.util.AppUtil.loadCache(key);
            return  Ext.create('Ext.data.Store', {
                autoLoad: true,
                model: 'App.model.common.DicCache',
                proxy: {
                    type: 'ajax',
                    autoAppendParams: false,
                    limitParam: "",
                    pageParam: "",
                    startParam: "",
                    url: App.util.AppUtil.getDicUrl(data),
                    reader: {
                        type: 'json',
                        root: 'data'
                    }
                }
            });
        } else {
            var clientCache = gloab_cdic[key];
            var store = null;
            if (clientCache === undefined || clientCache === null) {
                store = Ext.create('Ext.data.Store', {
                    autoLoad: true,
                    model: 'App.model.common.DicCache',
                    proxy: {
                        type: 'jsonp',
                        autoAppendParams: false,
                        limitParam: "",
                        pageParam: "",
                        startParam: "",
                        url: App.util.AppUtil.getDicUrl(key),
                        reader: {
                            type: 'json',
                            root: 'data'
                        }
                    }
                });
                App.util.AppUtil.loadCache(key);
            } else {
                store = Ext.create('Ext.data.Store', {
                    autoLoad: false,
                    model: 'App.model.common.DicCache',
                    data: clientCache,
                    proxy: {
                        type: 'memory',
                        reader: {
                            type: 'json',
                            root: ''
                        }
                    }
                });
            }
            return store;
        }
    },

    getClientDicStore: function (key) {
        var clientCache = gloab_cdic[key];
        var fields = [];
        if (clientCache && clientCache.length > 0) {
            var code = clientCache[0];
            for (var p in code) {
                fields.push(p);
            }
        }
        var store = Ext.create('Ext.data.Store', {
            fields: fields,
            data: clientCache
        });
        return store;
    },

    copy: function (obj) {
        obj = obj || {};
        var result = {};
        for (var key in obj) {
            result[key] = obj[key];
        }
        return result;
    },
    copyArray: function (array) {
        array = array || [];
        var copyArray = [];
        for (var i = 0; i < array.length; i++) {
            copyArray.push(array[i]);
        }
        return array;
    },
    getSutableMax: function (max) {
        if (max < 10) {
            return 10;
        }
        if (max < 100) {
            return 100;
        }
        if (max < 500) {
            return 500;
        }
        if (max < 1000) {
            return 1000;
        }
        if (max < 5000)
            return 5000;
        if (max < 10000)
            return 10000;
        if (max < 50000)
            return 50000;
        if (max < 100000)
            return 100000;
        if (max < 1000000)
            return 1000000;
        if (max < 10000000)
            return 10000000;
        return max;

    },
    getTimeValue: function (second) {
        if (second < 60) {
            return second + "秒";
        } else if (second < 3600) {
            var minites = parseInt(second / 60);
            var seconds = second % 60;
            return minites + "分" + seconds + "秒";
        } else {
            var hours = parseInt(second / 3600);
            var minites = parseInt(second % 3600 / 60);
            var seconds = second % 60;
            return hours + "时" + minites + "分" + seconds + "秒";
        }
    },
    getDefaultDateByFind: function (type) {
        var date = new Date();
        var fullYear = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        if (type == 'begin') {
            return new Date(fullYear, month, 1);
        } else {
            return new Date(fullYear, month, day);
        }
    },
    getDefaultDate: function (type) {
        var date = new Date();
        var fullYear = date.getFullYear();
        var month = date.getMonth();
        var result = '';
        if (type == 'begin') {
            return new Date(fullYear, month, 1);
        } else {
            return new Date(fullYear, month + 1, 1);
        }
    },
    msg: function (content) {
        var title = new String('系统提示');
        if (!this.msgCt) {
            this.msgCt = Ext.DomHelper.insertFirst(document.body, {
                id: 'msg-div'
            }, true);
        }
        var m = Ext.DomHelper.append(this.msgCt,
            this.createBox(title, content), true);
        m.hide();
        m.slideIn('t').ghost("t", {
            delay: 1000,
            remove: true
        });
    },
    createBox: function (t, s) {
        return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
    },
    keyHandler: function (field, key) {
        if (key.getKey() === key.ENTER) {
            var form = field.up('form');
            var btn = form.down('button[text="查询"]');
            btn.focus();
        }
    },
    getGridStore: function (interType, data, model ,pageSize) {
        data = data || {};
        var store = Ext.create('Ext.data.Store', {
            model: model,
            pageSize: pageSize ||10,
            autoLoad: false,
            proxy: {
                type: 'ajax',
                actionMethods: 'POST',
                extraParams: {
                    action: interType,
                    sessionId: app_sessionId || "",
                    data: Ext.JSON.encode(data)
                },
                url: this.app_constant_domain,
                timeout: 10000,
                reader: {
                    type: 'json',
                    root: 'list',
                    totalProperty: 'count'
                }
            }
        });
        return store;
    },
    getReportGridStore : function (interType, data, model){
        data = data || {};
        var store = Ext.create('Ext.data.Store', {
            model: model,
            autoLoad: false,
            proxy: {
                type: 'ajax',
                actionMethods: 'POST',
                extraParams: {
                    action: interType,
                    data: Ext.JSON.encode(data)
                },
                url: this.app_report_domain,
                timeout: 10000,
                reader: {
                    type: 'json',
                    root: 'list',
                    totalProperty: 'count'
                }
            }
        });
        return store;
    },
    getGroupedReportGridStore : function (interType,groupField, data, model){
        data = data || {};
        var store = Ext.create('Ext.data.Store', {
            model: model,
            autoLoad: false,
            groupField:groupField,
            proxy: {
                type: 'ajax',
                actionMethods: 'POST',
                extraParams: {
                    action: interType,
                    data: Ext.JSON.encode(data)
                },
                url: this.app_report_domain,
                timeout: 10000,
                reader: {
                    type: 'json',
                    root: 'list',
                    totalProperty: 'count'
                }
            }
        });
        return store;
    },
    exportReport : function (interType, param){
        window.location.href = this.app_report_domain+'?'+
            'action='+interType+
            '&data='+Ext.JSON.encode(param);
    },
    commonAdd: function (obj, action, successMsg, self , queryGrid) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request(action, data, function (data) {
                if (data.success) {
                    App.util.AppUtil.msg(successMsg);
                    win.close();
                    queryGrid = queryGrid || self.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, self);
        }
    },
    commonUpdate: function (obj, action, successMsg, self , queryGrid) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request(action, data, function (data) {
                if (data.success) {
                    App.util.AppUtil.msg(successMsg);
                    win.close();
                    queryGrid = queryGrid || self.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, self);
        }
    },
    commongDelete: function (self, displayField, action, data , queryGrid){
        queryGrid = queryGrid || self.getQueryGrid();
        var selection = queryGrid.getSelectionModel().getSelection()[0];
        console.log(selection.data);
        var id = selection.get("_id");
        data = data || {};
        data._id = id;
        var display = selection.get(displayField);
        Ext.Msg.confirm("警告", "确认删除[" + display + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request(action, data, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除成功！");
                        queryGrid.store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, self);
            }
        });
    },
    commonDock: function (selections, self , queryGrid) {
        queryGrid = queryGrid || self.getQueryGrid();
        var grid = queryGrid;
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    commonShowUpdate: function (obj, self, action, showClass , queryGrid) {
        queryGrid = queryGrid || self.getQueryGrid();
        var selection = queryGrid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request(action, {_id: id}, function (data) {
            if (data.success) {
                var win = Ext.create(showClass, {
                    data: data.data,
                    animateTarget: obj
                });
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, self);
    },
    isHideWidget: function (/*1:proxy*/flag) {
        if (gloab_client_user.identity == 'proxy') {
            if (flag) {
                return false;
            }
            return true;
        } else {
            if (flag) {
                return true;
            }
            return false;
        }
    },
    isHide2: function () {
        /*运维角色id：ac2b1e90-22cb-11e4-98b0-afd2ca705c70*/
        if (gloab_client_user.identity == 'admin'||gloab_client_user.identity == 'operation') {
            return false;
        }
        return true;
    },
    app_timer: function (countTimer) {
        if (countTimer <= 0) {
            return '00:00:00';
        }
        var hour = "0";
        var minute = "0";
        var second = "0";

        countTimer = parseInt(countTimer) - 1;
        hour = parseInt(countTimer / 3600);
        minute = parseInt((countTimer % 3600) / 60);
        second = (countTimer % 3600) % 60;

        var mtime = (hour < 10) ? "0" + hour : hour;
        mtime += ":";
        mtime += (minute < 10) ? "0" + minute : minute;
        mtime += ":";
        mtime += (second < 10) ? "0" + second : second;
        return mtime;
    },
    processUserLimit: function (limits,roleLimits) {
        for (var i = 0; i < limits.length; i++) {
            if(App.util.AppUtil.containsItem(limits[i].id,roleLimits)){
                limits[i].checked = true;
            }
            else {
                limits[i].checked = false;
            }
            if(!limits[i].leaf){
                App.util.AppUtil.processUserLimit(limits[i].children,roleLimits);
            }
        }


    },
    containsItem : function(item,array){
        array = array ||[];
        for(var i=0;i<array.length;i++){
            if(array[i] == item){
                return true;
            }
        }
        return false;
    },
    formatFee : function (number) {
        number=number||0;
        return Math.round(number*10000);
    },
    formatTrueFee : function (number) {
        number=number||0;
        return number/10000;
    },
    formatRoundMoney:function(number) {
        return Math.round(number*10000)/10000;
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
    randomString:function (length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
    }


});
