handler.config.channelDic = {
    menuId:'',
    channelDicMap:null,
    channel_dic: function(menu) {
        var container=$("#view_"+menu);
        handler.config.channelDic.menuId=menu;
        container.find(".nav-list>li a:first").click();
    },
    /**
     * 获取字典的层级
     * @param type
     * @returns {number}
     */
    getDicLevel:function(type){
        if(!type){
            type="webchat";
        }
        var dics=getCache('channelDic');
        var item={};
        for (var i = 0; i < dics.length; i++) {
            var obj = dics[i];
            if(obj.type==type){
                item=obj;
                break;
            }
        }
        var options=item.options||[];
        var lastNum=1;
        var iteratorDic=function(_dics,level){
            var _count=level>lastNum?level:lastNum;
            //console.info("level=="+level+",_count==="+_count);
            lastNum=_count;
            for(var i=0;i<_dics.length;i++){
                var obj=_dics[i];
                if(obj.options && obj.options.length>0){
                    if(lastNum==3){
                        return;
                    }
                    iteratorDic(obj.options,level+1);
                }
            }
        }
        iteratorDic(options,1);
        return lastNum;
    },
    _addDicMap:function(type){
        if(!type){
            type="webchat";//default
        }
        var dics=getCache('channelDic');
        var item={};
        for (var i = 0; i < dics.length; i++) {
            var obj = dics[i];
            if(obj.type==type){
                item=obj;
                break;
            }
        }
        var options=item.options||[];
        var map={};
        var iteratorDic=function(_dics,pid){
            for(var i=0;i<_dics.length;i++){
                var obj=_dics[i];
                map[obj.key]={n:obj.name,pid:pid};
                if(obj.options && obj.options.length>0){
                    iteratorDic(obj.options,obj.key);
                }
            }
        }
        iteratorDic(options,"");
        handler.config.channelDic.channelDicMap=map;
    },
    getDicMapByKey:function(type,key){
        var map=handler.config.channelDic.channelDicMap;
        if(!map){
            handler.config.channelDic._addDicMap(type);
            map=handler.config.channelDic.channelDicMap;
        }
        var dic=map?map[key]:null;
        return dic;
    },
    /**
     * 获取字典名称
     * @param type
     * @param key
     * @returns {*}
     */
    getDicMapName:function(type,key){
        var dic=handler.config.channelDic.getDicMapByKey(type,key);
        if(dic){
            return dic.n;
        }
        return "";
    },
    /**
     * 获取字典及父节点名称
     * @param type
     * @param key
     * @returns {string}
     */
    getDicMapPath:function(type,key){
        var dic=handler.config.channelDic.getDicMapByKey(type,key);
        var desc="";
        var pid="";
        if(dic){
            desc=dic.n;
            pid=dic.pid;
        }
        var iteratorDic=function(pid){
            if(!pid)return;
            var _dic=handler.config.channelDic.getDicMapByKey(type,pid);
            if(_dic){
                desc=_dic.n+"->"+desc;
                iteratorDic(_dic.pid);
            }
        }
        iteratorDic(pid);
        return desc;
    },
    /**
     * 根据字典在数组中的位置获取下级
     * @param type
     * @param level （例如1_2_3代表3级，按“_”分隔后每项代表每一级的位置）
     * @returns {*|Array}
     */
    getCaseCadeItem:function(type,level){
        var dics=getCache('channelDic');
        var item={};
        for (var i = 0; i < dics.length; i++) {
            var obj = dics[i];
            if(obj.type==type){
                item=obj;
                break;
            }
        }
        var _item=getCaseCadeDic(item,level);
        return _item;
    },
    _getChannelDic:function(type){
        var dics=getCache('channelDic');
        var _dics=[];
        for (var i = 0; i < dics.length; i++) {
            var obj = dics[i];
            if(obj.type==type){
                _dics=obj.options||[];
                break;
            }
        }
        return _dics;
    },
    _initDicList:function(type,pane){
        var _dics=handler.config.channelDic._getChannelDic(type);
        for (var i = 0; i < _dics.length; i++) {
            var obj = _dics[i];
            obj.level=i;
            obj.lastLevel="";//第一级为空
            var tmplObj=$("#tmpl_channel_dic_show");
            var tmpl=tmplObj.html()||'';
            tmpl=DS.renderViewNew(tmpl,obj);
            pane.find(".dic_level_1>.channel_dic_list").append(tmpl);
        }
    },
    showWebchatDic:function(){
        var container=$("#view_"+handler.config.channelDic.menuId);
        var action = {
            action: 'config.channelDic.getDicByType',
            data: {type:'webchat'}
        }
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                if(!row){
                    row={_id:''};
                }
                DS.getView('config/channelDic/webchat_set', function (view) {
                    var pane = container.find('#config_channel_dic_pane');
                    view=view.replace(/_#_id#_/g,row._id);
                    pane.html(view);
                    handler.config.channelDic._initDicList("webchat",container);
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    blurDicItem:function(data,src){
        var val= $.trim(src.val());
        var pane=src.closest(".diction-subject");
        var item=src.closest(".dic_item");
        var nextSection=pane.nextAll(".diction-subject");
        var frm=src.closest("form");
        var param = DS.util.getDataOfForm(frm);
        var _data=param.data;
        var key=item.find("input[name='key']").val();
        var level=item.find("input[name='level']").val();
        var lastLevel=item.find("input[name='lastLevel']").val();
        _data.key=key;
        _data.level=level;
        _data.lastLevel=lastLevel;
        var flag="update";
        if(!key){
            flag="add";
            _data.key=uuid.v1();
        }
        _data.flag=flag;
        console.dir(_data);
        if(flag=='update' && !val){
            $().alertmessage('showError', "名称不能为空！");
            return;
        }
        if(val){
            handler.config.channelDic.saveDicItem(_data,function(){
                var tmplObj=$("#tmpl_channel_dic_show");
                var tmpl=tmplObj.html()||'';
                tmpl=DS.renderViewNew(tmpl,_data);
                item.prop("outerHTML",tmpl);
                pane.find(".channelDic-plus").show();

                nextSection.each(function(){
                    $(this).find(".channel_dic_list").empty();
                    $(this).find(".btn-add").hide();
                });
            });
        }else{
            src.closest(".dic_item").remove();
            pane.find(".channelDic-plus").show();
        }
    },
    saveDicItem: function (data, callback) {
        var container=$("#view_"+handler.config.channelDic.menuId);
        var action = {
            action: 'config.channelDic.saveDicItem',
            data: data
        }
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                if(!data._id){
                    addCache("channelDic",row);
                    container.find(".channel_dic_container").find("input[name='_id']").val(row._id);
                }else{
                    updateCache("channelDic",row._id,row);
                }
                handler.config.channelDic._addDicMap(data.type);
                //$().alertmessage('showSuccess', "设置成功");
                if (typeof callback == "function") {
                    callback(row);
                }
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    delDicItem: function (data, src) {
        if(src.closest(".channel_dic_list").parent().hasClass("dic_level_1")){
            var dicItems=$("#config_channel_dic_pane .dic_level_1").find(".dic_item");
            if(dicItems.length=="1"){
                $().alertmessage('showError',"必须保留一条结束会话类别");
                return;
            }
        }
        if(!confirm("该项及其子项都会删除，确认删除吗？"))return;
        var lastLevel=src.attr("level");
        var level=lastLevel;
        var frm=src.closest("form");
        var item=src.closest(".dic_item");
        var pane=src.closest(".diction-subject");
        var nextSection=pane.nextAll(".diction-subject");
        var prevDics=item.prevAll(".dic_item");
        if(!level){
            level=prevDics.length+"";
        }else{
            level=level+"_"+prevDics.length;
        }

        var _id=frm.find("input[name='_id']").val();
        var type=frm.find("input[name='type']").val();
        console.info("type===="+type);
        var action = {
            action: 'config.channelDic.delDicItem',
            data: {key:data,level:level,_id:_id}
        }
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                updateCache("channelDic",row._id,row);
                handler.config.channelDic._addDicMap(type);
                item.remove();
                nextSection.each(function(){
                    $(this).find(".channel_dic_list").empty();
                    $(this).find(".btn-add").hide();
                });
                $().alertmessage('showSuccess', "删除成功");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showEditDicItem: function (data, src) {
        var lastLevel=src.attr("level");
        var level=lastLevel;
        var name=src.attr("ds_name");
        var item=src.closest(".dic_item");
        var prevDics=item.prevAll(".dic_item");
        if(!level){
            level=prevDics.length+"";
        }else{
            level=level+"_"+prevDics.length;
        }

        var tmplObj=$("#tmpl_channel_dic_set_2");
        var tmpl=tmplObj.html()||'';
        tmpl=DS.renderMethodViewNew(tmpl,{level:level,lastLevel:lastLevel,key:data,name:name});
        //item.prop("outerHTML",tmpl);
        item.html(tmpl);
        item.find(".channel_dic_input_text").focus();
    },
    //增加一个默认的结束会话字典
    addNewWebchatDic: function(){
        var action = {
            action: 'config.channelDic.getDicByType',
            data: {type:'webchat'}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                if(!row){
                    var options=[];
                    options.push({name:"咨询结束",key:uuid.v1()});
                    var action2 = {
                        action: 'config.channelDic.saveDic',
                        data: {options : options, type:'webchat'}
                    };
                    DS.send(action2, function(rep){
                        if(rep.success){
                            var row=rep.row;
                            addCache("channelDic",row);
                        }
                    });
                }

            }
        });
    },

    //保存客户满意度调查
    saveWebchatCSR:function(data, src){

        var names = data.names,keys=data.keys,indexs=data.index ||[],reasons=data.reason;
        var options=[];
        for(var i=0;i<indexs.length;i++) {
            var _reason=[];
            for (var j=i*6;j<(i+1)*6;j++){
                if(reasons[j] != '' && reasons[j] != null){
                    _reason.push(reasons[j]);
                }
            }
            if($.trim(indexs[i])){
                var _key=keys[i];
                if(_key){
                    options.push({index:indexs[i],key:_key,name:names[i],reason:_reason});
                }else{
                    options.push({index:indexs[i],key:uuid.v1(),name:names[i],reason:_reason});
                }
            }
        }
        delete data.names;
        delete data.keys;
        delete data.index;
        delete data.reason;
        data.options=options;
        var action = {
            action: 'config.channelDic.saveCSRDic',
            data: data
        }
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                if(!data._id){
                    addCache("channelDic",row);
                }else{
                    updateCache("channelDic",data._id,data);
                }
                $().alertmessage('showSuccess', "设置成功");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    modulesAdd: function (){
        var box_length=$('#module_list .modules');
        var template=[];
        var xx_px=function(){
            $('#module_list .m_title b').each(function(){
                var _num=$(this).closest(".modules").find('.module_ind').attr('value');
                var px_input=$(this).closest(".module_head").find('.modules_name');
                if(_num==0){
                    $(this).html("一");
                    px_input.attr('msgname','选项一')
                }else if(_num==1){
                    $(this).html("二");
                    px_input.attr('msgname','选项二')
                }else if(_num==2){
                    $(this).html("三");
                    px_input.attr('msgname','选项三')
                }else if(_num==3){
                    $(this).html("四");
                    px_input.attr('msgname','选项四')
                }else if(_num==4){
                    $(this).html("五");
                    px_input.attr('msgname','选项五')
                }
            })
        };
        if (box_length.length < 5) {
            var nums = box_length.length;
            template = $("#add_template").html();
            $('#module_list').append(template);
            $('#module_list .modules:last-child .module_ind').attr('value', nums);
            xx_px();
        } else {
            $().alertmessage('showError',"最多只能添加5个");
        }
        var _remove = $('#module_list .m_title span');
        _remove.each(function () {
            $(this).click(function () {
                var id = $(this).closest('.modules').remove();
                var models = $('#module_list .modules .module_ind');
                for (var i = 0; i <= models.length; i++) {
                    $(models[i]).attr('value', i);
                }
                xx_px();
            })
        });
    },
    relActiveAdd: function (e) {
        var ev = e || window.event;
        var obj = ev.target || ev.srcElement;
        $(obj).closest("span").addClass("act_two").siblings().removeClass("act_two");
        $(obj).closest("li.relative").addClass("active");
    },
    showWebchatCSR: function (e) {

        handler.config.channelDic.relActiveAdd(e);

        var action = {
            action: 'config.channelDic.getCSRDic',
            data: {type:'webchatCSR'}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                if(!row){
                    row={_id:''};
                }
                DS.getView('config/channelDic/satisfied_set', function (view) {
                    var pane = $('#config_channel_src_pane');
                    view=view.replace(/_#_id#_/g,row._id);
                    pane.html(view);
                    handler.config.channelDic._initDicListCSR("webchatCSR",pane);
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

    },
    _initDicListCSR:function(type){
        var _dics=handler.config.channelDic._getChannelDic(type);
        var pane=$('#config_channel_src_pane');
        for (var i = 0; i < _dics.length; i++) {
            var obj = _dics[i];
            pane.find('#add_modules').click();
            var module=$('#module_list .modules:last-child');
            module.find('.modules_key').val(obj.key);
            module.find('.modules_name').val(obj.name);
            var reason=module.find('.modules_reason');
            for(var j=0;j< reason.length;j++){
                var re=obj.reason[j];
                $(reason[j]).val(re);
            }
        }
        pane.find('#module_list').find('.modules').find('.module_body').find('input').attr('placeholder',' ');
    }

};