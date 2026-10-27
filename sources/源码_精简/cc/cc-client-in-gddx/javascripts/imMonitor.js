/**
 * Created by chenguang on 11/13/15.
 */
var im_accessNos = {};
var im_agents = {};
var im_queues = {};
var _im_queue_index = 0;
var _im_accessNo_index = 0;
function _im_monitor_init() {
    var agents = getCache('agents');
    for(var i=0;i<agents.length;i++){
        agents[i].claim = 0;
        agents[i].dealing = 0;
        agents[i].autoClaim = undefined;
        agents[i].mailAutoClaim = undefined;//邮件开关
        im_agents[agents[i]._id] = agents[i];
    }
    var config = getCache('webchatAndSdkConfig');
    for(var i=0;i<config.length;i++){
        if(config[i].nick_name){
            //如果是微信,特殊处理,因为字段名不同
            config[i].accessId = config[i]._id;
            config[i].name = config[i].nick_name;
            config[i].platform = 'weixin';
            config[i].ToPeer = config[i].to_peer;
            im_accessNos[config[i]._id] = config[i];
        }else{
            im_accessNos[config[i].accessId] = config[i];
        }
    }
    if(im_accessNos) {
        $.each(im_accessNos, function(key, item){
            if(!item)
                return true;
            item.newSession = 0;
            item.accessSession = 0;
            item.closeSession = 0;
            item.robotSession = 0;
            item.manualSession = 0;
            item.robotToManualSession = 0;
            var curRow = $("#monitor_im_accessNo_" + key);
            if(curRow.html() == null) {
                _im_monitor_createRow(item, 'accessNo');
            } else {
                _im_monitor_updateRow(item, curRow, 'accessNo')
            }
        })
    }
    _im_monitor_initAgentAndQueue();
}

function _im_monitor_initAgentAndQueue() {
    var action = {
        action: 'app.monitor.getPushOnlineAgentAndDealingCount',
        data: {}
    }
    DS.send(action, function(res){
        if(res.success){
            for(var i=0 ;i<res.onlineList.length;i++){
                if('status' in res.onlineList[i]){
                    if(res.onlineList[i].status == 'close'){
                        im_agents[res.onlineList[i]._id].autoClaim = false;
                    }else{
                        im_agents[res.onlineList[i]._id].autoClaim = true;
                    }
                }else{
                    im_agents[res.onlineList[i]._id].autoClaim = true;
                }
                if('emailStatus' in res.onlineList[i]){
                    if(res.onlineList[i].emailStatus == 'close'){
                        im_agents[res.onlineList[i]._id].mailAutoClaim = false;
                    }else{
                        im_agents[res.onlineList[i]._id].mailAutoClaim = true;
                    }
                }else{
                    im_agents[res.onlineList[i]._id].mailAutoClaim = false;
                }
                _im_monitor_onPeerChanged(im_agents[res.onlineList[i]._id]);
            }
            for(var i=0 ;i<res.dealList.length;i++){
                if(im_agents[res.dealList[i]._id]){
                    im_agents[res.dealList[i]._id].dealing = res.dealList[i].count;
                    _im_monitor_onPeerChanged(im_agents[res.dealList[i]._id]);
                }
            }
            //queue table init need agentData so in there init queues.
            var imQueues = getCache('mailQueues');
            for(var i=0;i<imQueues.length;i++){
                imQueues[i].manualSession = 0;
                imQueues[i].waitClaim = 0;
                im_queues[imQueues[i].Exten] = imQueues[i];
                _im_monitor_onQueueChanged(imQueues[i]);
            }
            for(var i=0 ;i<res.queueAccessList.length;i++){
                if(im_queues[res.queueAccessList[i]._id]){
                    im_queues[res.queueAccessList[i]._id].manualSession = res.queueAccessList[i].accessCount;
                    _im_monitor_onQueueChanged(im_queues[res.queueAccessList[i]._id]);
                }
            }
            for(var i=0 ;i<res.queueUndealList.length;i++){
                if(im_queues[res.queueUndealList[i]._id]){
                    im_queues[res.queueUndealList[i]._id].waitClaim = res.queueUndealList[i].undealCount;
                    _im_monitor_onQueueChanged(im_queues[res.queueUndealList[i]._id]);
                }
            }
        }
        _im_monitor_initAccessNo();
    });
}

