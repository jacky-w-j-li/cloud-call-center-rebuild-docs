handler.callConfig = {
    pageSize: 5,
    currentPage: 1,
    currentPbx: null,
    effectIvr: false,
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
            var actionName = null, beforeActionEventName = null, actionCallbackName = null, extraDataName = null;
            var data = null, updateClientDataCond = null;

            //如果声明了ds-form-action，只是简单地把标签属性取出来
            if (formActionTag.length > 0) {
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
                        var viewPanel = null;
                        if (viewPanelID) {
                            viewPanel = $('#' + viewPanelID);
                            if (!viewPanel) {
                                console.warn('[ds_action_flow] view panel not found!');
                                return;
                            }
                            // 把页面填充
                            viewPanel.html(viewHtml);
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
                            handler.callConfig.renderItemList(itemLists);
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
                            handler.callConfig.renderItemEdit(itemEditForms, viewPanel);
                        }

                        var ivrToPeerType = $('.ds_ivr_to_peer_type', viewPanel);
                        if (ivrToPeerType.length > 0) {
                            handler.callConfig.renderToPeerType(ivrToPeerType, viewPanel);
                        }

                        var ivrSoundSelect = $('.ds_ivr_sound_select', viewPanel);
                        if(ivrSoundSelect.length > 0) {
                            handler.callConfig.renderSoundSelect(ivrSoundSelect, viewPanel);
                        }

                        var ivrVarSelect = $('.ds_ivr_var_select', viewPanel);
                        if(ivrVarSelect.length > 0) {
                            handler.callConfig.renderVarSelect(ivrVarSelect, viewPanel);
                        }

                        if (effectIvrTag.length > 0 && handler.callConfig.effectIvr) {
                            $(".ds_ivr_effect").removeClass('disabled');
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
                        var ivrMessage = $('#ivrMessage');
                        if (ivrMessage.length > 0 && (actionName.indexOf('save')>-1
                            || actionName.indexOf('update')>-1)) {
                            ivrMessage.css('display', '');
                            setTimeout(handler.callConfig.hideIvrMessage, 5000);
                        }
                        if (effectIvrTag.length > 0) {
                            handler.callConfig.effectIvr = true;
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
                            if(handler.callConfig.infoMessage[response.code]){
                                alert(handler.callConfig.infoMessage[response.code]);
                            }
                        }

                        // 服务端返回数据后调用renderView宣染页面
                        renderView(responseData);
                    } else {
                        if(response.reason) {
                            if(handler.callConfig.infoMessage[response.reason]){
                                alert(handler.callConfig.errorMessage[response.reason]);
                            }
                        } else {
                            alert('保存失败.\n' + response.message ? response.message : '');
                        }
                    }
                });
            } else {
                if (refreshClientData) {
                    delete session.ivrMap.searchResult;
                    handler.callConfig.currentPage = 1;
                }
                // 如果没有声明ds-do-action或do-form-action，则直接宣染页面
                renderView();
            }
        });
        $(document).on('change', '.ivr_to_peer_type_select', function (event) {
            var src = $(event.currentTarget);
            var value = src.val();
            var toPeerTypeTag = src.parent('div');
            handler.callConfig.renderToPeerTag(toPeerTypeTag, value);
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
                html.push(generateComboxOptionsFromDocs(handler.callConfig.systemPeerTypeArr, 'name', 'value', ''));
            } else {
                html.push("<option value=''>--请选择--</option>");
                var toPeerArr = session.ivrMap.ivr[self.val()];
                if (toPeerArr) {
                    if (self.val() == 'account_user'){
                        html.push(generateComboxOptionsFromDocs(toPeerArr, 'name', 'exten', ''));
                    } else {
                        html.push(generateComboxOptionsFromDocs(toPeerArr, 'DisplayName', 'Exten', ''));
                    }
                }
            }
            panel.html(html.join(''));
        });

        $(document).on('click', '.ds-ivr-add-ivr-key', function(){
            var html = handler.callConfig.node.ivr.getIvrKeyListItem({
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
            handler.callConfig.node.assignment.addNewAssignment();
        })
        .on('click', '.ds-ivr-add-route-item', function(){
                handler.callConfig.node.route.addNewRouteItem();
        })
        .on('click', '.ivr_advantage_search', function(){
            handler.callConfig.showAdvantageSearch(this);
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
                    var page = handler.callConfig.currentPage || 1;
                    var pageSize = handler.callConfig.pageSize;
//                    for (var i = 0; i < enddata.length; i++) {
//                        dataList.push(enddata[i]);
//                        if ((i + 1) === handler.callConfig.pageSize) {
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
                    updatePagination(list, enddata.length, handler.callConfig.pageSize, page);
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
                        handler.callConfig.renderItemList(subRenderItemList, null);
                    }
                    // 此处是递归调用renderItemList去渲染更多的列表
                    handler.callConfig.renderItemList(itemList, callback);
                });
            } else {
                handler.callConfig.renderItemList(itemList, callback);
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
        {TypeValue: 'ivr_node_validation', TypeName: '采集输入节点'},
        {TypeValue: 'ivr_node_assignment', TypeName: '赋值节点'},
        {TypeValue: 'ivr_node_route', TypeName: '按变量路由节点'},
        {TypeValue: 'ivr_node_call_url', TypeName: 'CallUrl节点'},
        {TypeValue: 'ivr_node_voice_mail', TypeName: '留言节点'},
        {TypeValue: 'ivr_node_room', TypeName: '会议室节点'},
        {TypeValue: 'ivr_node_satisfaction', TypeName: '自定义满意度节点'},
        {TypeValue: 'ivr_node_extension_peer', TypeName: '自定义节点'}
    ],
    systemPeerTypeArr: [
        {name: '挂机', value: "0"},
        {name: '满意度调查', value: "1"},
        {name: '拨工号', value: "2"}
    ],
    renderToPeerType: function (toPeerTypeTag, viewPanel) {
        var toPeerType = handler.callConfig.toPeerTypeArr;
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
            handler.callConfig.renderToPeerTag(currentTag, toPeerTypeValue, viewPanel);
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
            html += generateComboxOptionsFromDocs(handler.callConfig.systemPeerTypeArr, 'name', 'value', toPeer);
        } else {
            html += "<option value=''>--请选择--</option>";
            if (toPeerArr) {
                if(toPeerTypeValue == 'account_user'){
                    html += generateComboxOptionsFromDocs(toPeerArr, 'name', '_id', toPeer);
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
            var soundArr = handler.callConfig.sound.getNormalSound();
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
                varSelectDiv.html(handler.callConfig.generateVarSelect(varSelectName, value));
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
                    var lastIndex = handler.callConfig.itemFocusIndex;
                    var currentIndex = lastIndex + 1;
                    var itemFlagArr = $(".item-flag", target);
                    if(currentIndex+1 > itemFlagArr.length) {
                        currentIndex = lastIndex;
                    }
                    itemFlagArr.removeClass('item-focus');
                    $(itemFlagArr[currentIndex]).addClass('item-focus');
                    handler.callConfig.itemFocusIndex = currentIndex;
                    return false;
                } else if (keyCode == 38) {
                    // press up
                    var lastIndex = handler.callConfig.itemFocusIndex;
                    var currentIndex = lastIndex - 1;
                    if(lastIndex == 0) {
                        currentIndex = 0;
                    }
                    var itemFlagArr = $(".item-flag", target);
                    itemFlagArr.removeClass('item-focus');
                    $(itemFlagArr[currentIndex]).addClass('item-focus');
                    handler.callConfig.itemFocusIndex = currentIndex;
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
                    handler.callConfig.lastSearch = $(this).val();
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

                        if(keyCode == 8 && !handler.callConfig.lastSearch){
                            delete session.ivrMap.searchResult;
                            handler.callConfig.renderItemList($('.ds-item-list','#ivrMain'));
                            return false;
                        }

                        if (!src.val()){
                            delete session.ivrMap.searchResult;
                            handler.callConfig.renderItemList($('.ds-item-list','#ivrMain'));
                            return false;
                        }

                        var searchResult = handler.callConfig.ivrSearch(src);
                        session.ivrMap.searchResult = searchResult;
                        handler.callConfig.currentPage = 1;
                        keyPress = null;
                        handler.callConfig.itemFocusIndex = -1;
                        handler.callConfig.renderItemList($('.ds-item-list','#ivrMain'));
                        var list = $(".class_list #"+src.attr('pagination-name')+"_index li");
                        var count = 0;
                        if(searchResult && searchResult.length > 0) {
                            count = searchResult.length;
                        }
                        updatePagination(list, count, handler.callConfig.ivrPageSize, 1);
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
                        handler.callConfig.itemFocusIndex = -1;
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
        handler.callConfig.initDSActionFlow();
        session.ivrMap = session.ivrMap || {};
    },
    hideIvrMessage: function () {
        $('#ivrMessage').css('display', 'none');
    },
    getNodes: function (data, callback) {
        session.ivrMap.ivr = session.ivrMap.ivr || {};
        var cacheNodes = session.ivrMap.ivr[data.nodeType];
        if (!cacheNodes) {
            var action = {
                action: data.actionName,
                data: {
                    Account: handler.callConfig.currentConfigData.Account,
                    PBX: handler.callConfig.currentConfigData.PBX
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
        var cacheNodes = handler.callConfig._getCacheNode(nodeType);
        handler.callConfig._spliceNodeFromCache(cacheNodes, key, value);
        handler.callConfig._refreshNodeCacheMap();
    }, updateNodeToCache: function (nodeType, key, value, data) {
        var cacheNodes = handler.callConfig._getCacheNode(nodeType);
        handler.callConfig._spliceNodeFromCache(cacheNodes, key, value);
        cacheNodes.unshift(data);
        handler.callConfig._refreshNodeCacheMap();
    }, addNodeToCache: function (nodeType, data) {
        var cacheNodes = handler.callConfig._getCacheNode(nodeType);
        cacheNodes.unshift(data);
        handler.callConfig._refreshNodeCacheMap();
    },
    refreshNodeToCache: function(nodeType, dataList) {
        session.ivrMap.ivr[nodeType] = dataList;
    },
    beforeRenderIvrMain: function(data, ele){
        var self = handler.callConfig;
        self.currentConfigData = self.currentConfigData || {};
        self.currentConfigData.PBX = ele.attr('pbx');
        self.currentConfigData.Account = ele.attr('account');
        data.PBX = self.currentConfigData.PBX;
        data.Account = self.currentConfigData.Account;
        return data;
    },
    afterRenderIvrMain: function(data, src){
        // IVR主页面每一个显示的节点是服务号，触发服务号锻接的click，让其加载数据
        $('#pbxInfoLink').trigger('click');
        $('#accountNameLabel').html(src.attr('account-id')+' - '+src.attr('account-name')+' - '+src.attr('company-name')+' - <b style="color:blue;">' + src.attr('pbx-name') + '</b>');
        handler.callConfig.ivrBehaviorModule.init();
    },
    /**
     * IVR主页面加载时，从服务端取出当前账户所有的IVR节点信息，存放在缓存里：session.ivrMap
     * 数据按节点类型:节点信息列表存储，如：{"ivr_node_announcement":[{..},{..}]}
     */
    ivrMain: function (data, response) {
        var self = handler.callConfig;

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
        handler.callConfig.setSipPeerUser();
    },
    setSipPeerUser: function() {
        var sips = session.ivrMap.ivr.ivr_sip;
        var users = session.ivrMap.ivr.account_user;
        users.forEach(function(user) {
            var sipNumMap = user.sipNum;
            var sipNum = null;
            var sip = null;
            for (var sipType in sipNumMap) {
                sipNum = sipNumMap[sipType];
                for (var s in sips) {
                    if (sips[s].Exten == sipNum) {
                        sip = sips[s];
                        break;
                    }
                }
                if (sip) {
                    sip.UserExten = user.exten;
                    sip.UserName = user.displayName;
                }
                sip = null;
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
            handler.callConfig.deleteNodeFromCache(type, '_id', data._id);
        }else {
            if (data)
            handler.callConfig.updateNodeToCache(type, '_id', data._id, data);
        }
    },
    updateClientDataList: function (param) {
        var type = param.type;
        var list = param.data;
        handler.callConfig.refreshNodeToCache(type, list);
    },
    updateClientSearchData: function(param) {
        session.ivrMap.searchResult = param.data;
    },
    reloadComplete: function () {
        handler.callConfig.effectIvr = false;
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
//        var pageSize = handler.callConfig.ivrPageSize;
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

        handler.callConfig.currentPage = parseInt(src.val())||1;
        var itemLists = $("#"+data.itemListID);
        handler.callConfig.renderItemList(itemLists);
//        $("span."+data.itemListID+"_result_count").text(count);
//        var list = $(".class_list #"+data.itemListID+"_index li");
//        updatePagination(list, count, handler.callConfig.ivrPageSize, page);
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
            updatePagination(list, count, handler.callConfig.ivrPageSize, page);
            $('#accountListPage').val('');
        },
        accountPbxList: function () {
            $('#searchAccountPbxLink').trigger('click');
        },
        preRenderItem: function (view, data) {
            var pbx = data.pbx;
            var pbxTemplate = '<a href="#" class="ds_action_flow" pbx="__PBX" account="__Account" account-name="__AccountName" account-id="__AccountID"' +
                ' company-name="__CompanyName" pbx-name="__PBXName">__NickName' +
                '<ds-do-action action="manager.ivr.getAllNodesByPbx" on-before="callConfig.beforeRenderIvrMain" on-complete="callConfig.ivrMain"></ds-do-action>' +
                '<ds-get-view view="callConfig/ivrMain" panel="ivrMain" on-complete="callConfig.afterRenderIvrMain"/></a>';
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
            var accountID = ele.attr("Account");
            handler.callConfig.currentConfigData = {
                Account : accountID
            };
            $('#addPbxLink').trigger('click');
            $('#pbxSelectPanel').html(handler.callConfig.pbx.renderPbxSelect(''));
            var account = handler.callConfig.getAccount(accountID);
            $('#accountDisplayName').val(account.name);
        },
        renderPbxSelect: function(val, disabled){
            var pbxList = getCache('pbx');
            var pbxListHtml = [];
            pbxListHtml.push('<select name="PBX" required="true" ');
            pbxListHtml.push(disabled||'');
            pbxListHtml.push('><option id="defautpbxselected" selected="selected" value="">--请选择--</option>');
            pbxListHtml.push(generateComboxOptionsFromDocs(pbxList, 'name', '_id', val));
            pbxListHtml.push('</select>');
            return pbxListHtml.join('');
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
        pbxAddSuccess: function () {
            $('#addPbx').modal('hide');
            $('#addPbx').html('');
            $('#searchAccountPbxLink').trigger('click');
        },
        cancelAdd: function(){
            $('#addPbx').modal('hide');
            $('#addPbx').html('');
        },
        accountPbxEdit: function () {
            var self = handler.callConfig;
            var accountPbxList = session.ivrMap.accountPbxList;
            var current = self.currentConfigData;
            var account = null;
            for (var ind in accountPbxList) {
                account = accountPbxList[ind];
                if (account.account == current.Account) {
                    break;
                }
            }
            if(account){
                self.currentPbx = account.pbx;
            } else {
                alert('系统找不到此账户的PBX');
            }
            $('#pbxEditSelectPanel').html(handler.callConfig.pbx.renderPbxSelect('', 'disabled'));
        },
        accountPbxUpdated: function(data){
            var self = handler.callConfig;
            var account = handler.callConfig.getAccount(self.currentConfigData.Account);
            if(account) {
                account.pbx = data;
                self.currentPbx = data;
            }
            $('#pbxEditSelectPanel').html(handler.callConfig.pbx.renderPbxSelect(''));
        }
    },
    serviceNo: {
        afterSaveServiceNo: function (serviceNoData, res) {
            if(res.serviceNoSchedule){
                handler.callConfig.addNodeToCache('ivr_schedule', res.serviceNoSchedule);
            }
        },
        afterDeleteServiceNo: function(serviceNoData, res){
            if(res.scheduleIDs){
                for(var id in res.scheduleIDs){
                    handler.callConfig.deleteNodeFromCache('ivr_schedule', '_id', res.scheduleIDs[id].id)
                }
            }
        },
        getTypeName: function(type) {
            if (type == 'normal') {
                return '普通';
            }
            if (type == 'batchDialout') {
                return '批量外呼';
            }
            return '';
        }
    },
    schedule: {
        renderDetail: function () {
//            var itemLists = $(".ds-item-list", viewPanel);
//            if (itemLists.length > 0){
//                handler.callConfig.renderItemList(itemLists);
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

        }
    },
    agent: {
        agentAdded: function (userData) {
            handler.callConfig.addNodeToCache('account_user', userData);
        },
        getAgentStatusName: function(status){
            if (status == 'disable') {
                return '已停用';
            }
            return '';
        },
        onShownAgentEdit: function(){
            var agentID = session.ivrMap.viewData._id;
            var agent = handler.callConfig.getNodeFromCache('account_user', '_id', agentID);
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
        }
    },
    queue: {
        preAddQueue: function () {
            var action = {
                action: 'manager.ivr.queue.getFreeQueueNo',
                data: null
            }
            DS.send(action, function (rep) {
                if (rep.success) {
                    $('#queueNoInput').val(rep.num);
                    handler.callConfig.queue.renderAgentAssign();
                } else {
                    alert('取空闲技能组失败');
                }
            });

            var action = {
                action: 'callRecord.getCallRecordTemplate',
                data: {account:handler.callConfig.currentConfigData.Account}
            };

            DS.send(action,function(rep){
                if(rep.success){
                    var data = rep.data ||[];
                    var popUpSelect =  $("#callInPopConfig");
                    popUpSelect.empty();
                    popUpSelect.append("<option value='business'>业务</option>");
                    for( var i=0;i<data.length;i++){
                        popUpSelect.append("<option value="+data[i]._id+">"+data[i].name+"</option>");
                    }
                } else {
                    alert('获取账户来电登记失败！');
                }
            });


//            alert($("#callInPopConfig").val());
//
//            alert(handler.callConfig.currentConfigData.Account );
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
                return item.name + "[" + item.exten + ']';
            });
            $('#agentAssignAutoComplete').bind('keyup', function(){
                if (event.keyCode == 13) {
                    if (this.value) {
                        var agentExten = this.value.substring(this.value.indexOf('[') + 1, this.value.indexOf(']'));
                        console.info(agentExten);
                        if (agentExten) {
                            var searchAgent = handler.callConfig.getNodeFromCache('account_user', 'exten', agentExten);
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
            var assignedchkArr = $('input:checked', agentAssignPanel);
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
            handler.callConfig.addNodeToCache('ivr_node_queue', queueData);
        },
        preUpdateQueue: function (data) {
            handler.callConfig.queue.renderAgentAssign();
            var members = data.AssignMembers;
            if (members && members.length > 0) {
                var member = null, arr = null;
                for (var ind in members) {
                    member = members[ind];
                    $('#' + member.agentID + '_assignment').attr('checked', 'true');
                    $('#' + member.agentID + '_priority').val(member.penalty);
                }
            }
            var action = {
                action: 'callRecord.getCallRecordTemplate',
                data: {account:handler.callConfig.currentConfigData.Account}
            };

            DS.send(action,function(rep){
                if(rep.success){
                    var reqdata = rep.data ||[];
                    var popUpSelect =  $("#callInPopConfig");
                    popUpSelect.empty();
                    if(data.CallInPop == 'business'){
                        popUpSelect.append("<option value='business' selected=true>业务</option>");
                    } else {
                        popUpSelect.append("<option value='business'>业务</option>");
                    }
                    for( var i=0;i<reqdata.length;i++){
                        console.log(reqdata[i]._id);
                        console.log( data.CallInPop);
                        if(reqdata[i]._id == data.CallInPop){
                            popUpSelect.append("<option value="+reqdata[i]._id+" selected=true>"+reqdata[i].name+"</option>");
                        } else{
                            popUpSelect.append("<option value="+reqdata[i]._id+">"+reqdata[i].name+"</option>");
                        }
                    }
                } else {
                    alert('获取账户来电登记失败！');
                }
            });
        },
        queueUpdated: function (queueData) {
            console.info(queueData);
            handler.callConfig.updateNodeToCache('ivr_node_queue', '_id', queueData._id, queueData);
        }
    },
    line: {
        preEditLine: function(data) {
            console.info(data);
            var lineList = getCache('line');
            var html = [];
            html.push('<select name="Exten"><option value="">--请选择--</option>');
            html.push(generateComboxOptionsFromDocs(lineList, 'name', '_id', ''));
            html.push('</select>');
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
        getTypeName: function(type) {
            if (type == "true") {
                return '外呼线路';
            } else {
               return '呼转线路';
            }
        },
        getLineName: function(line){
            var line = getCacheByKey('line', '_id', line);
            if(line) {
                return line.name;
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
            console.info(evt.target.responseText);
            var res = $.parseJSON(evt.target.responseText);
            if (res.filePath) {
                $('#oldIvrSoundFilePath').val($('#ivrSoundFilePath').val());
                $('#ivrSoundFilePath').val(res.filePath);
                var uploadMess = $("#uploadMess");
                uploadMess.addClass("text-success");
                uploadMess.text('文件已上传');
                uploadMess.css("display", "block");
            } else {
                handler.ivr.sound.uploadError();
            }
        },
        uploadError: function (evt) {
            var uploadMess = $("#uploadMess");
            uploadMess.addClass("text-error");
            uploadMess.text('文件上传失败，请重新选择文件上传');
            uploadMess.css("display", "block");
        },
        uploadProgressing: function (evt) {
            var percentComplete = Math.round(evt.loaded * 100 / evt.total);
            console.info(percentComplete);
        },
        onrenderEdit: function(data){
            var soundFileName = data.Filename.substring(0, data.Filename.indexOf('.'));
            var fileUrl = DS._ds_url.replace('action', '') + 'fileDownload/?sessionId=' + session.id + '&fileId=' + soundFileName;
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
            var user = handler.callConfig.getNodeFromCache('account_user', '_id', userID);
            if(user){
                return user.name;
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
                handler.callConfig.updateClientData(param);
            }
        },
        addCodes: function() {
            var codesPanel = $('#sipCodesPanel');
            var template = $('#codesTemplate').html();
            $('.icon-plus',codesPanel).removeClass('icon-plus').addClass('icon-minus')
                .parent('a').attr('onclick', 'handler.callConfig.sip.removeCodes(this)');
            codesPanel.append(template);
        },
        removeCodes: function(src) {
            $(src).parent('div').remove();
        },
        onShowDetial: function() {
            var sipNum = session.ivrMap.viewData.Exten;
            var sip = handler.callConfig.getNodeFromCache('ivr_sip', 'Exten', sipNum);
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
                                handler.callConfig.sip.addCodes();
                                $('select', '#sipCodesPanel').last().val(codes[i]);
                            }
                        }
                    }
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
            for(var i= 0,len=codesSelectArr.length;i<len;i++) {
                codesSelect = codesSelectArr[i];
                if(codesSelect.value) {
                    codesMap[codesSelect.value] = "1";
                }
            }
            for(var codes in codesMap) {
                codesString += codes + ",";
            }
            if(codesString) {
                codesString = codesString.substring(0, codesString.length - 1);
                data.Allow = codesString;
            }
            return data;
        }
    },
    node: {
        ivr: {
            ivrKeyDocs : null,
            getIvrKeyDocs: function(){
                var docs = handler.callConfig.node.ivr.ivrKeyDocs;
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
                    handler.callConfig.node.ivr.ivrKeyDocs = docs;
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
                        html.push(handler.callConfig.node.ivr.getIvrKeyListItem(key));
                    }
                    $('#ivrKeyListBody').html(html.join(''));
                }
            },
            getIvrKeyListItem: function(key){
                var html = [];
                var keyDocs = handler.callConfig.node.ivr.getIvrKeyDocs();
                html.push('<tr><td><select name="key" class="span12 ivr-key">');
                html.push(generateComboxOptionsFromDocs(keyDocs, 'code', 'value', key.Key));
                html.push('</select></td><td><select name="toPeerType" class="span6 ivr-key-to-peer-type" style="float:left;">');
                html.push(generateComboxOptionsFromDocs(handler.callConfig.toPeerTypeArr, 'TypeName', 'TypeValue', key.ToPeerType));
                html.push('</select><div class="ivr-key-to-peer-panel"><select name="toPeer" class="span6 ivr-key-to-peer">');
                if (key.ToPeerType == 'system') {
                    html.push(generateComboxOptionsFromDocs(handler.callConfig.systemPeerTypeArr, 'name', 'value', ''));
                } else {
                    html.push("<option value=''>--请选择--</option>");
                    var toPeerArr = session.ivrMap.ivr[key.ToPeerType];
                    if (toPeerArr) {
                        if (key.ToPeerType == 'account_user') {
                            html.push(generateComboxOptionsFromDocs(toPeerArr, 'name', 'exten', key.ToPeer));
                        } else {
                            html.push(generateComboxOptionsFromDocs(toPeerArr, 'DisplayName', 'Exten', key.ToPeer));
                        }
                    }
                }
                html.push('</select></div></td><td>');
                html.push('<a href="#" class="ds-ivr-delete-ivr-key"><i class="icon-minus"></i></a>');
                html.push('</td></tr>');
                return html.join('');
            },
            preSaveIvrKey: function(data){
                console.info(data);
                var ivrKeys = $('.ivr-key', '#ivrKeyListBody');
                var keyArr = [];
                var keyMap = {};
                if(ivrKeys && ivrKeys.length > 0) {
                    var ivrKey = null, tr = null;
                    var toPeerType = null, toPeer = null;
                    var isDuplicated = false, duplicateKey = null;
                    for(var i= 0,len=ivrKeys.length;i<len;i++) {
                        ivrKey = $(ivrKeys[i]);
                        tr = ivrKey.parents('tr');
                        toPeerType = $('.ivr-key-to-peer-type', tr);
                        toPeer = $('.ivr-key-to-peer', tr);
                        keyArr[i] = {
                            Key: ivrKey.val(),
                            ToPeerType: toPeerType.val(),
                            ToPeer: toPeer.val()
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
                if(endKey === '0'){
                    $("#EndType").val("0");
                    $("#MaxLabel").html("结束长度");
                    $("#Max").attr("name","EndLength");
                    $("#Max").attr("value","4");
                    $("#Max").attr("msgName","结束长度");
                    $("#Max").attr("msg","结束长度须是大于0的数字");
                }else{
                    $("#EndType").val("1");
                    $("#MaxLabel").html("字段最大长度");
                    $("#Max").attr("name","Max");
                    $("#Max").attr("value","30");
                    $("#Max").attr("msgName","字段最大长度");
                    $("#Max").attr("msg","字段最大长度必须是大于0的数字");
                }
            }
        },
        assignment: {
            addNewAssignment: function(){
                $('#ivrAssignmentListBody').append(handler.callConfig.node.assignment.getAssignmentItem({
                    VarName:'',
                    VarValue: ''
                }));
            },
            getAssignmentItem: function(assignmentObj){
                var html = [];
                html.push('<tr><td class="span3">');
                html.push(handler.callConfig.generateVarSelect("ivrAssignment", assignmentObj.VarName));
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
                        html.push(handler.callConfig.node.assignment.getAssignmentItem(condition));
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
                $('#ivrRouteListBody').append(handler.callConfig.node.route.getRouteItem({
                    VarId:'',
                    Operation: '0',
                    Value: '',
                    Logic: 'and'
                }));
            },
            getRouteItem: function(routeItem){
                var html = [];
                html.push('<tr><td class="span3">');
                html.push(handler.callConfig.generateVarSelect("", routeItem.VarName, 'input-small ivr-route-var'));
                html.push('</td><td class="span2"><select class="ivr-route-operation input-small">');
                html.push(generateComboxOptionsFromDocs(handler.callConfig.node.route.routeConditions, 'label', 'value', routeItem.Operation));
                html.push('</select></td><td class="span3">');
                html.push('<input type="text" class="ivr-route-value input-small" value="'+routeItem.Value+'">');
                html.push('</td><td class="span3"><select class="ivr-route-logic input-small">');
                html.push(generateComboxOptionsFromDocs(handler.callConfig.node.route.routeLogicArray, 'label', 'value', routeItem.Logic));
                html.push('</select></td><td class="span1">');
                html.push('<a href="#" class="ds-ivr-delete-route-condition"><i class="icon-minus"></i></a>');
                html.push('</td></tr>');
                return html.join('');
            },
            preSaveRoute: function(data){
                var routes = $('.ivr-route-var', '#ivrRouteListBody');
                var routeArr = [];
                if(routes && routes.length > 0) {
                    var routeVar = null, tr = null;
                    var routeValue = null, operation = null, logic = null;
                    for(var i= 0,len=routes.length;i<len;i++) {
                        routeVar = $(routes[i]);
                        tr = routeVar.parents('tr');
                        operation = $('.ivr-route-operation', tr);
                        routeValue = $('.ivr-route-value', tr);
                        logic = $('.ivr-route-logic', tr);
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
                        html.push(handler.callConfig.node.route.getRouteItem(route));
                    }
                    $('#ivrRouteListBody').html(html.join(''));
                }
            }
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

$(function () {
    handler.callConfig.init();
});