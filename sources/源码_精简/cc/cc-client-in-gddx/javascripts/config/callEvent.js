/**
 * Created by chenguang on 7/25/14.
 */
handler.config.callEvent = {
    config_event : function(data){
        var action = {
            action : "config.callEvent.queryCallEvent"
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('查询失败');
                return;
            }

            var html = '';
            for(var i=0 ; i<res.list.length ; i++){
                var tr = '<tr>';
                tr += '<td>'+res.list[i].Name+'</td>';
                tr += '<td>'+handler.config.callEvent.getConcreteTypeName(res.list[i].ConcreteType)+'</td>';
                tr += '<td>'+res.list[i].Url+'</td>';
                tr += '<td>'+handler.config.callEvent.getPbxNickName(res.list[i].PBX)+'</td>';
                tr += '<td><a class="btn btn-primary ds_do_action" ds_action="config.callEvent.showEditCallEvent" ds_data="'+res.list[i]._id+'">修改</a>  ' +
                    '<a class="btn btn-danger ds_do_action" ds_action="config.callEvent.delCallEvent" ds_data="'+res.list[i]._id+'">删除</a>' +
                    '</td>';
                tr += '</tr>';
                html += tr;
            }
            $('#interface_call_event_table_data').html(html);
        });
    },
    showAddCallEvent : function(data){
        DS.getView('config/callEvent/add_call_event', function(view){
            var panel = $('#interface_add_call_event_pane');
            panel.empty();
            var accountPbxes = session.account.pbx;
            var pbxOptions = '<option value="">--请选择--</option>';
            for(var i=0; i < accountPbxes.length ;i ++){
                pbxOptions += '<option value='+accountPbxes[i].PBX+'>'+accountPbxes[i].NickName+'</option>';
            }
            panel.append(view.replace(/__SELECT_PBX_OPTIONS/g,pbxOptions));

            $('#add_call_event_Modal').modal();
        });
    }
    ,showEditCallEvent : function(data){
        var action = {
            action : "config.callEvent.getCallEventById",
            data : data
        }
        DS.send(action,function(res){
            if(!res.success || !res.doc){
                alert('查询事件失败！');
            }
            console.log(res.doc);
            var event = res.doc;
            DS.getView('config/callEvent/add_call_event', function(view){
                var panel = $('#interface_add_call_event_pane');
                panel.empty();
                var accountPbxes = session.account.pbx;
                var pbxOptions = '<option value="">--请选择--</option>';
                for(var i=0; i < accountPbxes.length ;i ++){
                    if(event.PBX == accountPbxes[i].PBX){
                        pbxOptions += '<option selected value='+accountPbxes[i].PBX+'>'+accountPbxes[i].NickName+'</option>';
                    }else{
                        pbxOptions += '<option value='+accountPbxes[i].PBX+'>'+accountPbxes[i].NickName+'</option>';
                    }
                }
                panel.append(view.replace(/__SELECT_PBX_OPTIONS/g,pbxOptions));
                $('#callEventPBX').attr('disabled','disabled');
                $('#callEventId').val(event._id);
                $('#callEventName').val(event.Name);
                $('#callEventUrl').val(event.Url);
                $('#callEventConcreteType').val(event.ConcreteType)
                $('#callEventTitle').html('修改通话事件');

                $('#add_call_event_Modal').modal();
            });
        });
    }
    ,saveCallEvent : function(data){
        var action = {
            action : "config.callEvent.addOrUpdateCallEvent",
            data : data
        }
        DS.send(action, function(response){
            if (response.success){
                alert('保存事件成功！');
                $('#add_call_event_Modal').modal('hide');
                handler.config.callEvent.config_event();
            }else{
                alert('保存事件失败！');
            }
        });
    }
    ,delCallEvent : function(data){
        var action = {
            action : "config.callEvent.delCallEvent",
            data : data
        }
        DS.send(action, function(response){
            if (response.success){
                alert('删除事件成功！');
                handler.config.callEvent.config_event();
            }else{
                alert('删除事件失败！');
            }
        });
    },
    getConcreteTypeName : function(data){
        var concreteTypes = session.dicMap['callEventConcreteType'];
        var name = '';
        for(var i=0 ; i < concreteTypes.length ; i++){
            if(concreteTypes[i].code_value === data){
                name = concreteTypes[i].code_name;
                break;
            }
        }
        return name;
    }
    ,getPbxNickName : function(data){
        var pbxs = session.account.pbx;
        var name = '';
        for(var i=0 ; i < pbxs.length ; i++){
            if(pbxs[i].PBX === data){
                name = pbxs[i].NickName;
                break;
            }
        }
        return name;
    }

}