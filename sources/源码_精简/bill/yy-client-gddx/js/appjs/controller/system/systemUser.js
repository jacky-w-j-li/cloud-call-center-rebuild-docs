Ext.define('App.controller.system.systemUser', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    configLineIds:[],
    refs: [
        {
            ref: 'systemUserQueryPanel',
            selector: 'systemUserQueryPanel'
        },
        {
            ref: 'addSystemUserWindow',
            selector: 'addSystemUserWindow'
        },
        {
            ref: 'updateSystemUserWindow',
            selector: 'updateSystemUserWindow'
        },
        {
            ref: 'queryGrid',
            selector: 'systemUserQueryPanel > grid[class="query"]'
        },
        {
            ref: 'setSystemUserWin',
            selector: 'setSystemUserWin'
        },
        {
            ref: 'pay2ProxyWin',
            selector: 'pay2ProxyWin'
        },
        {
            ref: 'callEvent2ProxyWin',
            selector: 'callEvent2ProxyWin'
        },
        {
            ref: 'externalDialFees',
            selector: 'externalDialFees',
        },
        {
            ref: 'externalDialFeesEdit',
            selector: 'externalDialFeesEdit'
        },
        {
            ref: 'groupFinanceSetWin',
            selector: 'groupFinanceSetWin',
        }

    ],
    init: function () {
        this.control({
                'systemUserQueryPanel >  button#btn_stop': {
                    click: this.stopSysUser
                },
                'systemUserQueryPanel >  button#btn_pay_proxy': {
                    click: this.showPayProxy
                },
                'systemUserQueryPanel >  button#btn_callEvent_proxy': {
                    click: this.showCallEventProxy
                },
                'systemUserQueryPanel >  button#btn_group_finance_set':{
                    click: this.showGroupFinanceSet,
                },
                'groupFinanceSetWin >  button#commit_button':{
                    click: this.setGroupFinanceInfo
                },
                'systemUserQueryPanel >  button#addSystemUser_tool': {
                    click: this.showAddUser
                },
                'systemUserQueryPanel >  button#showSystemUser_tool': {
                    click: this.showUserInfo
                },
                'systemUserQueryPanel >  button#systemUserSet_tool': {
                    click: this.showSystemUserSet
                },
                'systemUserQueryPanel >  button#findSystemUser_tool': {
                    click: this.showUserFind
                },
                'systemUserQueryPanel >  button#manager_sub_tool': {
                    click: this.showSubUserWin
                },
                //系统用户导出
                'systemUserQueryPanel >  button#btn_export_system_user': {
                    click: this.exportSystemUser
                },
                'addSystemUserWindow >  button#create_new_user_button': {
                    click: this.addUser
                },
                'updateSystemUserWindow >  button#update_user_button': {
                    click: this.updateUserInfo
                },

//                'setSystemUserWin panel#sys_user_price_config_panel': {
//                    beforeactivate: this.initSystemUser
//                },
                'setSystemUserWin >  button#sysUser_price_confirm_button': {
                    click: this.savePriceConfig
                },
//                'setSystemUserWin >  combobox#dialFeeStrategy': {
//                    change: this.showDialPricePanel
//                },
//                'setSystemUserWin >  combobox#dial400FeeStrategy': {
//                    change: this.show400DialPricePanel
//                },
                'setSystemUserWin >  button#viewlog_price_button': {
                    click: this.showPriceLog
                },
                'systemUserQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showUserFind
                },
                'pay2ProxyWin >  button#btn_save_pay_proxy': {
                    click: this.payProxy
                },
                'callEvent2ProxyWin >  button#btn_save_callEvent_proxy': {
                    click: this.saveCallEventProxy
                },
                'externalDialFees' : {
                    selectionchange:this.externalDialFeesEnableDockItems,
                    itemdblclick: this.externalDialFeesShowUpdate,
                },
                'externalDialFees >  button#toolbar_add_line_fee': {
                    click: this.externalDialFeesShowAdd,
                },
                'externalDialFees >  button#toolbar_update_line_fee' : {
                    click: this.externalDialFeesShowUpdate,
                },
                'externalDialFees >  button#toolbar_delete_line_fee' : {
                    click: this.externalDialFeesRemove,
                },
                'externalDialFeesEdit >  button#commit_button' : {
                    click: this.externalDialFeesUpsert
                },
                'externalDialFeesEdit >  button#close' : {
                    click: this.externalDialFeesClose
                },
                'externalDialFeesEdit >  combobox#combo_add_line':{
                    select: this.externalDialFeesEditLineSelect
                }
            }
        );
        this.initFlag = true;
    },
    externalDialFeesEnableDockItems: function(selModel,selections){
        var grid = this.getExternalDialFees();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }

        //不能删除默认的资费设置
        if(selections.length>0 && !selections[0].get('lineIds')){
            items[1].setDisabled(true);
        }
    },
    externalDialFeesShowAdd: function(obj){
        var win = Ext.create('App.view.system.systemUser.externalDialFeesEdit',{
            animateTarget: obj,
            editMode: 'addNew',
            configLineIds:this.configLineIds,
        });
        win.show();
    },
    externalDialFeesRemove: function(obj){
        var grid = this.getExternalDialFees();
        var seleted = grid.getSelectionModel().getSelection()[0];
        grid.getStore().remove(seleted);

        grid.refresh();

        //刷新已选线路ID
        this.refreshConfigLineIds();
    },
    externalDialFeesShowUpdate: function(obj){
        var win = Ext.create('App.view.system.systemUser.externalDialFeesEdit',{
            animateTarget: obj,
            editMode: 'update',
            record:this.getExternalDialFees().getSelectionModel().getSelection()[0],
            configLineIds:this.configLineIds,
        });
        win.show();

        if(win.lineIds){
            var linesDiv = document.getElementById("external_dial_fees_edit_line_list_div");
            win.lineIds.forEach(function(lineId){
                var lineName = App.util.AppUtil.getRendererValue(lineId, 'line');
                var lineSpan = win.getRenderLine(lineName,lineId);
                linesDiv.appendChild(lineSpan);
            })

            //线路太多时重新布局
            linesDiv.style.height = this.calcLinsDivHeight(linesDiv,win) + 'px';
            win.doLayout();
        }

    },
    externalDialFeesUpsert: function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var grid = this.getExternalDialFees();
        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            if(!win.updateRecord()){
                return;
            }
        }else if(win.editMode == 'addNew'){
            var newRecord = win.getRecord();

            //如果都是0,加它干嘛
            if(!(newRecord.lineIds && newRecord.lineIds.length)){
                form.down('combobox#combo_add_line').markInvalid("关联线路不能为空!");
                return;
            }
            //
            if(grid.getStore().count()>1){
                grid.getStore().insert(0,newRecord);
            }else{
                grid.getStore().add(newRecord);
            }
        }


        win.close();
        grid.refresh();

        //刷新已选线路ID
        this.refreshConfigLineIds();
    },
    externalDialFeesClose: function(obj){
        var win = obj.up('window');
        win.close();

        //刷新已选线路ID
        this.refreshConfigLineIds();
    },
    externalDialFeesEditLineSelect: function(obj,selected){
        var selectedRecord = selected[0];
        var lineName = selectedRecord.get("codeName");
        var lineId = selectedRecord.get('codeValue');

        var win = obj.up('window');
        if(!win.lineIds) {
            win.lineIds = []
        }

        if(win.lineIds.indexOf(lineId)>=0 || this.configLineIds.indexOf(lineId)>=0){
            //警告线路重复
            obj.markInvalid("线路重复!");
            return;
        }

        var linesDiv = document.getElementById("external_dial_fees_edit_line_list_div");
        var lineSpan = win.getRenderLine(lineName,lineId);
        linesDiv.appendChild(lineSpan);

        //线路太多时重新布局
        linesDiv.style.height = this.calcLinsDivHeight(linesDiv,win) + 'px';
        win.doLayout();

        win.lineIds.push(lineId);
        obj.reset();
    },
    calcLinsDivHeight:function(linesDiv){
        var lineSpans = linesDiv.children || [];
        var limitWidth = linesDiv.getBoundingClientRect().width;
        var totalWidth = 0;
        for (var i = 0; i < lineSpans.length; i++) {
            totalWidth += lineSpans[i].getBoundingClientRect().width + 2;
        };

        var newHeight = (Math.floor((totalWidth)/(limitWidth-40)) + 1) * 40;

        return newHeight;
    },
    refreshConfigLineIds: function() {
        var thisConfigLineIds = [];
        var grid = this.getExternalDialFees();
        grid.getStore().each(function(record){
            var lineIds = record.get("lineIds");
            if(lineIds){
                thisConfigLineIds = thisConfigLineIds.concat(lineIds);
            }
        });
        this.configLineIds = thisConfigLineIds;
    },

    showAddUser: function (obj) {
        var win = Ext.create('App.view.system.systemUser.addSystemUser', {
            animateTarget: obj
        });
        win.show();
    },
    addUser: function (obj) {
        var win = this.getAddSystemUserWindow();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.addUser', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加用户成功！");
                    var win = self.getAddSystemUserWindow();
                    win.close();
                    self.getQueryGrid().store.load();
                    App.util.AppUtil.getDicStore("systemUser", true);
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    _formatTrueFee: function (data) {
        var rate = 10000;
        if (data.overdraw) data.overdraw = data.overdraw / rate;
        if (data.callinLicence) data.callinLicence = data.callinLicence / rate;
        if (data.serviceLicence) data.serviceLicence = data.serviceLicence / rate;
        //if(data.calloutLicence) data.calloutLicence=data.calloutLicence/rate;
        if (data.monitorLicence) data.monitorLicence = data.monitorLicence / rate;
        if (data.standardLicence) data.standardLicence = data.standardLicence / rate;
        if (data.smsFee) data.smsFee = data.smsFee / rate;
        if (data.voiceFee) data.voiceFee = data.voiceFee / rate;
//        if(data.min400Consume) data.min400Consume=data.min400Consume/rate;
        if (!data.fee) {
            data.fee = {};
        } else {
            for (var key in data.fee) {
                data.fee[key] = data.fee[key] / rate;
            }
        }

        if (!data.dialFee) {
            data.dialFee = {};
        } else {
            for (var key in data.dialFee) {
                data.dialFee[key] = data.dialFee[key] / rate;
            }
        }
        if (!data.dial400Fee) {
            data.dial400Fee = {};
        } else {
            for (var key in data.dial400Fee) {
                data.dial400Fee[key] = data.dial400Fee[key] / rate;
            }
        }
        //国际长途
        //if (!data.internationalFee) {
        //    data.internationalFee = {};
        //} else {
        //    for (var key in data.internationalFee) {
        //        data.internationalFee[key] = data.internationalFee[key] / rate;
        //    }
        //}
        //线路管理资费设置
        if(data.externalLineFees){
            data.externalLineFees.forEach(function(lineFee){
                if (!lineFee.dialFee) {
                    lineFee.dialFee = {};
                } else {
                    for (var key in lineFee.dialFee) {
                        lineFee.dialFee[key] = lineFee.dialFee[key] / rate;
                    }
                }
                if (!lineFee.dial400Fee) {
                    lineFee.dial400Fee = {};
                } else {
                    for (var key in lineFee.dial400Fee) {
                        lineFee.dial400Fee[key] = lineFee.dial400Fee[key] / rate;
                    }
                }
                //国际长途
                //if (!lineFee.internationalFee) {
                //    lineFee.internationalFee = {};
                //} else {
                //    for (var key in lineFee.internationalFee) {
                //        lineFee.internationalFee[key] = lineFee.internationalFee[key] / rate;
                //    }
                //}
            })
        }
    },
    showSystemUserSet: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var uid = selection.get("_id");
        App.util.AppUtil.request('bill.systemUser.getUserSetInfo', {_id: uid}, function (data, self) {
            if (data.success) {
                if (data.data) {
                    self._formatTrueFee(data.data);
                }
//                console.dir(data.data);
                var win = Ext.create('App.view.system.systemUser.setSystemUser', {
                    data: data.data,
                    animateTarget: obj
                });

                var externalLineFeesData = [];
                externalLineFeesData.push({
                    dialFee : data.data.dialFee,
                    dialPercent : data.data.dialPercent,
                    dial400Fee : data.data.dial400Fee,
                    num400Percent : data.data.num400Percent,
                    //internationalFee : data.data.internationalFee,
                    intlPercent : data.data.intlPercent
                });

                self.configLineIds =[];
                if(data.data.externalLineFees){
                    externalLineFeesData = externalLineFeesData.concat(data.data.externalLineFees);

                    data.data.externalLineFees.forEach(function(lineFee){
                        self.configLineIds = self.configLineIds.concat(lineFee.lineIds);
                    });
                }

                var externalLineFeesPanel = Ext.create('App.view.system.systemUser.externalDialFees',{
                    animateTarget: win,
                    data:externalLineFeesData,
                });
                win.down("fieldset#line_fees_fieldset").add(externalLineFeesPanel);
                win.doLayout();
                win.setTitle(selection.get('name') + '---->' + '用户配置');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showUserFind: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var uid = selection.get("_id");
        App.util.AppUtil.request('bill.systemUser.getUserSetInfo', {_id: uid}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.systemUser.findSystemUser', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(selection.get('name') + '---->' + '用户查询');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showSubUserWin: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var uid = selection.get("_id");
        App.util.AppUtil.request('bill.systemUser.getSubUser', {_id: uid}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.systemUser.managerSubUser', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(selection.get('name') + '---->' + '管理子账号');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });
    },
    //系统用户导出
    exportSystemUser: function (obj) {
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method = "exportSystemUser";
//            console.dir(data);
            App.util.AppUtil.request('bill.export.exportBillXls', data, function (rep, self) {
                if (rep.Succeed) {
                    self.downloadFile(rep.path);
//                    App.util.AppUtil.msg("导出成功！");
                } else {
                    App.util.AppUtil.msg(rep.message);
                }
            }, this);
        }
    },
    downloadFile: function (fileUrl) {
//        var url = fileUrl + "&sessionId=" + session.id;
        var url = fileUrl;
        var container = {
            id: 'downloadFile_Frame',
            tag: 'iframe',
            style: 'display:none'
        };
        var frame = Ext.getDom("downloadFile_Frame");
//        console.info(url);
        if (!frame) {
            Ext.DomHelper.append(Ext.getBody(), container);
            frame = Ext.getDom("downloadFile_Frame");
        }

//        console.dir(frame);
        frame.src = url;
    },

    showUserInfo: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.system.systemUser.updateSystemUser', {
            user: selection,
            animateTarget: obj
        });
        win.setTitle(selection.get('name') + '---->' + '系统用户信息');
        win.show();
    },
    updateUserInfo: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.updateUserInfo', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改用户信息成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    savePriceConfig: function (obj) {
        var form = obj.up("form");
        if (form.form.isValid()) {
//            var fieldSet = form.down("fieldset");
//            var data = App.util.AppUtil.getFormParam(fieldSet);
            var data = {};
            var liceseData = App.util.AppUtil.getFormParam(form.down("fieldset#license_set_fieldset"));
            data._id = liceseData._id;
            delete liceseData._id;
            //var callData = App.util.AppUtil.getFormParam(form.down("fieldset#call_set_fieldset"));
            var flowData = App.util.AppUtil.getFormParam(form.down("fieldset#flow_set_fieldset"));
            //var num400Data = App.util.AppUtil.getFormParam(form.down("fieldset#num400_set_fieldset"));
            var fareData = App.util.AppUtil.getFormParam(form.down("fieldset#fare_set_fieldset"));
            var resourceData = App.util.AppUtil.getFormParam(form.down("fieldset#resource_set_fieldset"));
            //国际化
            //var internationalData = App.util.AppUtil.getFormParam(form.down("fieldset#international_set_fieldset"));
            var smsFeeData = App.util.AppUtil.getFormParam(form.down("fieldset#smsFee_set_fieldset"));
            var voiceFeeData = App.util.AppUtil.getFormParam(form.down("fieldset#voice_set_fieldset"));

            var lineFeeGrid = this.getExternalDialFees();

            data.externalLineFees = []
            lineFeeGrid.getStore().each(function(record){
                var lineIds = record.get('lineIds');
                if(!lineIds || lineIds.length <= 0){
                    //默认线路资费设置
                    data.dialFee = {
                        local: record.get('local'),
                        remote: record.get('remote'),
                        localTel: record.get('localTel'),
                        remoteTel: record.get('remoteTel'),
                    };
                    data.dialPercent = record.get('dialPercent');

                    data.dial400Fee = {
                        local: record.get('400local'),
                        remote: record.get('400remote'),
                    };
                    data.num400Percent = record.get('num400Percent');

                    //data.internationalFee = {
                    //    fee1: record.get('intlFee1'),
                    //    fee2: record.get('intlFee2'),
                    //    fee3: record.get('intlFee3'),
                    //};
                    data.intlPercent = record.get('intlPercent');
                }else{
                    //关联线路资费设置
                    var lineFee = {};
                    lineFee.lineIds = record.get('lineIds');

                    lineFee.dialFee = {
                        local: record.get('local'),
                        remote: record.get('remote'),
                        localTel: record.get('localTel'),
                        remoteTel: record.get('remoteTel'),
                    };
                    lineFee.dialPercent = record.get('dialPercent');

                    lineFee.dial400Fee = {
                        local: record.get('400local'),
                        remote: record.get('400remote'),
                    };
                    lineFee.num400Percent = record.get('num400Percent');

                    //lineFee.internationalFee = {
                    //    fee1: record.get('intlFee1'),
                    //    fee2: record.get('intlFee2'),
                    //    fee3: record.get('intlFee3'),
                    //};
                    lineFee.intlPercent = record.get('intlPercent');

                    data.externalLineFees.push(lineFee);
                }
            });


            data.fee = {
                100001: flowData['100001'],
                100002: flowData['100002'],
                100003: flowData['100003'],
                100004: flowData['100004'],
                100005: flowData['100005'],
                100006: flowData['100006'],
                100007: flowData['100007'],
                100008: flowData['100008'],
                100009: flowData['100009'],
                100010: flowData['100010'],
                100011: flowData['100011'],
                200001: flowData['200001'],
                200002: flowData['200002'],
                200003: flowData['200003'],
                200004: flowData['200004'],
                200005: flowData['200005'],
                300001: flowData['300001'],
                300002: flowData['300002'],
                300003: flowData['300003'],
                300004: flowData['300004'],
                300005: flowData['300005'],
                300006: flowData['300006'],
                300007: flowData['300007'],
                300008: flowData['300008']
            };

            data.flowPercent = flowData.flowPercent;
            data.smsFee = smsFeeData.smsFee;
            data.smsPercent = smsFeeData.smsPercent;
            data.callinLicence = liceseData.callinLicence;
            data.serviceLicence = liceseData.serviceLicence;
            //data.calloutLicence = liceseData.calloutLicence;
            data.monitorLicence = liceseData.monitorLicence;
            data.standardLicence = liceseData.standardLicence;

            data.agentPercent = liceseData.agentPercent;
            data.overdraw = fareData.overdraw;
            data.monthRentPercent = fareData.monthRentPercent;
            data.numScope = resourceData.numScope.numScope;
            //语音验证码
            data.voiceFee = voiceFeeData.voiceFee;
            data.voicePercent = voiceFeeData.voicePercent;


            App.util.AppUtil.request('bill.systemUser.savaPriceConfig', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("保存成功！");
                    var win = self.getSetSystemUserWin();
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showPriceLog: function (obj) {
        var win = obj.up('window');
        win.logStore = null;
        var panel = win.getLogViewPanel('fee');
        var pricePanel = win.down("tabpanel").down('panel#sys_user_price_config_panel');
        pricePanel.add(panel);
        obj.setDisabled(true);
    },
    showDialPricePanel: function (obj) {
        var win = obj.up('window');
        var val = arguments[1];
        switch (val) {
            case "minute":
                win.down("panel#byMinute_panel").show();
                win.down("panel#by6Second_panel").hide();
                win.down("panel#by3Minute_panel").hide();
                break;
            case "second6":
                win.down("panel#byMinute_panel").hide();
                win.down("panel#by6Second_panel").show();
                win.down("panel#by3Minute_panel").hide();
                break;
            case "minute3":
                win.down("panel#byMinute_panel").hide();
                win.down("panel#by6Second_panel").hide();
                win.down("panel#by3Minute_panel").show();
                break;
        }
    },
    show400DialPricePanel: function (obj) {
        var win = obj.up('window');
        var val = arguments[1];
        switch (val) {
            case "minute":
                win.down("panel#by400Minute_panel").show();
                win.down("panel#by4006Second_panel").hide();
                win.down("panel#by4003Minute_panel").hide();
                break;
            case "second6":
                win.down("panel#by400Minute_panel").hide();
                win.down("panel#by4006Second_panel").show();
                win.down("panel#by4003Minute_panel").hide();
                break;
            case "minute3":
                win.down("panel#by400Minute_panel").hide();
                win.down("panel#by4006Second_panel").hide();
                win.down("panel#by4003Minute_panel").show();
                break;
        }
    },
    initSystemUser: function (obj) {
        var combox = obj.down("#dialFeeStrategy");
        combox.fireEvent("change", combox, combox.getValue());
        var combox400 = obj.down("#dial400FeeStrategy");
        combox400.fireEvent("change", combox400, combox400.getValue());
    },

    showPayProxy: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var identity = gloab_client_user.identity;
        var proxyRole = selection.get("identity");
//        console.dir(proxyRole);
        if (proxyRole == "proxy") {
            var win = Ext.create('App.view.system.systemUser.pay2Proxy', {
                uid: selection.get("_id"),
                animateTarget: obj
            });
            win.show();
        } else {
            App.util.AppUtil.msg("只能给代理充值");
        }
        /*
         if(identity=='admin'){
         }else{
         App.util.AppUtil.msg("只有管理员可以充值");
         }
         */
    },
    showCallEventProxy: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var identity = gloab_client_user.identity;
        var proxyRole = selection.get("identity");
//        console.dir(proxyRole);
        if (proxyRole == "proxy") {
            var win = Ext.create('App.view.system.systemUser.callEvent2Proxy', {
                uid: selection.get("_id"),
                callEventUrl: selection.get("callEventUrl") || '',
                animateTarget: obj
            });
            win.show();
        } else {
            App.util.AppUtil.msg("只能给代理设置");
        }
    },
    showGroupFinanceSet: function(obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var proxyRole = selection.get("identity");
        if (proxyRole == "proxy") {
            var win = Ext.create('App.view.system.systemUser.groupFinanceSetWin', {
                record: selection,
                animateTarget: obj
            });
            win.show();
        } else {
            App.util.AppUtil.msg("只能给代理设置");
        }
    },
    setGroupFinanceInfo: function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        if(!form.form.isValid()){
            return;
        }

        var data = App.util.AppUtil.getFormParam(form.down('fieldset'));
        App.util.AppUtil.request('bill.systemUser.setGroupFinanceInfo', data, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("集团财务设置成功！");
                win.close();
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    payProxy: function (obj) {
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.pay2ProxyByUser', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("给代理充值成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    saveCallEventProxy: function (obj) {
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.saveCallEvent2Proxy', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("配置成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    stopSysUser: function(obj) {
        if(!confirm("确认停用当前账户吗?")){
            return;
        }

        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var stopUserId = selection.get('_id');

        App.util.AppUtil.request('bill.systemUser.stopSysUser', {stopUserId : stopUserId}, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("用户停用成功！");
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);


    }

});
