handler.config.callConfig = {
    pageSize: 5,
    currentPage: 1,
    currentPbx: null,
    effectIvr: false,
    isInitDSActionFlow : false,
    isShowUploadWait: false,
    currentConfigData: {
    },
    errorMessage: {
        'serviceNo_401': '服务号已被占用或不存在',
        'serviceNo_500': '检查服务号失败，计费服务不可用'
    },
    infoMessage: {
        'agent.batchRequested': '批量增加座席请求已成功提交，可点刷新按键查看新座席',
        'sip.batchRequested': '批量增加SIP号请求已成功提交，可点刷新按键查看新SIP号'
    },
    call_config : function(){
        handler.config.callConfig.init();
        //$('#searchAccountPbxLink').trigger('click');
        var pbx = null;
        var account = session.account;
        var self = handler.config.callConfig;
        if (account) {
            if (account.pbx && account.pbx.length > 0) {
                pbx = account.pbx[0];
            }
            render.ivr.renderNewPbxSelect(pbx);
            $('#ivrAddPbxLink').attr('account', account.account);
            if (!pbx) {
                return;
            }
            session.ivrMap.accountPbxList = account.pbx;
            self.currentConfigData = {
                Account: pbx.Account,
                PBX: pbx.PBX
            }
            self.currentPbx = pbx;
            if (account && session.user.isAdmin) {
                $('#accountPbxInfoPanel').html('<h3>' + pbx.Account + ' - ' + account.name + ' - <b style="color:blue;">' + pbx.NickName + '</b></h3>');
            }
            var getIvrNodesLink = $('#getIvrNodesLink');
            getIvrNodesLink.trigger('click');
        } else {
            alert('找不到账户信息');
        }
    },
    changePbx: function(pbxId){
        var pbx = null;
        var account = session.account;
        var pbxes = session.account.pbx;
        var self = handler.config.callConfig;
        if (account) {
            if (account.pbx && pbxes.length > 0) {
                for(var i=0 ; i < pbxes.length ; i++){
                    if(pbxes[i].PBX == pbxId){
                        pbx = pbxes[i];
                    }
                }
            }
            if(!pbx){
                alert('切换pbx失败！');
                return;
            }
            render.ivr.renderNewPbxSelect(pbx);
            session.ivrMap.accountPbxList = account.pbx;
            self.currentConfigData = {
                Account: pbx.Account,
                PBX: pbx.PBX
            }
            self.currentPbx = pbx.PBX;
            if (account && session.user.isAdmin) {
                $('#accountPbxInfoPanel').html('<h3>' + pbx.Account + ' - ' + account.name + ' - <b style="color:blue;">' + pbx.NickName + '</b></h3>');
            }
            var getIvrNodesLink = $('#getIvrNodesLink');
            getIvrNodesLink.trigger('click');
        } else {
            alert('找不到账户信息');
        }
    },
    /**
     * 初始化ds_action_flow标签的事件监听
     * 在页面里声明class为ds_action_flow，会为此标签注册单击事件，
     * 并根据此标签的子标签做相应的动作。
     * 可声明的子标签：
     * ds-do-action: 声明要向服务器端发送请求:action="xxx"；当服务器返回数据后，会执行on-complete声明的回调,
     *                  回调的方法声明在handler对象中；extra-data声明额外需提交到服务端的数据
     *
     * do-form-action: 标签的属性与ds-do-action一样。
     * ds-do-action与do-form-action是互斥的，不应该同时声明。
     *
     * ds-get-view: 声明要取页面:view="xxx"， 放置到panel声明的xxx
     * 如：
     * <a href="#" class="ds_action_flow">
     *     <ds-do-action action="xxx" on-complete="xxx" extra-data="xxx"/>
     *     <ds-get-view view="xxx" panel="xxx"/>
     * </a>
     */
    initDSActionFlow: function () {
        $(document).on('click', '.ds_action_flow', function (event) {
            var src = $(event.currentTarget);
            if (src.hasClass('disabled'))
                return false;
            var formActionTag = $('ds-form-action', src);
            var doActionTag = $('ds-do-action', src);
            var getViewTag = $('ds-get-view', src);
            var effectIvrTag = $('ds-effect-ivr', src);
            var refreshClientData = src.attr('refresh-data');
            var actionName = null, beforeActionEventName = null, actionCallbackName = null, extraDataName = null,actionCallbackNameFailed = null;
            var data = null, updateClientDataCond = null;

            //如果声明了ds-form-action，只是简单地把标签属性取出来
            if (formActionTag.length > 0) {
                var from = src.attr("ds_form") ? $(src.attr("ds_form")) : src.closest("form");
                try{
                    if(validate && !validate.validate(from)) return false;
                }catch(e){}
                // 获取ds-form-action标签的action属性
                actionName = formActionTag.attr('action');
                if (!actionName) {
                    console.error('[ds_action_flow] Tag config send form action, but [name] not config!');
                    return false;
                }
                //取得当前标签所在的form表单数据
                data = DS.getDataOfForm(src.closest('form'));
                if(!data.succeed){
                    return false;
                }
                data = data.data;
                beforeActionEventName = formActionTag.attr('on-before');
                actionCallbackName = formActionTag.attr('on-complete');
                actionCallbackNameFailed = formActionTag.attr('on-complete-failed');
                extraDataName = formActionTag.attr('extra-data');
                updateClientDataCond = formActionTag.attr('update-client-data');

            } else
            // 如果声明了ds-do-action
            if (doActionTag.length > 0) {
                // ds-form-action与ds-do-action同时声明了，只会优先取ds-form-action
                if (formActionTag.length > 0) {
                    console.warn('[ds_action_flow] You config both "form action" and "do action", we will process form action only!');
                }
                actionName = doActionTag.attr('action');
                if (!actionName) {
                    console.error('[ds_action_flow] Tag config send acton, but [name] not config!');
                    return false;
                }
                var dataJson = doActionTag.attr('data');
                if (dataJson) {
                    data = JSON.parse(dataJson);
                }
                beforeActionEventName = doActionTag.attr('on-before');
                actionCallbackName = doActionTag.attr('on-complete');
                extraDataName = doActionTag.attr('extra-data');
                updateClientDataCond = doActionTag.attr('update-client-data');
            }

            if(updateClientDataCond){
                var updateClientDataCondParam = JSON.parse(updateClientDataCond);
                if(updateClientDataCondParam.arg){
                    if(updateClientDataCondParam.arg.operation && updateClientDataCondParam.arg.operation == 'del'){
                        var con = confirm("确定要删除该条信息吗？");
                        if (!con) {
                            return false;
                        }
                    }
                }
            }

            // 声明取页面、更新页面数据，并把页面填充
            var renderView = function (data) {
                // 如果声明了ds-get-view子标签
                if (getViewTag.length > 0) {
                    // 获取需要取得的页面
                    var view = getViewTag.attr('view');
                    if (!view) {
                        console.error('[ds_action_flow] Tag config get view action, bug [view] not config!');
                        return;
                    }
                    // 取得页面，并填充至panel
                    DS.getView(view, function (viewHtml) {
                        // 取得声明的panel
                        var viewPanelID = getViewTag.attr('panel');
                        var sourceID = getViewTag.attr('source');
                        var alias = getViewTag.attr('alias');
                        var viewPanel = null;
                        if (viewPanelID) {
                            if(sourceID !='ivrProcessSave' || sourceID != 'ivrProcessDel'){
                                viewPanel = $('#' + viewPanelID);
                                if (!viewPanel) {
                                    console.warn('[ds_action_flow] view panel not found!');
                                    return;
                                }
                                // 把页面填充
                                viewPanel.html(viewHtml);
                            }
                        }
                        var viewDataStr = getViewTag.attr('view-data');
                        var viewData = null;
                        if (viewDataStr) {
                            viewData = JSON.parse(viewDataStr);
                            session.ivrMap.viewData = viewData;
                        }
                        // 如果页面声明了c5-item-list标签，则宣染标签
                        var itemLists = $(".ds-item-list", viewPanel);
                        if (itemLists.length > 0) {
                            handler.config.callConfig.renderItemList(itemLists);
                        }
                        var onComplete = getViewTag.attr('on-complete');
                        // 如果声明了回调，填充完页面后即调用回调
                        if (onComplete) {
                            var actionHandler = eval('DS._ds_handler.' + onComplete);
                            if (!actionHandler) {
                                console.error('[ds_action_flow] handler not found: ' + onComplete);
                                return;
                            }
                            actionHandler(data, src);
                        }

                        var itemEditForms = $('.ds_item_edit', viewPanel);
                        if (itemEditForms.length > 0) {
                            handler.config.callConfig.renderItemEdit(itemEditForms, viewPanel);
                        }

                        var ivrToPeerType = $('.ds_ivr_to_peer_type', viewPanel);
                        if (ivrToPeerType.length > 0) {
                            handler.config.callConfig.renderToPeerType(ivrToPeerType, viewPanel);
                        }

                        var ivrProcess = $('.ds_ivr_ivr_process',viewPanel);
                        if(ivrProcess.length>0){
                            handler.config.callConfig.renderIvrProcess(ivrProcess, viewPanel);
                        }

                        var ivrSoundSelect = $('.ds_ivr_sound_select', viewPanel);
                        if(ivrSoundSelect.length > 0) {
                            handler.config.callConfig.renderSoundSelect(ivrSoundSelect, viewPanel);
                        }

                        var ivrVarSelect = $('.ds_ivr_var_select', viewPanel);
                        if(ivrVarSelect.length > 0) {
                            handler.config.callConfig.renderVarSelect(ivrVarSelect, viewPanel);
                        }

                        if (effectIvrTag.length > 0 && handler.config.callConfig.effectIvr) {
                            $(".ds_ivr_effect").removeClass('disabled');
                        }
                        if(alias){
                            if(alias == 'C'){
                                handler.config.ivrProcess.processButton("2");
                            }else if(alias == 'O'){
                                handler.config.ivrProcess.processButton("0");
                            }else{
                                handler.config.ivrProcess.processButton("1");
                            }
                        }else{
                            if(sourceID == 'ivrProcessSave' || sourceID == 'ivrProcessDel' ){
                                $('#node_panel').empty();
                                handler.config.ivrProcess.refreshNodeMenu();
                                handler.config.ivrProcess.renderFlowChart();
                            }else if(sourceID == 'ivrProcessEdit'){
                                handler.config.ivrProcess.processButton('0');
                            }else if(sourceID == 'ivrProcessAdd'){
                                handler.config.ivrProcess.processButton('3');
                            }else if(sourceID == 'ivrProcessAddSave'){
                                $('#node_panel').empty();
                                handler.config.ivrProcess.refreshNodeMenu();
                            }
                        }
                    });
                }
            }
            // 向服务端发送请求
            if (actionName) {
                if (extraDataName) {
                    var extraData = eval('handler.' + extraDataName);
                    if (extraData) {
                        data = data || {};
                        $.extend(data, extraData);
                    }
                }

                if (beforeActionEventName) {
                    var beforeActionEvent = eval('DS._ds_handler.' + beforeActionEventName);
                    if (beforeActionEvent) {
                        data = data || {};
                        data = beforeActionEvent(data, src);
                    }
                    if(data.skip) {
                        return;
                    }
                    delete data.skip;
                    if(data.error) {
                        alert(data.errorMessage);
                        return;
                    }
                }

                var action = {
                    action: actionName,
                    data: data
                }
                DS.util.sendAction(action, function (response) {
                    if (response.success) {
                        //var ivrMessage = $('#ivrMessage');
                        //if (ivrMessage.length > 0 && (actionName.indexOf('save')>-1
                        //    || actionName.indexOf('update')>-1)) {
                        //    ivrMessage.css('display', '');
                        //    setTimeout(handler.config.callConfig.hideIvrMessage, 5000);
                        //}
                        if(actionName.indexOf('save')>-1 || actionName.indexOf('update')>-1){
                            $().alertmessage('showSuccess','保存成功!');
                        }
                        //var ivrReloadMessage = $('#ivrReloadMessage');
                        //if (ivrReloadMessage.length > 0 && (actionName.indexOf('reloadIvr')>-1)) {
                        //    ivrReloadMessage.css('display', '');
                        //    setTimeout(handler.config.callConfig.hideIvrMessage, 5000);
                        //}
                        if(actionName.indexOf('reloadIvr')>-1){
                            $().alertmessage('showSuccess','生效成功!');
                        }
                        if (effectIvrTag.length > 0) {
                            handler.config.callConfig.effectIvr = true;
                        }
                        var responseData = response.data || response.list;
                        if (updateClientDataCond) {
                            var updateClientDataParam = JSON.parse(updateClientDataCond);
                            if (updateClientDataParam.method) {
                                var updateClientDataMethod = eval('DS._ds_handler.' + updateClientDataParam.method);
                                var updateClientDataArgs = updateClientDataParam.arg || {};
                                updateClientDataArgs.data = responseData;
                                updateClientDataMethod(updateClientDataArgs);
                            }
                        }
                        if (actionCallbackName) {
                            var actionCallback = eval('DS._ds_handler.' + actionCallbackName);
                            if (actionCallback) {
                                responseData = actionCallback(responseData, response);
                            }
                        }

                        if(response.code) {
                            if(handler.config.callConfig.infoMessage[response.code]){
                                alert(handler.config.callConfig.infoMessage[response.code]);
                            }
                        }

                        // 服务端返回数据后调用renderView宣染页面
                        renderView(responseData);
                    } else {
                        if(actionCallbackNameFailed){
                            var actionCallbackFailed = eval('DS._ds_handler.' + actionCallbackNameFailed);
                            if (actionCallbackFailed) {
                                actionCallbackFailed(response);
                            }
                        }else{
                            if(response.reason) {
                                if(handler.config.callConfig.infoMessage[response.reason]){
                                    alert(handler.config.callConfig.errorMessage[response.reason]);
                                }
                            } else {
                                alert('保存失败.\n' + response.message ? response.message : '');
                            }
                        }
                    }
                });
            } else {
                if (refreshClientData) {
                    delete session.ivrMap.searchResult;
                    handler.config.callConfig.currentPage = 1;
                }
                // 如果没有声明ds-do-action或do-form-action，则直接宣染页面
                renderView();
            }
        });
        $(document).on('change', '.ivr_to_peer_type_select', function (event) {
            var src = $(event.currentTarget);
            var value = src.val();
            var toPeerTypeTag = src.parent('div');
            handler.config.callConfig.renderToPeerTag(toPeerTypeTag, value);
        });
        $(document).on('change', '.ds_ivr_ivr_process', function (event) {
            var src = $(event.currentTarget);
            var value = src.find('select').val();
            var ivrProcess = session.ivrMap.ivr.ivr_process;
            var currentNode = null;
            var scheduleTypeTag = $('#scheduleToPeerType');
            var scheduleTag = $('#scheduleToPeer');
            if(value != ''){
                for(var nodeKey in ivrProcess){
                    if(value == ivrProcess[nodeKey]._id){
                        currentNode = ivrProcess[nodeKey];
                        break;
                    }
                }
                scheduleTypeTag.find('select').val(currentNode.FirstNodeType);
                scheduleTypeTag.find('select').attr('disabled',true);
                handler.config.callConfig.renderToPeerTag(scheduleTypeTag, currentNode.FirstNodeType);
                scheduleTag.find('select').val(currentNode.FirstNode);
                scheduleTag.find('select').attr('disabled',true);
            }else{
                scheduleTypeTag.find('select').attr('disabled',false);
                scheduleTag.find('select').attr('disabled',false);
            }
        });
        $(document).on('click', '.queue_panel_toggle', function (event) {
            var src = $(event.currentTarget);
            var srcID = src.attr('id');
            $('.queue_panel_toggle').removeClass('active');
            src.addClass('active');
            $('.queue_toggle_panel').css('display', 'none');
            $('#' + srcID + 'Panel').css('display', '');
        });
        $(document).on('click', '.accountPbxListHeader', function(event){
            var self = $(this);
            var table = self.parent('table');
            var tbody = $('tbody', table);
            if (tbody.css('display') == 'none'){
                tbody.css('display', '');
            } else {
                tbody.css('display', 'none');
            }
        });
        $(document).on('change', '.ivr-key-to-peer-type', function(event){
            var self = $(this);
            var parentTr = self.parents('tr');
            var panel = $('.ivr-key-to-peer-panel', parentTr);
            var html = [];
            html.push("<select name='to_peer' class='span6 ivr-key-to-peer'>");
            if (self.val() == 'system') {
                html.push(generateComboxOptionsFromDocs(handler.config.callConfig.systemPeerTypeArr, 'name', 'value', ''));
            } else {
                html.push("<option value=''>--请选择--</option>");
                var toPeerArr = session.ivrMap.ivr[self.val()];
                if (toPeerArr) {
                    if (self.val() == 'account_user'){
                        html.push(generateComboxOptionsFromDocs(toPeerArr, 'displayName', '_id', ''));
                    } else {
                        html.push(generateComboxOptionsFromDocs(toPeerArr, 'DisplayName', 'Exten', ''));
                    }
                }
            }
            panel.html(html.join(''));
        });

        $(document).on('click', '.ds-ivr-add-ivr-key', function(){
            var html = handler.config.callConfig.node.ivr.getIvrKeyListItem({
                Key:1,
                ToPeerType:'system',
                ToPeer:'0'
            });
            $('#ivrKeyListBody').append(html);
        });
        $(document).on('click', '.ds-ivr-delete-ivr-key,.ds-ivr-delete-assignment,.ds-ivr-delete-route-condition', function(){
            var self = $(this);
            var tr = self.parents('tr');
            tr.remove();
        })
            .on('click', '.ds-ivr-add-assignment-cond', function(){
                handler.config.callConfig.node.assignment.addNewAssignment();
            })
            .on('click', '.ds-ivr-add-route-item', function(){
                handler.config.callConfig.node.route.addNewRouteItem();
            })
            .on('click', '.ivr_advantage_search', function(){
                handler.config.callConfig.showAdvantageSearch(this);
            })
            .on('click', '.ivr_cancel_advantage_search', function(){
                var self = $(this);
                console.info(self.get(0).outerHTML);
                self.parents('.ivr_advantage_search_panel').css('display', 'none');
            });
    },
    /**
     * 渲染页面里所有声明了class="ds-item-list"标签，根据提供的数据源与标签属性宣染数据列表：
     * 如：
     * <div class="ds-item-list">
     * </div>
     * @param itemList
     * @param callback
     */
    renderItemList: function (itemList, callback) {
        // 页面上会有一个或多个列表，不管如何，可先填充到数组中
        itemList = Array.prototype.slice.call(itemList);
        if (itemList.length > 0) {
            // 取出数组的第一个列表标签
            var item = $(itemList.shift());
            // 取得数据源声明
            var dataSource = item.attr('data-source');
            // 数据源中的数据有些是不想展现出来的，如日程的默认语音，在语音列表里是不需要
            // 展现出来的，可以增加过滤条件，从数据源中过滤掉这些数据
            var dataExclude = item.attr('data-exclude');
            // 是否有分页控件
            var isPagination = item.attr('data-pagination');
            var onRenderItem = item.attr('on-render-item');
            var id = item.attr('id');
            if (dataExclude) {
                eval('dataExclude=' + dataExclude);
            }
            var itemView = item.attr('item-view');
            var dataList = null;
            // 如果页面上没有分页控件，则可直接取数据源
            if (isPagination && isPagination != 'true') {
                dataList = eval('session.ivrMap.' + dataSource);
            } else {
                // 分页显示数据
                var tempdata = null;

                // 因为页面上可能会有搜索框，要优先取出搜索出的数据，没有才展示数据源的数据
                if (session.ivrMap.searchResult) {
                    tempdata = session.ivrMap.searchResult;
                } else {
                    tempdata = eval('session.ivrMap.' + dataSource);
                }
                if (tempdata) {
                    dataList = [];
                    var enddata = [];
                    var oneData = null;
                    if (dataExclude) {
                        for (var i = 0, len = tempdata.length; i < len; i++) {
                            oneData = tempdata[i];
                            for (var key in dataExclude) {
                                if (dataExclude[key] == 'NotNull') {
                                    if (!oneData[key]) {
                                        enddata.push(oneData);
                                    }
                                } else {
                                    if (oneData[key] == dataExclude[key]) {
                                        enddata.push(oneData);
                                    }
                                }
                            }
                        }
                    } else {
                        enddata = tempdata;
                    }
                    var page = handler.config.callConfig.currentPage || 1;
                    var pageSize = handler.config.callConfig.pageSize;
//                    for (var i = 0; i < enddata.length; i++) {
//                        dataList.push(enddata[i]);
//                        if ((i + 1) === handler.config.callConfig.pageSize) {
//                            break;
//                        }
//                    }
                    for(var i = 0 ; i < enddata.length ;i ++){
                        if(i >((page-1)*pageSize-1) && i < page*pageSize){
                            dataList.push(enddata[i]);
                        }
                        if(dataList.length == pageSize){
                            break;
                        }
                    }
                    $("span." + id + "_result_count").text(enddata.length);
                    var list = $(".class_list #" + id + "_index li");
                    updatePagination(list, enddata.length, handler.config.callConfig.pageSize, page);
                    //dataList = eval('session.ivrMap.'+dataSource);
                }
            }
            if (dataList) {
                DS.getView(itemView, function (view) {
                    var data = null, itemHtml = null;
                    var dataListHtml = [];
                    for (var i = 0, len = dataList.length; i < len; i++) {
                        data = dataList[i];
                        if (dataExclude) {
                            //如果isExclude为false的时候，着条记录会被显示到页面
                            var isExclude = false;
                            for (var key in dataExclude) {
                                if (dataExclude[key] == 'NotNull') {
                                    if (data[key]) {
                                        isExclude = true;
                                        continue;
                                    }
                                } else {
                                    if (data[key] == dataExclude[key]) {
                                        isExclude = false;
                                        continue;
                                    } else {
                                        isExclude = true;
                                        continue;
                                    }
                                }
                            }
                            if (isExclude) continue;
                        }
                        itemHtml = DS.renderMethodViewNew(view, data, '');

                        if (onRenderItem) {
                            var renderItemCallback = eval('DS._ds_handler.' + onRenderItem);
                            if (renderItemCallback) {
                                itemHtml = renderItemCallback(itemHtml, data);
                            }
                        }
                        dataListHtml.push(itemHtml);
                    }
                    item.html(dataListHtml.join(''));
                    var subRenderItemList = $(".ds-item-list", item);
                    if (subRenderItemList.length > 0) {
                        handler.config.callConfig.renderItemList(subRenderItemList, null);
                    }
                    // 此处是递归调用renderItemList去渲染更多的列表
                    handler.config.callConfig.renderItemList(itemList, callback);
                });
            } else {
                handler.config.callConfig.renderItemList(itemList, callback);
            }
        } else {
            //session.ivrMap.searchResult = null;
            // 如果到了最后一个列表，则回调
            if (callback && typeof callback == 'function') {
                callback();
            }
        }
    },
    renderItemEdit: function (itemForm, panel) {
        var data = null;
        var clientDataName = itemForm.attr('client-data');
        if (clientDataName) {
            var clientData = eval(clientDataName);
            if (clientData) {
                if (Array.isArray(clientData)) {
                    var condition = session.ivrMap.viewData;
                    if (condition) {
                        var currData = null;
                        for (var ind in clientData) {
                            currData = clientData[ind];
                            for (var attr in currData) {
                                if (condition[attr]) {
                                    if (condition[attr] == currData[attr]) {
                                        data = currData;
                                        break;
                                    }
                                }
                            }

                        }
                    }
                } else {
                    data = clientData;
                }
            }
        }
        if (data) {
            objectToForm(itemForm, data);
            var itemEditParamTag = $(".ds_item_edit_param", itemForm);
            if (itemEditParamTag.length > 0) {
                var attr = null;
                for (var attrName in data) {
                    attr = itemEditParamTag.attr(attrName);
                    if (attr != undefined) {
                        itemEditParamTag.attr(attrName, data[attrName]);
                    }
                }
            }
            var completeCallbackName = itemForm.attr('on-complete');
            if (completeCallbackName) {
                var completeCallback = eval('DS._ds_handler.' + completeCallbackName);
                if (completeCallback) {
                    completeCallback(data);
                }
            }
        }
    },
    toPeerTypeArr: [
        {TypeValue: 'system', TypeName: '系统节点'},
        {TypeValue: 'ivr_node_queue', TypeName: '技能组'},
        {TypeValue: 'account_user', TypeName: '座席'},
        {TypeValue: 'ivr_node_announcement', TypeName: '播放语音节点'},
        {TypeValue: 'ivr_node_text_announcement', TypeName: '播放文本语音节点'},
        {TypeValue: 'ivr_node_ivr', TypeName: '按键菜单节点'},
        {TypeValue: 'ivr_node_encrypt_md5', TypeName: 'MD5加密节点'},
        {TypeValue: 'ivr_node_validation', TypeName: '采集输入节点'},
        {TypeValue: 'ivr_node_assignment', TypeName: '赋值节点'},
        {TypeValue: 'ivr_node_route', TypeName: '按变量路由节点'},
        {TypeValue: 'ivr_node_ivr_menu', TypeName: '转IVR菜单节点'},
        {TypeValue: 'ivr_node_call_url', TypeName: 'CallUrl节点'},
        {TypeValue: 'ivr_node_voice_mail', TypeName: '留言节点'},
        {TypeValue: 'ivr_node_room', TypeName: '会议室节点'},
        {TypeValue: 'ivr_node_satisfaction', TypeName: '自定义满意度节点'},
        {TypeValue: 'ivr_node_superDialJobNum', TypeName: '采集工号并拨打节点'},
        {TypeValue: 'ivr_node_extension_peer', TypeName: '自定义节点'}
    ],
    systemPeerTypeArr: [
        {name: '挂机', value: "0"},
        {name: '满意度调查', value: "1"},
        {name: '拨工号', value: "2"}
    ],
    renderIvrProcess: function (currentTag, viewPanel) {
        var itemEditParamTag = $('.ds_item_edit_param', viewPanel);
        var ivrProcessTypeTagValueKey = currentTag.attr('tag-value-key');
        var ivrProcessTypeValue = itemEditParamTag.attr(ivrProcessTypeTagValueKey);
        var toPeerArr = session.ivrMap.ivr.ivr_process;
        var html = "<select name='IvrProcessId' class='ivr_process_select'>";
        html += "<option value=''>不使用流程</option>";
        html += generateIvrProcessComboxOptionsFromDocs(toPeerArr, 'DisplayName', '_id', ivrProcessTypeValue);
        html += "</select>";
        currentTag.html(html);
        var isSelectProcess = $('#ivrProcessType').find('select').val();
        if(isSelectProcess){
            $('#scheduleToPeerType').find('select').attr('disabled',true);
            $('#scheduleToPeer').find('select').attr('disabled',true);
        }
    },
    renderToPeerType: function (toPeerTypeTag, viewPanel) {
        var toPeerType = handler.config.callConfig.toPeerTypeArr;
        var currentTag = null;
        var itemEditParamTag = $('.ds_item_edit_param', viewPanel);
        for (var i = 0, len = toPeerTypeTag.length; i < len; i++) {
            currentTag = $(toPeerTypeTag[i]);
            var selectTagName = currentTag.attr('tag-name');
            var toPeerTypeTagValueKey = currentTag.attr('tag-value-key');
            var toPeerTypeValue = itemEditParamTag.attr(toPeerTypeTagValueKey);
            var html = "<select name='" + selectTagName + "' class='ivr_to_peer_type_select'>"
            html += generateComboxOptionsFromDocs(toPeerType, 'TypeName', 'TypeValue', toPeerTypeValue);
            html += "</select>";
            currentTag.html(html);
            handler.config.callConfig.renderToPeerTag(currentTag, toPeerTypeValue, viewPanel);
        }
    },
    renderToPeerTag: function (toPeerTypeTag, toPeerTypeValue, viewPanel) {
        var toPeerTag = toPeerTypeTag.next('div');
        var toPeerArr = session.ivrMap.ivr[toPeerTypeValue];
        var itemEditParamTag = $('.ds_item_edit_param', viewPanel);

        var toPeerSelectTagName = toPeerTypeTag.attr('tag-name').replace('Type', '');
        var html = "<select name='" + toPeerSelectTagName + "'>";

        var toPeerTagValueKey = toPeerTag.attr('tag-value-key');
        var toPeer = itemEditParamTag.attr(toPeerTagValueKey);

        if (!toPeerTypeValue || toPeerTypeValue == 'system') {
            html += generateComboxOptionsFromDocs(handler.config.callConfig.systemPeerTypeArr, 'name', 'value', toPeer);
        } else {
            html += "<option value=''>--请选择--</option>";
            if (toPeerArr) {
                if(toPeerTypeValue == 'account_user'){
                    html += generateComboxOptionsFromDocs(toPeerArr, 'displayName', '_id', toPeer);
                } else {
                    html += generateComboxOptionsFromDocs(toPeerArr, 'DisplayName', 'Exten', toPeer);
                }
            }
        }

        html += "</select>";
        toPeerTag.html(html);
    },
    renderSoundSelect: function(soundSelectDivArr, panel){
        if(soundSelectDivArr.length > 0) {
            var soundSelectDiv = null;
            var html = null;
            var optionHtmp = null, filename = null;
            var selectName = "";
            var soundArr = handler.config.callConfig.sound.getNormalSound();
            for(var i= 0,len=soundSelectDivArr.length;i<len;i++) {
                soundSelectDiv = $(soundSelectDivArr[i]);
                selectName = soundSelectDiv.attr('sound-select-name');
                filename = $('.ds_item_edit_param', panel).attr(selectName);
                html = [];
                html.push("<select name='" + selectName + "'>");
                html.push("<option value=''>--请选择--</option>");
                optionHtmp = generateComboxOptionsFromDocs(soundArr, 'DisplayName', 'Filename', filename);
                html.push(optionHtmp);
                html.push("</select>");
                soundSelectDiv.html(html.join(''));
            }
        }
    },
    renderVarSelect: function(varSelectDivArr, panel) {
        if(varSelectDivArr.length > 0) {
            var varSelectDiv = null;
            var varSelectName = null, value = null;
            for(var i= 0,len=varSelectDivArr.length;i<len;i++) {
                varSelectDiv = $(varSelectDivArr[i]);
                varSelectName = varSelectDiv.attr('var-select-name');
                value = $('.ds_item_edit_param', panel).attr(varSelectName);
                varSelectDiv.html(handler.config.callConfig.generateVarSelect(varSelectName, value));
            }
        }
    },
    generateVarSelect: function(varSelectName, value, appendClass){
        var html = [];
        appendClass = appendClass ? appendClass : '';
        html.push("<select name='" + varSelectName + "' class='" + appendClass + "'>");
        html.push("<option value=''>--请选择--</option>");
        var vars = session.ivrMap.ivr.vars;
        html.push(generateComboxOptionsFromDocs(vars, 'VarName', 'VarName', value));
        html.push("</select>");
        return html.join('');
    },
    ivrSearch: function(self){
        if(self){
            var nodeType = self.attr('node-type');
            var nodes = eval('session.ivrMap.'+nodeType);
            var searchResult = [];
            if(nodes) {
                var node = null, key = null;
                var val = self.val();
                var mapKeys = self.attr('map-key').split(',');
                var searchResultMap = {};
                for(var i= 0,len=nodes.length;i<len;i++) {
                    node = nodes[i];
                    for(var j= 0,jLen=mapKeys.length;j<jLen;j++) {
                        key = mapKeys[j];
                        if(node[key] && node[key].indexOf(val) > -1){
                            if(!searchResultMap[node._id]){
                                searchResultMap[node._id] = node;
                                searchResult.push(node);
                            }
                        }
                    }
                }
                searchResultMap = null;
            }
            return searchResult;
        }
    },
    itemFocusIndex : -1,
    lastSearch: null,
    ivrBehaviorModule : {
        init:function(){
            var keyPress = null;
            var isIgnoreKeyPress = false;
            var ignoreKey = '_16_17_18_27_37_39_';
            var ignoreUpKey = '_13_38_40_';
            $('#ivrMain').on('keydown', '.ivr_search', function(){
                var keyCode = event.keyCode;
                if (ignoreKey.indexOf('_'+keyCode+'_')> -1){
                    isIgnoreKeyPress = true;
                }

                var target = event.currentTarget;
                if(keyCode == 40) {
                    // press down
                    var lastIndex = handler.config.callConfig.itemFocusIndex;
                    var currentIndex = lastIndex + 1;
                    var itemFlagArr = $(".item-flag", target);
                    if(currentIndex+1 > itemFlagArr.length) {
                        currentIndex = lastIndex;
                    }
                    itemFlagArr.removeClass('item-focus');
                    $(itemFlagArr[currentIndex]).addClass('item-focus');
                    handler.config.callConfig.itemFocusIndex = currentIndex;
                    return false;
                } else if (keyCode == 38) {
                    // press up
                    var lastIndex = handler.config.callConfig.itemFocusIndex;
                    var currentIndex = lastIndex - 1;
                    if(lastIndex == 0) {
                        currentIndex = 0;
                    }
                    var itemFlagArr = $(".item-flag", target);
                    itemFlagArr.removeClass('item-focus');
                    $(itemFlagArr[currentIndex]).addClass('item-focus');
                    handler.config.callConfig.itemFocusIndex = currentIndex;
                    return false;
                } else if (keyCode == 13) {
                    // press enter
                    var currentItem = $('.item-focus', target);
                    if(currentItem) {
                        var itemParent = currentItem.parents('.list-item');
                        if(itemParent.length > 0) {
                            itemParent.trigger('click');
                        }
                    }
                    return false;
                }

                if (!isIgnoreKeyPress){
                    keyPress = keyCode;
                    handler.config.callConfig.lastSearch = $(this).val();
                }
            }).on('keyup', '.ivr_search', function(){
                    var keyCode = event.keyCode;
                    if (ignoreKey.indexOf('_'+keyCode+'_')> -1){
                        isIgnoreKeyPress = false;
                        return true;
                    }

                    if(ignoreUpKey.indexOf('_'+keyCode+'_') > -1) {
                        return false;
                    }

                    if(isIgnoreKeyPress){
                        isIgnoreKeyPress = false;
                        return false;
                    }

                    if(keyPress){
                        var target = event.currentTarget;
                        var src = $(this);

                        if(keyCode == 8 && !handler.config.callConfig.lastSearch){
                            delete session.ivrMap.searchResult;
                            handler.config.callConfig.renderItemList($('.ds-item-list','#ivrMain'));
                            return false;
                        }

                        if (!src.val()){
                            delete session.ivrMap.searchResult;
                            handler.config.callConfig.renderItemList($('.ds-item-list','#ivrMain'));
                            return false;
                        }

                        var searchResult = handler.config.callConfig.ivrSearch(src);
                        session.ivrMap.searchResult = searchResult;
                        handler.config.callConfig.currentPage = 1;
                        keyPress = null;
                        handler.config.callConfig.itemFocusIndex = -1;
                        handler.config.callConfig.renderItemList($('.ds-item-list','#ivrMain'));
                        var list = $(".class_list #"+src.attr('pagination-name')+"_index li");
                        var count = 0;
                        if(searchResult && searchResult.length > 0) {
                            count = searchResult.length;
                        }
                        updatePagination(list, count, handler.config.callConfig.ivrPageSize, 1);
                        $("span."+src.attr('pagination-name')+"_result_count").text(count);
                        var paginationName = src.attr('pagination-name');
                        $('[name=dataSource]','#'+paginationName+'Frm').attr('value', 'searchResult');
                    }
                });

            var isFocusLast = false;
            $('#ivrMain').on('keydown', '.ivr-node-panel .ivr-focus-last', function(){
                var keyCode = event.keyCode;
                if (keyCode == 9) {
                    isFocusLast = true;
                    return false;
                }
                return true;
            }).on('keyup', '.ivr-node-panel .ivr-focus-last', function(){
                    var keyCode = event.keyCode;
                    if (keyCode == 9 && isFocusLast) {
                        var first = $('.ivr-node-panel .ivr-focus-first');
                        if(first) {
                            first.select();
                            isFocusLast = false;
                            return false;
                        }
                    }
                    return true;
                }).on('keydown', '.ivr-node-panel input,select', function(){
                    var keyCode = event.keyCode;
                    if(keyCode == 13) {
                        $('.ivr-node-panel .ivr-save').trigger('click');
                        handler.config.callConfig.itemFocusIndex = -1;
                        return false;
                    }
                    return true;
                });
        },
        panelOpened: function(){
            var node = $('.ivr-node-panel .ivr-focus-first');
            if(node) {
                var val = node.val();
                node.focus();
                node.val(val);
            }
        }
    },
    /**
     * 由于ds_action_flow现只有ivr用到，IVR页面加载时需要初始化，为ds_action_flow绑定事件
     */
    init: function () {
        if(!handler.config.callConfig.isInitDSActionFlow){
            handler.config.callConfig.initDSActionFlow();
            handler.config.callConfig.isInitDSActionFlow = true;
        }
        session.ivrMap = session.ivrMap || {};
    },
    hideIvrMessage: function () {
        $('#ivrMessage').css('display', 'none');
        $('#ivrReloadMessage').css('display', 'none');
    },
    getNodes: function (data, callback) {
        session.ivrMap.ivr = session.ivrMap.ivr || {};
        var cacheNodes = session.ivrMap.ivr[data.nodeType];
        if (!cacheNodes) {
            var action = {
                action: data.actionName,
                data: {
                    Account: handler.config.callConfig.currentConfigData.Account,
                    PBX: handler.config.callConfig.currentConfigData.PBX
                }
            }
            if (data.actionParam) {
                for (var param in data.actionParam) {
                    action.data[param] = data.actionParam[param];
                }
            }
            DS.send(action, function (response) {
                if (response.success) {
                    session.ivrMap.ivr[data.nodeType] = response.list;
                    callback(response.list);
                } else {
                    callback(null);
                }

            });
        } else {
            callback(cacheNodes);
        }
    }, getNodeFromCache: function (nodeType, key, value) {
        var cacheNodes = session.ivrMap.ivr[nodeType];
        if (!cacheNodes) return null;
        if (key && value) {
            var node = null;
            for (var i = 0, len = cacheNodes.length; i < len; i++) {
                node = cacheNodes[i];
                if (node && node[key] == value) {
                    return node;
                }
            }
        } else {
            return cacheNodes;
        }
    }, _getCacheNode: function (nodeType) {
        var cacheNodes = session.ivrMap.ivr[nodeType];
        if(!cacheNodes){
            cacheNodes = session.ivrMap[nodeType];
        }
        if (!cacheNodes || !Array.isArray(cacheNodes)) {
            cacheNodes = [];
            session.ivrMap.ivr[nodeType] = cacheNodes;
        }
        return cacheNodes;
    }, _spliceNodeFromCache: function (cacheNodes, key, value) {
        var node = null;
        for (var i = 0, len = cacheNodes.length; i < len; i++) {
            node = cacheNodes[i];
            if (node && node[key] == value) {
                cacheNodes.splice(i, 1);
                break;
            }
        }
    }, deleteNodeFromCache: function (nodeType, key, value) {
        var cacheNodes = handler.config.callConfig._getCacheNode(nodeType);
        handler.config.callConfig._spliceNodeFromCache(cacheNodes, key, value);
        handler.config.callConfig._refreshNodeCacheMap();
    }, updateNodeToCache: function (nodeType, key, value, data) {
        var cacheNodes = handler.config.callConfig._getCacheNode(nodeType);
        handler.config.callConfig._spliceNodeFromCache(cacheNodes, key, value);
        cacheNodes.unshift(data);
        handler.config.callConfig._refreshNodeCacheMap();
    }, addNodeToCache: function (nodeType, data) {
        var cacheNodes = handler.config.callConfig._getCacheNode(nodeType);
        cacheNodes.unshift(data);
        handler.config.callConfig._refreshNodeCacheMap();
    },
    refreshNodeToCache: function(nodeType, dataList) {
        session.ivrMap.ivr[nodeType] = dataList;
    },
    beforeRenderIvrMain: function(data, ele){
//        var self = handler.config.callConfig;
//        self.currentConfigData = self.currentConfigData || {};
//        self.currentConfigData.PBX = ele.attr('pbx');
//        self.currentConfigData.Account = ele.attr('account');
//        data.PBX = self.currentConfigData.PBX;
//        data.Account = self.currentConfigData.Account;
//        return data;
    },
    afterRenderIvrMain: function(data, src){
        // IVR主页面第一个显示的节点是pbx信息，触发pbx信息锻接的click，让其加载数据
        if(session.user.isAdmin){
            $('#pbxInfoLink').trigger('click');
        }else{
            $('#ivrServiceNoLink').trigger('click');
        }
        //$('#accountNameLabel').html(src.attr('account-id')+' - '+src.attr('account-name')+' - '+src.attr('company-name')+' - <b style="color:blue;">' + src.attr('pbx-name') + '</b>');
        handler.config.callConfig.ivrBehaviorModule.init();
        $('#accountPbxMainPanel').css('display', '');
    },
    /**
     * IVR主页面加载时，从服务端取出当前账户所有的IVR节点信息，存放在缓存里：session.ivrMap
     * 数据按节点类型:节点信息列表存储，如：{"ivr_node_announcement":[{..},{..}]}
     */
    ivrMain: function (data, response) {
        var self = handler.config.callConfig;

        session.ivrMap.ivr = data;
        //构建一个 key-value对象，key是Exten，value是节点对象
        self._refreshNodeCacheMap();
        //查询所有服务号，并放放缓存中
        //session.ivrMap.ivrServiceNo = response.allServiceNos;
        //查询所有ivr流程，并放入缓存中
        //session.ivrMap.ivrFlow = response.allFlows;
        //查询所有schedule日程，并放入缓存中
        //session.ivrMap.ivrSchedule = response.allSchedules;
        //查询所有ivr变量，并放入缓存中
        //session.ivrMap.ivrVars = response.allVars;
        //查询所有的电话条状态，并放入缓存中
        session.ivrMap.ivrPhoneBarConfig = response.allPhoneBarConfig;
        //查询所有的黑红名单，并放入缓存中
        session.ivrMap.ivrBlackList = response.allBlackList;
        //所有节点类型的中文名称放入缓存中。key=节点类型，value=类型的中文名
        //self._generateIvrTypeNameMap();

        //handler.ivr.showIvrServiceNo(data);
        var accountLines = session.ivrMap.ivr.ivr_line;
        accountLines.forEach(function (item) {
            if (item.Exten) {
                item.DisplayName = item.Exten;
            } else {
                item.DisplayName = '未配置线路';
                item.UpdateTime = '';
                item.DidNum = '';
            }
            if (item.Dialout) {
                item.TypeName = '外呼线路';
            } else {
                item.TypeName = '呼转线路';
            }
        });

        var soundList = session.ivrMap.ivr.ivr_sound;
        var normalSound = [];
        soundList.forEach(function(item){
            if(item.SoundType == 'normal'){
                normalSound.push(item);
            }
        });
        session.ivrMap.ivr.normal_sound = normalSound;
        handler.config.callConfig.setSipPeerUser();
        var systemNode = session.ivrMap.ivr.system;
        if (systemNode) {
            var systemNodeItem = null;
            for (var i = 0, len = systemNode.length;i<len;i++) {
                systemNodeItem = systemNode[i];
                if (systemNodeItem.Exten && systemNodeItem.Exten == '2') {
                    // system node only dial job number node, as array
                    session.ivrMap.ivr.ivr_node_system = [systemNodeItem];
                    break;
                }
            }
        }
    },
    setSipPeerUser: function() {
        var sips = session.ivrMap.ivr.ivr_sip;
        var users = session.ivrMap.ivr.account_user;
        users.forEach(function(user) {
            for (var s in sips) {
                if (sips[s].UserID && sips[s].UserID == user._id) {
                    sips[s].UserExten = user.exten;
                    sips[s].UserName = user.displayName;
                }
            }
        });
    },
    _generateIvrTypeNameMap: function () {
        var typeList = session.ivrMap.ivrNodeType;
        var typeNameMap = {};
        for (var i = 0; i < typeList.length; i++) {
            typeNameMap[typeList[i].code_value] = typeList[i].code_name;
        }
        session.ivrMap.ivrTypeNameMap = typeNameMap;
    },
    _refreshNodeCacheMap: function () {
//        delete session.ivrMap['extenIndex'];
//        var allNodesMap = {};
//        var cacheNodes = session.ivrMap.ivr;
//        $.each(cacheNodes, function (i, item) {
//            $.each(item, function (j, obj) {
//                var Exten = null;
//                if (i === 'account_user') {
//                    Exten = obj['_id'];
//                    obj['NodeType'] = i;
//                } else {
//                    Exten = obj['Exten'];
//                    obj['NodeType'] = i;
//                }
//                allNodesMap[Exten] = obj;
//            });
//        });
//        console.log(allNodesMap);
//        session.ivrMap.extenIndex = allNodesMap;
    },
    updateClientData: function (param) {
        var type = param.type;
        var operation = param.operation;
        var data = param.data;
        if(operation && operation == "del"){
            handler.config.callConfig.deleteNodeFromCache(type, '_id', data._id);
        }else {
            if (data)
                handler.config.callConfig.updateNodeToCache(type, '_id', data._id, data);
        }
    },
    updateClientDataList: function (param) {
        var type = param.type;
        var list = param.data;
        handler.config.callConfig.refreshNodeToCache(type, list);
    },
    updateClientSearchData: function(param) {
        session.ivrMap.searchResult = param.data;
    },
    reloadComplete: function () {
        handler.config.callConfig.effectIvr = false;
        $('.ds_ivr_effect').addClass('disabled');
    },
    showAdvantageSearch:function(obj){
        var searchBtn = $(obj);
        var popDv = $(searchBtn.attr('pop-target')+'');
        popDv.css('display', '');
        popDv.css('top', 30);
        popDv.css('left', 62);
    },
    ivrPageSize : 5,
    paginationChanged : function(data , src){
//        var datalist =  eval('session.ivrMap.'+data.dataSource);
//        //语音节点需要过滤掉日程默认语音
//        if(data.itemTabId === 'announcementList'){
//            var endData = [];
//            for(var i= 0,len=datalist.length;i<len;i++){
//                if(!datalist[i].ServiceNo){
//                    endData.push(datalist[i]);
//                }
//            }
//            datalist = endData;
//        }
//        var count = datalist.length;
//        var page = src.val() || 1;
//        var pageSize = handler.config.callConfig.ivrPageSize;
//        //筛选出当前页码显示的记录
//        var result = [];
//        for(var i = 0 ; i < datalist.length ;i ++){
//            if(i >((page-1)*pageSize-1) && i < page*pageSize){
//                result.push(datalist[i]);
//            }
//            if(result.length == pageSize){
//                break;
//            }
//        }
//        delete session.ivrMap['searchResult'];
//        session.ivrMap['searchResult'] = result;

        handler.config.callConfig.currentPage = parseInt(src.val())||1;
        var itemLists = $("#"+data.itemListID);
        handler.config.callConfig.renderItemList(itemLists);
//        $("span."+data.itemListID+"_result_count").text(count);
//        var list = $(".class_list #"+data.itemListID+"_index li");
//        updatePagination(list, count, handler.config.callConfig.ivrPageSize, page);
    },
    getAccount: function(accountID){
        var accountPbxList = session.ivrMap.accountPbxList;
        var account = null;
        for(var i= 0,len = accountPbxList.length;i<len;i++){
            account = accountPbxList[i];
            if(account.account == accountID){
                break;
            }
        }
        if(account) {
            return account;
        }
        return null;
    },
    accountListLoaded: function(data){
        console.info(data);
    },
    openLocalNumForPhonePick: function(data){
        DS.getView('config/callConfig/addLocalNumForPhonePick', function (view) {
            var panel = $('#modal_panel');
            panel.empty();
            panel.html(view.replace(/__agenName/g,handler.cdr.getAgentName(data))
                .replace(/__agent_id/g,data));
            $('#add_local_num_Modal').modal();
        });
    },
    saveLocalNumForPhonePick: function(data){
        var action = {
            action: 'app.user.editUser',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                phone_peers[data._id].localNo = data.mobile;
                $().alertmessage('showSuccess', '保存成功');
                $('#add_local_num_Modal').modal('hide');
                phone_pick(data._id);
            } else {
                $().alertmessage('showError', '保存失败');
            }
        });
    },
    pbx: {
        queryPaginationAccount: function(data, src){
            var page = src.attr('value');
            $('#accountListPage').val(page);
            $('#searchAccountPbxLink').trigger('click');
        },
        setAccountPbxList: function (data, res) {
            session.ivrMap.accountPbxList = data;
            var count = res.count;
            var page = res.page;
            $("#accountList_pagination .result_count").text(count);
            var list = $("#accountList_pagination #accountList_index li");
            updatePagination(list, count, handler.config.callConfig.ivrPageSize, page);
            $('#accountListPage').val('');
        },
        accountPbxList: function () {
            $('#searchAccountPbxLink').trigger('click');
        },
        preRenderItem: function (view, data) {
            var pbx = data.pbx;
            var pbxTemplate = '<a href="#" class="ds_action_flow" pbx="__PBX" account="__Account" account-name="__AccountName" account-id="__AccountID"' +
                ' company-name="__CompanyName" pbx-name="__PBXName">__NickName' +
                '<ds-do-action action="config.ivr.getAllNodesByPbx" on-before="config.callConfig.beforeRenderIvrMain" on-complete="config.callConfig.ivrMain"></ds-do-action>' +
                '<ds-get-view view="config/callConfig/ivrMain" panel="ivrMain" on-complete="config.callConfig.afterRenderIvrMain"/></a>';
            if (pbx) {
                var html = [];
                var currentPbxHtml = '';
                currentPbxHtml = pbxTemplate.replace('__PBX', pbx.PBX).replace('__AccountName', data.name).replace('__AccountID', data._id).replace('__NickName', pbx.NickName)
                    .replace("__Account", pbx.Account).replace("__CompanyName", data.company).replace("__PBXName", pbx.NickName);
                html.push(currentPbxHtml + "&nbsp;&nbsp;");
                return view.replace('__listpbx', html.join(''));
            }
            return view.replace('__listpbx', '');
        },
        preAddPbx: function (data, ele) {
            handler.config.callConfig.currentConfigData = {
                Account : session.account.account
            };
            $('#addPbxLink').trigger('click');
            $('#pbxSelectPanel').html(handler.config.callConfig.pbx.renderPbxSelect(''));
            $('#accountDisplayName').val(session.account.name);
        },
        renderPbxSelect: function(val, disabled){
            var pbxList = getCache('pbx');
            var pbxListHtml = [];
            var ownPbxes = session.account.pbx;
            var endList = [];
            if(ownPbxes){
                for(var i=0;i<pbxList.length;i++){
                    var tag = false;
                    for(var j=0;j<ownPbxes.length;j++){
                        if(ownPbxes[j].PBX == pbxList[i]._id ||
                            ownPbxes[j].PBX.substring(0,ownPbxes[j].PBX.lastIndexOf('.')) == pbxList[i]._id.substring(0,pbxList[i]._id.lastIndexOf('.'))){
                            tag = true;
                        }
                    }
                    if(!tag){
                        endList.push(pbxList[i]);
                    }
                }
            }else{
                endList = pbxList;
            }
            var pbxNameList = [];
            var pbxNameMap = {};
            for(var i=0 ;i<endList.length;i++){
                var currentId = endList[i]._id;
                var currentName = endList[i].name;
                var pbxKey = currentId.substring(0,currentId.lastIndexOf('.'));
                var pbxInstance = currentId.substring(currentId.lastIndexOf('.')+1);
                if(pbxKey in pbxNameMap){
                    pbxNameMap[pbxKey].push({num:pbxInstance+'('+currentName+')',name:currentName,allId:currentId});
                }else{
                    pbxNameMap[pbxKey] = [];
                    pbxNameMap[pbxKey].push({num:pbxInstance+'('+currentName+')',name:currentName,allId:currentId});
                }
            }
            $.each(pbxNameMap,function(key,item){
                pbxNameList.push({name:key})
            })
            session.ivrMap.addPbxNameList = pbxNameList;
            session.ivrMap.addPbxNameMap = pbxNameMap;
            pbxListHtml.push('<select name="PBX_NAME" required="true" onchange="handler.config.callConfig.pbx.changePbxSelect(this.value)" ');
            pbxListHtml.push(disabled||'');
            pbxListHtml.push('><option id="defautpbxselected" selected="selected" value="">--请选择--</option>');
            pbxListHtml.push(generateComboxOptionsFromDocs(pbxNameList, 'name', 'name', val));
            pbxListHtml.push('</select>');
            pbxListHtml.push('<span class="add_pbx_load_label"></span>')
            handler.config.callConfig.pbx.changePbxSelect();
            return pbxListHtml.join('');
        },
        changePbxSelect: function(val){
            var html = [];
            var list = session.ivrMap.addPbxNameMap[val];
            html.push('<select name="PBX" required="true" onchange="handler.config.callConfig.pbx.changeSubPbxSelect(this.value)" >');
            html.push('<option selected="selected" value="">--请选择--</option>');
            if(val){
                html.push(generateComboxOptionsFromDocs(list, 'num', 'allId', val));
            }
            html.push('</select>');
            html.push('<span class="add_sub_pbx_load_label"></span>')
            $('#pbxSelectInstancePanel').html(html.join(''));
            if(val && val != ''){
                checkPbxLoadInfo(val);
            }else{
                $(".add_pbx_load_label").html('');
            }
        },
        changeSubPbxSelect: function(val){
            if(val && val != ''){
                checkSubPbxLoadInfo(val);
            }else{
                $(".add_sub_pbx_load_label").html('');
            }
        },
        preSavePbx: function(data) {
            var pbxNickName = $('#pbxNickName');
            if (!pbxNickName.val()) {
                data.error = true;
                data.errorMessage = '请填写昵称';
                pbxNickName.focus();
            }
            return data;
        },
        pbxAddSuccess: function (responseData) {
            $('#addPbx').modal('hide');
            $('#addPbx').html('');
            $("#pbx_btn_group").show();
            var pbx = null;
            var account = session.account;
            var self = handler.config.callConfig;
            if (account) {
                if (account.pbx) {
                    account.pbx.push(responseData);
                }else{
                    account.pbx = [];
                    account.pbx.push(responseData);
                }
                pbx = responseData;
                render.ivr.renderNewPbxSelect(pbx);
                $('#ivrAddPbxLink').attr('account', account.account);
                if (!pbx) {
                    return;
                }
                session.ivrMap.accountPbxList = account.pbx;
                self.currentConfigData = {
                    Account: pbx.Account,
                    PBX: pbx.PBX
                }
                if (account) {
                    $('#accountPbxInfoPanel').html('<h3>' + pbx.Account + ' - ' + account.name + ' - ' + ' <b style="color:blue;">' + pbx.NickName + '</b></h3>');
                }
                var getIvrNodesLink = $('#getIvrNodesLink');
                getIvrNodesLink.trigger('click');
            } else {
                alert('找不到账户信息');
            }
        },
        cancelAdd: function(){
            $('#addPbx').modal('hide');
            $('#addPbx').html('');
        },
        accountPbxEdit: function () {
            var self = handler.config.callConfig;
            var accountPbxList = session.ivrMap.accountPbxList;
            var current = self.currentConfigData;
            var pbx = null;
            for (var ind in accountPbxList) {
                pbx = accountPbxList[ind];
                if (pbx.PBX == current.PBX) {
                    break;
                }
            }
            if(pbx){
                self.currentPbx = pbx;
            } else {
                alert('系统找不到此账户的PBX');
            }
            $('#pbxEditSelectPanel').html('<input value="'+self.currentPbx.PBX+'" disabled/>');
//            $('#pbxEditSelectPanel').html(handler.config.callConfig.pbx.renderPbxSelect(self.currentPbx, 'disabled'));
        },
        accountPbxUpdated: function(data){
            var self = handler.config.callConfig;
            var ownpbxes = session.account.pbx;
            for(var i=0 ; i<ownpbxes.length ;i++){
                if(data.PBX == ownpbxes[i].PBX){
                    ownpbxes[i] = data;
                    break;
                }
            }
            var ivrAccPbxes = session.ivrMap.accountPbxList;
            for(var i=0 ; i<ivrAccPbxes.length ;i++){
                if(data.PBX == ivrAccPbxes[i].PBX){
                    ivrAccPbxes[i] = data;
                    break;
                }
            }
            var dicPbxes =  session.dicMap.pbx;
            for(var i=0 ; i<dicPbxes.length ;i++){
                if(data.PBX == dicPbxes[i].PBX){
                    dicPbxes[i] = data;
                    break;
                }
            }
            $('#pbxInfoLink').click();
            $('#pbxEditSelectPanel').html('<input value="'+self.currentPbx.PBX+'" disabled/>');
        },
        showMovePbx: function(data){
            var pbxes = getCache("pbx");
            var pbx = null;
            var accountPbx = null;
            var isHasPbx = false;
            var html = [];
            var accountPbxes = session.account.pbx;
            var currentPbxVo = null;
            for (var i = 0, len = pbxes.length; i < len; i++) {
                pbx = pbxes[i];
                if (pbx) {
                    isHasPbx = false;
                    for (var j = 0, jLen = accountPbxes.length; j < jLen; j++) {
                        accountPbx = accountPbxes[j];
                        if (accountPbx.PBX == pbx._id||
                            accountPbx.PBX.substring(0,accountPbx.PBX.lastIndexOf('.')) == pbx._id.substring(0,pbx._id.lastIndexOf('.'))){
                            isHasPbx = true;
                        }
                        if (accountPbx.PBX == handler.config.callConfig.currentPbx.PBX) {
                            currentPbxVo = accountPbx;
                        }
                    }
                    if (!isHasPbx) {
                        html.push('<option value="');
                        html.push(pbx._id);
                        html.push('">');
                        html.push(pbx.name);
                        html.push('('+pbx._id+')');
                        html.push('</option>');
                    }
                }
            }
            var pane = $('#move_pbx_Modal');
            pane.find("input[name='sipConfigName']").val(currentPbxVo.NickName+"("+currentPbxVo.PBX+")");
            pane.find("input[name='oldsipConfigId']").val(currentPbxVo.PBX);
            $("#targetpbxselected").after(html.join(''));
            $('#move_pbx_Modal').modal();
        },
        saveMoveAccountPbx: function(data){
            if(!confirm('这是【迁移PBX】操作! 确定要执行吗？建议联系4008-113-114 让技术协助完成此动作!')){
                return;
            }
            if(session.ivrMap.ivr.ivr_line){
                var lines = session.ivrMap.ivr.ivr_line;
                for(var i=0;i<lines.length;i++){
                    if(!lines[i].Exten){
                        alert('您有[外呼]或[呼转]线路未配置，不能迁移。请先配置外呼和呼转线路后再迁移!');
                        return;
                    }
                }
            }
            data.accountId = session.user.account;
            var action = {
                action: 'config.ivr.pbx.moveAccountPbx',
                data: data
            }
            DS.send(action, function (response) {
                if(!response.success){
                    if(response.Reason == '501'){
                        alert("迁移失败，执行bill库存储过程失败！请检查是否添加了存储过程！");
                    }else if(response.Reason == '502'){
                        alert("迁移失败，执行cc库存储过程失败！请检查是否添加了存储过程！");
                    }
                }else{
                    alert('迁移PBX成功，请稍等一会重新登录系统');
                    $('#move_pbx_Modal').modal('hide');
                }
            });
        }
    },
    serviceNo: {
        afterSaveServiceNo: function (serviceNoData, res) {
            if(res.serviceNoSchedule){
                handler.config.callConfig.addNodeToCache('ivr_schedule', res.serviceNoSchedule);
            }
            if(res.data){
                var index = null;
                var availService = session.ivrMap.ivr.ivr_available_service_no;
                for(var i=0 ; i < availService.length ; i++){
                    if(res.data.Exten == availService[i]._id){
                        index = i;
                        break;
                    }
                }
                if(index != null)
                    availService.splice(i,1);
            }
        },
        afterDeleteServiceNo: function(serviceNoData, res){
            if(res.scheduleIDs){
                for(var id in res.scheduleIDs){
                    handler.config.callConfig.deleteNodeFromCache('ivr_schedule', '_id', res.scheduleIDs[id].id)
                }
            }
            var availService = session.ivrMap.ivr.ivr_available_service_no;
            var resotreServiceNo ={
                _id: serviceNoData.Exten
            }
            availService.push(resotreServiceNo);
        },
        getTypeName: function(type) {
            if (type == 'normal') {
                return '普通';
            }
            if (type == 'batchDialout') {
                return '批量外呼';
            }
            return '';
        },
        completeOpenAddServiceNo : function(data){
            var availService = session.ivrMap.ivr.ivr_available_service_no;
            var pane = $("#serviceNoAddSelect");
            var html = '';
            for(var i=0 ; i < availService.length ; i++){
                html+='<option value='+availService[i]._id+'>'+availService[i]._id+'</option>'
            }
            pane.html(html);
        }
    },
    schedule: {
        compareDate : function(data){
            var startMoth = parseInt(data.StartDate.split('-')[0]);
            var startDay = parseInt(data.StartDate.split('-')[1]);
            var endMonth = parseInt(data.EndDate.split('-')[0]);
            var endDay = parseInt(data.EndDate.split('-')[1]);
            if (startMoth > endMonth){
                return false;
            }
            if (startMoth == endMonth && startDay > endDay){
                return false;
            }
            return true;
        },
        judgeScheduleData : function(data){
            var scheduleList = session.ivrMap.ivr.ivr_schedule;
            for (var i = 0; i < scheduleList.length; i++){
                if (scheduleList[i].ServiceNo  == data.ServiceNo){
                    if (!data._id){
                        if (scheduleList[i].DisplayName == data.DisplayName){
                            alert("日程名称重复，请重新输入！");
                            $('.schedule_name').focus;
                            data.skip = true;
                            return data;
                        }
                        if (scheduleList[i].Order == data.Order){
                            alert("优先级重复，请重新输入！");
                            $('.schedule_order').focus;
                            data.skip = true;
                            return data;
                        }
                    }else{
                        if (data._id != scheduleList[i]._id){
                            if (scheduleList[i].DisplayName == data.DisplayName){
                                alert("日程名称重复，请重新输入！");
                                $('.schedule_name').focus;
                                data.skip = true;
                                return data;
                            }
                            if (scheduleList[i].Order == data.Order){
                                alert("优先级重复，请重新输入！");
                                $('.schedule_order').focus;
                                data.skip = true;
                                return data;
                            }
                        }

                    }

                }
            }
            var datePattern = new RegExp(/^([1-9]|[1][012])-([1-9]|[12][0-9]|[3][01])$/);
            if (!datePattern.test(data.StartDate) && data.StartDate != "*"){
                alert("请输入正确的开始日期！");
                $('.schedule_start_date').focus();
                data.skip = true;
                return data;
            }
            if (!datePattern.test(data.EndDate) && data.EndDate != "*"){
                alert("请输入正确的结束日期！");
                $('.schedule_end_data').focus();
                data.skip = true;
                return data;
            }
            var timePattern = new RegExp(/^([01][0-9]|[2][0-3]):[0-5][0-9]$/);
            if (!timePattern.test(data.StartTime) && data.StartTime != "*"){
                alert("请输入正确的开始时间！");
                $('.schedule_start_time').focus();
                data.skip = true;
                return data;
            }
            if (!timePattern.test(data.EndTime) && data.EndTime != "*"){
                alert("请输入正确的结束时间！");
                $('.schedule_end_time').focus();
                data.skip = true;
                return data;
            }
            if (data.EndTime != '*'){
                var lastNum = data.EndTime.substring(data.EndTime.length - 1);
                if (lastNum % 2 == 0){
                    alert("设置日程结束时间，请将分钟设置为奇数，如18:59，即19点之前");
                    $('.schedule_end_time').focus();
                    data.skip = true;
                    return data;
                }
            }
            if (data.StartDate != '*' && data.EndDate != '*'){
                if (!handler.config.callConfig.schedule.compareDate(data)){
                    alert("开始日期必须小于或等于结束日期，请重新输入！");
                    data.skip = true;
                    return data;
                }
            }
            if (data.FlowId == ''){
                alert("请选择日程要流转到的流程！");
                data.skip = true;
                return data;
            }
            if (!(data.WeekMon || data.WeekTue || data.WeekWed || data.WeekThu || data.WeekFri || data.WeekSat || data.WeekSun)){
                alert("请在日程的星期中至少选择一天！");
                data.skip = true;
                return data;
            }
            return data;
        },
        renderDetail: function () {
//            var itemLists = $(".ds-item-list", viewPanel);
//            if (itemLists.length > 0){
//                handler.config.callConfig.renderItemList(itemLists);
//            }
        },
        preAddSchedule : function(){
            var viewData = session.ivrMap.viewData;
            $('#serviceNoOfSchedule').val(viewData.ServiceNo);
        },
        preUpdateSchedule : function(){
            var viewData = session.ivrMap.viewData;
            if(viewData.Order == "999"){
                $('#scheduleOrderText').attr("disabled", "true");
            }
        },
        scheduleUpdated: function (param) {

        },
        renderScheduleDisplayName: function(displayName){
            if(displayName && displayName!=''){
                return '（'+displayName+'）';
            }else{
                return '';
            }
        }
    },
    agent: {
        agentAdded: function (userData) {
            handler.config.callConfig.addNodeToCache('account_user', userData);
        },
        getAgentStatusName: function(status){
            if (status == 'disable') {
                return '已停用';
            }
            return '';
        },
        getAgentLastUpdateTime: function(time){
            da = new Date(parseInt(time));
            var year = da.getFullYear()+'年';
            var month = da.getMonth()+1+'月';
            var date = da.getDate()+'日';
            return [year,month,date].join(' ');
        },
        onShownAgentEdit: function(){
            var agentID = session.ivrMap.viewData._id;
            var agent = handler.config.callConfig.getNodeFromCache('account_user', '_id', agentID);
            if (agent){
                if (agent.status == 'disable') {
                    $('#disableAgentBtn').css('display', 'none');
                    $('#endableAgentBtn').css('display', '');
                    $('#agentSaveBtn').css('display', 'none');
                } else {
                    $('#disableAgentBtn').css('display', '');
                    $('#endableAgentBtn').css('display', 'none');
                }
            }
        },
        beforeAddAgent: function(data){
            data.skip = false;
            if(data.type == 'manager'){
                var roles = getCache("roles");
                var managerID = null;
                for(var i=0 ;i<roles.length;i++){
                    if(roles[i].display_name == "管理员"){
                        managerID = roles[i]._id;
                    }
                }
                if(managerID != null)
                    data.role = [managerID];
            }
            if(data.exten.substr(0,1) == '0' || data.exten.substr(0,1) == '9'){
                alert('座席工号不能以0或9开头！');
                data.skip = true;
            }
            return data;
        },
        beforeUpdateAgent: function(data){
            data.skip = false;
            if(data.exten.substr(0,1) == '0' || data.exten.substr(0,1) == '9'){
                alert('座席工号不能以0或9开头！');
                data.skip = true;
            }
            return data;
        },
        afterUpdateAgent: function(res){
            var message = '有以下信息重复：';
            if(res.repeatList && res.repeatList.length>0){
                for(var i=0;i<res.repeatList.length;i++){
                    if(res.repeatList[i]=='name'){
                        message+='座席姓名，';
                    }
                    if(res.repeatList[i]=='exten'){
                        message+='工号，';
                    }
                    if(res.repeatList[i]=='loginName'){
                        message+='座席姓名，';
                    }
                    if(res.repeatList[i]=='email'){
                        message+='邮箱';
                    }
                    if(res.repeatList[i]=='callerIDNum'){
                        message+='透传号码';
                    }
                }
            }else{
                message = "服务器请求超时，请稍后再试！";
            }
            alert(message);
        },
        afterBatchAddAgent: function(res){
            alert(res.reason);
        },
        openBatchAddAgent: function(){
            var roles = getCache("roles");
            var html = "";
            for(var i=0 ; i<roles.length ;i++){
                if(roles[i].display_name == "座席"){
                    html+= "<option value='"+ roles[i]._id +"' selected=true>"+roles[i].display_name+"</option>";
                }else{
                    html+= "<option value='"+ roles[i]._id +"'>"+roles[i].display_name+"</option>";
                }
            }
            $(".agentBatchAddRole").html(html);
        }
        ,initAgentCallerIDNumSelect : function(){
            var serviceNums = getCache('ownServiceNoResource');
            var html = '<select name="callerIDNum" class="ivr-focus-last">';
            html += '<option value="">--请选择--</option>';
            for(var i=0 ; i < serviceNums.length ; i++){
                html += '<option value="'+serviceNums[i]['_id']+'">'+serviceNums[i]['_id']+'</option>';
            }
            html += '</select>';
            $(".agent_callerID_num_select").empty();
            $(".agent_callerID_num_select").html(html);
        }
        ,beforeStopAgent: function(data){
            data.skip = false;
            if(!confirm('确定要停用吗？')){
                data.skip = true;
            }
            return data;
        }
    },
    queue: {
        preAddQueue: function () {
            handler.config.callConfig.queue.renderAgentAssign();
            var popUpSelect =  $("#callInPopConfig");
            var dialoutPopUpSelect =  $("#dialoutPopConfig");
            popUpSelect.empty();
            dialoutPopUpSelect.empty();
            popUpSelect.append(handler.config.callConfig.queue.generateBussinessTypeIdOptions(null));
            dialoutPopUpSelect.append(handler.config.callConfig.queue.dialoutTypeIdOptions(null));
        },
        generateBussinessTypeIdOptions : function(currentVal){
            var bussinessType = getCache('businessFlow',null,true);
            //还未做来电弹屏对接
            var callUrls = getCache('callUrls',null,true);
            if(bussinessType.length < 1 && callUrls.length <1){
                return '<option value="">--请选择--</option>';
            }

            var selectOptionHtml = '<option value="__value" selected>__name</option>';
            var optionHtml = '<option value="__value">__name</option>';
            var html = '';
            html += '<option value="">--请选择--</option>';

            for(var i=0 ; i < bussinessType.length ; i++){
                if(currentVal === 'business_'+bussinessType[i]._id){
                    html+=selectOptionHtml.replace(/__value/g,"business_"+bussinessType[i]._id)
                        .replace(/__name/g,"系统业务 "+bussinessType[i].name);
                }else{
                    html+=optionHtml.replace(/__value/g,"business_"+bussinessType[i]._id)
                        .replace(/__name/g,"系统业务 "+bussinessType[i].name);
                }
            }
            for(var i=0 ; i < callUrls.length ; i++){
                if(currentVal === 'callUrls_'+callUrls[i]._id){
                    html+=selectOptionHtml.replace(/__value/g,"callUrls_"+callUrls[i]._id)
                        .replace(/__name/g,"弹屏对接 "+callUrls[i].name);
                }else{
                    html+=optionHtml.replace(/__value/g,"callUrls_"+callUrls[i]._id)
                        .replace(/__name/g,"弹屏对接 "+callUrls[i].name);
                }
            }
            return html;
        },
        dialoutTypeIdOptions : function(currentVal){
            var bussinessType = getCache('businessFlow',null,true);
            //还未做外呼弹屏对接
            var dialoutUrls = getCache('dialoutUrls',null,true);
            if(bussinessType.length < 1 && dialoutUrls.length <1){
                return '<option value="">--请选择--</option>';
            }

            var selectOptionHtml = '<option value="__value" selected>__name</option>';
            var optionHtml = '<option value="__value">__name</option>';
            var html = '';
            html += '<option value="">--请选择--</option>';

            for(var i=0 ; i < bussinessType.length ; i++){
                if(currentVal === 'business_'+bussinessType[i]._id){
                    html+=selectOptionHtml.replace(/__value/g,"business_"+bussinessType[i]._id)
                        .replace(/__name/g,"系统业务 "+bussinessType[i].name);
                }else{
                    html+=optionHtml.replace(/__value/g,"business_"+bussinessType[i]._id)
                        .replace(/__name/g,"系统业务 "+bussinessType[i].name);
                }
            }
            for(var i=0 ; i < dialoutUrls.length ; i++){
                if(currentVal === 'dialoutUrls_'+dialoutUrls[i]._id){
                    html+=selectOptionHtml.replace(/__value/g,"dialoutUrls_"+dialoutUrls[i]._id)
                        .replace(/__name/g,"外呼弹屏 "+dialoutUrls[i].name);
                }else{
                    html+=optionHtml.replace(/__value/g,"dialoutUrls_"+dialoutUrls[i]._id)
                        .replace(/__name/g,"外呼弹屏 "+dialoutUrls[i].name);
                }
            }
            return html;
        },
        renderAgentAssign: function () {
            var agentArr = session.ivrMap.ivr.account_user;
            var leftHtml = [];
            var rightHtml = [];
            var agent = null;
            var tempHtml = null;
            for (var i= 0,len=agentArr.length;i<len;i++) {
                tempHtml = i % 2 == 0 ? leftHtml : rightHtml;
                agent = agentArr[i];
                if (agent.status && agent.status == 'enable'){
                    tempHtml.push('<tr><td><a href="#" id="queue_agent_');
                    tempHtml.push(agent._id);
                    tempHtml.push('">')
                    tempHtml.push(agent.displayName);
                    tempHtml.push(' [ ');
                    tempHtml.push(agent.exten);
                    tempHtml.push(' ]</a></td><td>');
                    tempHtml.push('<input type="text" style="width:30px;" id="');
                    tempHtml.push(agent._id + '_priority');
                    tempHtml.push('" value="0"/><td>');
                    tempHtml.push('<input type="checkbox" name="');
                    tempHtml.push(agent._id + '_assignment');
                    tempHtml.push('" id="');
                    tempHtml.push(agent._id + '_assignment');
                    tempHtml.push('"/>');
                    tempHtml.push('</td></tr>');
                }
            }
            if (leftHtml.length > 0) {
                $("#agentAssignTableLeft > tbody").html(leftHtml.join(''));
            }
            if (rightHtml.length > 0) {
                $("#agentAssignTableRight > tbody").html(rightHtml.join(''));
            } else {
                $("#agentAssignTableRight").css('display', 'none');
            }
            var agentNameArr = agentArr.map(function(item){
                return item.displayName + "[" + item.exten + ']';
            });
            $('#agentAssignAutoComplete').bind('keyup', function(){
                if (event.keyCode == 13) {
                    if (this.value) {
                        var agentExten = this.value.substring(this.value.indexOf('[') + 1, this.value.indexOf(']'));
                        console.info(agentExten);
                        if (agentExten) {
                            var searchAgent = handler.config.callConfig.getNodeFromCache('account_user', 'exten', agentExten);
                            if (searchAgent) {
                                $('#locationAgentHref').attr('href', '#queue_agent_' + searchAgent._id);
                                $('#locationAgentHref').get(0).click();
                            }
                        }

                    }
                }
            });
            $('#agentAssignAutoComplete').typeahead({
                source: agentNameArr
            });
        },
        preSaveQueue: function (data) {
            var agentAssignPanel = $('#agentAssignPanel');
            var assignedchkArr = $('input:checked[name!="selectAllAgent"]', agentAssignPanel);
            var assigned = null, assignedArr = [], chkName = null, agentID = null, proiority = null;
            for (var i = 0, len = assignedchkArr.length; i < len; i++) {
                assigned = $(assignedchkArr[i]);
                chkName = assigned.attr('name');
                agentID = chkName.split('_')[0];
                proiority = $('#' + agentID + '_priority').val();
                assignedArr.push(agentID + ':' + proiority);
            }
            data.MemberToken = JSON.stringify(assignedArr);
            return data;
        },
        queueAdded: function (queueData) {
            handler.config.callConfig.addNodeToCache('ivr_node_queue', queueData);
        },
        preUpdateQueue: function (data) {
            handler.config.callConfig.queue.renderAgentAssign();
            var members = data.AssignMembers;
            if (members && members.length > 0) {
                var member = null, arr = null;
                for (var ind in members) {
                    member = members[ind];
                    $('#' + member.agentID + '_assignment').attr('checked', 'true');
                    $('#' + member.agentID + '_priority').val(member.penalty);
                }
            }
            $("#callInPopConfig").empty().append(handler.config.callConfig.queue.generateBussinessTypeIdOptions(data.BussinessTypeId));
            $("#dialoutPopConfig").empty().append(handler.config.callConfig.queue.dialoutTypeIdOptions(data.DialoutTypeId));
            $("#ivrSoundOptions").empty().append(render.generateIvrSoundOptions(data.Music));
            $("#ivrMusicOnHoldOptions").empty().append(render.generateIvrMusicOnHoldOptions(data.MusicClass));
        },
        queueUpdated: function (queueData) {
            handler.config.callConfig.updateNodeToCache('ivr_node_queue', '_id', queueData._id, queueData);
        }
    },
    line: {
        preEditLine: function(data) {
            var oldExten = $('#line_edit_old_exten').val();
            var oldBoard = $('#line_edit_old_board').val();
            if(oldExten == ''){
                var allPbxs = getCache('pbx');
                var curPbxid = handler.config.callConfig.currentPbx.PBX;
                for(var i=0 ;i<allPbxs.length ;i++){
                    if(curPbxid == allPbxs[i]._id){
                        oldBoard = allPbxs[i].board;
                        break;
                    }
                }
            }
            $('#line_edit_old_exten').remove();
            $('#line_edit_old_board').remove();
            var boardMap = getCache('line');
            var boardList = [];
            $.each(boardMap,function(item, value){
                boardList.push({_id:item, name:value.name+'(归属地:'+value.location+')'});
            })
            var html = [];
            html.push('<select name="Board" onchange="handler.config.callConfig.line.changeBoard(this.value)">');
            html.push('<option value="">--请选择--</option>');
            html.push(generateComboxOptionsFromDocs(boardList, 'name', '_id', oldBoard));
            html.push('</select>');
            $('#boardSelectPanel').html(html.join(''));
            if(oldExten != '' || oldBoard !=''){
                handler.config.callConfig.line.changeBoard(oldBoard,oldExten);
            }
            //if is xferLine don't show multiDidNum config
            if(!data.Dialout){
                $('.multiDidNum_div').remove();
            }else{
                if(data.MultiDidNum){
                   if(data.MultiDidNum != ''){
                       $('.multiDidNum_content').val(data.MultiDidNum);
                   }
                }
            }
        },
        changeBoard: function (board,exten){
            var boardMap = getCache('line');
            var lineList = [];
            var boardName = "";
            $.each(boardMap,function(item, value){
                if(board == item){
                    if(value.routes){
                        lineList = value.routes;
                        boardName = value.name;
                    }else{
                        lineList = [];
                    }
                }
            })
            var html = [];
            html.push('<select name="Exten"><option value="">--请选择--</option>');
            if(exten){
                html.push(generateComboxOptionsFromDocs(lineList, 'name', 'number', exten));
            }else{
                html.push(generateComboxOptionsFromDocs(lineList, 'name', 'number', ''));
            }
            html.push('</select>');
            html.push('<input type="hidden" name="BoardName" value="'+ boardName +'">');
            $('#lineSelectPanel').html(html.join(''));
        },
        lineUpdated: function (data) {
            delete data.Type;
            data.DisplayName = data.Exten;
            if (data.Dialout) {
                data.TypeName = '外呼线路';
            } else {
                data.TypeName = '呼转线路';
            }
        },
        lineBeforeUpdated: function(data){
            if(session.ivrMap.ivr.ivr_service_no){
                var isMayServiceNo = false;
                for(var i=0;i<session.ivrMap.ivr.ivr_service_no.length;i++){
                    if(session.ivrMap.ivr.ivr_service_no[i].Exten.indexOf(data.DidNum) != -1){
                        isMayServiceNo = true;
                    }
                }
                if(!isMayServiceNo){
                    if(!confirm("这个透传号码不是您账户的服务号，确认要配置为透传号码吗？")){
                        data.skip = true;
                        return data;
                    }
                }
            }
            if(data.Dialout == 'true'){
                if(data.MultiDidEnable == 'true'){
                    if(data.MultiDidNum == ''){
                        alert('启用多透传号，必须输入多透传号内容！');
                        data.skip = true;
                        return data;
                    }
                }
                if(data.MultiDidNum != ''){
                    var reg = /^[0-9,-]+$/;
                    if(!reg.test(data.MultiDidNum)){
                        alert('多透传号内容号码有误！');
                        data.skip = true;
                        return data;
                    }
                }
            }
            return data;
        },
        getTypeName: function(type) {
            if (type == "true") {
                return '外呼线路';
            } else {
                return '呼转线路';
            }
        },
        getLineName: function(board,line){
            var boardMap = getCache('line');
            if(line != '__Exten'){
                if(board != '__Board'){
                    if(boardMap[board] && boardMap[board].routes){
                        var routes = boardMap[board].routes
                        for(var i=0 ; i<routes.length ;i++){
                            if(line == routes[i].number){
                                return routes[i].name + '(机柜:'+boardMap[board].name+')';
                            }
                        }
                        return '未配置线路';
                    }
                }else{
                    var text = '未配置线路';
                    $.each(boardMap,function(item,value){
                        if(value.routes){
                            for(var i=0;i<value.routes.length;i++){
                                if(line == value.routes[i].number){
                                    text = value.routes[i].name;
                                }
                            }
                        }
                    });
                    return text;
                }
            } else {
                return '未配置线路';
            }

        }
    },
    sound: {
        getNormalSound: function(){
            var soundList = session.ivrMap.ivr.ivr_sound;
            var normalSound = [];
            soundList.forEach(function(item){
                if(item.SoundType == 'normal'){
                    normalSound.push(item);
                }
            });
            return normalSound;
        },
        uploaded: function (evt) {
            handler.config.callConfig.isShowUploadWait = false;
            $('#sound_transfer_wait_modal').modal('hide');
            $('#ivr_sound_qiniu_transfer_wait_pane').empty();
            console.info(evt.target.responseText);
            var res = $.parseJSON(evt.target.responseText);
            if (res.filePath) {
                $('#oldIvrSoundFilePath').val($('#ivrSoundFilePath').val());
                $('#ivrSoundFilePath').val(res.filePath);
                var uploadMess = $("#uploadMess");
                uploadMess.addClass("text-success");
                uploadMess.text('文件已上传');
                uploadMess.css("display", "block");
                if(utils.getFileExt(res.fileName) != '.wav'){
                    uploadMess.text('您上传的文件为非wav,正在为您进行格式转换，请稍等！');
                    var waitPane = $('#ivr_sound_qiniu_transfer_wait_pane');
                    DS.getView('config/callConfig/sound/sound_transfer_wait', function(view){
                        waitPane.empty();
                        view = view.replace(/__msg/g,'您上传的文件不是wav格式,正在为您进行格式转换，请稍等！');
                        waitPane.html(view);
                        $("#sound_transfer_wait_modal").modal({'backdrop': 'static'});
                        var action = {
                            action: 'config.ivr.sound.soundToQiniuTransfer',
                            data: res
                        }
                        DS.send(action,function(rep){
                            if(rep.success){
                                uploadMess.text('已经开始转换请稍等，请稍等！');
                                waitPane.find('#soundTransferTryBtn').attr("ds_data",rep.data.persistentId);
                                window.setTimeout(function(){
                                    $('#soundTransferBtnDiv').show();
                                },15000);
                            }else{
                                $('#sound_transfer_wait_modal').modal('hide');
                                $('#ivr_sound_qiniu_transfer_wait_pane').empty();
                                uploadMess.text('格式转换出现问题，请重新上传！');
                            }
                        })
                    });
                }
            } else {
                var uploadMess = $("#uploadMess");
                uploadMess.addClass("text-error");
                uploadMess.text('文件上传失败，请重新选择文件上传');
                uploadMess.css("display", "block");
            }
        },
        uploadTransferSuccess: function(pushEvent){
            var persistentId = $('#sound_transfer_wait_modal').find('#soundTransferTryBtn').attr("ds_data");
            if(persistentId == pushEvent.Data.persistentId){
                var uploadMess = $("#uploadMess");
                $('#sound_transfer_wait_modal').modal('hide');
                $('#ivr_sound_qiniu_transfer_wait_pane').empty();
                if(pushEvent.Data.code == 0){
                    $('#sound_panel').find("input[name='IsQiniuMusic']").val('yes');
                    $('#sound_panel').find("input[name='QiniuMusicUrl']").val(pushEvent.Data.url);
                    uploadMess.text('恭喜，转换wav格式成功！可以保存了!');
                }else{
                    uploadMess.text('转换wav失败了！请重试或直接上传wav格式语音!');
                    $('#sound_transfer_wait_modal').modal('hide');
                    $('#ivr_sound_qiniu_transfer_wait_pane').empty();
                }
            }
        },
        uploadTransferRefresh: function(data){
            var action = {
                action: 'config.ivr.sound.soundToQiniuTransferRefresh',
                data: { persistentId: data}
            }
            DS.send(action,function(rep){
                var uploadMess = $("#uploadMess");
                if(rep.success){
                    if(rep.code == 0){
                        $('#sound_transfer_wait_modal').modal('hide');
                        $('#ivr_sound_qiniu_transfer_wait_pane').empty();
                        $('#sound_panel').find("input[name='IsQiniuMusic']").val('yes');
                        $('#sound_panel').find("input[name='QiniuMusicUrl']").val(rep.url);
                        uploadMess.text('恭喜，转换wav格式成功！可以保存了!');
                    }else{
                        alert('还在转换中，请再等等!');
                    }
                }else{
                    $('#sound_transfer_wait_modal').modal('hide');
                    $('#ivr_sound_qiniu_transfer_wait_pane').empty();
                    uploadMess.text('格式转换出现问题，请重新上传！');
                }
            })
        },
        uploadTransferCancel: function(){
            $('#sound_transfer_wait_modal').modal('hide');
            $('#ivr_sound_qiniu_transfer_wait_pane').empty();
            $('#ivrSoundPanel').find('.add_button').click();
            handler.config.callConfig.isShowUploadWait = false;
        },
        uploadError: function (evt) {
            var uploadMess = $("#uploadMess");
            uploadMess.addClass("text-error");
            uploadMess.text('文件上传失败，请重新选择文件上传');
            uploadMess.css("display", "block");
        },
        uploadProgressing: function (evt) {
            var percentComplete = Math.round(evt.loaded * 100 / evt.total);
            console.log(percentComplete);
            $('#uploadPercentCompleteShow').html(percentComplete+"%");

            if(!handler.config.callConfig.isShowUploadWait){
                handler.config.callConfig.isShowUploadWait = true;
                var waitPane = $('#ivr_sound_qiniu_transfer_wait_pane');
                DS.getView('config/callConfig/sound/sound_transfer_wait', function(view){
                        waitPane.empty();
                        view = view.replace(/__msg/g,'正在上传文件，请稍等！已完成&nbsp;<span id="uploadPercentCompleteShow">0%</span>');
                        waitPane.html(view);
                        $("#sound_transfer_wait_modal").modal({'backdrop': 'static'});
                });
            }
        },
        onrenderEdit: function(data){
            if(data.IsQiniuMusic && data.IsQiniuMusic == 'yes'){
                var soundFileName = data.Filename.substring(0, data.Filename.indexOf('.'));
                var fileUrl = data.QiniuMusicUrl.replace('@', '=/');
            }else{
                var soundFileName = data.Filename.substring(0, data.Filename.indexOf('.'));
                var fileUrl = DS._ds_url.replace('action', '') + 'fileDownload/?sessionId=' + session.id + '&fileId=' + soundFileName;
            }
            $('#fileToUpload').attr('fileId', soundFileName);
            $("#ivrSoundListen").attr('src', fileUrl);
            $('#downloadSoundLink').attr('href', fileUrl);
            $("#ivrSoundFilePath").val(data.Filename);
            $('ds-do-action', '#deleteSoundLink').attr('data', '{"_id":"'+ data._id +'"}');
        },
        listenSound: function (data) {
            var ivrAudio = $('#ivrSoundListen');
            ivrAudio.css('display', "block");
            ivrAudio.get(0).play();
        },
        getSoundName: function(data) {
            var sounds = session.ivrMap.ivr.ivr_sound;
            var soundName = '';
            var item = null;
            for(var i= 0,len = sounds.length;i<len;i++) {
                item = sounds[i];
                if(item.Filename == data) {
                    soundName = item.DisplayName;
                    break;
                }
            }
            return soundName;
        },
        getTypeName: function(type) {
            if(type == 'normal'){
                return '普通';
            } else {
                return '队列等待';
            }
            return '';
        }
    },
    sip: {
        getSipTypeName: function(sipType){
            var sipDic = getDicCache('sipType', sipType);
            if(sipDic){
                return sipDic.code_name;
            }
            return '';
        },
        getSipUserName: function(userID){
            var user = handler.config.callConfig.getNodeFromCache('account_user', '_id', userID);
            if(user){
                return user.displayName;
            }
            return '';
        },
        getSipUserNameAndEmpNo: function(userID){
            if(!userID){
                return '';
            }
            var user = handler.config.callConfig.getNodeFromCache('account_user', '_id', userID);
            if(user){
                return user.displayName+'['+user.exten+']';
            }
            return '';
        },
        onBatchAddGatewaySip: function(sipList) {
            var param = {
                type: 'ivr_sip'
            }
            var data = sipList.data;
            for(var i= 0,len=data.length;i<len;i++) {
                param.data = data[i];
                handler.config.callConfig.updateClientData(param);
            }
        },
        addCodes: function() {
            var codesPanel = $('#sipCodesPanel');
            var template = $('#codesTemplate').html();
            $('.icon-plus',codesPanel).removeClass('icon-plus').addClass('icon-minus')
                .parent('a').attr('onclick', 'handler.config.callConfig.sip.removeCodes(this)');
            codesPanel.append(template);
        },
        removeCodes: function(src) {
            $(src).parent('div').remove();
        },
        onShowDetial: function() {
            var sipNum = session.ivrMap.viewData.Exten;
            var sip = handler.config.callConfig.getNodeFromCache('ivr_sip', 'Exten', sipNum);
            if (sip){
                if (sip.ExtenType == 'gateway') {
                    $('#codesWrapper').css('display', '');
                    if (sip.Allow) {
                        var codes = sip.Allow.split(',');
                        for (var i= 0,len=codes.length;i<len;i++) {
                            console.info(codes[i]);
                            if (i == 0) {
                                $('select', '#sipCodesPanel').first().val(codes[i]);
                            } else {
                                handler.config.callConfig.sip.addCodes();
                                $('select', '#sipCodesPanel').last().val(codes[i]);
                            }
                        }
                    }
                    if($('.sip_detail_user_exten').attr("disabled") == 'disabled'){
                        $('.sip_detail_user_exten').attr("disabled", false);
                    }
                }else{
                    $('.sip_detail_user_exten_btn').remove();
                }
            } else {
                alert('Sip号不存在或已被删除');
            }
        },
        preUpdateCodes: function(data) {
            var codesString = "";
            var codesMap = {};
            var codesSelectArr = $('select', '#sipCodesPanel');
            var codesSelect = null;
            var codesArray = [];
            for(var i= 0,len=codesSelectArr.length;i<len;i++) {
                codesSelect = codesSelectArr[i];
                if(codesSelect.value) {
                    codesMap[codesSelect.value] = "1";
                }
            }
            for(var codes in codesMap) {
                codesString += codes + ",";
                codesArray.push(codes);
            }
            if(codesString) {
                codesString = codesString.substring(0, codesString.length - 1);
                data.Allow = codesString;
                data.codes = codesArray;
            }
            return data;
        },
        bindGatewayUserExten: function(data){
            var newUserID = null;
            var newUserName = null;
            var agents = session.ivrMap.ivr.account_user;
            for(var i=0;i<agents.length;i++){
                if(agents[i].exten == data.UserExten){
                    newUserID = agents[i]._id;
                    newUserName = agents[i].displayName;
                }
            }
            if(newUserID == null){
                alert('您要绑定的工号不存在！');
                return;
            }
            var action = {
                action: 'config.ivr.sip.bindGatewayUserExten',
                data: {_id: data.Exten,
                        UserExten: data.UserExten,
                        PBX: handler.config.callConfig.currentPbx.PBX,
                        UserID: newUserID,
                        UserName: newUserName
                    }
            }
            DS.send(action, function (res) {
                if (res.success) {
                    if(res.data){
                        $(".sip_detail_user_name").val(res.data.UserName);
                        $(".sip_detail_user_exten").val(res.data.UserExten);
                        $(".sip_list_item"+res.data._id).find(".sip_list_item_userName")
                            .html(res.data.UserName+'['+res.data.UserExten+']');
                        var ivrSips = session.ivrMap.ivr.ivr_sip;
                        for(var i=0;i<ivrSips.length;i++){
                            if(ivrSips[i].Exten == res.data._id){
                                ivrSips[i].UserID = res.data.UserID;
                                ivrSips[i].UserName = res.data.UserName;
                                ivrSips[i].UserExten = res.data.UserExten;
                                break;
                            }
                        }
                    }
                    alert('绑定成功！');
                } else {
                    alert('绑定失败'+res.message);
                }
            });
        }
    },
    blackList:{
        beforeSaveBlackList : function(data){
            if (data.BlackNum == ''){
                alert("请填写电话号码");
                if (data._id){
                    $('#edit_black_num').focus;
                }else{
                    $('#add_black_num').focus;
                }
                data.skip = true;
                return data;
            }
            if (data.Type == ''){
                alert("请选择名单类型");
                data.skip = true;
                return data;
            }
            if (/\D/g.test(data.BlackNum)){
                alert("电话号码只能由数字组成，请重新填写");
                if (data._id){
                    $('#edit_black_num').focus;
                }else{
                    $('#add_black_num').focus;
                }
                data.skip = true;
                return data;
            }
            var numPattern = new RegExp(/^((\d{11,12})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)$/);
            if (!numPattern.test(data.BlackNum)){
                alert("请输入正确电话号码格式！");
                data.skip = true;
                return data;
            }
            var blackCacheList;
            if(session.ivrMap){
                blackCacheList = session.ivrMap.ivrBlackList;
            }else{
                blackCacheList = getCache('inBlackList',null,true);
            }
            for (var i = 0; i < blackCacheList.length; i++){
                if(!data._id){
                    if (data.BlackNum == blackCacheList[i].BlackNum && data.Type == blackCacheList[i].Type ){
                        alert('该号码已加过黑名单!');
                        data.skip = true;
                        return data;
                    }
                }
            }
            data.PBX = handler.config.callConfig.currentConfigData.PBX;
            if(!data.PBX){
                data.PBX = session.user.pbx;
            }
            data.Account = session.user.account;
            data.skip = false;
            return data;
        },
        getTypeName: function(type) {
            if (type == '1') {
                return '呼入黑名单';
            }
            if (type == '2') {
                return '外呼黑名单';
            }
            if (type == '0') {
                return '红名单';
            }
            return '';
        }
    },
    phoneBar:{
        showPhoneBarConfig: function (data) {
            var ShowIsEnable = '';
            for (var i = 0; i < session.ivrMap.ivrPhoneBarConfig.length; i++) {
                if (session.ivrMap.ivrPhoneBarConfig[i].IsEnable == '0') {
                    ShowIsEnable = '停用'
                } else {
                    ShowIsEnable = '启用'
                }
                session.ivrMap.ivrPhoneBarConfig[i].ShowIsEnable = ShowIsEnable;
            }
        },
        editPhoneBarConfig: function (data) {
            if (data.IsSystemConfig == "1") {
                var editHtml = '';
                DS.getView('config/callConfig/phoneBar/ivr_edit_system_phoneBarConfig', function (editView) {
                    var pane = $('#phoneBarConfig_detail');
                    pane.empty();
                    pane.html(editView);
                    if (data) {
                        var phonebarConfig = session.ivrMap.ivrPhoneBarConfig;
                        var phonebarItem = null;
                        for (var i = 0, len = phonebarConfig.length; i < len; i++) {
                            phonebarItem = phonebarConfig[i];
                            if (phonebarItem && phonebarItem._id == data._id) {
                                break;
                            }
                        }
                        editHtml = render.ivr.phoneBar.renderPhoneBarConfig(phonebarItem, editView);
                        $('#phoneBarConfig_detail').html(editHtml);
                    }
                });
            } else {
                DS.getView('config/callConfig/phoneBar/ivr_edit_phoneBarConfig', function (editView) {
                    var pane = $('#phoneBarConfig_detail');
                    pane.empty();
                    pane.html(editView);
                    if (data) {
                        var phonebarConfig = session.ivrMap.ivrPhoneBarConfig;
                        var phonebarItem = null;
                        for (var i = 0, len = phonebarConfig.length; i < len; i++) {
                            phonebarItem = phonebarConfig[i];
                            if (phonebarItem && phonebarItem._id == data._id) {
                                break;
                            }
                        }
                        if (phonebarItem) {
                            objectToForm(pane, phonebarItem);
                        }
                    }
                });
            }
        },
        savePhoneBarConfig: function (data) {
//            data.PBX = handler.ivr.currentPbx;
//            data.Account = session.user.account;
//            var action = {
//                action: "config.ivr.phoneBarConfig.savePhoneBarConfig",
//                data: data
//            }
//            DS.send(action, function (response) {
//                if (response.success) {
//                    handler.ivr.alertSuccess('更新电话条配置成功!');
                    var ShowIsEnable = '';
                    if (data.IsEnable == '0') {
                        data.ShowIsEnable = '停用'
                    } else {
                        data.ShowIsEnable = '启用'
                    }
//                    handler.ivr.updatePhoneBarConfigToCache('_id', data._id, response.data);
                    delete session.dicMap.searchResult;
                    render.ivr.renderItemList($('#phoneBarItemList'), function () {
                        $('#phonebarconfig' + response.data._id).trigger('click');
                    });
//                }else{
//                    handler.ivr.alertFail('更新电话条失败!');
//                }
//            });
        }
    },
    ivrVar:{
        beforeDelIvrVar: function(data){
            var thisVars = session.ivrMap.ivr.vars;
            for(var i=0;i<thisVars.length;i++){
                if(data.VarName == thisVars[i].VarName){
                    if(thisVars[i].Account == 'admin'){
                        alert('系统内置变量，不能删除！');
                        data.skip= true;
                        return data;
                    }
                }
            }
            data.skip= false;
            return data;
        }
    },
    node: {
        ivr: {
            ivrKeyDocs : null,
            getIvrKeyDocs: function(){
                var docs = handler.config.callConfig.node.ivr.ivrKeyDocs;
                if(!docs){
                    docs = [];
                    var i = 1;
                    while(i<10) {
                        docs.push({
                            code:i+'',
                            value:i+''
                        });
                        i++;
                    }
                    docs.push({
                        code:'0',
                        value:'0'
                    });
                    docs.push({
                        code:'#',
                        value:'#'
                    });
                    docs.push({
                        code:'*',
                        value:'*'
                    });
                    handler.config.callConfig.node.ivr.ivrKeyDocs = docs;
                }
                return docs;
            },
            listLoaded: function(){
            },
            ivrEditPageShown: function(data){
                var dsGetViewTag = $('#editIvrKeyLink ds-get-view');
                dsGetViewTag.attr('view-data', '{"_id":"'+data._id+'"}');
            },
            ivrKeyListShown: function(data) {
                if(data.IvrKeys) {
                    var key = null;
                    var html = [];
                    for(var i=0,len=data.IvrKeys.length;i<len;i++) {
                        key = data.IvrKeys[i];
                        html.push(handler.config.callConfig.node.ivr.getIvrKeyListItem(key));
                    }
                    $('#ivrKeyListBody').html(html.join(''));
                }
            },
            getIvrKeyListItem: function(key){
                var html = [];
                var keyDocs = handler.config.callConfig.node.ivr.getIvrKeyDocs();
                html.push('<tr><td><select name="key" class="span12 ivr-key">');
                html.push(generateComboxOptionsFromDocs(keyDocs, 'code', 'value', key.Key));
                html.push('</select></td><td><select name="toPeerType" class="span6 ivr-key-to-peer-type" style="float:left;">');
                html.push(generateComboxOptionsFromDocs(handler.config.callConfig.toPeerTypeArr, 'TypeName', 'TypeValue', key.ToPeerType));
                html.push('</select><div class="ivr-key-to-peer-panel"><select name="toPeer" class="span6 ivr-key-to-peer">');
                if (key.ToPeerType == 'system') {
                    html.push(generateComboxOptionsFromDocs(handler.config.callConfig.systemPeerTypeArr, 'name', 'value', key.ToPeer));
                } else {
                    html.push("<option value=''>--请选择--</option>");
                    var toPeerArr = session.ivrMap.ivr[key.ToPeerType];
                    if (toPeerArr) {
                        if (key.ToPeerType == 'account_user') {
                            html.push(generateComboxOptionsFromDocs(toPeerArr, 'displayName', '_id', key.ToPeer));
                        } else {
                            html.push(generateComboxOptionsFromDocs(toPeerArr, 'DisplayName', 'Exten', key.ToPeer));
                        }
                    }
                }
                html.push('</select></div>');
                html.push('<br><label style="float: left">按键说明</label>');
                if(!key.KeyMemo){
                    key.KeyMemo = '';
                }
                html.push('<div><input class="ivr-key-memo" style="width: 300px;margin-left: 10px" type="text" name="keyMemo" value="'+key.KeyMemo+'"></div></td>')
                html.push('<td><a href="#" class="ds-ivr-delete-ivr-key"><i class="icon-minus"></i></a>');
                html.push('</td></tr>');
                return html.join('');
            },
            preSaveIvrKey: function(data){
                var ivrKeys = $('.ivr-key', '#ivrKeyListBody');
                var keyArr = [];
                var keyMap = {};
                if(ivrKeys && ivrKeys.length > 0) {
                    var ivrKey = null, tr = null;
                    var toPeerType = null, toPeer = null, keyMemo = null;
                    var isDuplicated = false, duplicateKey = null;
                    for(var i= 0,len=ivrKeys.length;i<len;i++) {
                        ivrKey = $(ivrKeys[i]);
                        tr = ivrKey.parents('tr');
                        toPeerType = $('.ivr-key-to-peer-type', tr);
                        toPeer = $('.ivr-key-to-peer', tr);
                        keyMemo = $('.ivr-key-memo', tr);
                        keyArr[i] = {
                            Key: ivrKey.val(),
                            ToPeerType: toPeerType.val(),
                            ToPeer: toPeer.val(),
                            KeyMemo: keyMemo.val()
                        };
                        if(keyMap[ivrKey.val()]){
                            isDuplicated = true;
                            duplicateKey = ivrKey.val();
                        } else {
                            keyMap[ivrKey.val()] = keyArr[i];
                        }
                    }
                    if(isDuplicated) {
                        data.error = true;
                        data.errorMessage = '按键重复，请重新配置。';
                        return data;
                    }
                    data.IvrKeys = keyArr;
                    //data.IvrKeys = '[{"key":"1"}]';
                    //console.info(data.IvrKeys);
                }
                delete data.key;
                delete data.toPeer;
                delete data.toPeerType;
                return data;
            }
        },
        validation: {
            endKeyChange: function() {
                var endKey = $("#EndKey").val();
                var returnKey = $("#ReturnKey").val();
                if(endKey === returnKey){
                    alert("结束方式与重新输入按键冲突，请重新设置");
                }
                var currentNode = null;
                if(session.ivrMap.viewData && session.ivrMap.viewData._id){
                    var nodes = session.ivrMap.ivr.ivr_node_validation;
                    for(var i=0 ;i < nodes.length ;i++){
                        if(nodes[i]._id == session.ivrMap.viewData._id){
                            currentNode = nodes[i];
                            break;
                        }
                    }
                }
                if(endKey === '0'){
                    $("#EndType").val("0");
                    $("#MaxLabel").html("结束长度");
                    $("#Max").attr("name","EndLength");
                    $("#Max").attr("value",currentNode ? currentNode.EndLength : "4");
                    $("#Max").attr("msgName","结束长度");
                    $("#Max").attr("msg","结束长度须是大于0的数字");
                }else{
                    $("#EndType").val("1");
                    $("#MaxLabel").html("字段最大长度");
                    $("#Max").attr("name","Max");
                    $("#Max").attr("value",currentNode ? currentNode.Max : "30");
                    $("#Max").attr("msgName","字段最大长度");
                    $("#Max").attr("msg","字段最大长度必须是大于0的数字");
                }
            },
            beforeSaveValidation: function(data){
                data.skip = false;
                if(data.Data == ""){
                    data.skip = true;
                    alert('请选择保存输入的变量！');
                }
                return data;
            }
        },
        assignment: {
            addNewAssignment: function(){
                $('#ivrAssignmentListBody').append(handler.config.callConfig.node.assignment.getAssignmentItem({
                    VarName:'',
                    VarValue: ''
                }));
            },
            getAssignmentItem: function(assignmentObj){
                var html = [];
                html.push('<tr><td class="span3">');
                html.push(handler.config.callConfig.generateVarSelect("ivrAssignment", assignmentObj.VarName));
                html.push('</td><td class="span2">=</td><td class="span6">');
                html.push('<input type="text" class="ivr-assignment-value" value="');
                html.push(assignmentObj.VarValue.replace(/"/g, '&quot;'));
                html.push('">');
                html.push('</td><td class="span1">');
                html.push('<a href="#" class="ds-ivr-delete-assignment"><i class="icon-minus"></i></a>');
                html.push('</td></tr>');
                return html.join('');
            },
            preSaveAssignment: function(data){
                var assignments = $('[name=ivrAssignment]', '#ivrAssignmentListBody');
                var assignmentCondArr = [];
                if(assignments && assignments.length > 0) {
                    var assignment = null, tr = null;
                    var assignmentValue = null;
                    for(var i= 0,len=assignments.length;i<len;i++) {
                        assignment = $(assignments[i]);
                        tr = assignment.parents('tr');
                        assignmentValue = $('.ivr-assignment-value', tr);
                        assignmentCondArr[i] = {
                            VarName: assignment.val(),
                            VarValue: assignmentValue.val()
                        };
                        if(assignment.val() == "" || assignmentValue.val() == ""){
                            data.skip = true;
                            alert('所有变量必须选择!  所有值必须填写!');
                            break;
                        }
                    }
                    data.VarConditions = assignmentCondArr;
                }
                return data;
            },
            editPageShown : function(data) {
                if(data.VarConditions && data.VarConditions.length > 0) {
                    var condition = null;
                    var html = [];
                    for (var key in data.VarConditions) {
                        condition = data.VarConditions[key];
                        html.push(handler.config.callConfig.node.assignment.getAssignmentItem(condition));
                    }
                    $('#ivrAssignmentListBody').html(html.join(''));
                }
            }
        },
        route: {
            routeConditions:[
                {label:"前缀匹配", value:'0'},
                {label:"后缀匹配", value:'1'},
                {label:"等于", value:'2'}
            ],
            routeLogicArray:[
                {label:"并且", value:'and'},
                {label:"或者", value:'or'}
            ],
            addNewRouteItem: function(data) {
                $('#ivrRouteListBody').append(handler.config.callConfig.node.route.getRouteItem({
                    VarId:'',
                    Operation: '0',
                    Value: '',
                    Logic: 'and'
                }));
            },
            getRouteItem: function(routeItem){
                var html = [];
                html.push('<tr><td class="span3">');
                html.push(handler.config.callConfig.generateVarSelect("", routeItem.VarName, 'input-small ivr-route-var'));
                html.push('</td><td class="span2"><select class="ivr-route-operation input-small">');
                html.push(generateComboxOptionsFromDocs(handler.config.callConfig.node.route.routeConditions, 'label', 'value', routeItem.Operation));
                html.push('</select></td><td class="span3">');
                html.push('<input type="text" class="ivr-route-value input-small" value="'+routeItem.Value+'">');
                html.push('</td><td class="span3"><select class="ivr-route-logic input-small">');
                html.push(generateComboxOptionsFromDocs(handler.config.callConfig.node.route.routeLogicArray, 'label', 'value', routeItem.Logic));
                html.push('</select></td><td class="span1">');
                html.push('<a href="#" class="ds-ivr-delete-route-condition"><i class="icon-minus"></i></a>');
                html.push('</td></tr>');
                return html.join('');
            },
            preSaveRoute: function(data){
                var routes = $('.ivr-route-var', '#ivrRouteListBody');
                var routeArr = [];
                if(routes.length > 20){
                    data.skip = true;
                    alert('变量路由节点最多添加20个条件！');
                    return data;
                }
                if(routes && routes.length > 0) {
                    var routeVar = null, tr = null;
                    var routeValue = null, operation = null, logic = null;
                    for(var i= 0,len=routes.length;i<len;i++) {
                        routeVar = $(routes[i]);
                        tr = routeVar.parents('tr');
                        operation = $('.ivr-route-operation', tr);
                        routeValue = $('.ivr-route-value', tr);
                        logic = $('.ivr-route-logic', tr);
                        if(routeVar.val() == ""){
                            data.error = true;
                            data.errorMessage = '变量不能为空，请选择变量!';
                            return data;
                        }
                        if(routeValue.val() == ""){
                            data.error = true;
                            data.errorMessage = '值不能为空，请填写!';
                            return data;
                        }
                        routeArr[i] = {
                            VarName: routeVar.val(),
                            Operation: operation.val(),
                            Value: routeValue.val(),
                            Logic: logic.val()
                        };
                    }
                    data.Routes = routeArr;
                }
                return data;
            },
            editPageShown : function(data) {
                if(data.Routes && data.Routes.length > 0) {
                    var route = null;
                    var html = [];
                    for (var key in data.Routes) {
                        route = data.Routes[key];
                        html.push(handler.config.callConfig.node.route.getRouteItem(route));
                    }
                    $('#ivrRouteListBody').html(html.join(''));
                }
            }
        },
        encryptMd5:{},
        ivrMenu: {
            ivrMenuShowEdit: function (data) {
                if (data.MenuType != 'out') {
                    $("#radio_inner").attr("checked","checked");
                    $("#div_outer").attr("style","display:none");
                } else {
                    $("#radio_outer").attr("checked","checked");
                    $("#div_inner").attr("style","display:none");
                }
                /*console.log('---' + data);
                alert('ok123');*/
            },
            getMenuTypeText: function(data) {
                //handler.callConfig.node.ivrMenu.ivrMenuShowEdit(data);
                //alert("data参数的类型"+ typeof(data)+"data:"+data);
                if(data == 'inner') {
                    return '内部';
                } else if(data == 'out') {
                    return '外部';
                } else {
                   // alert(this.menuType);
                    return this;
                  //  return '未知';
                }
            }
        },
        textAnnouncement: {
            changeTtsEngine: function (data) {
                console.log(data);
                if (data == 'kdxf') {
                    $(".tts_default").hide();
                    $(".tts_kdxf").show();
                } else {
                    $(".tts_default").show();
                    $(".tts_kdxf").hide();
                }
            },
            beforeOpenUpdateView: function (data){
                if(data.Engine){
                    if(data.Engine == 'kdxf'){
                        $("input[type=radio][name=Engine]:eq(0)").attr("checked","checked");
                        $(".tts_default").hide();
                        $(".tts_kdxf").show();
                    }else{
                        $("input[type=radio][name=Engine]:eq(1)").attr("checked","checked");
                        $(".tts_default").show();
                        $(".tts_kdxf").hide();
                    }
                }else{
                    $("input[type=radio][name=Engine]:eq(1)").attr("checked","checked");
                    $(".tts_default").show();
                    $(".tts_kdxf").hide();
                }
            }
        }
    },
    openIvrTools : function(data){
        var action = {
            action: 'config.ivr.ivrTools.queryAllAccount'
        }
        DS.send(action, function (response) {
            if (!response.success) {
                $().alertmessage('showError','查询所有账户失败：' + response.message);
            } else {
                $('#ivrToolsTableBody').html(render.ivr.renderIvrToolsTableTr(response.data));
            }
        });
    },
    ivrToolsSaveAndReload : function(data){
        session.dicMap.ivrTools = {};
        session.dicMap.ivrTools.isReload = true;
        handler.config.callConfig.ivrToolsSave(data);
    },
    ivrToolsSave : function(data){
        var dataToServer = {
            Account: data,
            NodeArr: new Array(),
            SaveId: data+'_'+new Date().getTime()
        }
        if(!session.dicMap.ivrTools){
            session.dicMap.ivrTools = {};
        }
        session.dicMap.ivrTools.saveId = dataToServer.SaveId;
        session.dicMap.ivrTools.nodeArr = dataToServer.NodeArr;

        var nodeArr = $(".IvrTools_check");
        $.each(nodeArr,function(i,item){
            if(item.checked == true){
                dataToServer.NodeArr.push(item.value);
            }
        })
        var action = {
            action: 'config.ivr.ivrTools.ivrToolsSave',
            data: dataToServer
        }
        DS.send(action,function(res){
            if(res.success){
                utils.showSucc('已经开始保存！请稍后......');
                //轮询保存的结果
                session.dicMap.ivrTools.checkSuccessCount = 0;
                setTimeout("handler.config.callConfig.checkIvrToolsSaveSuccess()",1500);
            }else{
                alert('开始保存失败！');
            }
        });
    },
    checkIvrToolsSaveSuccess : function(data){
        var action = {
            action: 'config.ivr.ivrTools.ivrToolsSaveStatus',
            data:{
                SaveId : session.dicMap.ivrTools.saveId,
                NodeArr : session.dicMap.ivrTools.nodeArr
            }
        }
        DS.send(action,function(res){
            if(res.success){
                console.log('ivrTools------查询保存结果'+res);
                var doc = res.data;
                var nodeArr = session.dicMap.ivrTools.nodeArr;
                var count = 0;
                for(var i=0 ; i<nodeArr.length ; i++ ){
                    if(doc.NodeArr[nodeArr[i]] <= doc.NodeArr[nodeArr[i]+'_success']){
                        count++;
                    }
                }
                if(count == nodeArr.length){
                    utils.showSucc('保存成功！');
                    if(session.dicMap.ivrTools.isReload){
                        utils.showSucc('开始生效！请稍后......');
                        session.dicMap.ivrTools.pbxList = doc.PBX;
                        handler.config.callConfig.ivrToolsReloadIvr();
                    }
                }else{
                    if(session.dicMap.ivrTools.checkSuccessCount == 40){
                        utils.showError('保存有问题，看表manager_ivr_tools_util！');
                    }else{
                        session.dicMap.ivrTools.checkSuccessCount++;
                        //轮询 保存的结果
                        setTimeout("handler.config.callConfig.checkIvrToolsSaveSuccess()",1500);
                    }
                }
            }
        });
    },
    //使用此方法时，需将session.dicMap.ivrTools.pbxList中赋值为存有pbx的id的数组
    ivrToolsReloadIvr: function () {
        var pbxAccList = session.dicMap.ivrTools.pbxList;
        if(pbxAccList.length > 0){
            var onePbxAndAcc = pbxAccList.pop();
            var action = {
                action: "config.ivr.reloadIvr",
                data: {
                    PBX: onePbxAndAcc.split('_')[0],
                    Account: onePbxAndAcc.split('_')[1]
                }
            }
            DS.send(action, function (response) {
                if (response.success) {
                    //递归调用自己，生效所有pbx
                    handler.config.callConfig.ivrToolsReloadIvr();
                } else {
                    alert('生效失败！');
                }
            });
        }else{
            utils.showSucc('全部生效成功！');
        }
    }
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
}

function objectToForm(node, obj) {
    if (obj) {
        var iq = "input:not([type=file]):not([type=image]):not([type=reset]):not([type=button]),select,textarea";
        var nodes = $(iq, node);
        nodes.each(function (i) {
            if (obj[nodes[i].name] != undefined) {
                var values = obj[nodes[i].name];
                if (typeof(values) == "object") {
                    values = values.toString();
                }
                if ((nodes[i].type || "").toLowerCase() == "checkbox") {
                    if (values == true || values == "true") {
                        nodes[i].checked = true;
                    } else {
                        nodes[i].checked = false;
                    }
                } else if ((nodes[i].type || "").toLowerCase() == "radio") {
                    if (values == nodes[i].value || values.toString() == nodes[i].value) {
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



function generateIvrProcessComboxOptionsFromDocs(docs, codeName, codeValue, currentValue) {
    var selectOptionHtml = '<option value="__value" selected>__name</option>';
    var optionHtml = '<option value="__value">__name</option>';
    var resultOptions = '';
    for (var i = 0; i < docs.length; i++) {
        var firstNodeDisplayName = getNodeDisplayName(docs[i].FirstNodeType,docs[i].FirstNode);
        var nodeTypeName = '';
        if(docs[i].FirstNodeType == 'system'){
            nodeTypeName = '系统节点';
        }else{
            nodeTypeName = handler.config.ivrProcess.nodeName2ChineseName[docs[i].FirstNodeType];
        }
        var showName = docs[i][codeName]+'('+nodeTypeName+'-'+firstNodeDisplayName+')';
        if (docs[i][codeValue] === currentValue) {
            resultOptions += selectOptionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, showName);
        } else {
            resultOptions += optionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, showName);
        }
    }
    return resultOptions;
}


function getNodeDisplayName(nodeType,nodeExten){
    var nodeDisplayName = "";
    var ivr = session.ivrMap.ivr;
    if(nodeType == 'account_user'){
        for(var i in ivr[nodeType]){
            if(nodeExten == ivr[nodeType][i]._id){
                nodeDisplayName = ivr[nodeType][i].displayName;
                break;
            }
        }
    }else{
        for(var i in ivr[nodeType]){
            if(nodeExten == ivr[nodeType][i].Exten){
                nodeDisplayName = ivr[nodeType][i].DisplayName;
                break;
            }
        }
    }
    return nodeDisplayName;
}


function checkPbxLoadInfo(pbxId) {
    var loadHtml = '<span class="label __level">__info</span>';
    var action = {
        action: 'config.ivr.pbx.checkPbxLoadInfo',
        data: {'pbxId': pbxId}
    }
    DS.send(action, function (response) {
        if(response.success){
            if(response.loadCount < 2000){
                loadHtml = loadHtml.replace(/__level/g,'label-success');
                loadHtml = loadHtml.replace(/__info/g,'空闲');
            }else if(response.loadCount < 3500){
                loadHtml = loadHtml.replace(/__level/g,'label-warning');
                loadHtml = loadHtml.replace(/__info/g,'繁忙');
            }else if(response.loadCount < 5000){
                loadHtml = loadHtml.replace(/__level/g,'label-important');
                loadHtml = loadHtml.replace(/__info/g,'拥挤');
            }else if(response.loadCount > 5000){
                loadHtml = loadHtml.replace(/__level/g,'label-inverse');
                loadHtml = loadHtml.replace(/__info/g,'饱和');
            }else{
                loadHtml = loadHtml.replace(/__level/g,'');
                loadHtml = loadHtml.replace(/__info/g,'未知');
            }
        }else{
            loadHtml = loadHtml.replace(/__level/g,'');
            loadHtml = loadHtml.replace(/__info/g,'未知');
        }
        $(".add_pbx_load_label").html(loadHtml);
    });
}

function checkSubPbxLoadInfo(pbxId) {
    var loadHtml = '<span class="label __level">__info</span>';
    var action = {
        action: 'config.ivr.pbx.checkPbxLoadInfo',
        data: {'pbxId': pbxId}
    }
    DS.send(action, function (response) {
        if(response.success){
            if(response.loadCount < 200){
                loadHtml = loadHtml.replace(/__level/g,'label-success');
                loadHtml = loadHtml.replace(/__info/g,'空闲');
            }else if(response.loadCount < 350){
                loadHtml = loadHtml.replace(/__level/g,'label-warning');
                loadHtml = loadHtml.replace(/__info/g,'繁忙');
            }else if(response.loadCount < 500){
                loadHtml = loadHtml.replace(/__level/g,'label-important');
                loadHtml = loadHtml.replace(/__info/g,'拥挤');
            }else if(response.loadCount >500){
                loadHtml = loadHtml.replace(/__level/g,'label-inverse');
                loadHtml = loadHtml.replace(/__info/g,'饱和');
            }else{
                loadHtml = loadHtml.replace(/__level/g,'');
                loadHtml = loadHtml.replace(/__info/g,'未知');
            }
        }else{
            loadHtml = loadHtml.replace(/__level/g,'');
            loadHtml = loadHtml.replace(/__info/g,'未知');
        }
        $(".add_sub_pbx_load_label").html(loadHtml);
    });
}
/**
 * Created by liyanlan on 16/08/01.
 */
handler.config.callConfigLabel = {
    configCallLabelChange:function(data){
        var pane=$("#cfg_add_lable_wrap");
        pane.show();
        pane.find(".cfg_add_lable").html("修改通话标签");
        var str=$("input[name='labelUse']:checked").siblings("span").html();
        var enable=$("input[name='labelUse']:checked").attr("use");
        pane.find(".cfg_write_label").val(str).attr("ds_data",data);
        $(".cfg_label_cancel").hide();
        if(enable=="off"){
            $(".cfg_label_use").show();
            $(".cfg_label_stop").hide();
        }else if(enable=="on"){
            $(".cfg_label_stop").show();
            $(".cfg_label_use").hide();
        }
    },
    addCallLabelTemplate:function(){
        var pane=$("#cfg_add_lable_wrap");
        pane.show().find(".cfg_label_cancel").show();
        pane.find(".cfg_add_lable").html("添加通话标签")
        $(".cfg_label_use,.cfg_label_stop").hide();
        $("input[name='labelUse']:checked").removeAttr("checked");
        pane.find(".cfg_write_label").val('').attr("ds_data","");
    },
    config_call_label_template:function(){
        var action = {
            action : "config.callLabel.queryCallLabel"
        }
        DS.send(action,function(res){
            if(res.success){
                var list=res.list;
                $("#config_call_label_use,#config_call_label_stopUse").empty();
                for(var i=0; i<list.length; i++) {
                    list[i].judge=(list[i].enable);
                    if (list[i].enable) {
                        var labelOn= template("use_on_label",list[i]);
                        $("#config_call_label_use").append(labelOn);
                    }else{
                        var labelOff= template("use_off_label",list[i]);
                        $("#config_call_label_stopUse").append(labelOff);
                    }
                }
                $("#cfg_add_lable_wrap").find(".cfg_write_label").val('');
            }else{
                $().alertmessage('showError','服务异常');
                return;
            }

        });

    },
    saveCallLabelTemplate:function(data){
        var pane=$("#cfg_add_lable_wrap").find(".cfg_write_label");
        data.name=$.trim(pane.val())
        data._id=pane.attr("ds_data");
        if(data.enable == ""|| data.enable == null){
            data.enable = true;
        }
        var action = {
            action: 'config.callLabel.addCallLabel',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                $("#cfg_add_lable_wrap").hide();
                pane.val('');
                $("#config_call_label_use,#config_call_label_stopUse").empty();
                $().alertmessage('showSuccess',response.message);
                handler.config.callConfigLabel.config_call_label_template();
            } else {
                $().alertmessage('showError',response.message);
            }
        });
    },
    changeToLabelUse:function(data){
        var pane = $("#cfg_add_lable_wrap").find(".cfg_write_label");
        data.name=$.trim(pane.val())
        data._id=pane.attr("ds_data");
        data.enable = true;
        var action = {
            action: 'config.callLabel.updateCallLabelState',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                $("#cfg_add_lable_wrap").hide();
                pane.val('');
                $("#config_call_label_use,#config_call_label_stopUse").empty();
                $().alertmessage('showSuccess',response.message);
                handler.config.callConfigLabel.config_call_label_template();
            } else {
                $().alertmessage('showError',response.message);
            }
        });
    },
    changeToLabelStop:function(data){
        var pane = $("#cfg_add_lable_wrap").find(".cfg_write_label");
        data.name=$.trim(pane.val())
        data._id=pane.attr("ds_data");
        data.enable = false;
        var action = {
            action: 'config.callLabel.updateCallLabelState',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                $("#cfg_add_lable_wrap").hide();
                pane.val('');
                $("#config_call_label_use,#config_call_label_stopUse").empty();
                $().alertmessage('showSuccess',response.message);
                handler.config.callConfigLabel.config_call_label_template();
            } else {
                $().alertmessage('showError',response.message);
            }
        });
    },
    cancleCallLaelTemplate:function(){
        var pane= $("#cfg_add_lable_wrap");
        pane.hide();
        pane.find(".cfg_write_label").val('');
    },
}