function _im_monitor_initAccessNo(){
    var action = {
        action: 'monitor.queryMonitorInitData',
        data: {account:session.user.account}
    };
    DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
        if(res.success){
            for(var i=0 ; i<res.agentList.length ;i++){
                im_agents[res.agentList[i]._id].claim = res.agentList[i].count;
                _im_monitor_onPeerChanged(im_agents[res.agentList[i]._id]);
            }
            for(var i=0 ; i<res.accessList.length ;i++){
                var accessId = res.accessList[i].accessId;
                if(im_accessNos[accessId]){
                    if('totalSessionCount' in res.accessList[i])
                        im_accessNos[accessId].newSession = res.accessList[i].totalSessionCount;
                    if('accessSessionCount' in res.accessList[i])
                        im_accessNos[accessId].accessSession = res.accessList[i].accessSessionCount;
                    if('finishSessionCount' in res.accessList[i])
                        im_accessNos[accessId].closeSession = res.accessList[i].finishSessionCount;
                    if('robotSessionCount' in res.accessList[i])
                        im_accessNos[accessId].robotSession = res.accessList[i].robotSessionCount;
                    if('manualSessionCount' in res.accessList[i])
                        im_accessNos[accessId].manualSession = res.accessList[i].manualSessionCount;
                    if('robotToManualSessionCount' in res.accessList[i])
                        im_accessNos[accessId].robotToManualSession = res.accessList[i].robotToManualSessionCount;
                    _im_monitor_onAccessNoChanged(im_accessNos[accessId]);
                }
            }
        }
    });
}


function im_monitor_eventProcess(event){
    event = event.Data;
    if(event.im_monitor_type == 'accessNo'){
        if(!im_accessNos[event.accessId]){
            getCache('webchatAndSdkConfig',null,true);
            var curAccess = getCacheByKey('webchatAndSdkConfig','accessId',event.accessId);
            if(curAccess){
                if(curAccess.nick_name){
                    curAccess.accessId = curAccess._id;
                    curAccess.name = curAccess.nick_name;
                    curAccess.platform = 'weixin';
                    curAccess.ToPeer = curAccess.to_peer;
                    im_accessNos[curAccess._id] = curAccess;
                }else{
                    im_accessNos[curAccess.accessId] = curAccess;
                }
            }
        }
        if(!im_accessNos[event.accessId]){
            var accessNo = {
                accessId: event.accessId,
                newSession: event.newSession,
                accessSession: event.accessSession,
                closeSession: event.closeSession,
                robotSession: event.robotSession,
                manualSession: event.manualSession,
                robotToManualSession: event.robotToManualSession
            };
            im_accessNos[event.accessId] = accessNo;
        } else {
            var accessNo = im_accessNos[event.accessId];
            accessNo.newSession = event.newSession;
            accessNo.accessSession = event.accessSession;
            accessNo.closeSession = event.closeSession;
            accessNo.robotSession = event.robotSession;
            accessNo.manualSession = event.manualSession;
            accessNo.robotToManualSession = event.robotToManualSession;
        }
        _im_monitor_onAccessNoChanged(accessNo);
    }else if(event.im_monitor_type == 'agent'){
        var autoClaimChangeFlag = false;
        if(!im_agents[event._id]){
            var agent = {
                _id: event._id,
                claim: event.claim,
                dealing: event.dealing,
                autoClaim: event.autoClaim
            };
            im_agents[event._id] = agent;
            autoClaimChangeFlag = true;
        } else {
            var agent = im_agents[event._id];
            if(event.autoClaim != agent.autoClaim){
                autoClaimChangeFlag = true;
            }
            agent.claim = event.claim;
            agent.dealing = event.dealing;
            agent.autoClaim = event.autoClaim;
        }
        _im_monitor_onPeerChanged(agent);
        if(autoClaimChangeFlag){
            _im_monitor_queueAgentsAutoClaimChanged(agent);
        }
    }else if(event.im_monitor_type == 'queue'){
        if(!im_queues[event.queueExten]){
            getCache('mailQueues',null,true);
            var curQueue = getCacheByKey('mailQueues','Exten',event.queueExten);
            if(curQueue){
                im_queues[curQueue.Exten] = curQueue;
            }
        }
        if(im_queues[event.queueExten]){
            im_queues[event.queueExten].manualSession = event.manualSession;
            im_queues[event.queueExten].waitClaim = event.waitClaim;
            _im_monitor_onQueueChanged(im_queues[event.queueExten]);
        }
    }
}
function mail_monitor_eventProcess(event){
    event = event.Data;
    if(event.im_monitor_type == 'agent'){
        var autoClaimChangeFlag = false;
        var mailAutoClaimChangeFlag = false;
        if(!im_agents[event._id]){
            var agent = {
                _id: event._id,
                claim: event.claim,
                dealing: event.dealing,
                mailAutoClaim: event.mailAutoClaim//邮件开关
            };
            im_agents[event._id] = agent;
            mailAutoClaimChangeFlag = true;
        } else {
            var agent = im_agents[event._id];
            if(event.mailAutoClaim != agent.mailAutoClaim){
                mailAutoClaimChangeFlag = true;
            }
            agent.claim = event.claim;
            agent.dealing = event.dealing;
            agent.mailAutoClaim = event.mailAutoClaim;
        }
        _im_monitor_onPeerChanged(agent);
        if(mailAutoClaimChangeFlag){
            _im_monitor_queueAgentsAutoClaimChanged(agent);
        }
    }
}

