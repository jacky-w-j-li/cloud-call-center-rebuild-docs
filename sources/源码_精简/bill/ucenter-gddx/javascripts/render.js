var render = {
    _leftMenuRegExp: new RegExp("\\/","g"),

    replaceDataByObject : function(obj,html){
        obj = obj || {};
        for(var key in obj){
            var prefix = key.substr(0,1) == '_' ?'_':'__';
            var reg = new RegExp(prefix+key,'g');
            html = html.replace(reg,obj[key]);
        }
        return html;
    },
    renderAccountListItem: function(account, html){
        html = html.replace(/__id/g,account._id)
            .replace(/__name/g, account.name)
            .replace(/__company/g,account.company)
            .replace(/__createTime/g, account.createTime);
        return html;
    },
    renderLeftMenuHandlerPage: function(page) {
        return page.replace(render._leftMenuRegExp, ".");
    },
    renderLeftMenuPage: function(page) {
        return page.replace(render._leftMenuRegExp, "_");
    },
    renderActiveHistory: function(obj, html, rel) {
        if(rel == "notes") {
            var isComplete = "";
            if(obj.status && obj.status == "1") {
                isComplete = "task_title";
            }
            html = html.replace(/__createTime/g, obj.lastUpdateTime)
                .replace(/__creator/g," 最近更新人:" + getCache("agents", obj.userId).name)
                .replace(/__content/g, "<span class='"+isComplete+"'>"+obj.remark+"</span>");
            return html;
        } else if(rel == "task") {
            var isComplete = "";
            if(obj.isComplete) {
                isComplete = "task_title";
            }
            html = html.replace(/__createTime/g, obj.lastUpdateTime)
                .replace(/__creator/g, " 最近更新人:" + getCache("agents", obj.lastUpdateUser).name);
            html = html.replace(/__content/g, "<span class='"+isComplete+"'>"+obj.title+"</span>");
            return html;
        } else if(rel == "call") {
            html = html.replace(/__createTime/g, obj.OFFERING_TIME)
                .replace(/__creator/g, " 呼叫类型:【"+obj.CONNECT_TYPE+"】【" +obj.STATUS+"】处理座席:【"+obj.DISPOSAL_AGENT+"】")
                .replace(/__content/g, "");
            return html;
        }
    },
    getAgentName : function(id){
        if(id == null || id == ''){
            return '';
        }
        var agent = getCache('agents',id);
        if(agent != null && agent != undefined){
            return agent.name;
        }
        return '';
    },
    getStatusName : function(data){
        if(data === 'dealing'){
            return '已接听';
        }else if(data === 'notDeal'){
            return '振铃未接听';
        }else if(data === 'leak'){
            return 'ivr';
        }else if(data === 'queueLeak'){
            return '排队放弃';
        }else if(data === 'blackList'){
            return '黑名单';
        }else{
            return '';
        }
    }

}

