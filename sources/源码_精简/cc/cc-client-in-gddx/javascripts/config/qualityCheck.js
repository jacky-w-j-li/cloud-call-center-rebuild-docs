/**
 * Created by chenguang on 8/21/14.
 */
handler.config.qualityCheck = {
    currentTemplates : null,
    showTemplateStatus: function(status,reverse){
        if(status && status == 'true'){
            if(reverse)
                return '停用';
            return '启用';
        }else{
            if(reverse)
                return '启用';
            return '停用';
        }
    },
    changeQualityCheckTemplateStatus: function(data){
        var action = {
            action: 'config.qualityCheck.changeQualityCheckTemplateStatus',
            data: {
                _id : data.split(',')[0],
                currentStatus : data.split(',')[1]
            }
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.qualityCheck.config_quality_check_template();
                $().alertmessage('showSuccess', "更改质检模板状态成功！");
            } else {
                $().alertmessage('showError', '更新质检模板状态失败！');
            }
        });
    },
    getQualityCheckConfigs: function(){
        if(handler.qualityCheck.currentTemplate == null){
            var templates = getCache('qualityCheckTemplates');
            if(templates.length >0)
                handler.qualityCheck.currentTemplate = templates[0];
            else
                return [];
        }
        var configs = handler.qualityCheck.currentTemplate.config;
        var flog = false;
        for (var ind in configs) {
            if (configs[ind].weight) {
                flog = true;
                break;
            }
        }
        if (flog) {
            configs = configs.sort(function(a, b) {
                if(parseInt(b.weight) != parseInt(a.weight)){
                    return parseInt(b.weight) - parseInt(a.weight);
                }else{
                    return parseInt(b.order) - parseInt(a.order);
                }
            });
        }
        return configs;
    },
    getQualityTaskTemplateConfig : function (data,callback) {
        var action = {
            action: 'config.qualityCheck.queryQualityTaskTemplateConfig',
            data: {
                callId: data
            }
        };
        DS.send(action, function (res) {
                if (res.success) {
                    callback(res.config);
                } else {
                    $().alertmessage('showError','获取质检任务模板失败！');
                    callback('');
                }
        });
    },
    getQualityCheckTemplateType: function(){
        if(handler.qualityCheck.currentTemplate == null){
            var templates = getCache('qualityCheckTemplates');
            if(templates.length >0)
                handler.qualityCheck.currentTemplate = templates[0];
            else
                return [];
        }
        var type = handler.qualityCheck.currentTemplate.type;
        return type;
    },
    config_quality_check_template: function(data,src) {
        data = {};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.channel.pageSize;
        var pane = $("#config_quality_check_template_pane");
        var formID = "config_quality_template_update_form_two";
        var action = {
            action: 'config.qualityCheck.queryQualityCheckTemplate',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var configs = response.list;
                handler.config.qualityCheck.currentTemplates = configs;
                if(configs.length > 0) {
                        var config = null;
                        pane.empty();
                        for(var i= 0,len=configs.length;i<len;i++) {
                            config = configs[i];
                            var enableToStr=config.enable.toString();
                            var qualityUser=handler.cdr.getAgentName(config.updateUser);
                            var qualityState=handler.config.qualityCheck.showTemplateStatus(enableToStr);
                            var enableTrue=handler.config.qualityCheck.showTemplateStatus(enableToStr,true);
                            config.qualityUser=qualityUser;
                            config.qualityState=qualityState;
                            config.enableTrue=enableTrue;
                            config.enable=enableToStr;
                            if (config.type == "pass") {
                                config.typeName = "pass模板";
                                config.state="查看"
                            } else {
                                config.typeName = "打分模板";
                                config.state="修改"
                            }
                            var qualickCheckTemplate = template("quality_check_template_item",config);
                            pane.append(qualickCheckTemplate);
                        }
                        var tdTextOne=pane.children("tr").find("td:nth-child(4)");
                         tdTextOne.each(function(index,node) {
                                 if ($(node).html() == "停用") {
                                     $(node).css("color","red");
                                 }else{
                                     $(node).css("color","#84BC25");
                                 }
                             })
                } else {
                    pane.html('<tr><td colspan="5" style="text-align:center;height:58px;line-height:58px;">目前没有模板信息！</td></tr>');

                }
                DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
            } else {
                $().alertmessage('showError', "请求失败！");
            }
        });
    },

    saveQualityCheckTemplate: function(data) {
        if(!handler.config.qualityCheck.checkAualityStandard(data)){
            return;
        }
        data.config = [
            {
                "order" : 1,
                "name" : "专业水平",
                "weight" : "40"
            },
            {
                "order" : 2,
                "name" : "态度语气",
                "weight" : "30"
            },
            {
                "order" : 3,
                "name" : "解决程度",
                "weight" : "30"
            }
        ]
        var action = {
            action: 'config.qualityCheck.saveQualityCheckTemplate',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                handler.config.qualityCheck.config_quality_check_template();
                $("#config_quality_check_template_container").html('');
            } else{
                $().alertmessage('showError',response.message);
            }
        });
    },
    setConfigName:function (config,config1,config2,config3,config4,config5,config6,config7,config8,config9,configNames,configNameFatals){
        var configOrder = 1;
        var config1Order = 1;
        var config2Order = 1;
        var config3Order = 1;
        var config4Order = 1;
        var config5Order = 1;
        var config6Order = 1;
        var config7Order = 1;
        var config8Order = 1;
        var config9Order = 1;
        for(var i=0;i<configNames.length;i++){
            var item = {
                "order" : 0,
                "name" : "",
                "value": "",
                "child":[]
            };
            // 1-11-1  分割key ["1","11","1"]
            var resultArry = configNames[i].key.split("-");
            var keyStr = "";
            for(var j=0;j<resultArry.length;j++){
                keyStr += resultArry[j] + "-";  // 1-11-1-
            }
            if(keyStr != ""){
                keyStr = keyStr.substr(0,keyStr.length -1); //1-11-1
            }
            if(resultArry.length == 1) {
                item.order =configOrder;
                item.name = keyStr;
                item.value = configNames[i].value;
                config.push(item);
                configOrder+=1;
            }
            if(resultArry.length == 2){
                for(var a=0;a< configNameFatals.length;a++) {
                    if(configNameFatals[a].key.substr(0,3).indexOf("Non")>-1 && configNameFatals[a].key.substr(9,1)== keyStr.substr(12,1)){
                        item.Non_Fatal = configNameFatals[a].value;

                    }
                    if (configNameFatals[a].key.substr(16, configNameFatals[a].key.length) == keyStr.substr(12, keyStr.length)) {
                        item.fatalName = configNameFatals[a].key;
                        item.fatalValue = configNameFatals[a].value;
                    }
                }
                item.order =config1Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config1.push(item);
                config1Order+=1;
            }
            if(resultArry.length == 3) {
                item.order =config2Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config2.push(item);
                config2Order+=1;

            }
            if(resultArry.length == 4) {
                item.order =config3Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config3.push(item);
                config3Order+=1;

            }
            if(resultArry.length == 5) {
                item.order =config4Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config4.push(item);
                config4Order+=1;

            }
            if(resultArry.length == 6) {
                item.order =config5Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config5.push(item);
                config5Order+=1;

            }
            if(resultArry.length == 7) {
                item.order =config6Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config6.push(item);
                config6Order+=1;

            }
            if(resultArry.length == 8) {
                item.order =config7Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config7.push(item);
                config7Order+=1;

            }
            if(resultArry.length == 9){
                item.order =config8Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config8.push(item);
                config8Order+=1;

            }
            if(resultArry.length == 10){
                item.order =config9Order;
                item.name = keyStr;
                item.value = configNames[i].value;
                config9.push(item);
                config9Order+=1;

            }

        }
        //configNames[i].key.split("-")  resutl = ["1","1","11"]
        for(var i=0; i<config.length; i++){
            var config0Arry = config[i].name.split("-"); // 1 ["1"]
            for(var j=0; j<config1.length; j++){
                var config1Arry = config1[j].name.split("-"); // 1-1 ["1","1"]
                if(config0Arry[0] == config1Arry[0]){
                    config[i].child.push(config1[j]);
                    for(var k=0; k<config2.length; k++){
                        var config2Arry = config2[k].name.split("-"); // 1-1-1 ["1","1","1"]
                        if(config2Arry[0] == config1Arry[0] && config2Arry[1] == config1Arry[1] ){
                            config1[j].child.push(config2[k]);
                            for(var z=0; z<config3.length; z++) {
                                var config3Arry = config3[z].name.split("-"); // 1-1-1-1 ["1","1","1","1"]
                                if (config3Arry[0] == config2Arry[0] && config3Arry[1] == config2Arry[1] && config3Arry[2] == config2Arry[2]) {
                                    config2[k].child.push(config3[z]);
                                    for(var x=0; x<config4.length; x++) {
                                        var config4Arry = config4[x].name.split("-"); // 1-1-1-1-1 ["1","1","1","1","1"]
                                        if (config4Arry[0] == config3Arry[0] && config4Arry[1] == config3Arry[1] && config4Arry[2] == config3Arry[2] && config4Arry[3] == config3Arry[3]) {
                                            config3[z].child.push(config4[x]);
                                            for(var c=0; c<config5.length; c++) {
                                                var config5Arry = config5[c].name.split("-"); // 1-1-1-1-1-1 ["1","1","1","1","1","1"]
                                                if (config5Arry[0] == config4Arry[0] && config5Arry[1] == config4Arry[1] && config5Arry[2] == config4Arry[2] && config5Arry[3] == config4Arry[3] && config5Arry[4] == config4Arry[4]) {
                                                    config4[x].child.push(config5[c]);
                                                    for(var v=0; v<config6.length; v++) {
                                                        var config6Arry = config6[v].name.split("-"); // 1-1-1-1-1-1-1 ["1","1","1","1","1","1","1"]
                                                        if (config6Arry[0] == config5Arry[0] && config6Arry[1] == config5Arry[1] && config6Arry[2] == config5Arry[2] && config6Arry[3] == config5Arry[3] && config6Arry[4] == config5Arry[4] && config6Arry[5] == config5Arry[5]) {
                                                            config5[c].child.push(config6[v]);
                                                            for(var b=0; b<config7.length; b++) {
                                                                var config7Arry = config7[b].name.split("-"); // 1-1-1-1-1-1-1-1 ["1","1","1","1","1","1","1","1"]
                                                                if (config7Arry[0] == config6Arry[0] && config7Arry[1] == config6Arry[1] && config7Arry[2] == config6Arry[2] && config7Arry[3] == config6Arry[3] && config7Arry[4] == config6Arry[4] && config7Arry[5] == config6Arry[5] && config7Arry[6] == config6Arry[6]) {
                                                                    config6[v].child.push(config7[b]);
                                                                    for(var n=0; n<config8.length; n++) {
                                                                        var config8Arry = config8[n].name.split("-"); // 1-1-1-1-1-1-1-1-1 ["1","1","1","1","1","1","1","1","1"]
                                                                        if (config8Arry[0] == config7Arry[0] && config8Arry[1] == config7Arry[1] && config8Arry[2] == config7Arry[2] && config8Arry[3] == config7Arry[3] && config8Arry[4] == config7Arry[4] && config8Arry[5] == config7Arry[5] && config8Arry[6] == config7Arry[6] && config8Arry[7] == config7Arry[7]) {
                                                                            config7[b].child.push(config8[n]);
                                                                            for(var m=0; m<config9.length; m++) {
                                                                                var config9Arry = config9[m].name.split("-"); // 1-1-1-1-1-1-1-1-1-1 ["1","1","1","1","1","1","1","1","1","1"]
                                                                                if (config9Arry[0] == config8Arry[0] && config9Arry[1] == config8Arry[1] && config9Arry[2] == config8Arry[2] && config9Arry[3] == config8Arry[3] && config9Arry[4] == config8Arry[4] && config9Arry[5] == config8Arry[5] && config9Arry[6] == config8Arry[6] && config9Arry[7] == config8Arry[7] && config9Arry[8] == config8Arry[8]) {
                                                                                    config8[b].child.push(config9[m]);
                                                                                }
                                                                            }
                                                                        }
                                                                    }

                                                                }
                                                            }

                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }    ,
    saveQualityCheckTemplateTwo: function(data) {
        var uncurxratio = $("#uncurx_ratio").val();
        if(!(new RegExp(/^(100|[1-9]\d|\d)$/).test(uncurxratio))){
            alert("非致命项比例请输入0-100的整数！");
            return;
        }
       var liLength=$("#table0").children().length;
        if(liLength<=0){
            alert("您没有添加质检项，请添加质检项！");
            return;
        }
        var pane=$("#quality_check_template_pane_form_two .quality-fatal-text");
        var fatal=pane.html()
        var re = /^\d+$/;//是否为数字
        var configNameFatals = [];

        var Non_Fatals = [];
        var k = 0;
        var b = 0;
        for(keyitem in data){
            if(keyitem.indexOf("Non_Fatal") > -1){
                Non_Fatals[b] = {key:keyitem,value:data[keyitem]};
                b++
            }
            if(keyitem.indexOf("Fatal") > -1) {
                configNameFatals[k] = {key: keyitem, value: data[keyitem]};
                delete data[keyitem];
                k++;
            }
        }

        var configNameFatals_num1 = 0;
        var configNameFatals_num2 = 0;
        var configNameFatals_num3 = 0;
        var configNameFatals_num4 = 0;
        var configNameFatals_num5 = 0;
        var configNameFatals_num6 = 0;
        var configNameFatals_num7 = 0;
        var configNameFatals_num8 = 0;
        var configNameFatals_num9 = 0;
        var configNameFatals_num10 = 0;
        var configNameFatals_num11 = 0;
        var configNameFatals_num12 = 0;
        var configNameFatals_num13 = 0;
        var configNameFatals_num14 = 0;
        var configNameFatals_num15 = 0;
        var configNameFatals_num16 = 0;
        var configNameFatals_num17 = 0;
        var configNameFatals_num18 = 0;
        var configNameFatals_num19 = 0;
        var configNameFatals_num20 = 0;
        for(var m=0;m<configNameFatals.length;m++){
            var configNameFatalsNum=configNameFatals[m].key;
            if( configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="1"){
                if(configNameFatals[m].value){
                    configNameFatals_num1 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="2"){
                if(configNameFatals[m].value){
                    configNameFatals_num2 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="3"){
                if(configNameFatals[m].value){
                    configNameFatals_num3 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="4"){
                if(configNameFatals[m].value){
                    configNameFatals_num4 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="5"){
                if(configNameFatals[m].value){
                    configNameFatals_num5 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="6"){
                if(configNameFatals[m].value){
                    configNameFatals_num6 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="7"){
                if(configNameFatals[m].value){
                    configNameFatals_num7 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="8"){
                var configNameFatals_num8 = 0;
                if(configNameFatals[m].value){
                    configNameFatals_num8 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="9"){
                if(configNameFatals[m].value){
                    configNameFatals_num9 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="10"){
                if(configNameFatals[m].value){
                    configNameFatals_num10 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="11"){
                if(configNameFatals[m].value){
                    configNameFatals_num11 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="12"){
                if(configNameFatals[m].value){
                    configNameFatals_num12 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="13"){
                if(configNameFatals[m].value){
                    configNameFatals_num13 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="14"){
                if(configNameFatals[m].value){
                    configNameFatals_num14 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="15"){
                if(configNameFatals[m].value){
                    configNameFatals_num15 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="16"){
                if(configNameFatals[m].value){
                    configNameFatals_num16 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="17"){
                if(configNameFatals[m].value){
                    configNameFatals_num17 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="18"){
                if(configNameFatals[m].value){
                    configNameFatals_num18 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="19"){
                if(configNameFatals[m].value){
                    configNameFatals_num19 +=1;
                }
            }else if(configNameFatalsNum.substring(configNameFatalsNum.indexOf("_")+1,configNameFatalsNum.indexOf("-"))=="20"){
                if(configNameFatals[m].value){
                    configNameFatals_num20 +=1;
                }
            }
        }

        for(var f=0;f<Non_Fatals.length;f++){
            if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="1"){
                var value=$("#1>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num1<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="2"){
                var value=$("#2>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num2<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="3"){
                var value=$("#3>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num3<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="4"){
                var value=$("#4>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num4<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="5"){
                var value=$("#5>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num5<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="6"){
                var value=$("#6>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num6<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="7"){
                var value=$("#7>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num7<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="8"){
                var value=$("#8>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num8<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="9"){
                var value=$("#9>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num9<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="10"){
                if(configNameFatals_num10<Non_Fatals[f].value){
                    var value=$("#10>span>input").val()
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="11"){
                var value=$("#11>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num11<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="12"){
                var value=$("#12>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num12<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="13"){
                var value=$("#13>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num13<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="14"){
                var value=$("#14>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num14<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="15"){
                var value=$("#15>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num15<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="16"){
                var value=$("#16>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num16<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="17"){
                var value=$("#17>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num17<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="18"){
                if(configNameFatals_num18<Non_Fatals[f].value){
                    var value=$("#18>span>input").val()
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="19"){
                var value=$("#19>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num19<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }else if(Non_Fatals[f].key.substring(Non_Fatals[f].key.indexOf("l")+1,Non_Fatals[f].key.indexOf("-"))=="20"){
                var value=$("#20>span>input").val()
                if(!re.test(Non_Fatals[f].value)||Non_Fatals[f].value>20||Non_Fatals[f].value<0||Non_Fatals[f].value==''){
                    alert(value+"非致命项标准数必须是0~20！");
                    return;
                }
                if(configNameFatals_num20<Non_Fatals[f].value){
                    alert(value+"选中的非致命项小于您填写的数量");
                    return;
                }
            }
        }
        var config_names = [];
        var i=0;
        for(keyitem in data){
            if(keyitem.indexOf("config_name") > -1){
                config_names[i] = {key:keyitem,value:data[keyitem]};
                delete data[keyitem];
                i++;
            }
        }
        var config = [],config1 = [],config2 = [],config3 = [],config4 = [],config5 = [],config6 = [],config7 = [], config8 = [],config9 = [];
        handler.config.qualityCheck.setConfigName(config,config1,config2,config3,config4,config5,config6,config7,config8,config9,config_names,configNameFatals);
        console.dir(config);
        data.type="pass";
        data.config = config;
        var action = {
            action: 'config.qualityCheck.saveQualityCheckTemplateTwo',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                handler.config.qualityCheck.config_quality_check_template();
                $("#config_quality_check_template_container_Two").empty();
            } else {
                $().alertmessage('showError',response.message);
            }
        });
    },

    saveEditQualityCheckTemplate: function(data){
        if(!handler.config.qualityCheck.checkAualityStandard(data)){
            return;
        }
        delete data.config_name;
        delete data.config_weight;
        delete data.config_fatal;
        var configs = [];
        var tbody = $("#config_quality_check_template_config_table_pane");
        var trs = tbody.children("tr");
        var weightCount = 0;
        for(var i=0 ; i < trs.length ; i++){
            var tds = $(trs[i]).children("td");
            var name = null;
            var weight = null;
            var fatal = null;
            for(var j=0 ; j <tds.length ;j++){
                var tmpName = $(tds[j]).children("input[name='config_name']");
                var tmpWeight = $(tds[j]).children("input[name='config_weight']");
                var tmpFatal = $(tds[j]).children("input[name='config_fatal']");
                if(tmpName.length>0){
                    name = tmpName;
                }
                if(tmpWeight.length >0){
                    weight = tmpWeight
                }
                if(tmpFatal.length >0){
                    fatal = tmpFatal
                }
            }
            if(name.val() == '' && weight.val() ==''){
                $().alertmessage('showError','质检项名称和权重必须填写!');
                return;
            }
            if(name.val() == ''){
                $().alertmessage('showError','质检项名称必须填写!');
                return;
            }
            if(weight.val() ==''){
                $().alertmessage('showError','权重必须填写!');
                return;
            }
            configs.push({order:i+1,name:name.val(),weight:weight.val(),fatal:fatal[0].checked});
            weightCount += parseInt(weight.val());
        }
       for(var k = 0; k<configs.length;k++){
           if(configs[k].weight<0){
               $().alertmessage('showError','质检项权重值必须大于0!');
               return;
           }
       }
        if(weightCount!=100){
            $().alertmessage('showError','质检项权重之和相加必须等于100!');
            return;
        }
        data.config = configs;
        var action = {
            action: 'config.qualityCheck.saveQualityCheckTemplate',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                handler.config.qualityCheck.config_quality_check_template();
                $("#config_quality_check_template_container").html('');
            } else {
                $().alertmessage('showError',response.message);
            }
        });

    },
    showAddQualityCheckTemplate: function(data) {
        $("#config_quality_check_template_container_Two").empty();
        DS.getView("config/qualityCheck/add_quality_check_template", function (view) {
            var pane = $("#config_quality_check_template_container");
            pane.empty();
            pane.html(view);
        });
    },
    showAddQualityCheckTemplateTwo: function(data) {
        $("#config_quality_check_template_container").empty();
        DS.getView("config/qualityCheck/add_quality_check_template_Two", function (view) {
            var pane = $("#config_quality_check_template_container_Two");
            pane.empty();
            pane.html(view);

        });
    },
    saveQualityCheckConfig: function(data) {
        var weight = data.WEIGHT;
        if(!/^\d+$/.test(weight) || weight=='0' || /^0/.test(weight)) {
            alert('请正确填写权重：1至100之间的整数');
            return false;
        }
        var configs = handler.config.cdr.currentConfigs;
        var weightAmount = 0;
        var config = null;
        for(var ind in configs) {
            config = configs[ind];
            if(config._id != data._id){
                weightAmount += parseInt(config.WEIGHT);
            }
        }
        weightAmount += parseInt(weight);

        if (weightAmount > 100) {
            $().alertmessage('showError','所有质检项权重之和已大于100，请先调整已有的权重');
            return false;
        }

        var action = {
            action: 'config.cdr.saveQualityCheckConfig',
            data: data
        };
        sendAction(action, function (response) {
            if(response.success){
                handler.config.cdr.config_quality_check();
                $("#config_quality_check_container").html('');
            } else {
                $().alertmessage('showError','保存失败，请重新保存');
            }
        });
    },
    confirmDelQualityConfig : function(data){
        getBufferedView('config/cdr/confirm_delete_quality_config', function (view) {
            var panel = $('#confirm_del_quality_config_pane');
            panel.html('');
            view = view.replace(/__doDeleteButton/g, "<a class='btn btn-danger action' appaction='config.cdr.deleteQualityCheckConfig' appdata='"+data+"'>确认删除</a>");
            panel.append(view);
            $('#confirm_del_quality_config_Modal').modal();
        });
    },
    deleteQualityCheckConfig: function(data) {
        var action = {
            action: 'config.cdr.deleteQualityCheckConfig',
            data: {
                _id: data
            }
        };
        sendAction(action, function (response) {
            if(response.success){
                handler.config.cdr.config_quality_check();
                $().alertmessage('showSuccess','删除质检项成功！');
            } else {
                $().alertmessage('showError','删除失败，请重试');
            }
        });
    },
    cancelQualityCheckTemplate: function(){
        $("#config_quality_check_template_container").html('');
    },
    cancelQualityCheckTemplateTwo: function(){
        $("#config_quality_check_template_container_Two").html('');
    },
    showEditQualityCheckTemplate: function(data) {
        var templates = handler.config.qualityCheck.currentTemplates;
        var template = null;
        for(var ind in templates) {
            template = templates[ind];
            if(template._id == data) {
                break;
            }
        }
        if(template.type=="pass"){
            DS.getView("config/qualityCheck/add_quality_check_template_Two_change", function (view) {
                var pane = $("#config_quality_check_template_container_Two");
                pane.empty();
                pane.html(view);
                $("#config_quality_template_update_form").empty()
                $("#table0").empty();
                $("#field_name").val(template.name).attr("title",template.name);
                if(!template.uncurxratio){
                    template.uncurxratio = 0;
                }
                $("#uncurx_ratio").val(template.uncurxratio);
                var tablePane=$("#table0");
                objectToForm($('#config_quality_template_update_form_two'), template);
                var config=template.config;
                var oneHtml ="";
                for(i=0;i<config.length;i++){
                    //var noCrux=config[0].child[0].Non_Fatal;
                    var tmp = i+1;
                        oneHtml += '<li class="info" id='+tmp+'><span class="pull-left ds_do_action" ds_action="qualityCheck.showFirstSubItems" title='+config[i].value+'><p class="quality-name">'+config[i].value+'</p></span>'
                    if(config[i].child.length > 0){
                        oneHtml += '<ul id="table'+tmp+'">'
                        for(j=0;j<config[i].child.length;j++){
                            var tmp2 =j+1;
                            oneHtml += '<li class="info" style="" id='+tmp+'-'+tmp2+'><input type="checkbox" class="cfg_pitch_crux" disabled crux='+config[i].child[j].fatalValue+' curxNum='+config[i].child[j].Non_Fatal+'><span class="pull-left ds_do_action" ds_action="qualityCheck.showFirstSubItems" title='+config[i].child[j].value+'><p class="quality-name">'+config[i].child[j].value+'</p></span>'
                            if(config[i].child[j].child.length>0){
                                   oneHtml += '<ul id="table'+tmp+'-'+tmp2+'">'
                                       for(k=0;k<config[i].child[j].child.length;k++){
                                           var tmp3 =k+1;
                                           oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'><span class="pull-left" title='+config[i].child[j].child[k].value+'><p class="quality-name">'+config[i].child[j].child[k].value+'</p></span>'
                                           if(config[i].child[j].child[k].child.length>0){
                                                   oneHtml += '<ul id="table'+tmp+'-'+tmp2+'-'+tmp3+'">'
                                                   for(l=0;l<config[i].child[j].child[k].child.length;l++){
                                                       var tmp4 =l+1;
                                                       oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp4+'><span class="pull-left" title='+config[i].child[j].child[k].child[l].value+'><p class="quality-name">'+config[i].child[j].child[k].child[l].value+'</p></span>'
                                                       if(config[i].child[j].child[k].child[l].child.length>0){
                                                           oneHtml += '<ul id="table'+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp4+'">'
                                                               for(m=0;m<config[i].child[j].child[k].child[l].child.length;m++){
                                                                   var tmp5 =m+1;
                                                                   oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp5+'><span class="pull-left" title='+config[i].child[j].child[k].child[l].child[m].value+'><p class="quality-name">'+config[i].child[j].child[k].child[l].child[m].value+'</p></span>'
                                                                   if(config[i].child[j].child[k].child[l].child[m].child.length>0){
                                                                       oneHtml += '<ul id="table'+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp4+'-'+tmp5+'">'
                                                                       for(n=0;n<config[i].child[j].child[k].child[l].child[m].child.length;n++){
                                                                           var tmp6 =n+1;
                                                                           oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp5+'-'+tmp6+'><span class="pull-left" title='+config[i].child[j].child[k].child[l].child[m].child[n].value+'><p class="quality-name">'+config[i].child[j].child[k].child[l].child[m].child[n].value+'</p></span>'
                                                                           if(config[i].child[j].child[k].child[l].child[m].child[n].child.length>0){
                                                                               oneHtml += '<ul id="table'+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp4+'-'+tmp5+'-'+tmp6+'">'
                                                                               for(o=0;o<config[i].child[j].child[k].child[l].child[m].child[n].child.length;o++){
                                                                                   var tmp7 =o+1;
                                                                                   oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp5+'-'+tmp6+'-'+tmp7+'><span class="pull-left" title='+config[i].child[j].child[k].child[l].child[m].child[n].child[o].value+'><p class="quality-name">'+config[i].child[j].child[k].child[l].child[m].child[n].child[o].value+'</p></span>'
                                                                                   if(config[i].child[j].child[k].child[l].child[m].child[n].child[o].child.length>0){
                                                                                       oneHtml += '<ul id="table'+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp4+'-'+tmp5+'-'+tmp6+'-'+tmp7+'">'
                                                                                       for(p=0;p<config[i].child[j].child[k].child[l].child[m].child[n].child[o].child.length;p++){
                                                                                           var tmp8 =p+1;
                                                                                           oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp5+'-'+tmp6+'-'+tmp7+'-'+tmp8+'><span class="pull-left" title='+config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].value+'><p class="quality-name">'+config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].value+'</p></span>'
                                                                                           if(config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child.length>0){
                                                                                               oneHtml += '<ul id="table'+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp4+'-'+tmp5+'-'+tmp6+'-'+tmp7+'-'+tmp8+'">'
                                                                                               for(q=0;q<config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child.length;q++){
                                                                                                   var tmp9 =q+1;
                                                                                                   oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp5+'-'+tmp6+'-'+tmp7+'-'+tmp8+'-'+tmp9+'><span class="pull-left" title='+config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child[q].value+'><p class="quality-name">'+config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child[q].value+'</p></span>'
                                                                                                   if(config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child[q].child.length>0){
                                                                                                       oneHtml += '<ul id="table'+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp4+'-'+tmp5+'-'+tmp6+'-'+tmp7+'-'+tmp8+'-'+tmp9+'">'
                                                                                                       for(r=0;r<config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child[q].child.length;r++){
                                                                                                           var tmp10=r+1;
                                                                                                           oneHtml += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+tmp+'-'+tmp2+'-'+tmp3+'-'+tmp5+'-'+tmp6+'-'+tmp7+'-'+tmp8+'-'+tmp9+'-'+tmp10+'><span class="pull-left" title='+config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child[q].child[r].value+'><p class="quality-name">'+config[i].child[j].child[k].child[l].child[m].child[n].child[o].child[p].child[q].child[r].value+'</p></span></li>'
                                                                                                       }
                                                                                                       oneHtml += '</ul>'
                                                                                                   }
                                                                                                   oneHtml+='</li>'
                                                                                               }
                                                                                               oneHtml += '</ul>'
                                                                                           }
                                                                                           oneHtml+='</li>'
                                                                                       }
                                                                                       oneHtml += '</ul>'
                                                                                   }
                                                                                   oneHtml+='</li>'
                                                                               }
                                                                               oneHtml += '</ul>'
                                                                           }
                                                                           oneHtml+='</li>'
                                                                       }
                                                                       oneHtml += '</ul>'
                                                                   }
                                                                   oneHtml +='</li>'
                                                               }
                                                               oneHtml += '</ul>'
                                                       }
                                                       oneHtml+='</li>'
                                                   }
                                                   oneHtml += '</ul>'
                                               }
                                           oneHtml+='</li>'
                                       }
                                    oneHtml += '</ul>'
                                }
                            oneHtml += '</li>'
                        }
                        oneHtml += '</ul>'
                    }
                    oneHtml += '</li>';
                }

                var tableWrap=$(".table-wrap");
                var noCrux=$("#1>ul>.cfg_pitch_crux").attr("curxnum");
                if(!noCrux||noCrux=="undefined"){
                    noCrux=0;
                }
                tableWrap.prepend("<div style='height:56px;'><div class='cfg_noCrux'>非致命项标准数："+noCrux+"</div></div>")
                tablePane.append(oneHtml);
                $(".cfg_pitch_crux").each(function(index,node){
                    if( $(node).attr("crux")=='true'){
                        $(node).attr("checked","checked");
                    }else{
                        $(node).removeAttr("checked");
                    }
                })
            })

        }else if(template) {
            $("#config_quality_template_update_form_two").empty();
            var pane = $("#config_quality_check_template_container_Two");
            pane.empty();
            DS.getView("config/qualityCheck/edit_quality_check_template", function (view) {
                var pane = $("#config_quality_check_template_container");
                pane.empty();
                pane.html(view);
                objectToForm($('#config_quality_template_update_form'), template);
                if(template.config){
                    var tablePane = $("#config_quality_check_template_config_table_pane");
                    var oneHtml = '<tr class="info"><td><input name="config_name" class="input" value="__name"/></td>' +
                        '<td><input name="config_weight" class="input-small" value="__weight" maxlength="2"/>%'+
                        '<input type="checkbox" name="config_fatal" style="margin: 0 3px 0px 5px;" __fatal/>是否致命项'+
                        '</td>'+

                        '<td><a href="#" class="ds-config-quality-check-remove-config ds_do_action" ds_action="qualityCheck.setRemoveQualityCheckOne"><i class="icon-minus"></i></a></td></tr>';

                    for(var i=0;i<template.config.length;i++){
                        var __fatal = "";
                        if(template.config[i].fatal){
                            __fatal = "checked";
                        }
                        var html = oneHtml.replace(/__name/,template.config[i].name)
                            .replace(/__weight/,template.config[i].weight)
                            .replace(/__fatal/,__fatal);

                        tablePane.append(html);
                    }
                }
            });
        } else {
            $().alertmessage('showError','此模板已无效');
            handler.config.qualityCheck.config_quality_check_template();
        }
    },
    getQualityCheckListItem: function(){
        var html = [];
        html.push('<tr class="info"><td><input name="config_name" class="input"/></td>');
        html.push('<td><input name="config_weight" class="input-small" maxlength="2"/>%');
        html.push('<input type="checkbox" name="config_fatal" style="margin: 2px 3px 0px 5px;"/>是否致命项');
        html.push('</td>');
        html.push('<td><a href="#" class="ds-config-quality-check-remove-config ds_do_action" ds_action="qualityCheck.setRemoveQualityCheckOne"><i class="icon-minus"></i></a></td></tr>');
        return html.join('');
    },
    //质检模板2添加质检项
    getQualityCheckListItemTwo: function(data,src){
        var trIndex=0;
        var len=$("#table0>li").length;
        var lastLiId=$("#table0>li").last().attr("id");
        if(len<=0){
            trIndex=1;
        }else{
            var lastIndex=lastLiId-0+1;
            trIndex=lastIndex;
        }
        var html = [];
        //var _fatal='<input class="checkbox-quality-check-fatal ds_webchat_action" name="configNameFatal_'+trIndex+'" ds_action="config.qualityCheck.showFatalNum" data-toggle="tooltip" title="非致命项" type="checkbox" />';
        html.push('<li class="info" id='+trIndex+'><span class="pull-left ds_do_action" ds_action="qualityCheck.showFirstSubItems" title=""><input name="config_name_'+trIndex+'" value="质检'+trIndex+'" class="input ds_focus_action" focus_action="qualityCheck.addQualityCheckFocus"  blur_action="qualityCheck.addQualityCheckBlur" autocomplete="off"/>');
        html.push('<a href="#" class="ds-config-quality-check-remove-config-two ds_do_action" ds_action="qualityCheck.showDelModal"><i class="icon-minus"></i></a>');
        html.push('<a href="#" class="ds-config-quality-check-addChildren-config-two ds_do_action" ds_action="config.qualityCheck.getQualityCheckListItemTwoChildren" ds_data="deadly"><i class="icon-plus"></i></a></span>');
        return html.join('');
    },
//添加子质检项
    getQualityCheckListItemTwoChildren: function(data,src){
        var data=data||"";
        var parentTr =src.parent().parent();
        var maxlen=parentTr.children("ul").children(".info");
        if(maxlen.length>19){
            alert("您最多可添加20级");
            return;
        }
        var trId = parentTr.attr("id");
        var trIdtmp = trId;
        var trIndex=0;
        var len= parentTr.find("#table"+trIdtmp).children(".info").length;
        var fatal_len= parentTr.find("#table"+trIdtmp).children(".quality-fatal-num").length;
        var lastIndex =src.closest("li").attr("id");
        var lastNum = lastIndex.split("-").length;//判断，如果超过10 层，就直接把最后一层的加功能删除；
        var html = "";
        if(len<=0){
            trIndex=1;
        }else{
            var lastLiId=$("#table"+trIdtmp+">li").last().attr("id");//获取到最后一个的li的id
             trIndex=lastLiId.substring(lastLiId.lastIndexOf("-")-0+1)-0+1;//获取到最后一位，并加1
        }
        if(parentTr.find("#table"+trIdtmp).length == 0){
            parentTr.append('<ul id="table'+trId+'"></ul>');
        }
        var config_name = trId + "-"+trIndex;
        trId = trId + "-"+trIndex;
        var _fatal = "";
        //var _to_do = "qualityCheck.showSubItems";
        if(data=="deadly"){
            _fatal = '<input class="checkbox-quality-check-fatal" name="configNameFatal_'+trId+'" data-toggle="tooltip" title="非致命项" type="checkbox" />';
            if(fatal_len==0){
                html += '<li class="quality-fatal-num"><span class="pull-left quality-fatal-con">非致命项标准数：<input type="hidden" class="quality-fatal-val" name="Non_Fatal'+trId+'" value =0><span class="quality-fatal-text ds_do_action" ds_action="config.qualityCheck.showQualityFatalNum" title="非致命项标准数:0" ds_data="0">0</span><input type="text" class="input ds_focus_action hidden" blur_action="config.qualityCheck.saveQualityFatalNum" style="width: 38px"></span></li>';
                //_to_do = 'qualityCheck.showFirstSubItems'
            }
            html += '<li class="info " id='+trId+' >'+_fatal+'<span class="pull-left ds_do_action" ds_action="qualityCheck.showFirstSubItems"><input name="config_name_'+config_name+'" value="质检'+trId+'"  class="input ds_focus_action" focus_action="qualityCheck.addQualityCheckFocus"  blur_action="qualityCheck.addQualityCheckBlur" autocomplete="off"/>';
        }else{
            html += '<li class="info ds_do_action" ds_action="qualityCheck.showSubItems" id='+trId+' ><span class="pull-left" title=""><input name="config_name_'+config_name+'" value="质检'+trId+'"  class="input ds_focus_action" focus_action="qualityCheck.addQualityCheckFocus"  blur_action="qualityCheck.addQualityCheckBlur" autocomplete="off"/>';
        }
        html += '<a href="#" class="ds-config-quality-check-removeChildren-config-two ds_do_action" ds_action="qualityCheck.showDelModalChildren"><i class="icon-minus"></i></a>';
        html += '<a href="#" class="ds-config-quality-check-addChildren-config-two ds_do_action" ds_action="config.qualityCheck.getQualityCheckListItemTwoChildren"><i class="icon-plus"></i></a></span></li>';
        parentTr.find("#table"+trIdtmp).append(html);
        if (lastNum >= 9) {
            src.parent().parent().children("ul").children("li").find(".ds-config-quality-check-addChildren-config-two").hide();
        }
    },
    showQualityFatalNum:function(data,src){
        src.hide();
        $(src).next('input').val(data).show()[0].focus();
    },
    saveQualityFatalNum:function(data,src){
        data=src.val();
        //var re = /^\d+$/;
        //if(!re.test(data)){
        //    alert('请输入一个非负数');
        //    $(src)[0].focus();
        //    return false;
        //}
        //var _max=src.closest('ul').children('li.info').length;
        //if(data > _max || data <0){
        //    alert('输入错误，请重新输入！');
        //    $(src)[0].focus();
        //    return false;
        //}
        src.closest('.quality-fatal-con').find('.quality-fatal-text').attr("title","非致命项标准数:"+data);
        src.hide().closest('.quality-fatal-con').find('.quality-fatal-text').show().attr('ds_data',data).html(data);
        src.closest('.quality-fatal-con').find('.quality-fatal-val').val(data);
    },
    checkAualityStandard: function(data){
        if(parseInt(data['A-begin']) >=100 || parseInt(data['A-begin']) <= parseInt(data['B-end'])){
            alert('优秀 的开始分值有误，请重新输入！');
            return false;
        }
        if(parseInt(data['B-begin']) >= parseInt(data['B-end']) || parseInt(data['B-end']) <= parseInt(data['C-begin'])
            || parseInt(data['B-end']) + 1 != parseInt(data['A-begin'])){
            alert('合格 分值有误，请重新输入！必须是连续的区间。');
            return false;
        }
        if(parseInt(data['C-begin']) >= parseInt(data['C-end']) || parseInt(data['C-end']) >= parseInt(data['B-begin'])
            || parseInt(data['C-end']) + 1 != parseInt(data['B-begin'])){
            alert('提醒 分值有误，请重新输入！必须是连续的区间。');
            return false;
        }
        if(parseInt(data['D-end']) <= 0 || parseInt(data['D-end']) >= parseInt(data['C-begin'])
            || parseInt(data['D-end']) + 1 != parseInt(data['C-begin'])){
            alert('不合格 的结束分值有误，请重新输入！必须是连续的区间。');
            return false;
        }
        return true;
    }
}

handler.qualityCheck = {
    sysConfigName: '质检评分项配置',
    isGradeInputBindEvent : false,
    currentGrade:{},
    currentQueryAction:null,
    callDataIdList : [],
    currentQualityCheckCallSheets: null,
    currentQualityedCheckCallSheets: null,
    currentQualityCheckCallSheetIndex: null,
    QualityChecked_cycle: null,
    CheckQualityTemplte:null,
    taskTemplateType : null,
    taskTemplateId : null,
    selectedCallId : '',
    taskTemplateConfig : null,
    currentTemplate: null,
    randomTemplate: null,
    randomFlag: null,
    qualityCheckMsgFlag: true,
    qualityCheck_main: function(data){
        var pane=$("#view_nav_qualityCheck");
        if (!session.user.isAdmin) {
            if(!isHasMenu("func_quality_check")){
                pane.find(".quality_check_tab>.role_quality_check").remove();

            }else{
                pane.find(".quality_check_tab>.role_quality_check").show();
            }
            if(!isHasMenu("func_quality_check_list_query")){
                pane.find(".quality_check_tab>.role_quality_check_list_query").remove();
            }else{
                pane.find(".quality_check_tab>.role_quality_check_list_query").show();
            }
            if(!isHasMenu("func_quality_check_query")){
                pane.find(".quality_check_tab>.role_quality_check_query").remove();
            }else{
                pane.find(".quality_check_tab>.role_quality_check_query").show();
            }
            if(!isHasMenu("func_quality_task_monitor")){
                pane.find(".quality_check_tab>.role_quality_task_monitor").remove();
            }else{
                pane.find(".quality_check_tab>.role_quality_task_monitor").show();
            }
            if(!isHasMenu("func_quality_check_cycle")){
                pane.find(".quality_check_tab>.role_quality_check_cycle").remove();
            }else{
                pane.find(".quality_check_tab>.role_quality_check_cycle").show();
            }
            if(!isHasMenu("func_quality_check_period")){
                pane.find(".quality_check_tab>.role_quality_task_period").remove();
            }else{
                pane.find(".quality_check_tab>.role_quality_task_period").show();
            }
        }
        $('.quality_check_tab').find('li:first-child').find("a").click();
    },
    validateGrade: function(src){
        if (src.val() == '') {
            return true;
        }
        if(!/^\d+$/.test(src.val())){
            alert('评分只能填写0-100的整数');
            src.val('');
            src.focus();
            return false;
        }
        if(parseInt(src.val()) > 100) {
            alert('评分的范围是0至100，请重新评分');
            src.val('');
            src.focus();
            return false;
        }
        return true;
    },
    bindGradeInputEvent: function(){
        $(document).on('change', '.callSheetOtherInfoPanel .call_sheet_grade', function(event){
            event.preventDefault();
            event.stopImmediatePropagation();

            var self = handler.qualityCheck;
            var fatal_flag = false;
            var src = $(event.target);
            /*if(!src.val()){
                return false;
            }*/
            var validation = self.validateGrade(src);
            /*if(!validation){
                //src.val(0);
            }*/
            var callSheetQualityCheckConfig = {};
            if ($('#quality_check_query_table_data .quality_call_task_id').val()) {
                callSheetQualityCheckConfig = handler.qualityCheck.taskTemplateConfig;
            } else {
                callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            }

            var currentGrade = self.currentGrade;
            var inputs = $("#callSheetGradeTable .input-prepend input");
            for(var i=0;i<inputs.length;i++){
                var input = inputs[i];
                var gradeInputName = input.name;
                var option = null;

                for(var ind in callSheetQualityCheckConfig) {
                    option = callSheetQualityCheckConfig[ind];
                    if(option.order == gradeInputName) {
                        if(option.fatal && parseInt(input.value)<60){
                            fatal_flag = true;
                            //break;
                        }
                        if(input.value && !option.fatal){
                            currentGrade[gradeInputName] = parseInt(option.weight) * parseInt(input.value) / 100;
                        }else if(option.fatal && parseInt(input.value)>=60){
                            currentGrade[gradeInputName] = parseInt(option.weight) * parseInt(input.value) / 100;
                        }else{
                            currentGrade[gradeInputName] = 0;
                        }
                        break;
                    }
                }
                //if(fatal_flag)break;
            }

            if(fatal_flag){
                $('#gradeAmount').text(0);
            }else{
                var amount = 0;
                for(var gradeItem in currentGrade) {
                    amount += currentGrade[gradeItem];
                }
                $('#gradeAmount').text(Math.round(amount * 100) / 100);
            }
        });
        handler.qualityCheck.isGradeInputBindEvent = true;
    },

    getagentcheckedcount : function(agent_id,agents_id){
        for(var agents_id_one in agents_id){
            if(agents_id[agents_id_one]._id == agent_id){
                return agents_id[agents_id_one].count;
            }
        }
    },
    quality_task_monitor : function (data, src, session) {
        if (data.QA_SPECIALIST == '' && $('#quality_check_agent_report_search_qa_input').val()) {
            return false;
        }
        var self = handler.qualityCheck;
        var query = {};
        if (data == "quality_task_monitor") {
            query.cid = data;
        } else {
            query.QA_SPECIALIST = data.QA_SPECIALIST;
            query.hide = data.TASK_STATE;
            query.BEGIN_TIME = data.BEGIN_TIME;
            query.END_TIME = data.END_TIME;
        }
        if(src){
            query.page = src.val() || 1;
        }else{
            query.page = 1;
        }
        self.getQualityTaskTemplateList(query, function (res) {
            render.qualityCheck.renderQualityTaskForQuery(res.list);
            DS.updatePagination('qualityMonitorQueryFrm', res.count, handler.cdr.queryPageSize, query.page);
        });
    },
    init_checked_table_title : function(data,src){
        var action = {
            action : 'config.qualityCheck.queryQualityCheckedtabletitle',
        }
        DS.send(action, function(res){
            var selector_option = '';
            var QualityCheckedtable = res.docs;
            handler.qualityCheck.CheckQualityTemplte = res.docs;
            if(res.success){
                for(var QualityCheckedtable_one in QualityCheckedtable) {
                    selector_option += "<option value='" + QualityCheckedtable[QualityCheckedtable_one]._id + "'>" + QualityCheckedtable[QualityCheckedtable_one].name + "</option>";
                }
            }
            $('#qualityChecked_table').append(selector_option);

        });
    },
    init_checked_cycle : function(data,src){
        var action = {
            action : 'config.qualityCheck.queryQualityCheckedCycle',
        }
        DS.send(action, function(res){
            if(!res.success){
                alert(res.message);
                return;
            }
            var selector_option = '';
            handler.qualityCheck.QualityChecked_cycle = res.cycles;
            for(var cycles_one in res.cycles){
                selector_option +='<option value="'+res.cycles[cycles_one]._id+'">'+res.cycles[cycles_one].cycleName+'</option>';
            }
            $('#qualityChecked_cycle').append(selector_option);

        });
    },
    quality_task_period : function (data, src, session) {
        handler.qualityCheck.init_checked_cycle();
        handler.qualityCheck.init_checked_table_title();
        Date.prototype.Format = function (fmt) { //author: meizz
            var o = {
                "M+": this.getMonth() + 1, //月份
                "d+": this.getDate(), //日
                "h+": this.getHours(), //小时
                "m+": this.getMinutes(), //分
                "s+": this.getSeconds(), //秒
                "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                "S": this.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }
        $(document).on('change','#qualityChecked_table',function(event){
            var qctable_id  = $('#qualityChecked_table').val();
            var qc_table = getCache('qualityCheckTemplates',qctable_id);
            var tem_floor = 1;
            for(var qc_tb_1 in qc_table.config){
                var op1_child=qc_table.config[qc_tb_1];
                for(var qc_one = 0;qc_one<op1_child.child.length;qc_one++){
                    if(tem_floor<2){tem_floor=2}
                    var op2_child = op1_child.child[qc_one];
                    for(var qc_two = 0;qc_two<op2_child.child.length;qc_two++){
                        if(tem_floor<3){tem_floor=3}
                        var op3_child = op2_child.child[qc_two];
                        for(var qc_three = 0;qc_three<op3_child.child.length;qc_three++){
                            if(tem_floor<4){tem_floor=4}
                            var op4_child = op3_child.child[qc_three];
                            for(var qc_four = 0;qc_four<op4_child.child.length;qc_four++){
                                if(tem_floor<5){tem_floor=5}
                                var op5_child = op4_child.child[qc_four];
                                for(var qc_five = 0;qc_five<op5_child.child.length;qc_five++){
                                    if(tem_floor<6){tem_floor=6}
                                    var op6_child = op5_child.child[qc_five];
                                    for(var qc_six = 0;qc_six<op6_child.child.length;qc_six++){
                                        if(tem_floor<7){tem_floor=7}
                                        var op7_child = op6_child.child[qc_six];
                                        for(var qc_seven = 0;qc_seven<op7_child.child.length;qc_seven++){
                                            if(tem_floor<8){tem_floor=8}
                                            var op8_child = op7_child.child[qc_seven];
                                            for(var qc_eight = 0;qc_eight<op8_child.child.length;qc_eight++){
                                                if(tem_floor<9){tem_floor=9}
                                                var op9_child = op8_child.child[qc_eight];
                                                for(var qc_nine = 0;qc_nine<op9_child.child.length;qc_nine++){
                                                    if(tem_floor<10){tem_floor=10}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            var ophtml = '';
            for(var k=1;k<=tem_floor;k++){
                ophtml += "<option value="+k+">"+k+"</option>"
            }
            $('#qualityChecked_floors').html(ophtml);
        })
        $(document).on('change','#qualityChecked_cycle',function(event){
            var checked_cycle = handler.qualityCheck.QualityChecked_cycle;
            var cycle_id = $(this).val();
            if(cycle_id == ''){
                $('#clearhid').hide();
                $('#qualityChecked_start_cycle').html('');
                $('#qualityChecked_start').hide();
                $('#qualityChecked_end_cycle').html('');
                $('#qualityChecked_end').hide();
            }else{
            for(var one_cycle in checked_cycle){
                if(cycle_id == checked_cycle[one_cycle]._id){
                    var json_cycle='{"begin": "'+checked_cycle[one_cycle].cycleBegins+'","end": "'+checked_cycle[one_cycle].cycleEnds+'","interval": "'+checked_cycle[one_cycle].cycleInterval+'", "name":"'+checked_cycle[one_cycle].cycleName+'", "range" : null}';
                    var jsonData = JSON.parse(json_cycle);
                    var intervals = handler.qualityCheck.construct_cycle_interval(jsonData.begin, jsonData.end, jsonData.interval, json_cycle.range);
                    var start_selector_option = '';
                    var end_selector_option = '';
                    var linkStr = '';
                    for(var intervals_one in intervals){
                        if(jsonData.interval == "null"){
                            linkStr = "_M_";
                        }else if(jsonData.interval == 1){
                            linkStr = "_D_";
                        }else if(jsonData.interval == 7){
                            linkStr = "_W_";
                        }else{
                            linkStr = "_" + jsonData.interval + "D_";
                        }
                        //var intervals_one_enety = JSON.parse(intervals[intervals_one]);
                        start_selector_option +='<option value="'+cycle_id+intervals_one+'">'+jsonData.name+ linkStr + (parseInt(intervals_one)+1) + '</option>';
                        end_selector_option +='<option value="'+cycle_id+intervals_one+'">'+jsonData.name+ linkStr + (parseInt(intervals_one)+1) + '</option>';
                    }
                    $('#qualityChecked_start_cycle').html(start_selector_option);
                    $('#qualityChecked_start').show();
                    $('#qualityChecked_end_cycle').html(end_selector_option);
                    $('#qualityChecked_end').show();
                    $('#clearhid').show();
                }
            }
            }



        });
    },
    quality_check: function(data, src,session) {
        var self = handler.qualityCheck;
        var query = {};
        if(data.CALL_TIME_LENGTH_BEGIN && data.CALL_TIME_LENGTH_END){
            var arraySta = parseInt(data.CALL_TIME_LENGTH_BEGIN);
            var arrayEnd= parseInt(data.CALL_TIME_LENGTH_END);
            if(arrayEnd <= arraySta){
                $().alertmessage('showError','请输入正确的通话时长范围！');
                return;
            }
        }else if(data.CALL_TIME_LENGTH_END == "0"){
            $().alertmessage('showError','请输入正确的通话时长范围！');
            return;
        }
        if (data == 'quality_check'){
            handler.qualityCheck._initQualityCheckRandomTemplate();
            handler.qualityCheck._initQualityTask();
            handler.cdr.initCallSheetCondition('qualityCheckMainPanel');
            $('#qualityCheckTemplates').html(self.initQualityCheckRadio());
            self.initQualityCheckRandomRadio();
            self.initQualityCheckTaskRadio();
        }else{
            delete data.currentTemplate;
            query = handler.cdr.getSearchCondition(data);
        }
        if(src){
            query.page = src.val() || 1;
        }else{
            query.page = 1;
        }

        var cdrId = "";
        var ifRandom = $('#quality_record_random_checkbox').is(':checked');
        var ifTask = $('#quality_task_random_checkbox').is(':checked');
        if (ifTask) {
            delete query.randomTemplate;
            cdrId = 'quality_check_query_task';
            if ($('#qualityCheckTaskTemplates').html() == '') {
                alert('请添加质检任务模板！');
                return;
            }
        }
        if(ifRandom){
            cdrId = 'quality_check_query_random';
            self.randomFlag = 'query';
            if(!self.randomTemplate || self.randomTemplate.length==0){
                if(self.qualityCheckMsgFlag){
                    alert('请添加抽查条件模板！');
                }
                return;
            }
        }
        if (!ifRandom && !ifTask){
            cdrId = 'quality_check_query';
            delete query.randomTemplate;
            delete query.taskTemplate;
            delete query.RANDOMNUM;
        }
        //$("#qualityCheckQueryFrm").find("input").attr("disabled","disabled");
        self.getQualityCheckCallSheet(query,cdrId,function(res){
            //$("#qualityCheckQueryFrm").find("input").removeAttr("disabled");
            DS.updatePagination('qualityCheckQueryFrm', res.count, handler.cdr.queryPageSize, query.page);
            var isBindEvent = self.isGradeInputBindEvent;
            if(!isBindEvent) {
                self.bindGradeInputEvent();
            }
        });
    },
    getQualityTaskTemplateList : function (data, callback) {
        var self = handler.qualityCheck;
        data.pageSize = handler.cdr.queryPageSize;
        var action = {
            action : 'app.qualityCheck.getQualityTaskTemplateList',
            data : data
        }
        DS.send(action,function(res){
            if (!res.success) {
                alert("系统获取不到监测信息！");
            }
           callback(res);
        });
    },
    quality_check_random: function(data, src) {
        var self = handler.qualityCheck;
        self.randomFlag = 'random';
        if(!self.randomTemplate || self.randomTemplate.length==0){
            alert('请添加抽查条件模板！');
            return;
        }

        var self = handler.qualityCheck;
        var query = {};
        delete data.currentTemplate;
        query = handler.cdr.getSearchCondition(data);
        if(src){
            query.page = src.val() || 1;
        }else{
            query.page = 1;
        }
        query.reset = true;

        self.getQualityCheckCallSheet(query,'quality_check_query_random',function(res){
            DS.updatePagination('qualityCheckQueryFrm', res.count, handler.cdr.queryPageSize, query.page);
            var isBindEvent = self.isGradeInputBindEvent;
            if(!isBindEvent) {
                self.bindGradeInputEvent();
            }
        });
    },
    addAndSelect_random_template: function(data, src){
        if(!data.TEMPLATE_NAME || data.TEMPLATE_NAME == ""){
            alert('请填写模板名称！');
            return;
        }

        if(!data.EXT_RULE || data.EXT_RULE == ""){
            data.EXT_RULE = "COUNT_TYPE_NUM";
        }

        if(data.EXT_RULE == "COUNT_TYPE_NUM"){
            if(!data.RANDOMNUM || data.RANDOMNUM == ""){
                alert('请填写随机抽取质检记录的条数，不超过1000条！');
                return;
            }
            if(data.RANDOMNUM > 1000){
                alert('请注意，随机数最大为1000！');
                return;
            }
            if(data.RANDOMNUM == 0){
                alert('请注意，随机数最小为1！');
                return;
            }
        }else if(data.EXT_RULE == "COUNT_TYPE_PERCENT"){
            if(!data.PERCENT || data.PERCENT == ""){
                alert('请填写随机抽取质检记录的百分比！');
                return;
            }
            if(data.PERCENT > 100 || data.PERCENT == 0){
                alert('请注意，百分比数必须为1-100之间的正整数！');
                return;
            }
        }
        if(data.CALL_TIME_LENGTH_BEGIN && data.CALL_TIME_LENGTH_END){
            var arraySta = parseInt(data.CALL_TIME_LENGTH_BEGIN);
            var arrayEnd= parseInt(data.CALL_TIME_LENGTH_END);
            if(arrayEnd <= arraySta){
                $().alertmessage('showError','请输入正确的通话时长范围！');
                return;
            }
        }else if(data.CALL_TIME_LENGTH_END == "0"){
            $().alertmessage('showError','请输入正确的通话时长范围！');
            return;
        }
        var self = handler.qualityCheck;
        var query = {};
        delete data.currentTemplate;
        delete data.extraction_rule;
        delete data.randomTemplate;
        delete data.selectedCallType;
        delete data.selectedQueue;
        query = handler.cdr.getSearchCondition(data);
        if(src){
            query.page = src.val() || 1;
        }else{
            query.page = 1;
        }

        self.getQualityCheckCallSheet(query,'quality_check_query_random_template_addAndSelect',function(res){
            DS.updatePagination('qualityCheckQueryFrm', res.count, handler.cdr.queryPageSize, query.page);
            self.initQualityCheckRandomRadio(res.randomTemplate);
            $('#qualityCheckMainPanel .quality_check_random_template_add_pane_show').click();
            $('#quality_check_random_template_add_pane').modal('hide');
            var isBindEvent = self.isGradeInputBindEvent;
            if(!isBindEvent) {
                self.bindGradeInputEvent();
            }
        });
    },
    add_random_template: function(data, src){
        if(!data.TEMPLATE_NAME || data.TEMPLATE_NAME == ""){
            alert('请填写模板名称！');
            return;
        }
        if(!data.EXT_RULE || data.EXT_RULE == ""){
            data.EXT_RULE = "COUNT_TYPE_NUM";
        }

        if(data.EXT_RULE == "COUNT_TYPE_NUM"){
            if(!data.RANDOMNUM || data.RANDOMNUM == ""){
                alert('请填写随机抽取质检记录的条数，不超过1000条！');
                return;
            }
            if(data.RANDOMNUM > 1000){
                alert('请注意，随机数最大为1000！');
                return;
            }
            if(data.RANDOMNUM == 0){
                alert('请注意，随机数最小为1！');
                return;
            }
        }else if(data.EXT_RULE == "COUNT_TYPE_PERCENT"){
            if(!data.PERCENT || data.PERCENT == ""){
                alert('请填写随机抽取质检记录的百分比！');
                return;
            }
            if(data.PERCENT > 100 || data.PERCENT == 0){
                alert('请注意，百分比数必须为1-100之间的正整数！');
                return;
            }
        }


        if(data.CALL_TIME_LENGTH_BEGIN && data.CALL_TIME_LENGTH_END){
            var arraySta = parseInt(data.CALL_TIME_LENGTH_BEGIN);
            var arrayEnd= parseInt(data.CALL_TIME_LENGTH_END);
            if(arrayEnd <= arraySta){
                $().alertmessage('showError','请输入正确的通话时长范围！');
                return;
            }
        }else if(data.CALL_TIME_LENGTH_END == "0"){
            $().alertmessage('showError','请输入正确的通话时长范围！');
            return;
        }
        var self = handler.qualityCheck;
        delete data.extraction_rule;
        delete data.currentTemplate;
        delete data.randomTemplate;
        delete data.selectedCallType;
        delete data.selectedQueue;
        var query = handler.cdr.getSearchCondition(data);

        var action = {
            action : 'app.qualityCheck.addQualityCheckRandomTemplates',
            data : query
        }

        DS.send(action,function(res){
            if(!res.success){
                if(res.code == 0){
                    alert(res.message);
                    return;
                }else{
                    alert("保存失败，请稍后再试！");
                    return;
                }
            }
            self.initQualityCheckRandomRadio();
            if (res.condition && getCache("qualityConditionTemplates").indexOf(res.condition) == -1) {
                session.dicMap.qualityConditionTemplates.push(res.condition);
            }
            $('#qualityCheckMainPanel .quality_check_random_template_add_pane_show').click();
            $('#quality_check_random_template_add_pane').modal('hide');
        });
    },
    remove_random_template: function(data, src){
        if(!data.randomTemplate){
            return;
        }
        var ishide =  confirm("是否删除当前条件模板");
        if (!ishide) {
            return;
        }
        var self = handler.qualityCheck;
        var action = {
            action : 'app.qualityCheck.removeQualityCheckRandomTemplates',
            data : {randomTemplate : data.randomTemplate}
        }

        DS.send(action,function(res){
            if(!res.success){
                alert('质检抽查模板删除失败，请稍后再试！');
                return;
            }
            self.initQualityCheckRandomRadio('remove');
        });
    },
    remove_task_template: function(data, src){
        if ($('#qualityCheckTaskTemplates').html() == '') {
            return;
        }
        var ishide =  confirm("是否停用当前任务");
        if (!ishide) {
            return;
        }
        var self = handler.qualityCheck;
        var action = {
            action : 'app.qualityCheck.removeQualityCheckTaskTemplates',
            data : {taskTemplate : data.taskTemplate}
        }

        DS.send(action,function(res){
            if(!res.success){
                alert('任务模板删除失败，请稍后再试！');
                return;
            }
            //缓存里设置为停用状态
            var qualityTasks = getCache("qualityTasks");
            for (var i=0; i < qualityTasks.length; i++) {
                if (qualityTasks[i]._id == data.taskTemplate) {
                    qualityTasks[i].hide = false;
                }
            }
            self.initQualityCheckTaskRadio(true);
        });
    },
    _initQualityCheckRandomTemplate: function(){
        var templatePane = $('#qualityCheckMainPanel');
        templatePane.find(".quality_check_random_template_add_pane_show").bind("click",function(e){
            e.stopPropagation();
            //var offset=templatePane.find(".quality_check_random_template_add_pane_show").offset();
            //var _p=templatePane.find("#quality_check_random_template_add_pane");
            //if(offset.left > 500){
            //    _p.css({top:offset.top+20+"px",left:"500px"});
            //}else{
            //    _p.css({top:offset.top+20+"px",left:offset.left+"px"});
            //}
            //
            //_p.toggleClass("hidden");
            $('#quality_check_random_template_add_pane').modal();
            $('#qualityCheckQueryFrm_random .quality_resetForm').click();//调用重置按钮
            //清空坐席选项
            var selectedAgentList = $("#selectedAgentList_random").val();
            if(selectedAgentList && selectedAgentList != ""){
                var selectedAgentArr = selectedAgentList.split(",");
                for(var i=0;i<selectedAgentArr.length;i++){
                    random_removeAgent(selectedAgentArr[i]);
                }
            }
            //清空呼叫类型
            var selectedCallType = $("#call_type_quality_check_random_selected").val();
            if(selectedCallType && selectedCallType != ""){
                var selectedCallTypeArr = selectedCallType.split(",");
                for(var i=0;i<selectedCallTypeArr.length;i++){
                    random_removeCallType(selectedCallTypeArr[i]);
                }
            }
            //清空技能组
            var selectedQueue = $("#queue_quality_check_random_selected").val();
            if(selectedQueue && selectedQueue != ""){
                var selectedQueueArr = selectedQueue.split(",");
                for(var i=0;i<selectedQueueArr.length;i++){
                    random_removeQueue(selectedQueueArr[i]);
                }
            }
        });
        var url = 'qualityCheck/quality_check_random_template_add';
        DS.getView(url, function(view){
            if(view){
                view=DS.renderViewNew(view);

                templatePane.find("#quality_check_random_template_add_pane").html(view);
                handler.cdr.initCallSheetCondition('qualityCheckQueryFrm_random');
            }
        });
    },
    //初始化加载质检任务模板
    _initQualityTask : function () {
        var templatePane = $('#qualityCheckMainPanel');
        templatePane.find(".quality_check_task_template_add_pane_show").bind("click",function(e){
            e.stopPropagation();
            $('#quality_task_add_pane').modal();
            $('#qualityCheckMainPanel .quality_resetForm').click();//调用重置按钮


        });
        var url = 'qualityCheck/quality_task_add';
        DS.getView(url, function(view){
            if(view){
                view=DS.renderViewNew(view);

                templatePane.find("#quality_task_add_pane").html(view);
                handler.cdr.initCallSheetCondition('qualityTaskFrm_random');
            }
        });
    },
    initQualityCheckTaskRadio : function (isremove) {
        var action = {
            action : 'app.qualityCheck.getQualityTaskTemplates'
        }
        DS.send(action, function (res) {
            if(!res.success){
                alert('质检任务模板加载失败！');
                return;
            }
            var data = res.list;
            var one = '<input type="radio" name="taskTemplate" class="qualityCheckRadio" value="___id" __checked>__name&nbsp;&nbsp;&nbsp;';
            var html = '';
            var self = handler.qualityCheck;
            if (data && data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    if (i == 0) {
                        html += one.replace(/___id/,data[i]._id)
                            .replace(/__checked/,'checked')
                            .replace(/__name/,data[i].TASK_NAME);
                        if (isremove) {
                            var task_id = {taskTemplate : data[i]._id};
                            self.quality_check(task_id);
                        }
                    } else {
                        html += one.replace(/___id/,data[i]._id).replace(/__name/,data[i].TASK_NAME);
                    }
                }
            } else {
                $('#condition_for_task').find('input').val('');
                $('#task_select_agents').html('');
                $("#condition_for_task").hide();
                $('#condition_for_quality_Check').show();
            }
            if (data && data.length == 0 && isremove) {
                DS.updatePagination('qualityCheckQueryFrm', 0, handler.cdr.queryPageSize, 1);
                render.qualityCheck.renderQualityCallSheetTable([],'quality_check_query');
            }
            $('#qualityCheckTaskTemplates').html('').html(html);
            var taskTemplateId = $("#qualityCheckTaskTemplates").find('input[type="radio"]:checked').val();
            if (taskTemplateId && $('#quality_task_random_checkbox').is(":checked")) {
                handler.qualityCheck.getTaskTemplate(taskTemplateId);
                $('#callSheetQualityCheckQueryBtn_reset').hide();
            }
        });
    },
    initQualityCheckRandomRadio : function(randomTemplate){
        var templates = null;
        var action = {
            action : 'app.qualityCheck.getQualityCheckRandomTemplates'
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('质检抽查模板加载失败！');
                return;
            }
            templates = res.list;
            handler.qualityCheck.randomTemplate = templates;
            if(randomTemplate == 'remove'){
                handler.qualityCheck.changeQualityCheckRandomTemplate('remove');
                if(!templates || templates.length == 0){
                    DS.updatePagination('qualityCheckQueryFrm', 0, handler.cdr.queryPageSize, 1);
                    render.qualityCheck.renderQualityCallSheetTable([],'quality_check_query');
                }
            }else if(randomTemplate){
                if(!templates || templates.length == 0){
                    return '请配置质检模板！';
                }
            }else{
                handler.qualityCheck.changeQualityCheckRandomTemplate('qualityCheckRandomTemplates');
                if(!templates || templates.length == 0){
                    return '请配置质检模板！';
                }
            }


            var one = '<input type="radio" name="randomTemplate" class="qualityCheckRadio" value="___id" __checked>__name&nbsp;&nbsp;&nbsp;';
            var html = '';
            if (templates.length == 0) {
                $('#condition_for_quality').find('input').val('');
            }
            for(var i=0 ; i<templates.length ; i++){
                if(randomTemplate && randomTemplate != 'remove'){
                    if(templates[i]._id == randomTemplate) {
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'checked')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                    }else{
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                    }
                }else{
                    if(i == 0) {
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'checked')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                        if(randomTemplate == 'remove'){
                            var data = {randomTemplate : templates[i]._id};
                            var self = handler.qualityCheck;
                            self.quality_check(data);
                        }

                    }else{
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                    }
                }
            }

            $('#qualityCheckRandomTemplates').html(html);
            var taskTemplateId = $("#qualityCheckRandomTemplates").find('input[type="radio"]:checked').val();
            if (taskTemplateId && $('#quality_record_random_checkbox').is(":checked")) {
                handler.qualityCheck.getQualityTemplate(taskTemplateId);
                $('.random_btn').show();//重新抽取按钮
            } else {
                $('.random_btn').hide();//重新抽取按钮
            }
        });
    },
    changeQualityCheckRandomTemplate : function(data,flag){
        if(data == 'qualityCheckRandomTemplates'){
            $('#callSheetQualityCheckQueryBtn').click();
        }
        $('#quality_myqueue').html("");
        $('#quality_myqueue_input').show();
        $('#quality_connect_type').html("");
        $('#quality_connect_type_input').show();
        $('#random_select_agents').html("");
        $('#random_select_agents_input').show();
        $('#random_checkbox_junior').removeAttr("checked");

    },
    getQualityCheckCallSheet: function(data, cdrId, callback) {
        var self = handler.qualityCheck;
        var randomTemplate = data.randomTemplate;
        data.pageSize = handler.cdr.queryPageSize;
        data.cdrId = cdrId;
        var action = {
            action : 'app.qualityCheck.getQualityCheckCallSheet',
            data : data
        }
        DS.send(action,function(res){
            if(!res.success){
                if(cdrId == 'quality_check_query_random_template_addAndSelect' && res.code == 0){
                    alert(res.message);
                    return;
                }
                alert('系统获取不到需要评分的记录');
                return;
            }

            self.currentQueryAction = action;
            self.currentQualityCheckCallSheets = res.list;

            if(cdrId == 'quality_check_query_random' || cdrId == 'quality_check_query_random_template_addAndSelect' || cdrId == 'quality_check_query_task'){
                if(res.countAll==0){
                    if(cdrId == 'quality_check_query_random_template_addAndSelect'){
                        $().alertmessage('showError','没有符合条件的通话记录！');
                        return;
                    }else if(cdrId == 'quality_check_query_random'){
                        if(self.randomFlag == 'query')
                            $().alertmessage('showError','未抽取对应条件的通话记录！');
                        else if(self.randomFlag == 'random')
                            $().alertmessage('showError','没有符合条件的通话记录！');
                    }

                }
                if (cdrId == 'quality_check_query_task') {
                    $('#qualityMonitorQueryFrm').find('input').val('');
                    $('#qualityMonitorQueryFrm').find('a[class = "button ds_form_action"]').click();//质检监测页面查询按钮模拟点击
                }
                $(".quality_check_random_progress").text((res.count?res.count:0) + "/" + (res.countAll?res.countAll:0));
                if(!res.count){
                    res.count = 0;
                }
                cdrId = 'quality_check_query'
            }
            if ($('#quality_task_random_checkbox').is(":checked")) {
                $('#quality_check_random_table').hide();
                $('#quality_check_task_table').show();
            } else {
                $('#quality_check_task_table').hide();
                $('#quality_check_random_table').show();
            }
            if (res.selectedId) {
                $('#selected_id').val('');
                $('#selected_id').val(res.selectedId);
            }
            if (res.condition && getCache("qualityConditionTemplates").indexOf(res.condition) == -1) {
                session.dicMap.qualityConditionTemplates.push(res.condition);
            }
            if(res.randomTemplate) {
                randomTemplate = res.randomTemplate;
            }
            render.qualityCheck.renderQualityCallSheetTable(res.list,cdrId,randomTemplate);
            callback(res);
        });
    },
    qualityCheckPaginationToChange: function(data,src){
        var page = src.val() || 1;
        data.page = page;
        handler.cdr.callSheetQualityCheck.getQualityCheckCallSheet(data,'quality_check_query',function(res){
            $(".class_list span.quality_check_result_count").text(res.count);
            var list = $(".class_list #quality_check_query_index li");
            updatePagination(list, res.count, handler.cdr.cdrPageSize, page);
        });
    },
    qualityCheckListPaginationToChange: function(data, src) {
        var page = src.val() || 1;
        data.page = page;
        handler.cdr.callSheetQualityCheck.queryQualityCheckList(data);
    },
    againGrade:function (data) {
        var action = {
            action : 'app.qualityCheck.getQualityedCheckCallSheet',
            data : data
        }

        DS.send(action,function(res){
            if (res.success) {
                DS.getView('qualityCheck/show_quality_check_cdr_business_detail', function(view){
                    DS.getView('qualityCheck/call_sheet_grade', function(otherInfoView){
                        showCdrTel(res.data);
                        var investigate=getinvestigate();
                        var investiageNum=res.data.INVESTIGATE;
                        if(investiageNum){
                            for(var i=0 in investigate.options){
                                var invData=investigate.options[i]
                                for(var j=0;j<invData.options.length;j++){
                                    if(invData.options[j].name==investiageNum){
                                        res.data.INVESTIGATENAME=invData.name;
                                    }
                                }
                            }
                        }else{
                            res.data.INVESTIGATENAME='';
                        }
                        var html ='';
                        html += view.replace('__callSheetOtherInfo', otherInfoView)
                            .replace('__AUDIO_AUTO_PLAY','autoplay="autoplay"');
                        html = DS.renderMethodViewNew(html, res.data);
                        html = html.replace(/__CALL_SHEET_GRADE_CONFIG/g, render.qualityCheck.renderCallSheetGradeTable());
                        var panel = $('#modal_panel');
                        panel.empty();
                        panel.append(html);
                        $('#cdrDetailCloseBtn').attr('ds_data', 'qualityCheck.closeCallSheetGradeDetail');
                        panel.find('#callSheetOtherInfoPanel').show();
                        var _height = $(document).height();
                        $('#show_cdr_detail_Modal').modal({'backdrop':'static'}).css({'width':750,'max-height':_height*0.8}).find('.modal-body').css('max-height',_height*0.8-131);
                        handler.qualityCheck.recordListenLog(res.data.CALL_SHEET_ID);
                        $('#callSheetGradeTable tr').each(
                            function(){
                                $(this).show();
                                $(this).find('b').attr('class','caret-bottom');
                            }
                        );

                        $("#isre").hide();
                        $('#isagain').show();
                        var checkedview = handler.qualityCheck.currentQualityedCheckCallSheets;
                        var config =  handler.config.qualityCheck.getQualityCheckConfigs();
                        for(var one_checkedview in checkedview){
                            if(checkedview[one_checkedview]._id == res.data.CALL_SHEET_ID){
                                $('textarea[name=COMMENTS]').text(checkedview[one_checkedview].COMMENTS);
                                for(var checkedoption in checkedview[one_checkedview].GRADE_AMOUNT){
                                    var inputSelected = $('input[name='+checkedoption+'][value='+checkedview[one_checkedview].GRADE_AMOUNT[checkedoption]+']');
                                    inputSelected.attr("checked",'checked');
                                    inputSelected.siblings('input[type="hidden"]').val(inputSelected.val());
                                }
                                if (checkedview[one_checkedview].GRADE_AMOUNT.amount == 'no') {
                                    $('#gradeAmount').html('不通过');
                                } else if (checkedview[one_checkedview].GRADE_AMOUNT.amount == 'yes') {
                                    $('#gradeAmount').html('通过');
                                } else {
                                    $('#gradeAmount').html('不涉及');
                                }
                                if ((checkedview[one_checkedview].GRADE_AMOUNT || checkedview[one_checkedview].GRADE_AMOUNT==0)
                                    && $.isNumeric(checkedview[one_checkedview].GRADE_AMOUNT)) {
                                    $('#callSheetGradeTable').find('input[class^="input-small call_sheet_grade"]').each(
                                        function(){
                                            var name = ($(this).attr('name'));
                                            var grade = parseFloat(checkedview[one_checkedview][name]);
                                            $('#gradeAmount').html(checkedview[one_checkedview].GRADE_AMOUNT);
                                            for (var ind in config) {
                                                if (config[ind].order == $(this).attr('name')) {
                                                    var percent = config[ind].weight;
                                                    percent = parseFloat(percent);
                                                    var str = Math.round(grade*100/percent)
                                                    $(this).val(str);
                                                }
                                            }
                                        }
                                    );
                                }
                            }
                        }

                        $(".fatal_warning").tooltip({trigger:'hover',html:true,title:'致命项，如果评分低于60则总分为0！'});
                        $(".fatal_warning_grade").tooltip({trigger:'hover',html:true});
                        //show call business info
                        var callBack = function(err, list) {
                            var content = $("#callSheetQualityCheckBusinessInfo");
                            content.empty();
                            if(!err) {
                                if(list.length != 0) {
                                    DS.getView('qualityCheck/quality_check_business_item',function(view) {
                                        var val = "";
                                        for(var i = 0; i < list.length; i++) {
                                            val = render.renderBusinessActiveHistory(list[i],view);
                                        }
                                        content.append(val);
                                    });
                                } else {
                                    content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                                }
                            } else
                                content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
                        }
                        handler.business.getCustomerHistoryBusinessByCallId(res.data.CUSTOMER_ID, res.data.CALL_SHEET_ID, callBack);
                    });
                });
            }
        });
    },
    updateCallGrade : function (data) {
        var self = handler.qualityCheck;
        var comments = data.COMMENTS;
        var callSheetID = data.callSheetID;
        var grade = $('#gradeAmount').text();
        grade = parseFloat(grade);
        if ($.isNumeric(grade)) {
            var gradeInputs = $('#callSheetGradeTable .call_sheet_grade');
            var gradeInput = null;
            for(var i= 0,len = gradeInputs.length;i<len;i++) {
                gradeInput = gradeInputs[i];
                if(!self.validateGrade($(gradeInput))){
                    $(gradeInput).focus();
                    return false;
                }
            }
        } else {
            var flog = true;
            $('#callSheetGradeTable').find('input[type="radio"]').each(
                function(){
                    var name = ($(this).attr('name'))
                    if (!data[name]) {
                        flog = false;
                    }
                }
            );
            if (!flog) {
                alert('当前存在没有结果的质检项！');
                return false;
            }
            for (var i=1; 1 < 2;i++) {
                var grade = "config_name_"+i;
                if (data[grade]) {
                    if (data[grade] == "no") {
                        data.amount = "no";
                        break;
                    } else if (data[grade] == "yes") {
                        data.amount = "yes";
                    }
                } else {
                    break;
                }
            }
            if (!data.amount) {
                data.amount = "dont";
            }
        }
        delete data.callSheetID;
        delete data.COMMENTS;
        delete data.disposalAgent;
        delete data.offeringTime;
        var againgrade = {};
        againgrade._id = callSheetID;
        againgrade.COMMENTS = comments;
        if ($.isNumeric(grade)) {
            for (var ind in self.currentGrade) {
                againgrade[ind] = self.currentGrade[ind];
            }
            againgrade.GRADE_AMOUNT = grade;
            againgrade.type = "grade";
        } else {
            againgrade.GRADE_AMOUNT = data;
        }
        var action = {
            action: 'app.qualityCheck.updateCallGrade',
            data: {
                GRADE_DATA: againgrade
            }
        }
        DS.send(action, function(res){
            if (!res.success) {
                alert("重新评分失败！");
                return false;
            }
            $().alertmessage('showSuccess','重新评分成功！');
            $('#cdrDetailCloseBtn').click();
            $('#callSheetQualityCheckListQueryBtn').click();
        });
    },
    showGradeedDetail : function(data){
        var action = {
            action : 'app.qualityCheck.getQualityedCheckCallSheet',
            data : data
        }

        DS.send(action,function(res){
            if (res.success) {
                DS.getView('qualityCheck/show_quality_check_cdr_business_detail', function(view){
                    DS.getView('qualityCheck/call_sheet_grade', function(otherInfoView){
                        showCdrTel(res.data);
                        var investigate=getinvestigate();
                        var investiageNum=res.data.INVESTIGATE;
                        if(investiageNum){
                            for(var i=0 in investigate.options){
                                var invData=investigate.options[i]
                                for(var j=0;j<invData.options.length;j++){
                                    if(invData.options[j].name==investiageNum){
                                        res.data.INVESTIGATENAME=invData.name;
                                    }
                                }
                            }

                        }else{
                            res.data.INVESTIGATENAME='';
                        }
                        var html ='';
                        html += view.replace('__callSheetOtherInfo', otherInfoView)
                            .replace('__AUDIO_AUTO_PLAY','autoplay="autoplay"');
                        html = DS.renderMethodViewNew(html, res.data);
                        html = html.replace(/__CALL_SHEET_GRADE_CONFIG/g, render.qualityCheck.renderCallSheetGradeTable());
                        var panel = $('#modal_panel');
                        panel.empty();
                        panel.append(html);
                        $('.task_table_td input[type=radio]').attr('disabled','disabled');
                        $('#cdrDetailCloseBtn').attr('ds_data', 'qualityCheck.closeCallSheetGradeDetail');
                        panel.find('#callSheetOtherInfoPanel').show();
                        var _height = $(document).height();
                        $('#show_cdr_detail_Modal').modal({'backdrop':'static'}).css({'width':750,'max-height':_height*0.8}).find('.modal-body').css('max-height',_height*0.8-131);
                        handler.qualityCheck.recordListenLog(res.data.CALL_SHEET_ID);
                        /*$('#callSheetGradeTable .task_table').each(
                            function(){
                                $(this).trigger('click');
                            }
                        );*/
                        $('#callSheetGradeTable tr').each(
                            function(){
                                $(this).show();
                                $(this).find('b').attr('class','caret-bottom');
                            }
                        );

                        $("#isre").hide();
                        var checkedview = handler.qualityCheck.currentQualityedCheckCallSheets;
                        for(var one_checkedview in checkedview){
                            if(checkedview[one_checkedview]._id == res.data.CALL_SHEET_ID){
                                $('textarea[name=COMMENTS]').prop("disabled",true);
                                $('textarea[name=COMMENTS]').text(checkedview[one_checkedview].COMMENTS);
                                for(var checkedoption in checkedview[one_checkedview].GRADE_AMOUNT){
                                    $('input[name='+checkedoption+'][value='+checkedview[one_checkedview].GRADE_AMOUNT[checkedoption]+']').attr("checked",'checked');
                                }
                                if (checkedview[one_checkedview].GRADE_AMOUNT.amount == 'no') {
                                    $('#gradeAmount').html('不通过');
                                } else if (checkedview[one_checkedview].GRADE_AMOUNT.amount == 'yes') {
                                    $('#gradeAmount').html('通过');
                                } else {
                                    $('#gradeAmount').html('不涉及');
                                }
                            }
                        }

                        $(".fatal_warning").tooltip({trigger:'hover',html:true,title:'致命项，如果评分低于60则总分为0！'});
                        $(".fatal_warning_grade").tooltip({trigger:'hover',html:true});
                        //show call business info
                        var callBack = function(err, list) {
                            var content = $("#callSheetQualityCheckBusinessInfo");
                            content.empty();
                            if(!err) {
                                if(list.length != 0) {
                                    DS.getView('qualityCheck/quality_check_business_item',function(view) {
                                        var val = "";
                                        for(var i = 0; i < list.length; i++) {
                                            val = render.renderBusinessActiveHistory(list[i],view);
                                        }
                                        content.append(val);
                                    });
                                } else {
                                    content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                                }
                            } else
                                content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
                        }
                        handler.business.getCustomerHistoryBusinessByCallId(res.data.CUSTOMER_ID, res.data.CALL_SHEET_ID, callBack);
                    });
                });
                console.log('pushSocketLogined request failure: ' + res.message);
                return;
            }
        });
    },
    showGradeDetail : function(data){
        var templates = getCache('qualityCheckTemplates');
        if(templates.length == 0){
             alert('您还没有质检模板！不能进行质检！');
             return;
        }
        var self = handler.qualityCheck;
        // clear currentGrade
        self.currentGrade = {};
        // init qualityCheckCallSheetCache and qualityCheckCallSheetIndex
        var currentIndex = -1;
        var callSheet = null;
        self.currentQualityCheckCallSheetIndex = {};
            for (var i = 0, len = self.currentQualityCheckCallSheets.length; i < len; i++) {
                callSheet = self.currentQualityCheckCallSheets[i];
                if (callSheet['CALL_SHEET_ID'] == data) {
                    currentIndex = i;
                }
                self.currentQualityCheckCallSheetIndex[callSheet['CALL_SHEET_ID']] = callSheet;
            }
            self.currentQualityCheckCallSheets.splice(0, currentIndex);
            self.showGradeDetailInCache(data);
    },
    closeCallSheetGradeDetail: function(){
        var self = handler.qualityCheck;
        self.qualityCheckMsgFlag = false;
        if ($("#view_nav_qualityCheck").find("ul[class='new-nav-tabs config_tab quality_check_tab']").find("li").first().hasClass("active")) {
            $('#callSheetQualityCheckQueryBtn').trigger('click');
        }
        self.qualityCheckMsgFlag = true;
    },
    showGradeDetailInCache : function(data){
        // get callSheet data in cache ,so callSheetID param not need.
        var dataObject = {
            callSheetID : data,
            getDataMethod : handler.qualityCheck.getCallSheetGrade,
            otherInfoViewName : 'qualityCheck/call_sheet_grade'
        }
        handler.qualityCheck.showDetail(dataObject);
    },
    showDetailview : function(data,config,type, isTask, templateId){
        DS.getView('qualityCheck/show_quality_check_cdr_business_detail', function(view){
            DS.getView(data.otherInfoViewName, function(otherInfoView){
                data.getDataMethod(data.callSheetID, function(res){
                    showCdrTel(res.cdr);
                    var investigate=getinvestigate();
                    var investiageNum=res.cdr.INVESTIGATE;
                    if(investiageNum){
                        for(var i=0 in investigate.options){
                            var invData=investigate.options[i]
                            for(var j=0;j<invData.options.length;j++){
                                if(invData.options[j].name==investiageNum){
                                    res.cdr.INVESTIGATENAME=invData.name;
                                }
                            }
                        }
                    }else{
                        res.cdr.INVESTIGATENAME='';
                    }
                    var html ='';
                    html += view.replace('__callSheetOtherInfo', otherInfoView)
                        .replace('__AUDIO_AUTO_PLAY',res.recordAutoPlay);
                    html = DS.renderMethodViewNew(html, res.cdr);
                    html = html.replace(/__CALL_SHEET_GRADE_CONFIG/g, render.qualityCheck.renderCallSheetGradeTable(config,type,isTask));
                    var panel = $('#modal_panel');
                    panel.empty();
                    panel.append(html);
                    $('#cdrDetailCloseBtn').attr('ds_data', 'qualityCheck.closeCallSheetGradeDetail');
                    panel.find('#callSheetOtherInfoPanel').show();
                    var _height = $(document).height();
                    $('#show_cdr_detail_Modal').modal({'backdrop':'static'}).css({'width':800,'max-height':_height*0.8}).find('.modal-body').css('max-height',_height*0.8-131);
                    handler.qualityCheck.recordListenLog(res.cdr.CALL_SHEET_ID);
                    $('#hide_pass_template').val(templateId);
                    $(".fatal_warning").tooltip({trigger:'hover',html:true,title:'致命项，如果评分低于60则总分为0！'});
                    $(".fatal_warning_grade").tooltip({trigger:'hover',html:true});
                    //show call business info
                    var callBack = function(err, list) {
                        var content = $("#callSheetQualityCheckBusinessInfo");
                        content.empty();
                        if(!err) {
                            if(list.length != 0) {
                                DS.getView('qualityCheck/quality_check_business_item',function(view) {
                                    var val = "";
                                    for(var i = 0; i < list.length; i++) {
                                        val = render.renderBusinessActiveHistory(list[i],view);
                                    }
                                    content.append(val);
                                });
                            } else {
                                content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                            }
                        } else
                            content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
                    }
                    handler.business.getCustomerHistoryBusinessByCallId(res.cdr.CUSTOMER_ID, res.cdr.CALL_SHEET_ID, callBack);
                });
            });
        });
    },
    showDetail :function (data) {
        var task_id =$('#quality_check_query_table_data').find('input[class="quality_call_task_id"]').val();
        if (task_id) {
            handler.config.qualityCheck.getQualityTaskTemplateConfig(data.callSheetID, function (res) {
                handler.qualityCheck.showDetailview(data,res.config,res.type, true, res._id);
                handler.qualityCheck.taskTemplateConfig = res.config;
                handler.qualityCheck.taskTemplateType= res.type;
                handler.qualityCheck.taskTemplateId= res._id;
            });
        } else {
            handler.qualityCheck.showDetailview(data);
        }
    },
    getCallSheetGrade: function(data,callback){
        var currentCallSheet = handler.qualityCheck.currentQualityCheckCallSheets[0];
        callback({
            cdr: currentCallSheet,
            callSheetGrade: true,
            recordAutoPlay: 'autoplay="autoplay"'
        });
    },
    showNextCallSheetGrade: function(){
        var dataObject = {
            callSheetID : '',
            getDataMethod : handler.qualityCheck.getCallSheetGrade,
            otherInfoViewName : 'qualityCheck/call_sheet_grade'
        }
        handler.qualityCheck.showNextCallSheetGradeDetail(dataObject);
    },
    showNextCallSheetGradeDetail : function(data){
        DS.getView('qualityCheck/call_sheet_grade_item', function(view){
            DS.getView(data.otherInfoViewName, function(otherInfoView){
                data.getDataMethod(data.callSheetID, function(res){
                    showCdrTel(res.cdr);
                    var investigate=session.dicMap.investigate;
                    var investiageNum=res.cdr.INVESTIGATE;
                    if(investiageNum){
                        for(var i=0;i<investigate.length;i++){
                            if(investigate[i].code_order==investiageNum){
                                res.cdr.INVESTIGATE=investigate[i].code_name;
                            }
                        }
                        if(!investigate){
                            res.data.INVESTIGATE='';
                        }
                    }else{
                        res.cdr.INVESTIGATE='';
                    }
                    var html ='';
                    html += view.replace('__callSheetOtherInfo', otherInfoView)
                        .replace('__AUDIO_AUTO_PLAY',res.recordAutoPlay);
                    html = DS.renderMethodViewNew(html, res.cdr);
                    var config = handler.qualityCheck.taskTemplateConfig;
                    var type = handler.qualityCheck.taskTemplateType;
                    var templateId = handler.qualityCheck.taskTemplateId;
                    var task_name = $('#quality_check_query_table_data').find('input[class="quality_call_task_id"]').val();
                    if (task_name) {
                        html = html.replace(/__CALL_SHEET_GRADE_CONFIG/g, render.qualityCheck.renderCallSheetGradeTable(config,type,true));
                    } else {
                        html = html.replace(/__CALL_SHEET_GRADE_CONFIG/g, render.qualityCheck.renderCallSheetGradeTable());
                    }
                    var panel = $('#modal_panel').find('#cdr_detail_wrapper');
                    panel.empty();
                    panel.append(html);
                    $('#modal_panel .input_first').focus();
                    if (task_name) {
                        $('#hide_pass_template').val(templateId);
                    }
                    handler.qualityCheck.recordListenLog(res.cdr.CALL_SHEET_ID);
                    //show call business info
                    var callBack = function(err, list) {
                        var content = $("#callSheetQualityCheckBusinessInfo");
                        content.empty();
                        if(!err) {
                            if(list.length != 0) {
                                DS.getView('qualityCheck/quality_check_business_item',function(view) {
                                    var val = "";
                                    for(var i = 0; i < list.length; i++) {
                                        val = render.renderBusinessActiveHistory(list[i],view);
                                    }
                                    content.append(val);
                                });
                            } else {
                                content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                            }
                        } else
                            content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
                    }
                    handler.business.getCustomerHistoryBusinessByCallId(res.cdr.CUSTOMER_ID, res.cdr.CALL_SHEET_ID, callBack);
                });
            });
        });
    },
    getMoreQualityCheckCallSheet: function(){
        var self = handler.qualityCheck;
        var action = self.currentQueryAction;
        action.data = $.evalJSON(action.data);
        if(action.data.cdrId == 'quality_check_query_random'){
            action.data.reset = false;
        }
        var lastCallSheet = self.currentQualityCheckCallSheets[self.currentQualityCheckCallSheets.length - 1];
        if(lastCallSheet) {
            action.data.OFFERING_TIME = {"$lt": lastCallSheet.OFFERING_TIME};
            DS.send(action,function(res){
                delete action.OFFERING_TIME;
                if(!res.success){
                    return;
                }
                if(res.list && res.list.length > 0){
                    var callSheet = null;
                    for(var i= 0,len=res.list.length;i<len;i++) {
                        callSheet = res.list[i];
                        self.currentQualityCheckCallSheetIndex[callSheet['CALL_SHEET_ID']] = callSheet;
                    }
                    self.currentQualityCheckCallSheets = self.currentQualityCheckCallSheets.concat(res.list);
                }
            });
        }
    },
    getMoreQualityTaskCall: function(){
        var self = handler.qualityCheck;
        var task_id =$('#quality_check_query_table_data').find('input[class="quality_call_task_id"]').val();
        var action = {
            action: 'app.qualityCheck.selectedMorrCallRecord',
            data: {
                task_id :task_id
            }
        }
        var lastCallSheet = self.currentQualityCheckCallSheets[self.currentQualityCheckCallSheets.length - 1];
        if(lastCallSheet) {
            action.data.OFFERING_TIME = {"$lt": lastCallSheet.OFFERING_TIME};
            DS.send(action,function(res){
                delete action.OFFERING_TIME;
                if(!res.success){
                    return;
                }
                if(res.list && res.list.length > 0){
                    var callSheet = null;
                    for(var i= 0,len=res.list.length;i<len;i++) {
                        callSheet = res.list[i];
                        self.currentQualityCheckCallSheetIndex[callSheet['CALL_SHEET_ID']] = callSheet;
                    }
                    self.currentQualityCheckCallSheets = self.currentQualityCheckCallSheets.concat(res.list);
                }
            });
        }
    },
    saveCallShellGrade : function (data) {
        var self = handler.qualityCheck;
        var comments = data.COMMENTS;
        var callSheetID = data.callSheetID;
        var flog = true;
        $('#callSheetGradeTable').find('input[type="radio"]').each(
            function(){
                var name = ($(this).attr('name'))
                if (!data[name]) {
                    flog = false;
                }
            }
        );
        if (!flog) {
            alert('当前存在没有结果的质检项！');
            return false;
        }
        var pass_template = $('#hide_pass_template').val();
        for (var i=1; 1 < 2;i++) {
            var grade = "config_name_"+i;
            if (data[grade]) {
                if (data[grade] == "no") {
                    data.amount = "no";
                    break;
                } else if (data[grade] == "yes") {
                    data.amount = "yes";
                }
            } else {
                break;
            }
        }
        if (!data.amount) {
            data.amount = "dont";
        }
        delete data.callSheetID;
        delete data.COMMENTS;
        delete data.disposalAgent;
        delete data.offeringTime;


        var currentCallSheet = self.currentQualityCheckCallSheetIndex[callSheetID];
        self.currentGrade._id = callSheetID;
        self.currentGrade.OFFERING_TIME = currentCallSheet.OFFERING_TIME;
        self.currentGrade.DISPOSAL_AGENT = currentCallSheet.DISPOSAL_AGENT;
        self.currentGrade.CALL_NO = currentCallSheet.CALL_NO;
        self.currentGrade.CALLED_NO = currentCallSheet.CALLED_NO;
        self.currentGrade.CONNECT_TYPE = currentCallSheet.CONNECT_TYPE;
        self.currentGrade.ERROR_MEMO = currentCallSheet.ERROR_MEMO;
        self.currentGrade.CALL_TIME_LENGTH = currentCallSheet.CALL_TIME_LENGTH;
        self.currentGrade.FILE_SERVER = currentCallSheet.FILE_SERVER;
        self.currentGrade.RECORD_FILE_NAME = currentCallSheet.RECORD_FILE_NAME;
        self.currentGrade.INVESTIGATE = currentCallSheet.INVESTIGATE;
        self.currentGrade.GRADE_AMOUNT = data;
        if (pass_template) {
            self.currentGrade.TEMPLATE = pass_template;
        } else {
            self.currentGrade.TEMPLATE = self.currentTemplate._id;
        }
        var action = {
            action: 'app.qualityCheck.saveCallShellGrade',
            data: {
                CALL_SHEET_ID: callSheetID,
                QUALITY_GRADE: data,
                COMMENTS: comments,
                GRADE_DATA: self.currentGrade
            }
        }
        DS.send(action, function(res){
            if (res.success){
                self.currentQualityCheckCallSheets.shift();
                delete self.currentQualityCheckCallSheetIndex[data.callSheetID];
                self.currentGrade = {};
                if(self.currentQualityCheckCallSheets.length <= 0) {
                    alert('已完成全部评分。');
                    $('#show_cdr_detail_Modal').modal('hide');
                    $('#callSheetQualityCheckQueryBtn').trigger('click');
                } else {
                    if(self.currentQualityCheckCallSheets.length < 5) {
                        var task_id =$('#quality_check_query_table_data').find('input[class="quality_call_task_id"]').val();
                        if (task_id) {
                            setTimeout(self.getMoreQualityTaskCall, 1000);
                        }else {
                            setTimeout(self.getMoreQualityCheckCallSheet, 1000);
                        }
                    }
                    self.showNextCallSheetGrade();
                    $().alertmessage('showSuccess','评分成功！请评价下一条。');
                }
            } else {
                alert('保存评分失败，请重新保存!');
                return false;
            }
        });
    },
    saveCallSheetGrade: function(data) {
        var self = handler.qualityCheck;
        var grade = $('#gradeAmount').text();
        grade = parseFloat(grade);
        if(!$.isNumeric(grade)) {
            alert('保存失败：当前总分无效');
            return false;
        }
        var gradeInputs = $('.callSheetGradeTable .call_sheet_grade');
        var gradeInput = null;
        var pass_template = $('#hide_pass_template').val();

        for(var i= 0,len = gradeInputs.length;i<len;i++) {
            gradeInput = gradeInputs[i];
            if(!self.validateGrade($(gradeInput))){
                $(gradeInput).focus();
                return false;
            }
        }
        var callSheetID = data.callSheetID;
        var currentCallSheet = self.currentQualityCheckCallSheetIndex[callSheetID];
        self.currentGrade._id = callSheetID;
        self.currentGrade.OFFERING_TIME = currentCallSheet.OFFERING_TIME;
        self.currentGrade.DISPOSAL_AGENT = currentCallSheet.DISPOSAL_AGENT;
        self.currentGrade.CALL_NO = currentCallSheet.CALL_NO;
        self.currentGrade.CALLED_NO = currentCallSheet.CALLED_NO;
        self.currentGrade.CONNECT_TYPE = currentCallSheet.CONNECT_TYPE;
        self.currentGrade.ERROR_MEMO = currentCallSheet.ERROR_MEMO;
        self.currentGrade.CALL_TIME_LENGTH = currentCallSheet.CALL_TIME_LENGTH;
        self.currentGrade.FILE_SERVER = currentCallSheet.FILE_SERVER;
        self.currentGrade.RECORD_FILE_NAME = currentCallSheet.RECORD_FILE_NAME;
        self.currentGrade.INVESTIGATE = currentCallSheet.INVESTIGATE;
        self.currentGrade.GRADE_AMOUNT = grade;
        self.currentGrade.COMMENTS = data.COMMENTS;
        if (pass_template) {
            self.currentGrade.TEMPLATE = pass_template;
        } else {
            self.currentGrade.TEMPLATE = self.currentTemplate._id;
        }
        var action = {
            action: 'app.qualityCheck.saveCallSheetGrade',
            data: {
                CALL_SHEET_ID: data.callSheetID,
                QUALITY_GRADE: grade,
                COMMENTS: data.COMMENTS,
                GRADE_DATA: self.currentGrade
            }
        }
        DS.send(action, function(res){
            if(res.success) {
                self.currentQualityCheckCallSheets.shift();
                delete self.currentQualityCheckCallSheetIndex[data.callSheetID];
                self.currentGrade = {};
                if(self.currentQualityCheckCallSheets.length <= 0) {
                    alert('已完成全部评分。');
                    $('#show_cdr_detail_Modal').modal('hide');
                    $('#callSheetQualityCheckQueryBtn').trigger('click');
                } else {
                    if(self.currentQualityCheckCallSheets.length < 5) {
                        var task_id =$('#quality_check_query_table_data').find('input[class="quality_call_task_id"]').val();
                        if (task_id) {
                            setTimeout(self.getMoreQualityTaskCall, 1000);
                        } else {
                            setTimeout(self.getMoreQualityCheckCallSheet, 1000);
                        }
                    }
                    self.showNextCallSheetGrade();
                    $().alertmessage('showSuccess','评分成功！请评价下一条。');
                }
            } else {
                alert('保存评分失败，请重新保存');
                return false;
            }
        });
    },
    quality_check_query: function(data){
        if(handler.qualityCheck.currentTemplate==null||!handler.qualityCheck.currentTemplate.type){
            $(".pass_no").show();
            $(".normal_no").hide();
        }else{
            $(".normal_no").show();
            $(".pass_no").hide();
        }
        $('#qualityCheckTemplates input[type="radio"][checked!="checked"]').removeAttr("checked");
        render.qualityCheck.renderQualityCheckForQuery();
        handler.qualityCheck.queryCallSheetGradeResult(data);
    },
    queryCallSheetGradeResult: function(data,src){
        if(typeof data == 'string') {
            $('#qualityCheckAgentTemplates').html(handler.qualityCheck.initQualityCheckListRadio());
            if(handler.qualityCheck.currentTemplate != null){
                data = {TEMPLATE: handler.qualityCheck.currentTemplate._id};
            }else{
                var templates = getCache('qualityCheckTemplates');
                if(templates.length > 0){
                    data = {TEMPLATE: templates[0]._id};
                }else{
                    data = {};
                }
            }
        }
        if(src){
            data.page = src.val() || 1;
        }
        data.pageSize = handler.cdr.queryPageSize;
        var query = handler.cdr.getSearchCondition(data);
        var action = {
            action: 'app.qualityCheck.queryCallSheetGradeResult',
            data: query
        }
        DS.send(action, function(res){
            $('#quality_check_query_query_table_data').html('');
            if(res.success) {
                render.qualityCheck.renderQualityCheckResultTable(res);
            } else {
                alert('查询失败，请重新查询');
                return false;
            }
        });
    },
    exportCallSheetGradeResultExcel: function(data){
        var query = handler.cdr.getSearchCondition(data);
        query.accountId = session.user.account;
        query.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCallSheetGradeResult',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }
        });
    },
    quality_check_list_query: function(data) {
        handler.cdr.initCallSheetCondition('qualityCheckListQueryPanel');
        if(handler.qualityCheck.currentTemplate==null||!handler.qualityCheck.currentTemplate.type){
            $(".pass_no").show();
            $(".normal_no").hide();

        }else{
            $(".pass_no").hide();
            $(".normal_no").show();

        }
        if(data == 'quality_check_list_query'){

            $('#qualityCheckListTemplates').html(handler.qualityCheck.initQualityCheckListRadio());
            if(handler.qualityCheck.currentTemplate != null){
                data = {TEMPLATE: handler.qualityCheck.currentTemplate._id};
            }else{
                var templates = getCache('qualityCheckTemplates');
                if(templates.length > 0){
                    data = {TEMPLATE: templates[0]._id};
                }else{
                    data = {};
                }
            }
            if(handler.qualityCheck.currentTemplate.type == 'pass'){
                handler.qualityCheck.changeQcTemFloor(handler.qualityCheck.currentTemplate._id);
            }
        }
        $('#callSheetQualityCheckListQueryBtn').trigger('click');
    },
    queryQualityCheckList: function(data,src,session){
        data.TASK_ID = "";
        if($('#quality_check_list_task_name_input').val()!=''){
            data.TASK_ID = $('#quality_check_list_task_name_input').val();
        }
        if(data.DISPOSAL_AGENT!=''){
            data.DISPOSAL_AGENT=data.DISPOSAL_AGENT.split(/,/g);
            data.DISPOSAL_AGENT.shift();
        }
        if(data.GRADE_USER!=''){
            data.GRADE_USER=data.GRADE_USER.split(/,/g);
            data.GRADE_USER.shift();
        }
        if(data.ERROR_MEMO!=''){
            data.ERROR_MEMO=data.ERROR_MEMO.split(/,/g);
            data.ERROR_MEMO.shift();
        }
        if(data.CONNECT_TYPE!=''){
            data.CONNECT_TYPE=data.CONNECT_TYPE.split(/,/g);
            data.CONNECT_TYPE.shift();
        }


        if (data.CHECK_BEGIN_TIME && data.CHECK_END_TIME) {
            var arraySta = parseInt(data.CHECK_BEGIN_TIME.replace(/-/g,"").replace(/:/g,"").replace(/ /g,""));
            var arrayEnd= parseInt(data.CHECK_END_TIME.replace(/-/g,"").replace(/:/g,"").replace(/ /g,""));
            if(arrayEnd <= arraySta){
                $().alertmessage('showError','考核时间的开始时间必须小于结束时间！')
                return;
            }
        }
        if(data.CALL_TIME_LENGTH_BEGIN && data.CALL_TIME_LENGTH_END){
            var arraySta = parseInt(data.CALL_TIME_LENGTH_BEGIN);
            var arrayEnd= parseInt(data.CALL_TIME_LENGTH_END);
            if(arrayEnd <= arraySta){
                $().alertmessage('showError','请输入正确的通话时长范围！');
                return;
            }
        }else if(data.CALL_TIME_LENGTH_END == "0"){
            $().alertmessage('showError','请输入正确的通话时长范围！');
            return;
        }
        var maxGrade = $('#qualityCheckListQueryFrm select[name="GRADE_CONFIG"] option:selected').attr('ds_data');
        if(parseInt(data.GRADE_MIN) > parseInt(maxGrade) || parseInt(data.GRADE_MIN) < 0){
            $().alertmessage('showError','请输入正确的单项评分分数！');
            return;
        }
        if(parseInt(data.GRADE_MAX) > parseInt(maxGrade) || parseInt(data.GRADE_MAX) < 0){
            $().alertmessage('showError','请输入正确的单项评分分数！');
            return;
        }
        if(parseInt(data.GRADE_MAX)  < parseInt(data.GRADE_MIN)){
            $().alertmessage('showError','请输入正确的单项评分分数！');
            return;
        }
        data.pageSize = handler.cdr.queryPageSize;
        if(!src || src.val() == '') {
            data.page = 1;
        }else{
            data.page = src.val() || 1;
        }
        var query = handler.cdr.getSearchCondition(data);
        if(query.LEVEL){
            var curTemplate = handler.qualityCheck.currentTemplate;
            if(query.LEVEL == 'A'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['A-begin']) - 0.5};
            }else if(query.LEVEL == 'B'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['B-begin']) - 0.5, $lte: parseFloat(curTemplate['B-end']) + 0.4};
            }else if(query.LEVEL == 'C'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['C-begin']) - 0.5, $lte: parseFloat(curTemplate['C-end']) + 0.4};
            }else if(query.LEVEL == 'D'){
                query.GRADE_AMOUNT = {$lte: parseFloat(curTemplate['D-end']) + 0.4};
            }
            delete query.LEVEL;
        }
        var floors = data.floors;
        delete query.floors;
        var action = {
            action: 'app.qualityCheck.queryCallSheetGradeList',
            data: query
        }
        DS.send(action, function(res){
            handler.qualityCheck.currentQualityedCheckCallSheets=res.list;
            render.qualityCheck.renderQualityCheckListConfig(floors);
            $(".fatal_warning_show").tooltip({trigger:'hover',html:true,title:'致命项，如果评分低于60则总分为0！'});
            render.qualityCheck.renderQualityCheckList(res.list,floors);
            DS.updatePagination('qualityCheckListQueryFrm', res.count, handler.cdr.queryPageSize, data.page);
        });
    },
    exportQualityCheckListExcel : function(data){
        data.TASK_ID = "";
        if($('#quality_check_list_task_name_input').val()!=''){
            data.TASK_ID = $('#quality_check_list_task_name_input').val();
        }
        if(parseInt(data.GRADE_MIN) > 100 || parseInt(data.GRADE_MIN) < 0){
            alert("请输入正确的单项评分分数！");
            return;
        }
        if(parseInt(data.GRADE_MAX) > 100 || parseInt(data.GRADE_MAX) < 0){
            alert("请输入正确的单项评分分数！");
            return;
        }
        if(parseInt(data.GRADE_MAX) < parseInt(data.GRADE_MIN)){
            alert("请输入正确的单项评分分数！");
            return;
        }
        var query = handler.cdr.getSearchCondition(data);
        if(query.LEVEL){
            var curTemplate = handler.qualityCheck.currentTemplate;
            if(query.LEVEL == 'A'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['A-begin']) - 0.5};
            }else if(query.LEVEL == 'B'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['B-begin']) - 0.5, $lte: parseFloat(curTemplate['B-end']) + 0.4};
            }else if(query.LEVEL == 'C'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['C-begin']) - 0.5, $lte: parseFloat(curTemplate['C-end']) + 0.4};
            }else if(query.LEVEL == 'D'){
                query.GRADE_AMOUNT = {$lte: parseFloat(curTemplate['D-end']) + 0.4};
            }
            delete query.LEVEL;
        }
        query.accountId = session.user.account;
        query.type = 'QualityCheckListExport';
        query.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportQualityCheckList',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }
        });
    },
    queryQualityQueryRanking:function(data){
        data.TEMPLATE = handler.qualityCheck.currentTemplate._id;
        if(data.RANKING_AGENT!=''){
            data.RANKING_AGENT=data.RANKING_AGENT.split(/,/g);
            data.RANKING_AGENT.shift();
        }
        var action = {
            action : 'app.qualityCheck.agentRanking',
            data : data
        }
        DS.send(action,function(res){
            if(res.success){
                if(res.list||res.list.length !=0){
                    handler.qualityCheck._quickSort(res.list,0,res.list.length-1,res.type);
                }

                var rankinghead = $('#callSheetQualityCheckAgentRankingthead');
                var panel = $('#callSheetQualityCheckAgentRankingtbody');
                var rankingagenthtml = [];
                var rankingagenthead = [];
                if(res.type == "pass"){
                    rankingagenthead.push("<tr><td>排名</td><td>座席人员</td><td>通过率</td></tr>");
                }else{
                    rankingagenthead.push("<tr><td>排名</td><td>座席人员</td><td>平均得分</td></tr>");
                }
                rankinghead.html(rankingagenthead.join(""));
                for(var i = 0,len = res.list.length;i<len;i++){
                    for(var j= 0,selen = res.agentlist.length;j<selen;j++){
                        if(res.agentlist[j] == res.list[i].DISPOSAL_AGENT){
                            rankingagenthtml.push("<tr><td>"+parseInt(i+1)+"</td><td>"+getCache('agents',res.list[i].DISPOSAL_AGENT).displayName+"</td><td>"+res.list[i].all_cent+"</td></tr>");
                            continue;
                        }
                    }
                }
                panel.html(rankingagenthtml.join(""));
            }
        });
    },
    _quickSort:function(rankinglist, low,high,type) {

        if (low < high) {

            var middle = handler.qualityCheck.getMiddle(rankinglist, low, high,type);  //将list数组进行一分为二

            handler.qualityCheck._quickSort(rankinglist, low, middle-1,type);        //对低字表进行递归排序

            handler.qualityCheck._quickSort(rankinglist, middle+1, high,type);       //对高字表进行递归排序

        }
    },
    getMiddle:function (list,low,high,type) {
        var tmp =  list[low];    //数组的第一个作为中轴
        while (low < high) {
            if(type =='pass') {
                while (low < high && parseInt(list[high].all_cent.substr(0, list[high].all_cent.length - 1)) <= parseInt(tmp.all_cent.substr(0, tmp.all_cent.length - 1))) {
                    high--;
                }
                list[low] = list[high];   //比中轴小的记录移到低端
                while (low < high && parseInt(list[low].all_cent.substr(0, list[low].all_cent.length - 1)) >= parseInt(tmp.all_cent.substr(0, tmp.all_cent.length - 1))) {
                    low++;
                }
                list[high] = list[low];//比中轴大的记录移到高端
            }else{
                while (low < high && parseFloat(list[high].all_cent) <= parseFloat(tmp.all_cent)) {
                    high--;
                }
                list[low] = list[high];   //比中轴小的记录移到低端
                while (low < high && parseFloat(list[low].all_cent) >= parseFloat(tmp.all_cent)) {
                    low++;
                }
                list[high] = list[low];//比中轴大的记录移到高端
            }
        }
        list[low] = tmp;              //中轴记录到尾
        return low;                   //返回中轴的位置
},
    showQualityComments : function(data){
        DS.getView('qualityCheck/showQualityComments', function(view){
            var action = {
                action : 'app.qualityCheck.showQualityComments',
                data : data
            }
            DS.send(action,function(res){
                if(res.success){
                    var panel = $('#show_quality_comments_pane');
                    panel.empty();
                    panel.append(view.replace(/__QUALITY_COMMENTS/g,res.data));
                    $('#show_quality_comments_Modal').modal();
                }
            });
        });
    },
    changeQualityCheckTemplate : function(data){
        $("#quality_check_list_datetime_picker_start").val("");
        $("#quality_check_list_datetime_picker_end").val("");
        $("#check_datetime_picker_start").val("");
        $("#check_datetime_picker_end").val("");
        $(".input-append>input[name='CALL_TIME_LENGTH_BEGIN']").val("");
        $(".input-append>input[name='CALL_TIME_LENGTH_END']").val("");

        var templates = getCache('qualityCheckTemplates');
        if(data == 'qualityCheckTemplates'){
            var choiceId = $('#'+data).find("input[name='currentTemplate']:checked").val();
        }else{
            var choiceId = $('#'+data).find("input[name='TEMPLATE']:checked").val();
            $('#qualityCheckListQueryFrm input[name= "GRADE_MIN"]').attr('placeholder','0-100分');
            $('#qualityCheckListQueryFrm input[name= "GRADE_MAX"]').attr('placeholder','0-100分');
        }
        for(var i=0 ; i<templates.length ; i++){
            if(templates[i]._id == choiceId){
                handler.qualityCheck.currentTemplate = templates[i];
                break;
            }
        }
        $(".qualityCheckRadio[value='"+choiceId+"']").attr("checked",true);
        var curid=$("#"+data).closest("form").attr("id");
        $(curid+" a[ds_action='resetForm']").click();
        $("#qualityCheckListQueryFrm .callSheetQualityCheckListQueryResetHideBtn").click();
        $("#qualityCheckAgentQueryFrm a[ds_action='resetForm']").click();
        //if(handler.qualityCheck.currentTemplate.type == 'pass'){
        //    handler.qualityCheck.changeQcTemFloor(choiceId);
        //}
        handler.qualityCheck.quality_check_list_query('quality_check_list_query');
        handler.qualityCheck.quality_check_query('quality_check_query');
    },
    changeQcTemFloor :function(id){
            var qc_table = getCache('qualityCheckTemplates',id);
            var tem_floor = 1;
            for(var qc_tb_1 in qc_table.config){
                var op1_child=qc_table.config[qc_tb_1];
                for(var qc_one = 0;qc_one<op1_child.child.length;qc_one++){
                    if(tem_floor<2){tem_floor=2}
                    var op2_child = op1_child.child[qc_one];
                    for(var qc_two = 0;qc_two<op2_child.child.length;qc_two++){
                        if(tem_floor<3){tem_floor=3}
                        var op3_child = op2_child.child[qc_two];
                        for(var qc_three = 0;qc_three<op3_child.child.length;qc_three++){
                            if(tem_floor<4){tem_floor=4}
                            var op4_child = op3_child.child[qc_three];
                            for(var qc_four = 0;qc_four<op4_child.child.length;qc_four++){
                                if(tem_floor<5){tem_floor=5}
                                var op5_child = op4_child.child[qc_four];
                                for(var qc_five = 0;qc_five<op5_child.child.length;qc_five++){
                                    if(tem_floor<6){tem_floor=6}
                                    var op6_child = op5_child.child[qc_five];
                                    for(var qc_six = 0;qc_six<op6_child.child.length;qc_six++){
                                        if(tem_floor<7){tem_floor=7}
                                        var op7_child = op6_child.child[qc_six];
                                        for(var qc_seven = 0;qc_seven<op7_child.child.length;qc_seven++){
                                            if(tem_floor<8){tem_floor=8}
                                            var op8_child = op7_child.child[qc_seven];
                                            for(var qc_eight = 0;qc_eight<op8_child.child.length;qc_eight++){
                                                if(tem_floor<9){tem_floor=9}
                                                var op9_child = op8_child.child[qc_eight];
                                                for(var qc_nine = 0;qc_nine<op9_child.child.length;qc_nine++){
                                                    if(tem_floor<10){tem_floor=10}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            var ophtml = '';
            for(var k=1;k<=tem_floor;k++){
                ophtml += "<option value="+k+">"+k+"</option>"
            }
            $('#qualityCheckListQueryFrm #qc_query_in_floor').html(ophtml);
    },
    recordListenLog : function(data){
        var action = {
            action : 'app.qualityCheck.recordListenLog',
            data : {
                CALL_SHEET_ID : data
            }
        }
        DS.send(action,function(res){
            //ignore res
        });
    },
    showListenLog : function(data,src){
        var page = src.val() || 1;
        if(src.val() == ''){
            DS.getView('qualityCheck/showListenLog', function(view){
                view = view.replace(/__callSheetId/,data);
                var panel = $('#modal_panel');
                panel.empty();
                panel.append(view);
                $('#show_listen_log_Modal').modal();

                var action = {
                    action : 'app.qualityCheck.queryListenLog',
                    data : {
                        CALL_SHEET_ID : data,
                        page : page,
                        pageSize : handler.cdr.queryPageSize
                    }
                }
                DS.send(action,function(res){
                    var oneRow = '<tr><td>__user</td><td>__time</td></tr>';
                    var html = '';
                    for(var i=0;i<res.list.length;i++){
                        html+= oneRow.replace(/__user/,handler.cdr.getAgentName(res.list[i].userId))
                            .replace(/__time/,res.list[i].time);
                    }
                    $('#listen_log_table_data').html(html);
                    DS.updatePagination('showListenLogForm', res.count, handler.cdr.queryPageSize, page);
                });
            });
        }else{
            var page = src.val()||1;
            var action = {
                action : 'app.qualityCheck.queryListenLog',
                data : {
                    CALL_SHEET_ID : data.callSheetId,
                    page : page,
                    pageSize : handler.cdr.queryPageSize
                }
            }
            DS.send(action,function(res){
                var oneRow = '<tr><td>__user</td><td>__time</td></tr>';
                var html = '';
                for(var i=0;i<res.list.length;i++){
                    html+= oneRow.replace(/__user/,handler.cdr.getAgentName(res.list[i].userId))
                        .replace(/__time/,res.list[i].time);
                }
                $('#listen_log_table_data').html(html);
                DS.updatePagination('showListenLogForm', res.count, handler.cdr.queryPageSize, page);
            });
        }
    },
    initQualityCheckRadio : function(){
        var templates = getCache('qualityCheckTemplates');
        var one = '<input type="radio" name="currentTemplate" class="qualityCheckRadio" value="___id" __checked>__name&nbsp;&nbsp;&nbsp;';
        var html = '';
        if(!templates || templates.length == 0){
            return '请配置质检模板！';
        }
        for(var i=0 ; i<templates.length ; i++){
            if(i == 0) {
                html += one.replace(/___id/,templates[i]._id)
                    .replace(/__checked/,'checked')
                    .replace(/__name/,templates[i].name);
            }else{
                html += one.replace(/___id/,templates[i]._id)
                    .replace(/__checked/,'')
                    .replace(/__name/,templates[i].name);
            }
        }
        return html;
    },
    initQualityCheckListRadio : function(){
        var templates = getCache('qualityCheckTemplates');
        var one = '<input type="radio" name="TEMPLATE" class="qualityCheckRadio" value="___id" __checked>__name&nbsp;&nbsp;&nbsp;';
        var html = '';
        if(!templates || templates.length == 0){
            return '请配置质检模板！';
        }
        var currentId = null;
        if(handler.qualityCheck.currentTemplate != null){
            currentId = handler.qualityCheck.currentTemplate._id;
        }
        for(var i=0 ; i<templates.length ; i++){
            if(currentId){
                if(templates[i]._id == currentId) {
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'checked')
                        .replace(/__name/,templates[i].name);
                }else{
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'')
                        .replace(/__name/,templates[i].name);
                }
            }else{
                if(i == 0) {
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'checked')
                        .replace(/__name/,templates[i].name);
                }else{
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'')
                        .replace(/__name/,templates[i].name);
                }
            }
        }
        return html;
    },
    getQualityCheckLevel : function(data){
        if(handler.qualityCheck.currentTemplate != null){
            var template = handler.qualityCheck.currentTemplate;
            var amonut = Math.round(parseFloat(data));
            var Ab = parseInt(template['A-begin']);
            var Bb = parseInt(template['B-begin']);
            var Be = parseInt(template['B-end']);
            var Cb = parseInt(template['C-begin']);
            var Ce = parseInt(template['C-end']);
            var De = parseInt(template['D-end']);
            if(amonut >= Ab){
                return '优秀';
            }
            if(amonut >= Bb && amonut <= Be){
                return '合格';
            }
            if(amonut >= Cb && amonut <= Ce){
                return '提醒';
            }
            if(amonut <= De){
                return '不合格';
            }
        }else{
            return '';
        }
    },
    addAndSelect_task_template : function (data, src) {
        var self = handler.qualityCheck;
        var selected = src.closest('form').
            find("input[class='qualityCheckRadio qualityTaskRadio']:checked ~ input[class='input-small']");
        if(!data.TASK_NAME || data.TASK_NAME == ""){
            alert('请填写质检任务名称名称！');
            return;
        }
        if(data.CALL_TIME_LENGTH_BEGIN && data.CALL_TIME_LENGTH_END){
            var arraySta = parseInt(data.CALL_TIME_LENGTH_BEGIN);
            var arrayEnd= parseInt(data.CALL_TIME_LENGTH_END);
            if(arrayEnd <= arraySta){
                $().alertmessage('showError','请输入正确的通话时长范围！');
                return;
            }
        }else if(data.CALL_TIME_LENGTH_END == "0"){
            $().alertmessage('showError','请输入正确的通话时长范围！');
            return;
        }
        if (selected.first().attr("maxlength") == 4) {
            if (!selected.first().val() || selected.first().val() == "") {
                alert('请填写按条数抽取质检记录的数量，不超过1000条！');
                return;
            }
            if (selected.first().val() == 0) {
                alert('按条数抽取质检记录的数量不得小于1');
                return;
            }
            if (selected.first().val() > 1000) {
                alert('按条数抽取质检记录的数量不得大于1000');
                return;
            }
            data.sample_selection_rule = data.COUNT_TYPE_NUM;
            data.count = selected.first().val();
        } else {
            var twoSelected = src.closest('form').
                find("input[class=^'qualityCheckRadio qualityTaskRadio']:checked").siblings("div[class='input-append']").find('input');
            if (!twoSelected.val() || twoSelected.val() == "") {
                alert('请填写随机抽取质检记录的百分比！');
                return;
            }
            if (twoSelected.val() == 0) {
                alert('请注意，百分比数必须为1-100之间的正整数！');
                return;
            }
            if (twoSelected.val() > 100) {
                alert('请注意，百分比数必须为1-100之间的正整数！');
                return;
            }
            data.sample_selection_rule = data.COUNT_TYPE_PERCENT;
            data.percent = twoSelected.val()+"%";
        }
        if (!data.QA_SPECIALIST || data.QA_SPECIALIST == "" || data.QA_SPECIALIST == "serachInputNoresult" ) {
            alert('请填写质检专员名称');
            return;
        }
        data.QUEUE = data.queueTypeArr;
        data.CONNECT_TYPE = data.connectTypeArr;
        delete data.COUNT_TYPE;
        delete data.PERCENT;
        delete data.RANDOMNUM;
        delete data.extraction_rule;
        delete data.COUNT_TYPE_NUM;
        delete data.COUNT_TYPE_PERCENT;
        delete data.selectedAgent;
        delete data.ERROR_MEMO;
        delete data.queueTypeArr;
        delete data.connectTypeArr;
        delete data.selectedConnectType_task;
        delete data.selectedQueue_task;
        if(src){
            data.page = src.val() || 1;
        }else{
            data.page = 1;
        }

        var action = {
            action : 'app.qualityCheck.addQualityTaskTemplate',
            data : data
        }

        DS.send(action,function(res){
            if(!res.success){
                if (res.message) {
                    alert(res.message)
                    return;
                }
            } else {
                if(res.count == 0) {
                    alert("没有符合条件的通话记录！");
                    $('#quality_task_add_pane').modal('hide');
                }
                if ($('#quality_task_random_checkbox').is(":checked")) {
                    $('#quality_check_random_table').hide();
                    $('#quality_check_task_table').show();
                } else {
                    $('#quality_check_task_table').hide();
                    $('#quality_check_random_table').show();
                }
                if (res.selectedId) {
                    $('#selected_id').val('');
                    $('#selected_id').val(res.selectedId);
                }
                self.currentQualityCheckCallSheets = res.list;
                if (res.task && getCache("qualityTasks").indexOf(res.task) == -1) {
                    session.dicMap.qualityTasks.push(res.task);
                }
                $(".quality_check_random_progress").text((res.count?res.count:0) + "/" + (res.countAll?res.countAll:0));
                render.qualityCheck.renderQualityCallSheetTable(res.list,"quality_check_query");
                DS.updatePagination('qualityCheckQueryFrm', res.count, handler.cdr.queryPageSize, data.page);
                $('.quality_check_task_template_add_pane_show').click(function () {
                    $('#quality_task_add_pane').modal('');
                });
                $('#qualityMonitorQueryFrm').find('input').val('');
                $('#qualityMonitorQueryFrm').find('a[class = "button ds_form_action"]').click();//质检监测页面查询按钮模拟点击
                self.initQualityCheckTaskRadio();
                $('#quality_task_add_pane').modal('hide');
            }
        });
    },

    replacementRecord : function (data, src) {
        var self = handler.qualityCheck;
        if(self.selectedCallId == '') {
            self.selectedCallId = $('#selected_id').val();
        }
        var query = {selectedId : self.selectedCallId, _id : data}
        var action = {
            action : 'app.qualityCheck.replacementRecord',
            data : query
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('置换数据失败！')
            }
            if (res.callId) {
                self.selectedCallId += ","+res.callId;
            } else {
                alert("此座席无更多通话记录！");
                return;
            }
            $('#callSheetQualityCheckQueryBtn').trigger('click');
        });
    },
    condition_replacement_record : function (data,src) {
        var self = handler.qualityCheck;
        var action = {
            action : 'app.qualityCheck.queryAllConditionData',
            data : {
                callId : data ,
                randomTemplate : src.attr("template_data"),
                idList :self.callDataIdList
            }
        }
        console.log(self.callDataIdList);
        DS.send(action, function(res){
            if (!res.success) {
                alert("置换数据失败！");
                return false;
            }
            for (var ind in res.idList) {
                self.callDataIdList[ind] = res.idList[ind];
            }
            if (res.selectedId) {
                self.callDataIdList.push(res.selectedId);
            } else {
                alert("此座席无更多通话记录！");
            }
            $('#callSheetQualityCheckQueryBtn').trigger('click');
        });
    },
    quality_check_cycle: function(data,src) {
        var pane=$("#quality_check_cycle_list_query_table_data")
        var page = src ? (src.val() || 1) : 1;
        var action = {
            action : 'config.qualityCheck.queryQualityCheckCycle',
            data : {
                page : page,
                pageSize : handler.cdr.queryPageSize
            }
        }
        DS.send(action, function(res){
            if(!res.success){
                alert(res.message);
                return;
            }
           pane.empty();
            var tableData = [];
            $.each(res.data, function(i,item){
                tableData.push('<tr>');
                tableData.push('<td>' + item.cycleName + '</td>')
                tableData.push('<td>' + item.cycleBegins + '</td>');
                tableData.push('<td>' + item.cycleEnds + '</td>');
                if(item.cycleInterval != null){
                    tableData.push('<td>' + item.cycleInterval + '天</td>');
                }else{
                    tableData.push('<td>一个自然月</td>');
                }
                tableData.push('<td><a href="#" class="ds_do_action" ds_action="qualityCheck.show_qualityCheckCycle_detail" ds_data=\'' + '{\"begin\": \"' + item.cycleBegins + '\",\"end\": \"' + item.cycleEnds + '\", \"interval\": \"' + item.cycleInterval + '\", \"name\":\"' + item.cycleName + '\", \"range\" : null}\'>周期详情</a>&nbsp;&nbsp;');
                if(typeof item.active == 'undefined'){
                    item.active = true;
                }

                var bt = item.active?'停用周期':'启用周期';
                tableData.push('<a href="#" class="ds_do_action"  flag="use" ds_action="qualityCheck.change_qualityCheckCycle_status" ds_data=\'' + '{\"cycleId\": \"' + item._id + '\",\"active\": ' + !item.active + '}\'>'  + bt + '</a></td>');
                tableData.push('</tr>');
            });
            pane.html(tableData.join(''));
            var tdTextOne=pane.children("tr").find("td:nth-child(5) a[flag='use']");
            tdTextOne.each(function(index,node) {
                if ($(node).html() == "停用周期") {
                    $(node).css("color","red");
                }else{
                    $(node).css("color","#84BC25");
                }
            })
            DS.updatePagination('qualityCheckCycleListQueryFrm', res.count, handler.cdr.queryPageSize, page);
        });
    },

    save_quality_check_cycle: function(data) {
        var action = {};
        if(data == 'newCycle' || data == 'updateCycle'){
            var conf_id = null;
            var cycleInterval = 1;
            var cycleName = $('#cycleName').val();
            var cycleBegins = $('#cycleStartDate').val();
            var cycleEnds = $('#cycleEndDate').val();
            if($.trim(cycleName) == ''){
                alert('请设置质检周期名称');
                return;
            }else if($.trim(cycleBegins) == ''){
                alert('请设置质检周期起始日期');
                return;
            }else if($.trim(cycleEnds) == ''){
                alert('请设置质检周期结束日期');
                return;
            }else if(new Date(Date.parse(cycleBegins)) >= new Date(Date.parse(cycleEnds))){
                alert('周期结束日期不能早于或等于起始日期');
                return;
            }
            var intervalType = $('input[name="intervalType"]:checked').val();
            if(typeof intervalType == 'undefined'){
                alert('请设置质检周期间隔');
                return;
            }
            if (intervalType == 'week'){
                cycleInterval = 7;
            }else if(intervalType == 'month'){
                var cycleBeginsArr = cycleBegins.split('-');
                var beginDate = new Date(Date.parse(cycleBegins + ' 00:00:00'));
                // if(cycleBeginsArr[2] != '01'){
                if(beginDate.getDate() != 1){
                    alert('如果时间间隔为一个月，起始日期必须为自然月的第一天');
                    return;
                }
                cycleInterval = null;
            }else if(intervalType == 'manual'){
                var intervalRegex = /^[0-9]*[1-9][0-9]*$/;
                if(!intervalRegex.test($('#manualCycle').val())){
                    alert('自定义周期间隔天数必须是正整数');
                    return;
                }else{
                    cycleInterval = parseInt($('#manualCycle').val());
                }
                if((Date.parse(cycleEnds) - Date.parse(cycleBegins)) / 86400000 < cycleInterval){
                    alert('自定义周期间隔天数必须小于所选日期之间的间隔天数');
                    return;
                }
            }

            action = {
                action : 'config.qualityCheck.saveQualityCheckCycle',
                data : {
                    _id : conf_id,
                    cycleName : cycleName,
                    cycleBegins : cycleBegins,
                    cycleEnds : cycleEnds,
                    cycleInterval : cycleInterval
                }
            };
            DS.send(action, function(res){
                if(!res.success){
                    alert(res.message);
                }else{
                    $('#cycleName').val('');
                    $('#cycleStartDate').val('');
                    $('#cycleEndDate').val('');
                    $('#manualCycle').val('');
                }
                handler.qualityCheck.quality_check_cycle({});
            });
        }
    },

    change_qualityCheckCycle_status: function(data){
        var action = {
            action : 'config.qualityCheck.changeQualityCheckCycleStatus',
            data : JSON.parse(data)
        };
        DS.send(action, function(res){
            if(!res.success){
                alert(res.message);
            }
            handler.qualityCheck.quality_check_cycle({});
        })
    },

    show_qualityCheckCycle_detail : function(data){
        Date.prototype.Format = function (fmt) { //author: meizz
            var o = {
                "M+": this.getMonth() + 1, //月份
                "d+": this.getDate(), //日
                "h+": this.getHours(), //小时
                "m+": this.getMinutes(), //分
                "s+": this.getSeconds(), //秒
                "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                "S": this.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }
        var jsonData = JSON.parse(data);
        var intervals = handler.qualityCheck.construct_cycle_interval(jsonData.begin, jsonData.end, jsonData.interval, data.range);
        var tableData = [];
        var linkStr;
        if(jsonData.interval == "null"){
            linkStr = "_M_";
        }else if(jsonData.interval == 1){
            linkStr = "_D_";
        }else if(jsonData.interval == 7){
            linkStr = "_W_";
        }else{
            linkStr = "_" + jsonData.interval + "D_";
        }
        $.each(intervals, function(i, item){
            var jsonDataTemp = JSON.parse(item);
            tableData.push('<tr>');
            tableData.push('<td>' + jsonData.name + linkStr + (i+1) + '</td>');
            tableData.push('<td>' + new Date(jsonDataTemp.bDate).Format('yyyy-MM-dd hh:mm') + '</td>');
            tableData.push('<td>' + new Date(jsonDataTemp.eDate).Format('yyyy-MM-dd hh:mm') + '</td>');
            tableData.push('</tr>');
        });

        $('#cycleDetailTable').empty();
        $('#cycleDetailTable').html(tableData.join(''));
        $('#show_cycle_detail_Modal').modal({'backdrop':'static'});

    },

    construct_cycle_interval : function(begin, end, interval, limit){
        var intervalArray = [];
        var bDate = new Date(Date.parse(begin + ' 00:00:00'));
        var eDate = new Date(Date.parse(end + ' 00:00:00'));
        var tDate = bDate;
        var nowDate = new Date();
        while (tDate <= eDate){
            var intervalObj = {};
            intervalObj.bDate = tDate.getTime();
            if($.trim(interval) != 'null'){
                interval = parseInt(interval);
                tDate.setDate(tDate.getDate() + interval);
            }else{
                tDate.setMonth(tDate.getMonth() + 1);
            }
            if(tDate > eDate){
                intervalObj.eDate = eDate.getTime() + 86400000;
            }else{
                intervalObj.eDate = tDate.getTime();
            }
            if(limit != null){
                if(tDate < nowDate && intervalArray.length < limit){
                    intervalArray.push(JSON.stringify(intervalObj));
                }else if(tDate < nowDate && intervalArray.length >= limit){
                    intervalArray.shift();
                    intervalArray.push(JSON.stringify(intervalObj));
                }else if(tDate > nowDate && intervalArray.length < limit*2){
                    intervalArray.push(JSON.stringify(intervalObj));
                }else if(tDate > nowDate && intervalArray.length > limit*2){
                }
            }else{
                intervalArray.push(JSON.stringify(intervalObj));
            }
        }
        return intervalArray;
    },
    showSubItems : function(data,src){
        src.addClass("active").siblings().removeClass("active");
        src.children().children("input").addClass("active");
        src.siblings().children().children("input").removeClass("active");
    },
    showFirstSubItems : function(data,src){
        src.parent().addClass("active").siblings().removeClass("active");
        src.children("input").addClass("active");
        src.parent().siblings().children().children("input").removeClass("active");
        var crux=src.siblings("ul").find(".cfg_pitch_crux").attr("curxNum");
        if(!crux||crux=="undefined"){
            crux=0;
        }
        $(".cfg_noCrux").html("非致命项标准数："+crux);
    },
    //质检模板2添加质检项
    addQualityCheckTwo:function(data,src) {
        var html = handler.config.qualityCheck.getQualityCheckListItemTwo();
        $("#table0").append(html);
        var lastLiId=$("#table0>li").length
        if(lastLiId>20){
            alert("您最多可添加20级");
            $("#table0>li").last().remove();
        }
        $("#table0").find("[data-toggle='tooltip']").tooltip({placement: 'top',html:true});
    },
    //质检模板警示遮罩1
    showDelModal:function(data,src){
        var p=$("#confirm_modal_del");
        p.find(".modal-title").text("删除确认提醒");
        var view="<p>&nbsp;&nbsp;删除后将不可恢复，确认要删除吗？</p>";
        p.find(".modal-body").html(view);
        var trId=src.parents("li").attr("id");
        $("#confirm_modal_del>.modal-footer>button").attr("ds_data",trId);
        p.width(500);
        p.modal();
    },
    //质检模板警示遮罩2
    showDelModalChildren:function(data,src){
        var p=$("#confirm_modal_del_children");
        p.find(".modal-title").text("删除确认提醒");
        var view="<p>&nbsp;&nbsp;删除后将不可恢复，确认要删除吗？</p>";
        p.find(".modal-body").html(view);
        var trId=src.parents("li").attr("id");
        $("#confirm_modal_del_children>.modal-footer>button").attr("ds_data",trId);
        p.width(500);
        p.modal();
    },
    //删除质检模板2
    removeQualityCheckTwo:function(data,src){
        var p=$("#confirm_modal_del");
        p.width(500);
        p.modal("hide");
        var tr = $("#"+data)
        tr.remove();
    },
    //删除质检模板2的子模板
    removeQualityCheckTwoChildren:function(data,src){
        var p=$("#confirm_modal_del_children");
        p.width(500);
        p.modal("hide");
        var tr = $("#"+data);
        var ul = tr.parent();
        var num = ul.children('.quality-fatal-num').find('.quality-fatal-text');
        tr.remove();
        if(ul.children('li.info').length == 0){
            ul.empty();
        }else if(num.attr('ds_data') > ul.children('li.info').length){
            num.attr('ds_data',ul.children('li.info').length).html(ul.children('li.info').length);
        }
    },
    //修改里质检模板1的添加模板
    setAddQualityCheckOne:function(){
        var html = handler.config.qualityCheck.getQualityCheckListItem();
        $('#config_quality_check_template_config_table_pane').append(html);
    },
    //修改里质检模板1的删除模板
    setRemoveQualityCheckOne:function(data,src){
        var tr = src.parent().parent();
        tr.remove();
    },
    //质检模板2input获取焦点
    addQualityCheckFocus:function(data,src){
        src.addClass("live");
        src.closest("ul>li").children().children(".ds-config-quality-check-add-config-two").hide();
        src.closest("ul>li").children().children(".ds-config-quality-check-addChildren-config-two").hide();
        src.closest("ul>li").children().children(".ds-config-quality-check-remove-config-two").hide();
        src.closest("ul>li").children().children(".ds-config-quality-check-removeChildren-config-two").hide();
        src.closest("ul>li").find(".checkbox-quality-check-fatal").hide();

    },
    //质检模板2input失去焦点
    addQualityCheckBlur:function(data,src){
        var inputValue=src.attr("value");
        src.parent("span").attr("title",inputValue);
        src.removeClass("live");
        src.closest("ul>li").children().children(".ds-config-quality-check-add-config-two").show();
        src.closest("ul>li").children().children(".ds-config-quality-check-addChildren-config-two").show();
        src.closest("ul>li").children().children(".ds-config-quality-check-remove-config-two").show();
        src.closest("ul>li").children().children(".ds-config-quality-check-removeChildren-config-two").show();
        src.closest("ul>li").find(".checkbox-quality-check-fatal").show();
        var lastIndex =src.closest("li").attr("id");
        var lastNum = lastIndex.split("-").length;//判断，如果超过10 层，就直接把最后一层的加功能删除；
        if (lastNum >9) {
            src.closest("ul>li").children().children(".ds-config-quality-check-addChildren-config-two").hide();
        }
    },
    getQualityTemplate: function (data) {
        var condition = getCache("qualityConditionTemplates");
        for (var ind in condition) {
            if (data == condition[ind]._id) {
                var res = condition[ind];
                $('#condition_for_quality').show();
                $('#condition_for_quality').find('input').val('');
                $('#condition_for_quality_Check').hide();
                $('#condition_quality_name').val(res.TEMPLATE_NAME);
                $('#quality_picker_start').val(res.query.BEGIN_TIME ? res.query.BEGIN_TIME:'');
                $('#quality_picker_end').val(res.query.END_TIME ? res.query.END_TIME:'');
                //呼叫类型
                $('#quality_connect_type').html("");
                $('#quality_connect_type_input').hide();
                if (res.selectedCallTypeList) {
                    var callTypeArr = res.selectedCallTypeList.split(",");
                    for(var a=0;a< callTypeArr.length;a++){
                        if (callTypeArr[a] == 'normal') {
                            $('#quality_connect_type').append('&nbsp;&nbsp;<span class="label label-info">普通来电</span>');
                        } else if (callTypeArr[a] == 'dialout') {
                            $('#quality_connect_type').append('&nbsp;&nbsp;<span class="label label-info">外呼去电</span>');
                        } else if (callTypeArr[a] == 'transfer') {
                            $('#quality_connect_type').append('&nbsp;&nbsp;<span class="label label-info">来电转接</span>');
                        } else if (callTypeArr[a] == 'dialTransfer') {
                            $('#quality_connect_type').append('&nbsp;&nbsp;<span class="label label-info">外呼转接</span>');
                        }
                    }
                } else {
                    $('#quality_connect_type').append('<input type="text" value="--全部--" class="input-small" readonly style="z-index:1060;">');
                }

                //技能组
                $('#quality_myqueue').html("");
                $('#quality_myqueue_input').hide();
                if (res.selectedQueueList) {
                    var queues = getCache('queues');
                    var queueArr = res.selectedQueueList.split(",");
                    for (var i=0;i < queues.length;i++) {
                        for(var a=0;a< queueArr.length;a++){
                            if (queues[i].Exten ==queueArr[a]){
                                $('#quality_myqueue').append('&nbsp;&nbsp;<span class="label label-info">' + queues[i].DisplayName + '</span>');
                            }
                        }
                    }
                    for (var i=0;i < queues.length;i++) {
                        if (queues[i].Exten ==res.query.ERROR_MEMO){
                            $('#quality_myqueue').val(queues[i].DisplayName);
                        }
                    }
                } else {
                    $('#quality_myqueue').append('<input type="text" value="--全部--" class="input-small" readonly style="z-index:1060;">');
                }

                //随机抽取数
                var randomRule = res[res.EXT_RULE];
                var label = "人均随机抽取条数";
                var randomNum = 0;
                if(randomRule == "per_num"){
                    label = "人均随机抽取条数";
                    randomNum = res.TEMPLATE_NUM;
                }else if(randomRule == "per_percent"){
                    label = "人均随机抽取百分比";
                    randomNum = res.PERCENT+"%";
                }else if(!randomRule || randomRule == "entirety_num"){
                    label = "整体随机抽取条数";
                    randomNum = res.TEMPLATE_NUM;
                }else if(randomRule == "entirety_percent"){
                    label = "整体随机抽取百分比";
                    randomNum = res.PERCENT+"%";
                }

                //通话座席
                var disposalAgent = res.query.DISPOSAL_AGENT;
                $('#random_select_agents').html("");
                $('#random_select_agents_input').hide();
                if (!randomRule && disposalAgent) {
                    var agents = getCache('agents');

                    if(typeof disposalAgent == "object"){

                        var agentsShowStr = "";
                        for (var i=0;i < agents.length;i++) {
                            for(var a=0;a< disposalAgent.length;a++){
                                if (agents[i]._id ==disposalAgent[a]){
                                    $('#random_select_agents').append('&nbsp;&nbsp;<span class="label label-info">' + agents[i].displayName + '</span>');
                                }
                            }
                        }
                    }else{
                        for (var i=0;i < agents.length;i++) {
                            if (agents[i]._id == disposalAgent){
                                $('#random_select_agents').append('&nbsp;&nbsp;<span class="label label-info">' + agents[i].displayName + '</span>');
                            }
                        }
                    }

                }else if(res.selectedAgentList && res.selectedAgentList != ""){
                    var agents = getCache('agents');
                    var disposalAgentArr = res.selectedAgentList.split(",");
                    for (var i=0;i < agents.length;i++) {
                        for(var a=0;a< disposalAgentArr.length;a++){
                            if (agents[i]._id ==disposalAgentArr[a]){
                                $('#random_select_agents').append('&nbsp;&nbsp;<span class="label label-info">' + agents[i].displayName + '</span>');
                            }
                        }
                    }
                }else{
                    $('#random_select_agents').append('<input type="text" value="--全部--" class="input-small" readonly style="z-index:1060;">');
                }
                //是否包含下级
                if (res.includeSubordinate) {
                    $('#random_checkbox_junior').attr("checked","checked");
                } else {
                    $('#random_checkbox_junior').removeAttr("checked");
                }

                $('#condition_quality_label').html(label);
                $('#condition_quality_num').val(randomNum ? randomNum : '');
                //通话时长
                $('#quality_telephone_start').val(res.query.CALL_TIME_LENGTH_BEGIN ? res.query.CALL_TIME_LENGTH_BEGIN:'');
                $('#quality_telephone_end').val(res.query.CALL_TIME_LENGTH_END ? res.query.CALL_TIME_LENGTH_END:'');
                //满意度
                var investigate=getinvestigate();
                var investiageNum=res.query.INVESTIGATE;
                if(investiageNum){
                    for(var i=0 in investigate.options){
                        var invData=investigate.options[i]
                        for(var j=0;j<invData.options.length;j++){
                            if(invData.options[j].name==investiageNum){
                                $('#quality_satisfaction').val(invData.name);
                            }
                        }
                    }
                }else{
                    $('#quality_satisfaction').val("");
                }
                //$('#quality_satisfaction').val(res.query.INVESTIGATE ? res.query.INVESTIGATE:'');
            }
        }
    },
    getTaskTemplate: function (data, src) {
        var tasks = getCache("qualityTasks");
        for (var ind in tasks) {
            if (data == tasks[ind]._id) {
                var res = tasks[ind];
                $('#condition_for_task').show();
                $('#condition_for_task').find('input').val('');
                $('#task_select_agents').html('');
                $('#condition_for_quality_Check').hide();
                $('#condition_task_name').val(res.TASK_NAME);
                var templates = getCache('qualityCheckTemplates');
                for (var i=0;i < templates.length;i++) {
                    if (templates[i]._id ==res.query.TASK_TEMPLATE){
                        $('#condition_task_template').val(templates[i].name);
                    }
                }
                //抽取规则
                if (res.query.sample_selection_rule == "per_num") {
                    $('#condition_extraction_rule_num').val("人均条数");
                    $('#condition_task_num').val(res.query.count);
                } else if (res.query.sample_selection_rule == "entirety_num"){
                    $('#condition_extraction_rule_num').val("整体条数");
                    $('#condition_task_num').val(res.query.count);
                } else if (res.query.sample_selection_rule == "per_percent") {
                    $('#condition_extraction_rule_num').val("人均百分比");
                    $('#condition_task_num').val(res.query.percent);
                } else {
                    $('#condition_extraction_rule_num').val("整体百分比")
                    $('#condition_task_num').val(res.query.percent);
                }

                //呼叫类型
                $('#task_select_connectType').html("");
                if (res.query.CONNECT_TYPE) {
                    var list = [];
                    if (res.query.CONNECT_TYPE.indexOf(",") != -1) {
                        list = res.query.CONNECT_TYPE.split(",");
                    } else {
                        list.push(res.query.CONNECT_TYPE);
                    }
                    for (var j = 0; j < list.length; j++) {
                        var callType = getCache('callType');
                        for (var i = 0; i < callType.length; i++) {
                            if (callType[i].code_value == list[j]) {
                                $('#task_select_connectType').append('&nbsp;&nbsp;<span class="label label-info">' + callType[i].code_name + '</span>');
                            }
                        }
                    }
                }else {
                    $('#task_select_connectType').append('<input type="text" disabled class="input-small"/>');
                }
                /*var type = getCache('callType');
                for (var i=0;i < type.length;i++) {
                    if (type[i].code_value ==res.query.CONNECT_TYPE){
                        $('#task_select_connectType')..append('&nbsp;&nbsp;<span class="label label-info">' + type[i].code_name + '</span>');
                    }
                }
                if ($('#task_connect_type').val() == '') {
                    $('#task_connect_type').val("--全部--");
                }*/
                $('#task_picker_start').val(res.query.BEGIN_TIME);
                $('#task_picker_end').val(res.query.END_TIME);
                //是否包含下级
                if (res.query.includeSubordinate) {
                    $('#task_checkbox_junior').attr("checked","checked");
                } else {
                    $('#task_checkbox_junior').removeAttr("checked");
                }
                //技能组
                $('#task_select_queues').html("");
                if (res.query.QUEUE) {
                    var list = [];
                    if (res.query.QUEUE.indexOf(",") != -1) {
                        list = res.query.QUEUE.split(",");
                    } else {
                        list.push(res.query.QUEUE);
                    }
                    for (var j = 0; j < list.length; j++) {
                        var queues = getCache('queues');
                        for (var i = 0; i < queues.length; i++) {
                            if (queues[i].Exten == list[j]) {
                                $('#task_select_queues').append('&nbsp;&nbsp;<span class="label label-info">' + queues[i].DisplayName + '</span>');
                            }
                        }
                    }
                }else {
                    $('#task_select_queues').append('<input type="text" disabled class="input-small"/>');
                }
                //质检员
                var agents = getCache('agents');
                for (var i=0;i < agents.length;i++) {
                    if (agents[i]._id ==res.query.QA_SPECIALIST){
                        $('#task_qa_specialist').val(agents[i].displayName+"["+agents[i].exten+"]");
                    }
                }
                //满意度
                var investigate=getinvestigate();
                var investiageNum=res.query.INVESTIGATE;
                if(investiageNum){
                    for(var i=0 in investigate.options){
                        var invData=investigate.options[i]
                        for(var j=0;j<invData.options.length;j++){
                            if(invData.options[j].name==investiageNum){
                                $('#task_satisfaction').val(invData.name);
                            }
                        }
                    }
                }else{
                    $('#task_satisfaction').val("--全部--");
                }
               /* var investigate = getCache('investigate');
                for (var i=0;i < investigate.length;i++) {
                    if (investigate[i]._id ==res.query.includeSubordinate){
                        $('#task_satisfaction').val(investigate[i].code_name);
                    }
                }
                if ($('#task_satisfaction').val() == '') {
                    $('#task_satisfaction').val("--全部--");
                }*/
                //通话座席
                if (res.query.selectedAgentList) {
                    var list = [];
                    if (res.query.selectedAgentList.indexOf(",") != -1) {
                        list = res.query.selectedAgentList.split(",");
                    } else {
                        list.push(res.query.selectedAgentList);
                    }
                    for (var j = 0; j < list.length; j++) {
                        var agents = getCache('agents');
                        for (var i = 0; i < agents.length; i++) {
                            if (agents[i]._id == list[j]) {
                                $('#task_select_agents').append('&nbsp;&nbsp;<span class="label label-info">' + agents[i].displayName + '</span>');
                            }
                        }
                    }
                } else {
                    $('#task_select_agents').append('<input type="text" disabled class="input-small"/>');
                }
                $('#task_select_agents').val(res.query.selectedAgentList);
                $('#task_telephone_start').val(res.query.CALL_TIME_LENGTH_BEGIN);
                $('#task_telephone_end').val(res.query.CALL_TIME_LENGTH_END);
            }
        }

    },
    queryGradeBycycle : function (data, src, session){
        var btns = [];
        if(data.selectedAgent == ""){
            $('#quality_check_agent_report_search_div_ul li').each(function(key,value){
                btns[key] = $(this).attr('userid');
            });
            data.selectedAgent=btns;
        }else{
            data.selectedAgent=data.selectedAgent.split(/,/g);
            data.selectedAgent.shift();
        }
        if(!data.qualityChecked_cycle){
            alert("请选择您要查询的周期！");
            return;
        }

        if(!data.qualityChecked_table){
            alert("请选择您要查询的模板！");
            return;
        }
        var startcycle = data.qualityChecked_start_cycle;
        var endcycle = data.qualityChecked_end_cycle;
        if(parseInt(startcycle.substr(35,startcycle.length))>parseInt(endcycle.substr(35,endcycle.length))){
            alert('您的开始周期大于结束周期！');
            return;
        }
        var action = {
            action: 'qualitycheck.queryCycleReport',
            data: data
        };
        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }else{
                var cueert_templte_id = $('#qualityChecked_table').val();
                var qualityChecked_floors = $('#qualityChecked_floors').val();
                var qualityCheckedtemples = handler.qualityCheck.CheckQualityTemplte;
                var table_title = '';
                var table_tbody = '';
                for(var qualityCheckedtemple_one in qualityCheckedtemples){
                    if(cueert_templte_id == qualityCheckedtemples[qualityCheckedtemple_one]._id){
                        cueert_templte = qualityCheckedtemples[qualityCheckedtemple_one];
                    }
                }
                if(cueert_templte != null){
                    if(qualityChecked_floors == 1){
                        table_title += '<td>座席</td><td>周期</td><td>被监控数</td><td>非关键错误未通过录音数</td><td>关键错误准确率</td><td>非关键错误准确率</td><td>准确率</td>';
                    }else{
                        table_title += '<td>座席</td><td>周期</td>';
                    }
                    table_title += handler.qualityCheck.makeupqualityCheckedtitle(qualityChecked_floors,cueert_templte.config);
                    if(qualityChecked_floors == 1){
                        table_title += "<td>整体</td>";
                    }
                }
                var agents_id = getCache('agents');

                for(var j= 0,len_id=agents_id.length;j<len_id;j++){
                    var rowspan = 1;
                    var allcount = {};
                    var agenthasinfor = false;
                    for(var i= 0,len=res.list.length;i<len;i++){
                        if(res.list[i].DISPOSAL_AGENT==agents_id[j]._id){
                            agenthasinfor = true;
                            if(rowspan==1){table_tbody+='<tr><td rowspan=__rowspan>'+getCache('agents',res.list[i].DISPOSAL_AGENT).displayName+'['+getCache('agents',res.list[i].DISPOSAL_AGENT).exten+']</td>'}
                            table_tbody+='<td>' +res.list[i].cyclename+'</td>';
                            if(qualityChecked_floors==1){
                                table_tbody+='<td>'+res.list[i].monitorcount+'</td>';
                                if(res.list[i].uncurxnum =="-"){
                                    table_tbody+='<td>-</td>';
                                }else{
                                    table_tbody+='<td>'+res.list[i].uncurxnum+'</td>';
                                }
                                if(res.list[i].cruxerrorrate == "-"){
                                    table_tbody+='<td>-</td>';
                                }else{
                                    table_tbody+='<td>'+(res.list[i].cruxerrorrate*100).toFixed(2)+'%</td>';
                                }
                                if(res.list[i].uncruxerrorrate == "-"){
                                    table_tbody+='<td>-</td>';
                                }else{
                                    table_tbody+='<td>'+(res.list[i].uncruxerrorrate*100).toFixed(2)+'%</td>';
                                }
                                if(res.list[i].accrate == "-"){
                                    table_tbody+='<td>-</td>';
                                }else{
                                    table_tbody+='<td>'+(res.list[i].accrate*100).toFixed(2)+'%</td>';
                                }
                            }

                            for(var rellist_one in res.list[i]){
                                if(rellist_one.substr(0,11)=='config_name'&&rellist_one.split(/-/g).length.toString() ==qualityChecked_floors){
                                    if(typeof(allcount[rellist_one])=='number'){
                                        allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                    }else{
                                        allcount[rellist_one]=0;
                                        allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                    }
                                    table_tbody+='<td>'+(res.list[i][rellist_one]*100).toFixed(2)+'%</td>';
                                }else if(rellist_one =='monitorcount'){
                                    if(typeof(allcount[rellist_one])=='number'){
                                        allcount[rellist_one]+=parseInt(res.list[i][rellist_one]);
                                    }else{
                                        allcount[rellist_one]=0;
                                        allcount[rellist_one]+=parseInt(res.list[i][rellist_one]);
                                    }
                                }else if(rellist_one =='all_1_cent'){
                                    if(typeof(allcount[rellist_one])=='number'){
                                        allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                    }else{
                                        allcount[rellist_one]=0;
                                        allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                    }
                                }else if(rellist_one =='accrate'){
                                    if(res.list[i][rellist_one] == "-"){
                                        allcount[rellist_one] = "-";
                                    }else{
                                        if(typeof(allcount[rellist_one])=='number'){
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }else{
                                            allcount[rellist_one]=0;
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }
                                    }
                                }else if(rellist_one =='uncruxerrorrate'){
                                    if(res.list[i][rellist_one] == "-"){
                                        allcount[rellist_one] = "-";
                                    }else{
                                        if(typeof(allcount[rellist_one])=='number'){
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }else{
                                            allcount[rellist_one]=0;
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }
                                    }
                                }else if(rellist_one =='uncurxnum'){
                                    if(res.list[i][rellist_one] == "-"){
                                        allcount[rellist_one] = "-";
                                    }else{
                                        if(typeof(allcount[rellist_one])=='number'){
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }else{
                                            allcount[rellist_one]=0;
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }
                                    }
                                }else if(rellist_one =='cruxerrorrate'){
                                    if(res.list[i][rellist_one] == "-"){
                                        allcount[rellist_one] = "-";
                                    }else{
                                        if(typeof(allcount[rellist_one])=='number'){
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }else{
                                            allcount[rellist_one]=0;
                                            allcount[rellist_one]+=parseFloat(res.list[i][rellist_one]);
                                        }
                                    }
                                }
                            }
                            if(qualityChecked_floors==1){
                                table_tbody+='<td>'+(res.list[i]['all_1_cent']*100).toFixed(2)+'%</td>';
                            }
                            table_tbody+='</tr>';
                            rowspan++;
                        }
                    }
                    if(agenthasinfor){
                        table_tbody+='<tr><td>整体</td>';
                        for(var allcount_one in allcount){
                            if(qualityChecked_floors == 1&&allcount_one == 'monitorcount'){
                                table_tbody+='<td>'+allcount['monitorcount']+'</td>';
                            }else if(allcount_one.substr(0,11)=='config_name'&&allcount_one.split(/-/g).length.toString() ==qualityChecked_floors) {
                                table_tbody+='<td>'+(allcount[allcount_one]/(rowspan-1)*100).toFixed(2)+'%</td>';
                            }else if(qualityChecked_floors == 1&&allcount_one == 'all_1_cent') {
                                table_tbody+='<td>'+(allcount['all_1_cent']/(rowspan-1)*100).toFixed(2)+'%</td>';
                            }else if(qualityChecked_floors == 1&&allcount_one == 'accrate'){
                                if(allcount['accrate'] == "-"){
                                    table_tbody+='<td>'+"-"+'</td>';
                                }else{
                                    table_tbody+='<td>'+(allcount['accrate']/(rowspan-1)*100).toFixed(2)+'%</td>';
                                }
                            }else if(qualityChecked_floors == 1&&allcount_one == 'uncurxnum'){
                                if(allcount['uncurxnum'] == "-"){
                                    table_tbody+='<td>'+"-"+'</td>';
                                }else{
                                    table_tbody+='<td>'+allcount['uncurxnum']+'</td>';
                                }
                            }else if(qualityChecked_floors == 1&&allcount_one == 'cruxerrorrate'){
                                if(allcount['cruxerrorrate'] == "-"){
                                    table_tbody+='<td>'+"-"+'</td>';
                                }else{
                                    table_tbody+='<td>'+(allcount['cruxerrorrate']/(rowspan-1)*100).toFixed(2)+'%</td>';
                                }
                            }else if(qualityChecked_floors == 1&&allcount_one == 'uncruxerrorrate'){
                                if(allcount['uncruxerrorrate'] == "-"){
                                    table_tbody+='<td>'+"-"+'</td>';
                                }else{
                                    table_tbody+='<td>'+(allcount['uncruxerrorrate']/(rowspan-1)*100).toFixed(2)+'%</td>';
                                }

                            }
                        }
                        table_tbody+='</tr>';
                    }
                    table_tbody=table_tbody.replace(/__rowspan/g,rowspan);
                }
                $('#quality_checked_query_period_table_header').html(table_title);
                $('#quality_check_query_period_table_data').html(table_tbody);
                $('#quality_check_query_period_highcharts_container').empty();
                if(qualityChecked_floors !=1){
                    return;
                }else{
                    var seriesArray = new Array();
                    var ydata =[];
                    var xArray = [];
                    if(startcycle == endcycle){
                        seriesArray.push({
                            name:'整体',
                            data: ydata,
                        });
                        for(var j= 0,len_id=agents_id.length;j<len_id;j++) {
                            for (var i = 0, len = res.list.length; i < len; i++) {
                                if (res.list[i].DISPOSAL_AGENT == agents_id[j]._id) {
                                    xArray.push(agents_id[j].displayName+'['+agents_id[j].exten+']');
                                    ydata.push(parseFloat((res.list[i]['all_1_cent']*100).toFixed(2)));
                                }
                            }
                        }
                        handler.qualityCheck.initHighChat(function(){
                            handler.qualityCheck.generateQcReportHighChats('quality_check_query_period_highcharts_container',xArray,seriesArray,'quality_check_report');
                        });
                    }else{
                        var cycle = [];
                        var json = {};
                        for (var i = 0, len = res.list.length; i < len; i++) {
                                if(!json[res.list[i].cycle_section]){
                                    cycle.push(res.list[i].cycle_section);
                                    xArray.push(res.list[i].cyclename);
                                    json[res.list[i].cycle_section] = 1;
                                }
                            if(!json[res.list[i].DISPOSAL_AGENT]){
                                var agentData = getCache('agents',res.list[i].DISPOSAL_AGENT)
                                seriesArray.push({
                                    name:agentData.displayName+'['+agentData.exten+']',
                                    data:new Array(),
                                    valueName:res.list[i].DISPOSAL_AGENT
                                });
                                json[res.list[i].DISPOSAL_AGENT] = 1;
                            }

                        }
                        for(var i=0;i<cycle.length;i++){
                            for(var m=0;m<seriesArray.length;m++){
                                var ishas = false
                                for(var j=0;j<res.list.length;j++) {
                                    if ((res.list[j].DISPOSAL_AGENT == seriesArray[m].valueName )&& (res.list[j].cyclename == xArray[i])) {
                                        ishas = true;
                                        seriesArray[m].data.push(parseFloat((res.list[j]['all_1_cent']*100).toFixed(2)));
                                        break
                                    }
                                }
                                if(ishas == false){
                                    seriesArray[m].data.push(100);
                                }
                            }
                        }
                        handler.qualityCheck.initHighChat(function(){
                            handler.qualityCheck.generateQcReportHighChats('quality_check_query_period_highcharts_container',xArray,seriesArray,'quality_check_report_multiple');
                        });
                    }
                }
            }
        });
    },
    makeupqualityCheckedtitle : function(floors,templte){
        var html='';
        for(var templte_one=0;templte_one < templte.length ;templte_one++) {
            if(floors == 1){html += '<td>' + templte[templte_one].value + '</td>';}
            for (var qc_one = 0; qc_one < templte[templte_one].child.length; qc_one++) {
                if (floors == 1) {break;}
                var op1_child = templte[templte_one].child[qc_one];
                if(floors == 2){html += '<td>' + op1_child.value + '</td>';}
                for (var qc_two = 0; qc_two < op1_child.child.length; qc_two++) {
                    if (floors == 2) {break;}
                    var op2_child = op1_child.child[qc_two];
                    if(floors == 3){html += '<td>' + op2_child.value + '</td>';}
                    for (var qc_three = 0; qc_three < op2_child.child.length; qc_three++) {
                        if (floors == 3) {break;}
                        var op3_child = op2_child.child[qc_three];
                        if(floors == 4){html += '<td>' + op3_child.value + '</td>';}
                        for (var qc_four = 0; qc_four < op3_child.child.length; qc_four++) {
                            if (floors == 4) {break;}
                            var op4_child = op3_child.child[qc_four];
                            if(floors == 5){html += '<td>' + op4_child.value + '</td>';}
                            for (var qc_five = 0; qc_five < op4_child.child.length; qc_five++) {
                                if (floors == 5) {break;}
                                var op5_child = op4_child.child[qc_five];
                                if(floors == 6){html += '<td>' + op5_child.value + '</td>';}
                                for (var qc_six = 0; qc_six < op5_child.child.length; qc_six++) {
                                    if (floors == 6) {break;}
                                    var op6_child = op5_child.child[qc_six];
                                    if(floors == 7){html += '<td>' + op6_child.value + '</td>';}
                                    for (var qc_seven = 0; qc_seven < op6_child.child.length; qc_seven++) {
                                        if (floors == 7) {break;}
                                        var op7_child = op6_child.child[qc_seven];
                                        if(floors == 8){html += '<td>' + op7_child.value + '</td>';}
                                        for (var qc_eight = 0; qc_eight < op7_child.child.length; qc_eight++) {
                                            if (floors == 8) {break;}
                                            var op8_child = op7_child.child[qc_eight];
                                            if(floors == 9){html += '<td>' + op8_child.value + '</td>';}
                                            for (var qc_nine = 0; qc_nine < op8_child.child.length; qc_nine++) {
                                                if (floors == 9) {break;}
                                                var op9_child = op8_child.child[qc_nine];
                                                html += '<td>' + op9_child.value + '</td>';

                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return html;
    },
    queryranking:function(){
        DS.getView('qualityCheck/show_quality_check_agent_ranking_detail', function(view){
            var data ={};
            data.TEMPLATE = handler.qualityCheck.currentTemplate._id;
            var action = {
                action : 'app.qualityCheck.agentRanking',
                data:data
            }
            DS.send(action,function(res){
                if(res.success){
                    if(res.list||res.list.length !=0){
                        handler.qualityCheck._quickSort(res.list,0,res.list.length-1,res.type);
                    }
                    var rankingagenthtml = [];
                    var rankingagenthead = [];
                    if(res.type == "pass"){
                        rankingagenthead.push("<tr><td>排名</td><td>座席人员</td><td>通过率</td></tr>");
                    }else{
                        rankingagenthead.push("<tr><td>排名</td><td>座席人员</td><td>平均得分</td></tr>");
                    }
                    view=view.replace(/__HEAD/g,rankingagenthead.join(""));
                    for(var i = 0,len = res.list.length;i<len;i++){
                        for(var j= 0,selen = res.agentlist.length;j<selen;j++){
                            if(res.agentlist[j] == res.list[i].DISPOSAL_AGENT){
                                rankingagenthtml.push("<tr><td>"+parseInt(i+1)+"</td><td>"+getCache('agents',res.list[i].DISPOSAL_AGENT).displayName+"</td><td>"+res.list[i].all_cent+"</td></tr>");
                                continue;
                            }
                        }
                    }
                    view=view.replace(/__BODY/g,rankingagenthtml.join(""));
                }
                var panel = $('#modal_panel');
                panel.empty();
                panel.append(view);
                $('#show_cdr_detail_Modal').modal({'backdrop':'static'}).width(750);
            });
        });
    },
    initHighChat: function(callback){
        if(!window.Highcharts){
            var oHead = document.getElementsByTagName('HEAD').item(0);
            var oScript= document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src="./javascripts/highcharts.js";
            oHead.appendChild( oScript);
            if (!/*@cc_on!@*/0) { //if not IE
                //Firefox2、Firefox3、Safari3.1+、Opera9.6+ support js.onload
                oScript.onload = callback;
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        callback();
                    }
                }
            }
        }else{
            callback();
        }
    },
    generateQcReportHighChats: function(container, xArray,seriesArray,xName){
        var titleText = "";
        var labels = {};
        var type = 'line'
        if (xName == 'quality_check_report'){
            titleText = '单周期质检报表';
            type = 'column';

        }
        if(xName == 'quality_check_report_multiple'){
            titleText = '多周期质检报表';
            type = 'line';
        }
        if(xArray.length>15){
            labels = {
                rotation: -45,
                align: 'right',
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        }
        $('#' + container).highcharts({
            chart: {
                type: type
            },
            title: {
                text: titleText
            },
            subtitle: {
                text: ''
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                },
                showEmpty:false
            },
            xAxis: {
                categories: xArray,
                labels: labels
            },
            tooltip: {
                formatter: function () {
                    var s = '<span style="font-size:10px">' + this.x + '</span><table>';

                    $.each(this.points, function () {
                        var unit = "%";
                        s += '<tr><td style="color:'+this.series.color+';padding:0">' + this.series.name + ': </td><td style="padding:0"><b>' +
                            this.y + '' +unit+ "</b></td></tr>";
                    });
                    s+='</table>'
                    return s;
                },
                shared: true,
                useHTML: true
            },

            series: seriesArray
        });
    }
}
function getinvestigate(){
    var options=getCache("options");
    for(var i=0;i<options.length;i++){
        if(options[i].name=='满意度调查选项'){
            return options[i]
        }
    }
}