function _im_monitor_onAccessNoChanged(monitorAccessNo) {
    if(!monitorAccessNo || !monitorAccessNo.accessId)
        return;
    var curRow = $("#monitor_im_accessNo_" + monitorAccessNo.accessId);
    if(curRow.html() == null) {
        _im_monitor_createRow(monitorAccessNo, 'accessNo');
    } else {
        _im_monitor_updateRow(monitorAccessNo, curRow, 'accessNo')
    }
    _cti_ui_monitoringOnImAccessChanged(monitorAccessNo)
}

function _im_monitor_onQueueChanged(monitorQueue) {
    if(!monitorQueue || !monitorQueue.Exten)
        return;
    var curRow = $("#monitor_im_queue_" + monitorQueue.Exten);
    if(im_queues[monitorQueue.Exten]){
        if(curRow.html() == null) {
            _im_monitor_createRow(monitorQueue, 'queue');
        } else {
            _im_monitor_updateRow(monitorQueue, curRow, 'queue')
        }
    }
}

function _im_monitor_onPeerChanged(monitorPeer){
    if(!monitorPeer || !monitorPeer._id)
        return;
    if(session.user.type != "admin" && session.user.scope.call != 'all'){
        var isFind = false;
        var lowUsers = session.user.moduleUsers.call;
        for(var i=0;i<lowUsers.length;i++){
            if(lowUsers[i] == monitorPeer._id){
                isFind = true;
                break;
            }
        }
        if(!isFind) return;
    }
    var curRow = $("#monitor_peer_" + monitorPeer._id);
    if(curRow.html() != null) {
        _im_monitor_updateRow(monitorPeer, curRow, 'userId')
    }
}

function _im_monitor_createRow(item, key) {
    if(key == 'accessNo') {
        var tdHtml = "";
        tdHtml += "<tr id=\"monitor_im_accessNo_"+ item.accessId+"\"><td>"+item.name+"（"+render.monitor.renderAccessNoTypeDispaly(item.platform)+"）</td><td>"+item.newSession+"</td><td>"+item.accessSession+"</td><td>"+item.closeSession+"</td></tr>";
        $('#monitor_im_accessNo > tbody:last').append(tdHtml);
    } else if(key == 'queue') {
        var tdHtml = "";
        tdHtml += "<tr id=\"monitor_im_queue_"+ item.Exten+"\"><td>"+item.DisplayName+"</td><td><span data-toggle='tooltip' data-placement='top' title='"+_im_monitor_getQueueAutoClaimAgents(item,true)+"'>"+_im_monitor_getQueueAutoClaimAgents(item)+"</span></td><td><span data-toggle='tooltip' data-placement='top' title='"+_im_monitor_getQueueAgents(item,true)+"'>"+_im_monitor_getQueueAgents(item)+"</span></td><td>"+item.waitClaim+"</td><td>"+item.manualSession+"</td></tr>";
        $('#monitor_im_queue > tbody:last').append(tdHtml);
        $("#monitor_im_queue").find("[data-toggle='tooltip']").tooltip();
    } else if(key == 'userId') {


    }
}

function _im_monitor_updateRow(item, curRow, key) {
    if(key == 'accessNo') {
        var tdHtml = "<td>"+item.name+"（"+render.monitor.renderAccessNoTypeDispaly(item.platform)+"）</td><td>"+item.newSession+"</td><td>"+item.accessSession+"</td><td>"+item.closeSession+"</td>";
        curRow.html(tdHtml);
    } else if(key == 'queue') {
        var tdHtml = "<td>"+item.DisplayName+"</td><td>"+_im_monitor_getQueueAutoClaimAgents(item)+"</td><td>"+_im_monitor_getQueueAgents(item)+"</td><td>"+item.waitClaim+"</td><td>"+item.manualSession+"</td></tr>";
        curRow.html(tdHtml);
    } else if(key == 'userId') {
        curRow.find(".im_monitor_agent_claim").html(item.claim);
        curRow.find(".im_monitor_agent_autoClaim").html(render.monitor.renderAutoClaimDispaly(item.autoClaim));
        curRow.find(".im_monitor_agent_mailAutoClaim").html(render.monitor.renderAutoClaimDispaly(item.mailAutoClaim));
        curRow.find(".im_monitor_agent_dealing").html(item.dealing);
    }
}

