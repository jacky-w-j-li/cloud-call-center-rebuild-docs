handler.config.ivrProcess = {
    pageSize: 5,
    textCode: '',
    textLength: 0,
    nodeName2Alias:{
        ivr_node_announcement: 'A',
        ivr_node_text_announcement: 'B',
        ivr_node_ivr: 'C',
        ivr_node_validation: 'D',
        ivr_node_assignment: 'E',
        ivr_node_encrypt_md5: 'F',
        ivr_node_route: 'G',
        ivr_node_call_url: 'H',
        ivr_node_voice_mail: 'I',
        ivr_node_room: 'J',
        ivr_node_satisfaction: 'K',
        ivr_node_extension_peer: 'L',
        ivr_node_superDialJobNum: 'M',
        ivr_node_ivr_menu: 'N',
        system: {
            0: 'O1', //挂机
            1: 'O2', //满意度调查
            2: 'O3'  //拨打工号
        },
        ivr_node_system: 'O3',
        ivr_node_queue: 'P',
        account_user: 'Q'
    },
    alias2Node:{
        A: {
            type: 'ivr_node_announcement',
            fileName: 'node/announcement/announcement_edit'
        },
        B: {
            type: 'ivr_node_text_announcement',
            fileName: 'node/textAnnouncement/text_announcement_edit'
        },
        C: {
            type: 'ivr_node_ivr',
            fileName: 'node/ivr/ivr_edit'
        },
        D: {
            type: 'ivr_node_validation',
            fileName: 'node/validation/validation_edit'
        },
        E: {
            type: 'ivr_node_assignment',
            fileName: 'node/assignment/assignment_edit'
        },
        F: {
            type: 'ivr_node_encrypt_md5',
            fileName: 'node/encryptMd5/encrypt_md5_edit'
        },
        G: {
            type: 'ivr_node_route',
            fileName: 'node/route/route_edit'
        },
        H: {
            type: 'ivr_node_call_url',
            fileName: 'node/callUrl/call_url_edit'
        },
        I: {
            type: 'ivr_node_voice_mail',
            fileName: 'node/voiceMail/voice_mail_edit'
        },
        J: {
            type: 'ivr_node_room',
            fileName: 'node/room/room_edit'
        },
        K: {
            type: 'ivr_node_satisfaction',
            fileName: 'node/satisfaction/satisfaction_edit'
        },
        L: {
            type: 'ivr_node_extension_peer',
            fileName: 'node/extensionPeer/extension_peer_edit'
        },
        M: {
            type: 'ivr_node_superDialJobNum',
            fileName: 'node/superDialJobNum/superDialJobNum_edit'
        },
        N: {
            type: 'ivr_node_ivr_menu',
            fileName: 'node/ivrMenu/ivr_menu_edit'
        },
        O: {
            type: 'ivr_node_system',
            fileName: 'node/system/dial_jobnum_edit'
        },
        P: {
            type: 'ivr_node_queue',
            fileName: 'queue/queue_edit'
        }
    },
    node2PeerCondition:{
        ivr_node_announcement: 'next',
        ivr_node_text_announcement: 'next',
        ivr_node_validation: {
            ToPeerType: '成功',
            ToPeerTypeWhenWaitTimeout: '超时'
        },
        ivr_node_assignment: 'next',
        ivr_node_encrypt_md5: 'next',
        ivr_node_route: {
            ToPeerType: '满足条件',
            ToPeerTypeUnmatched: '不满足条件'
        },
        ivr_node_call_url: {
            NextPeerType: '成功',
            ToPeerTypeWhenTimeout: '超时'
        },
        ivr_node_voice_mail: 'next',
        ivr_node_satisfaction: 'next',
        ivr_node_superDialJobNum: {
            ToPeerTypeWhenFrontOffice: '按0前台转向',
            ToPeerTypeWhenEmpnoNotExist: '工号不存在',
            ToPeerTypeWhenEmpnoAgentBusy:'座席忙',
            ToPeerTypeWhenEmpnoLogoff: '网关未注册也未绑定手机'
        },
        ivr_node_ivr_menu: 'next',
        ivr_node_system: {
            ToPeerTypeWhenEmpnoNotExist: '工号不存在',
            ToPeerTypeWhenEmpnoAgentBusy: '座席忙',
            ToPeerTypeWhenEmpnoLogoff: '座席未登录'
        },
        ivr_node_queue: {
            ToPeerTypeWhenQueueEmpty: '技能组为空时',
            ToPeerTypeWhenWait: '正在等待时',
            ToPeerTypeWhenWaitTimeout: '等待超时',
            ToPeerTypeWhenHanguped: '通话结束'
        }
    },
    nodeName2ChineseName:{
        ivr_node_announcement: '播放语音节点',
        ivr_node_text_announcement: '播放文本节点',
        ivr_node_ivr: '按键菜单节点',
        ivr_node_validation: '采集输入节点',
        ivr_node_assignment: '赋值节点',
        ivr_node_encrypt_md5: 'MD5加密节点',
        ivr_node_route: '按变量路由节点',
        ivr_node_call_url: 'CallUrl节点',
        ivr_node_voice_mail: '留言节点',
        ivr_node_room: '会议室节点',
        ivr_node_satisfaction: '自定义满意度节点',
        ivr_node_extension_peer: '自定义节点',
        ivr_node_superDialJobNum: '采集工号并拨打节点',
        ivr_node_ivr_menu: '转IVR菜单节点',
        system: {
            0: '挂机', //挂机
            1: '满意度调查', //满意度调查
            2: '拨打工号'  //拨打工号
        },
        ivr_node_system: '拨打工号',
        ivr_node_queue: '技能组',
        account_user: '座席'
    },
    nodeType2Font:{
        ivr_node_announcement: 'fa:fa-volume-up',
        ivr_node_text_announcement: 'fa:fa-file-audio-o',
        ivr_node_ivr: 'fa:fa-building-o',
        ivr_node_validation: 'fa:fa-retweet',
        ivr_node_assignment: 'fa:fa-files-o',
        ivr_node_encrypt_md5: 'fa:fa-shield',
        ivr_node_route: 'fa:fa-random',
        ivr_node_call_url: 'fa:fa-volume-control-phone',
        ivr_node_voice_mail: 'fa:fa-envelope-o',
        ivr_node_room: 'fa:fa-home',
        ivr_node_satisfaction: 'fa:fa-heartbeat',
        ivr_node_extension_peer: 'fa:fa-tags',
        ivr_node_superDialJobNum: 'fa:fa-phone',
        ivr_node_ivr_menu: 'fa:fa-deaf',
        ivr_node_system: 'fa:fa-phone',
        ivr_node_queue: 'fa:fa-users',
        account_user: 'fa:fa-user',
        system: {
            0: 'fa:fa-lock', //挂机
            1: 'fa:fa-heart', //满意度调查
            2: 'fa:fa-phone'  //拨打工号
        }
    },
    vars:{

    },
    logic:{
        and: '并且',
        or: '或者'
    },
    operation:{
        0: '前缀匹配',
        1: '后缀匹配',
        2: '等于'
    },
    queryIvrProcessList: function(data,src){
        var container = $("#ivrProcessListPanel");
        var condition = {};
        var DisplayName = "";
        if(data && data.DisplayName == ""){
            DisplayName = data.DisplayName;
        }else{
            DisplayName = $('#ivr_process_query').val();
        }
        if(src){
            condition.page = src.attr("value") || 1;
        }else{
            condition.page = 1;
        }
        if(DisplayName){
            condition.DisplayName = DisplayName;
        }
        condition.limit = handler.config.ivrProcess.pageSize;
        if(handler.config.callConfig.currentConfigData){
            condition.PBX = handler.config.callConfig.currentConfigData.PBX;
        }
        var formID = "ivrProcess_query_frm";
        var action = {
            action: 'config.ivr.process.queryIvrProcessList',
            data: condition
        };
        DS.send(action, function (response) {
            if (response.success) {
                var ivrProcesses = response.list;
                var html = [];
                DS.getView('config/callConfig/process/process_list', function (list_view) {
                    container.html(list_view);
                    DS.getView('config/callConfig/process/process_list_item',function(item_view){
                        for (var i = 0; i < ivrProcesses.length; i++) {
                            var ivrProcess = ivrProcesses[i];
                            html.push(DS.renderMethodViewNew(item_view,ivrProcess));
                        }
                      container.find('#ivrProcessList').html(html.join(""));
                      DS.updatePagination(formID, response.count, handler.config.ivrProcess.pageSize, condition.page);
                      if(DisplayName){
                          $('#ivr_process_query').val(DisplayName);
                      }
                  });
                });
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    addIvrProcess:function(data,src){
        var container = $("#ivrProcessPanel");
        container.siblings().removeClass('active');
        container.addClass('active');
        DS.getView('config/callConfig/process/process_add',function(view){
            container.html(view);
            var ivrToPeerType = $('.ds_ivr_to_peer_type', container);
            if (ivrToPeerType.length > 0) {
                handler.config.callConfig.renderToPeerType(ivrToPeerType, container);
            }
            handler.config.ivrProcess.renderFlowChart();
        });
    },
    saveIvrProcess:function(data,src){
        if(data.FirstNode == ""){
            $().alertmessage('showError', "请选择具体的节点信息");
            return;
        }
        var extraData = handler.config.callConfig.currentConfigData;
        if (extraData) {
            $.extend(data, extraData);
        }
        data.CreateUser = session.user._id;
        var action = {
            action: "config.ivr.process.saveIvrProcess",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var cacheData = {};
                cacheData.method = 'add';
                cacheData.data = rep.data;
                handler.config.ivrProcess.updateClientData(cacheData);
                var condition = {};
                condition.DisplayName = "";
                handler.config.ivrProcess.returnIvrProcessList(condition);
                $().alertmessage('showSuccess', "保存IVR流程成功");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showIvrProcessEditView:function(data,src){
        var conditions = {};
        conditions._id = data;
        var container = $("#ivrProcessPanel");
        var action = {
            action: 'config.ivr.process.queryIvrProcessById',
            data: conditions
        };
        DS.send(action, function (response) {
            if (response.success) {
                container.siblings().removeClass('active');
                container.addClass('active');
                DS.getView('config/callConfig/process/process_edit',function(view){
                    var resultView = DS.renderMethodViewNew(view,response.data);
                    container.html(resultView);
                    var ivrToPeerType = $('.ds_ivr_to_peer_type', container);
                    if (ivrToPeerType.length > 0) {
                        handler.config.callConfig.renderToPeerType(ivrToPeerType, container);
                    }
                    handler.config.ivrProcess.renderFlowChart();
                });
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    updateIvrProcess:function(data,src){
        if(data.FirstNode == ""){
            $().alertmessage('showError', "请选择具体的节点信息");
            return;
        }
        var extraData = handler.config.callConfig.currentConfigData;
        if (extraData) {
            $.extend(data, extraData);
        }
        var action = {
            action: "config.ivr.process.updateIvrProcess",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var cacheData = {};
                cacheData.method = 'update';
                cacheData.data = rep.data;
                handler.config.ivrProcess.updateClientData(cacheData);
                /**更新session对象中日程的缓存**/
                if(rep.param.data.length>0){
                    for(var i=0;i<rep.param.data.length;i++){
                        var scheduleParam = {
                            type: rep.param.type,
                            operation: rep.param.operation,
                            data: rep.param.data[i]
                        };
                        handler.config.callConfig.updateClientData(scheduleParam);
                    }
                }
                handler.config.ivrProcess.returnIvrProcessList();
                $().alertmessage('showSuccess', "保存IVR流程成功");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    delIvrProcess:function(data,src){
        var con = confirm("确定要删除该流程吗？");
        if (!con) {
            return false;
        }
       var action = {
            action: 'config.ivr.process.delIvrProcess',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var cacheData = {};
                cacheData.method = 'del';
                cacheData.data = response.data;
                handler.config.ivrProcess.updateClientData(cacheData);
                handler.config.ivrProcess.returnIvrProcessList();
                $().alertmessage('showSuccess', "删除IVR流程成功");
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    returnIvrProcessList: function(data,src){
        var container = $("#ivrProcessListPanel");
        container.siblings().removeClass('active');
        container.addClass('active');
        handler.config.ivrProcess.queryIvrProcessList(data);
    },
    /**
     * 放大IVR流程图
     * @param data
     * @param src
     */
    clearFlowChart:function(data,src){
        $("#flowChartModal").remove();
        var continer = $("#process_modal");
        DS.getView('config/callConfig/process/process_modal',function(view){
            continer.html(view);
            var mermaidholder = document.getElementById('mermaidModalHolder');
            var mermaidnode = document.createElement('div');
            mermaidnode.className = 'mermaid';
            var width = 200;
            if(handler.config.ivrProcess.textLength*30>200){
                width = handler.config.ivrProcess.textLength*30;
            }
            mermaidnode.style.height = width+'px';
            mermaidnode.appendChild(document.createTextNode(handler.config.ivrProcess.textCode));
            mermaidholder.appendChild(mermaidnode);
            mermaid.init();
            $("#flowChartModal").dialog({ maxHeight:700,maxWidth:1500,minHeight:300,minWidth:600 });
            $('.ui-dialog-titlebar-close').addClass('ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close');
            $('.ui-dialog-titlebar-close').html('<span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span><span class="ui-button-text">close</span>');
        });
    },
    renderFlowChart:function(data,src){
        var ivr = session.ivrMap.ivr;
        var self = handler.config.ivrProcess;

        for(var i in ivr.vars){
            self.vars[ivr.vars[i].VarName] = ivr.vars[i].Memo;
        }

        var nodeType = $('#firstNodeType').find('select').val();
        var nodeExten = $('#firstNode').find('select').val();

        if(nodeType == 'system' && nodeExten == '2'){
            nodeType = 'ivr_node_system';
        }

        var nodeArr = new Array();
        var nodeObj = new Object();
        nodeObj.nodeType = nodeType;
        nodeObj.nodeExten = nodeExten;
        nodeArr.push(nodeObj);

        var existNodeArr = new Array();

        self.textCode = '';
        self.textLength = 0;
        self.processNode(nodeArr,existNodeArr,true);

        var mermaidholder = document.getElementById('mermaidholder');
        while (mermaidholder.firstChild) {
            mermaidholder.removeChild(mermaidholder.firstChild);
        }
        var mermaidnode = document.createElement('div');
        mermaidnode.className = 'mermaid';
        mermaidnode.appendChild(document.createTextNode(self.textCode));
        mermaidholder.appendChild(mermaidnode);
        mermaid.init();
        handler.config.ivrProcess.emptyNodeType();
        handler.config.ivrProcess.emptyPanel();
    },
    /**
     * 递归生成IVR流程图文本串
     * @param
     * @param existNodeArr
     * @param isStartNode
     * @param preNodeCode
     */
    processNode: function(nodes,existNodeArr,isStartNode,preNodeCode){
        var ivr = session.ivrMap.ivr;
        var self = handler.config.ivrProcess;

        for(var key in nodes){
            var nodeType = nodes[key].nodeType;
            var nodeExten = nodes[key].nodeExten;

            if(nodeType && nodeExten){
                if(nodeType == 'system' && nodeExten == '2'){
                    nodeType = 'ivr_node_system';
                }
                var peerCondition = "";
                if(nodes[key].peerCondition){
                    peerCondition = nodes[key].peerCondition  == 'next' ? '' : '--' +nodes[key].peerCondition;
                }
                var nodeAlias = "";
                var nodeName = "";
                var nodeCode = "";
                var nodeFont = "";
                var unicodeName = "";
                var currentNode = null;
                var nextNodeArr = new Array();


                if(nodeType == 'system'){
                    nodeAlias = self.nodeName2Alias[nodeType][nodeExten];
                    nodeFont = self.nodeType2Font[nodeType][nodeExten];
                }else{
                    nodeAlias = self.nodeName2Alias[nodeType];
                    nodeFont = self.nodeType2Font[nodeType];
                }

                if(isStartNode){
                    existNodeArr.push(nodeAlias+":"+nodeExten);
                    if(nodeType == "account_user"){
                        for(var i in ivr[nodeType]){
                            if(nodeExten == ivr[nodeType][i]._id){
                                currentNode = ivr[nodeType][i];
                                nodeExten = currentNode.exten;
                                nodeName = currentNode.displayName;
                                if(nodeName.length>5){
                                    for(var x = 0; x < 5; x++){
                                        unicodeName += '&#' + nodeName.charCodeAt(x);
                                    }
                                    nodeName = unicodeName + '..';
                                }else{
                                    for(var y = 0; y < nodeName.length; y++){
                                        unicodeName += '&#' + nodeName.charCodeAt(y);
                                    }
                                    nodeName = unicodeName;
                                }
                                break;
                            }
                        }
                        if(currentNode){
                            nodeCode = nodeAlias + "-" + nodeExten;
                            self.textCode +=  'graph LR\n' + nodeCode + '((' + nodeFont + ' ' + nodeName + '))\n';
                            self.textLength ++;
                        }
                    }else{
                        for(var i in ivr[nodeType]){
                            if(nodeExten == ivr[nodeType][i].Exten){
                                currentNode = ivr[nodeType][i];
                                nodeName = currentNode.DisplayName;
                                break;
                            }
                        }
                        if(currentNode){
                            if(nodeType == 'ivr_node_system'){
                                nodeName = '拨打工号';
                            }
                          /*  if(nodeName.length>5){
                                nodeName = nodeName.substring(0,5) + '..';
                            }*/
                            if(nodeName.length>5){
                                for(var x = 0; x < 5; x++){
                                    unicodeName += '&#' + nodeName.charCodeAt(x);
                                }
                                nodeName = unicodeName + '..';
                            }else{
                                for(var y = 0; y < nodeName.length; y++){
                                    unicodeName += '&#' + nodeName.charCodeAt(y);
                                }
                                nodeName = unicodeName;
                            }
                            nodeCode = nodeAlias + "-" + nodeExten;
                            self.textCode += 'graph LR\n' + nodeCode + '((' + nodeFont + ' ' + nodeName + '))\n';
                            self.textLength ++;

                            if(nodeType == "ivr_node_system"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerTypeWhenEmpnoNotExist;
                                nextNodeObj.nodeExten = currentNode.ToPeerWhenEmpnoNotExist;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoNotExist;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenEmpnoAgentBusy;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenEmpnoAgentBusy;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoAgentBusy;
                                var nextNodeObj2 = new Object();
                                nextNodeObj2.nodeType = currentNode.ToPeerTypeWhenEmpnoLogoff;
                                nextNodeObj2.nodeExten = currentNode.ToPeerWhenEmpnoLogoff;
                                nextNodeObj2.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoLogoff;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                nextNodeArr.push(nextNodeObj2);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_announcement" || nodeType == "ivr_node_text_announcement" ||
                                nodeType == "ivr_node_assignment" || nodeType == "ivr_node_voice_mail"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerType;
                                nextNodeObj.nodeExten = currentNode.ToPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType];
                                nextNodeArr.push(nextNodeObj);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_encrypt_md5" || nodeType == "ivr_node_satisfaction" ||
                                nodeType == "ivr_node_ivr_menu"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.NextPeerType;
                                nextNodeObj.nodeExten = currentNode.NextPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType];
                                nextNodeArr.push(nextNodeObj);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_validation"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerType;
                                nextNodeObj.nodeExten = currentNode.ToPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerType;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenWaitTimeout;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenWaitTimeout;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenWaitTimeout;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_call_url"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.NextPeerType;
                                nextNodeObj.nodeExten = currentNode.NextPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].NextPeerType;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenTimeout;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenTimeout;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenTimeout;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_ivr"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                self.textCode += nodeCode + '-->' + nodeAlias + '-' + 'V' + '-'+ nodeExten + '{按键}\n';
                                nodeCode = nodeAlias + '-' + 'V' + '-'+ nodeExten;
                                existNodeArr.push(nodeCode);
                                for(var j in currentNode.IvrKeys){
                                    var nextNodeObj = new Object();
                                    nextNodeObj.nodeType = currentNode.IvrKeys[j].ToPeerType;
                                    nextNodeObj.nodeExten = currentNode.IvrKeys[j].ToPeer;
                                    nextNodeObj.peerCondition = currentNode.IvrKeys[j].Key;
                                    nextNodeArr.push(nextNodeObj);
                                }
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_route"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var validateText = "变量路由";
                                /*for(var k in currentNode.Routes){
                                    validateText += self.vars[currentNode.Routes[k].VarName] + self.operation[currentNode.Routes[k].Operation]
                                        + currentNode.Routes[k].Value + self.logic[currentNode.Routes[k].Logic]+" ";
                                }*/
                                self.textCode += nodeCode + '-->' + nodeAlias + '-' + 'V' + '-'+ nodeExten + '{' + validateText + '}\n';
                                nodeCode = nodeAlias + '-' + 'V' + '-'+ nodeExten;
                                existNodeArr.push(nodeCode);
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerType;
                                nextNodeObj.nodeExten = currentNode.ToPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerType;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeUnmatched;
                                nextNodeObj1.nodeExten = currentNode.ToPeerUnmatched;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeUnmatched;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_superDialJobNum"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerTypeWhenFrontOffice;
                                nextNodeObj.nodeExten = currentNode.ToPeerWhenFrontOffice;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenFrontOffice;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenEmpnoNotExist;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenEmpnoNotExist;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoNotExist;
                                var nextNodeObj2 = new Object();
                                nextNodeObj2.nodeType = currentNode.ToPeerTypeWhenEmpnoAgentBusy;
                                nextNodeObj2.nodeExten = currentNode.ToPeerWhenEmpnoAgentBusy;
                                nextNodeObj2.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoAgentBusy;
                                var nextNodeObj3 = new Object();
                                nextNodeObj3.nodeType = currentNode.ToPeerTypeWhenEmpnoLogoff;
                                nextNodeObj3.nodeExten = currentNode.ToPeerWhenEmpnoLogoff;
                                nextNodeObj3.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoLogoff;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                nextNodeArr.push(nextNodeObj2);
                                nextNodeArr.push(nextNodeObj3);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_queue"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                 '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerTypeWhenQueueEmpty;
                                nextNodeObj.nodeExten = currentNode.ToPeerWhenQueueEmpty;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenQueueEmpty;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenWait;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenWait;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenWait;
                                var nextNodeObj2 = new Object();
                                nextNodeObj2.nodeType = currentNode.ToPeerTypeWhenWaitTimeout;
                                nextNodeObj2.nodeExten = currentNode.ToPeerWhenWaitTimeout;
                                nextNodeObj2.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenWaitTimeout;
                                var nextNodeObj3 = new Object();
                                nextNodeObj3.nodeType = currentNode.ToPeerTypeWhenHanguped;
                                nextNodeObj3.nodeExten = currentNode.ToPeerWhenHanguped;
                                nextNodeObj3.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenHanguped;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                nextNodeArr.push(nextNodeObj2);
                                nextNodeArr.push(nextNodeObj3);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_room" || nodeType == "ivr_node_extension_peer"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                            }
                        }
                    }
                }else if(existNodeArr.indexOf(nodeAlias + ":" + nodeExten) == -1) {
                    existNodeArr.push(nodeAlias + ":" + nodeExten);
                    if(nodeType == "account_user") {
                        for (var i in ivr[nodeType]) {
                            if (nodeExten == ivr[nodeType][i]._id) {
                                currentNode = ivr[nodeType][i];
                                nodeExten = currentNode.exten;
                                nodeName = currentNode.displayName;
                               /* if(nodeName.length>5){
                                    nodeName = nodeName.substring(0,5) + '..';
                                }*/
                                if(nodeName.length>5){
                                    for(var x = 0; x < 5; x++){
                                        unicodeName += '&#' + nodeName.charCodeAt(x);
                                    }
                                    nodeName = unicodeName + '..';
                                }else{
                                    for(var y = 0; y < nodeName.length; y++){
                                        unicodeName += '&#' + nodeName.charCodeAt(y);
                                    }
                                    nodeName = unicodeName;
                                }
                                break;
                            }
                        }
                        if(currentNode){
                            nodeCode = nodeAlias + "-" + nodeExten;
                            self.textCode += preNodeCode + peerCondition + '-->' + nodeCode + '(' + nodeFont + ' ' + nodeName + ')\n';
                            self.textLength ++;
                        }
                    }else{
                        for(var i in ivr[nodeType]){
                            if(nodeExten == ivr[nodeType][i].Exten){
                                currentNode = ivr[nodeType][i];
                                nodeName = currentNode.DisplayName;
                                break;
                            }
                        }

                        if(currentNode){
                            if(nodeType == 'ivr_node_system'){
                                nodeName = '拨打工号';
                            }
                           /* if(nodeName.length>5){
                                nodeName = nodeName.substring(0,5) + '..';
                            }*/
                            if(nodeName.length>5){
                                for(var x = 0; x < 5; x++){
                                    unicodeName += '&#' + nodeName.charCodeAt(x);
                                }
                                nodeName = unicodeName + '..';
                            }else{
                                for(var y = 0; y < nodeName.length; y++){
                                    unicodeName += '&#' + nodeName.charCodeAt(y);
                                }
                                nodeName = unicodeName;
                            }
                            nodeCode = nodeAlias + "-" + nodeExten;
                            if(nodeType == "ivr_node_queue"){
                                self.textCode += preNodeCode + peerCondition + '-->' + nodeCode + '(' + nodeFont + ' ' + nodeName + ')\n';
                            }else{
                                self.textCode += preNodeCode + peerCondition + '-->' + nodeCode + '[' + nodeFont + ' ' + nodeName + ']\n';
                            }
                            self.textLength ++;
                            if(nodeType == "ivr_node_system"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerTypeWhenEmpnoNotExist;
                                nextNodeObj.nodeExten = currentNode.ToPeerWhenEmpnoNotExist;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoNotExist;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenEmpnoAgentBusy;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenEmpnoAgentBusy;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoAgentBusy;
                                var nextNodeObj2 = new Object();
                                nextNodeObj2.nodeType = currentNode.ToPeerTypeWhenEmpnoLogoff;
                                nextNodeObj2.nodeExten = currentNode.ToPeerWhenEmpnoLogoff;
                                nextNodeObj2.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoLogoff;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                nextNodeArr.push(nextNodeObj2);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_announcement" || nodeType == "ivr_node_text_announcement" ||
                                nodeType == "ivr_node_assignment" || nodeType == "ivr_node_voice_mail"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerType;
                                nextNodeObj.nodeExten = currentNode.ToPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType];
                                nextNodeArr.push(nextNodeObj);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_encrypt_md5" || nodeType == "ivr_node_satisfaction" ||
                                nodeType == "ivr_node_ivr_menu"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.NextPeerType;
                                nextNodeObj.nodeExten = currentNode.NextPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType];
                                nextNodeArr.push(nextNodeObj);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_validation"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerType;
                                nextNodeObj.nodeExten = currentNode.ToPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerType;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenWaitTimeout;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenWaitTimeout;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenWaitTimeout;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_call_url"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.NextPeerType;
                                nextNodeObj.nodeExten = currentNode.NextPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].NextPeerType;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenTimeout;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenTimeout;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenTimeout;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_ivr"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                self.textCode += nodeCode + '-->' + nodeAlias + '-' + 'V' + '-'+ nodeExten + '{按键}\n';
                                nodeCode = nodeAlias + '-' + 'V' + '-'+ nodeExten;
                                existNodeArr.push(nodeCode);
                                for(var j in currentNode.IvrKeys){
                                    var nextNodeObj = new Object();
                                    nextNodeObj.nodeType = currentNode.IvrKeys[j].ToPeerType;
                                    nextNodeObj.nodeExten = currentNode.IvrKeys[j].ToPeer;
                                    nextNodeObj.peerCondition = currentNode.IvrKeys[j].Key;
                                    nextNodeArr.push(nextNodeObj);
                                }
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_route"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var validateText = "变量路由";
                               /* for(var k in currentNode.Routes){
                                    validateText += self.vars[currentNode.Routes[k].VarName] + self.operation[currentNode.Routes[k].Operation]
                                        + currentNode.Routes[k].Value + self.logic[currentNode.Routes[k].Logic]+" ";
                                }*/
                                self.textCode += nodeCode + '-->' + nodeAlias + '-' + 'V' + '-'+ nodeExten + '{' + validateText + '}\n';
                                nodeCode = nodeAlias + '-' + 'V' + '-'+ nodeExten;
                                existNodeArr.push(nodeCode);
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerType;
                                nextNodeObj.nodeExten = currentNode.ToPeer;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerType;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeUnmatched;
                                nextNodeObj1.nodeExten = currentNode.ToPeerUnmatched;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeUnmatched;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_superDialJobNum"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerTypeWhenFrontOffice;
                                nextNodeObj.nodeExten = currentNode.ToPeerWhenFrontOffice;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenFrontOffice;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenEmpnoNotExist;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenEmpnoNotExist;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoNotExist;
                                var nextNodeObj2 = new Object();
                                nextNodeObj2.nodeType = currentNode.ToPeerTypeWhenEmpnoAgentBusy;
                                nextNodeObj2.nodeExten = currentNode.ToPeerWhenEmpnoAgentBusy;
                                nextNodeObj2.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoAgentBusy;
                                var nextNodeObj3 = new Object();
                                nextNodeObj3.nodeType = currentNode.ToPeerTypeWhenEmpnoLogoff;
                                nextNodeObj3.nodeExten = currentNode.ToPeerWhenEmpnoLogoff;
                                nextNodeObj3.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenEmpnoLogoff;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                nextNodeArr.push(nextNodeObj2);
                                nextNodeArr.push(nextNodeObj3);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_queue"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                 '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                                var nextNodeObj = new Object();
                                nextNodeObj.nodeType = currentNode.ToPeerTypeWhenQueueEmpty;
                                nextNodeObj.nodeExten = currentNode.ToPeerWhenQueueEmpty;
                                nextNodeObj.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenQueueEmpty;
                                var nextNodeObj1 = new Object();
                                nextNodeObj1.nodeType = currentNode.ToPeerTypeWhenWait;
                                nextNodeObj1.nodeExten = currentNode.ToPeerWhenWait;
                                nextNodeObj1.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenWait;
                                var nextNodeObj2 = new Object();
                                nextNodeObj2.nodeType = currentNode.ToPeerTypeWhenWaitTimeout;
                                nextNodeObj2.nodeExten = currentNode.ToPeerWhenWaitTimeout;
                                nextNodeObj2.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenWaitTimeout;
                                var nextNodeObj3 = new Object();
                                nextNodeObj3.nodeType = currentNode.ToPeerTypeWhenHanguped;
                                nextNodeObj3.nodeExten = currentNode.ToPeerWhenHanguped;
                                nextNodeObj3.peerCondition = self.node2PeerCondition[nodeType].ToPeerTypeWhenHanguped;
                                nextNodeArr.push(nextNodeObj);
                                nextNodeArr.push(nextNodeObj1);
                                nextNodeArr.push(nextNodeObj2);
                                nextNodeArr.push(nextNodeObj3);
                                self.processNode(nextNodeArr,existNodeArr,false,nodeCode);
                            }else if(nodeType == "ivr_node_room" || nodeType == "ivr_node_extension_peer"){
                                self.textCode += 'click ' + nodeCode + ' handler.config.ivrProcess.showNodeDetail ' +
                                    '"'+self.nodeName2ChineseName[nodeType]+'"\n';
                            }
                        }
                    }

                }else{
                    if(nodeType == "account_user") {
                        for (var i in ivr[nodeType]) {
                            if (nodeExten == ivr[nodeType][i]._id) {
                                currentNode = ivr[nodeType][i];
                                nodeExten = currentNode.exten;
                                break;
                            }
                        }
                        if(currentNode){
                            nodeCode = nodeAlias + "-" + nodeExten;
                            self.textCode += preNodeCode + peerCondition + '-->' + nodeCode + '\n';
                            self.textLength ++;
                        }
                    }else{
                        for(var i in ivr[nodeType]){
                            if(nodeExten == ivr[nodeType][i].Exten){
                                currentNode = ivr[nodeType][i];
                                break;
                            }
                        }
                        if(currentNode){
                            nodeCode = nodeAlias + "-" + nodeExten;
                            self.textCode += preNodeCode + peerCondition + '-->' + nodeCode + '\n';
                            self.textLength ++;
                        }
                    }
                }
            }
        }

    },
    showNodeDetail: function(event){
        var ivr = session.ivrMap.ivr;
        var self = handler.config.ivrProcess;
        var alias = event.substring(0,1);
        var exten = '';
        var _id = '';
        if(alias == 'O'){
            exten = '2';
        }else{
            exten = event.substring(2);
        }
        var type = self.alias2Node[alias].type;
        var fileName = self.alias2Node[alias].fileName;
        for(var i in ivr[type]){
            if(exten == ivr[type][i].Exten){
                _id = ivr[type][i]._id;
                break;
            }
        }
        var clickId = event + '-ivrProcessClick'
        var virtualClick = $('#virtualClick');
        var viewHtml = '<div class="ds_action_flow" id="' + clickId + '">' +
            '<ds-get-view view="config/callConfig/' + fileName + '" panel="node_panel" alias= "'+ alias +'" ' +
            'view-data="{&quot;_id&quot;:&quot;' + _id + '&quot;}">' +
            '</ds-get-view></div>';
        virtualClick.html(viewHtml);
        $('#'+clickId).trigger("click");
        virtualClick.empty();
    },
    /**
     * 0 save
     * 1 save delete
     * 2 save delete edit(按键配置)
     * @param buttonType
     */
    processButton: function(buttonType){
        if(buttonType == '0'){
            $('#node_panel').find('.btn-info').find('ds-get-view').attr('source','ivrProcessSave');
        }else if(buttonType == '1'){
            $('#node_panel').find('.btn-info').find('ds-get-view').attr('source','ivrProcessSave');
            $('#node_panel').find('.btn-danger').find('ds-get-view').attr('source','ivrProcessDel');
        }else if(buttonType == '2'){
            $('#node_panel').find('.btn-info').find('ds-get-view').attr('source','ivrProcessSave');
            $('#node_panel').find('.btn-warning').find('ds-get-view').attr('source','ivrProcessEdit');
            $('#node_panel').find('.btn-warning').find('ds-get-view').attr('panel','node_panel');
            $('#node_panel').find('.btn-danger').find('ds-get-view').attr('source','ivrProcessDel');
        }else if(buttonType == '3'){
            $('#node_panel').find('.btn-info').find('ds-get-view').attr('source','ivrProcessAddSave');
        }
    },

    /**
     * 新增节点后，更新页面开始节点下拉框
     */
    refreshNodeMenu: function(){
        var container = $('#frm_ivrProcess_add');
        var nodeType = $('#firstNodeType').find('select').val();
        var nodeExten = $('#firstNode').find('select').val();
        var dom = container.find('.ds_item_edit_param');
        dom.attr('firstNodeType',nodeType);
        dom.attr('firstNode',nodeExten);
        var ivrToPeerType = $('.ds_ivr_to_peer_type', container);
        if (ivrToPeerType.length > 0) {
            handler.config.callConfig.renderToPeerType(ivrToPeerType, container);
        }
        handler.config.ivrProcess.emptyNodeType();
    },

    /**
     * 清除class为ds_item_edit_param的默认选中的下拉框值
     */
    emptyNodeType: function(){
        var container = $('#frm_ivrProcess_add');
        var dom = container.find('.ds_item_edit_param');
        dom.attr('firstNodeType','');
        dom.attr('firstNode','');
    },
    emptyPanel: function(){
        $('#ivrIvrNodePanel').empty();
        $('#ivrRouteNodePanel').empty();
        $('#ivrAssignmentNodePanel').empty();
    },
    updateClientData: function(param){
        var ivr = session.ivrMap.ivr;
        if(param.method == 'add'){
            ivr.ivr_process.push(param.data);
        }else if(param.method == 'update'){
            for(var i in ivr.ivr_process){
                if(param.data._id == ivr.ivr_process[i]._id){
                    ivr.ivr_process[i].DisplayName = param.data.DisplayName;
                    ivr.ivr_process[i].FirstNodeType = param.data.FirstNodeType;
                    ivr.ivr_process[i].FirstNode = param.data.FirstNode;
                    ivr.ivr_process[i].UpdateTime = param.data.UpdateTime;
                    break;
                }
            }
        }else if(param.method == 'del'){
            for(var i in ivr.ivr_process){
                if(param.data._id == ivr.ivr_process[i]._id){
                    ivr.ivr_process.splice(i,1);
                    break;
                }
            }
        }
    }
}