function _im_monitor_getQueueAgents(queue,new_flag){
    if(!queue.onlineAgents){
        _im_monitor_initQueueAgents(queue);
    }
    var str = '0';
    if(queue.onlineAgents.length >0){
        str = queue.onlineAgents.length+'(';
        for(var i=0;i<queue.onlineAgents.length;i++){
            str+=queue.onlineAgents[i].name;
            if(i != queue.onlineAgents.length-1)
                str+=',';
        }
        if(new_flag ){
            var array=str.split('(');
            var nstr=array[1];
            return nstr;
        }
        str+=')';
    }
    return str;
}

function _im_monitor_getQueueAutoClaimAgents(queue,new_flag){
    if(!queue.onlineAgents){
        _im_monitor_initQueueAgents(queue);
    }
    var autoCount = 0;
    var nameList = [];
    if(queue.onlineAgents.length >0){
        for(var i=0;i<queue.onlineAgents.length;i++){
            if(queue.onlineAgents[i].autoClaim || queue.onlineAgents[i].autoClaim == undefined){
                autoCount++;
                nameList.push(queue.onlineAgents[i].name);
            }
        }
        if(nameList.length > 0){
            var str = nameList.length+'(';
            for(var i=0;i<nameList.length;i++){
                str+=nameList[i];
                if(i != nameList.length-1)
                    str+=',';
            }
            if(new_flag ){
                var array=str.split('(');
                var nstr=array[1];
                return nstr;
            }
            str += ')';
            return str;
        }else{
            return '0';
        }
    }else{
        return '0';
    }
}

function _im_monitor_initQueueAgents(queue){
    var onlines=getCache("onlineChannelAgent");
    var resultList = [];
    for(var i=0;i<queue.AssignMembers.length;i++){
        var curId = queue.AssignMembers[i].agentID;
        for(var j=0;j<onlines.length;j++){
            var agent=onlines[j];
            if(agent._id == curId){
                var agentInfo = getCache("agents", curId);
                if(!agentInfo){
                    agentInfo = {displayName:''}
                }
                if(!agentInfo.displayName){
                    agentInfo.displayName = '';
                }
                var tmpAgent = {id:curId, name: agentInfo.displayName, autoClaim:im_agents[curId].autoClaim};
                resultList.push(tmpAgent);
            }
        }
    }
    queue.onlineAgents = resultList;
}

function _im_monitor_queueAgentsAutoClaimChanged(agent){
    $.each(im_queues, function(key, item){
        if(!item)
            return true;
        for(var i=0;i<item.onlineAgents.length;i++){
            if(item.onlineAgents[i].id == agent._id){
                item.onlineAgents[i].autoClaim = agent.autoClaim;
                item.onlineAgents[i].mailAutoClaim = agent.mailAutoClaim;
                _im_monitor_onQueueChanged(item);
                break;
            }
        }
    });
}

function _im_monitor_queueAgentsOnlineChanged(agentId, operate){
    if(operate == 'add'){
        $.each(im_queues, function(key, item){
            if(!item)
                return true;
            for(var i=0;i<item.AssignMembers.length;i++){
                if(item.AssignMembers[i].agentID == agentId){
                    var agentInfo = getCache("agents", agentId);
                    if(!agentInfo){
                        agentInfo = {displayName:''}
                    }
                    if(!agentInfo.displayName){
                        agentInfo.displayName = '';
                    }
                    var tmpAgent = {id: agentId, name: agentInfo.displayName, autoClaim:im_agents[agentId].autoClaim};
                    if(item.onlineAgents){
                        item.onlineAgents.push(tmpAgent);
                    }else{
                        item.onlineAgents = [item.onlineAgents];
                    }
                    _im_monitor_onQueueChanged(item);
                    break;
                }
            }
        });
    }else{
        $.each(im_queues, function(key, item){
            if(!item)
                return true;
            var delIndex = -1;
            for(var i=0;i<item.onlineAgents.length;i++){
                if(item.onlineAgents[i].id == agentId){
                    delIndex = i;
                    break;
                }
            }
            if(delIndex != -1){
                item.onlineAgents.splice(i,1);
                _im_monitor_onQueueChanged(item);
            }
        });
    }
}