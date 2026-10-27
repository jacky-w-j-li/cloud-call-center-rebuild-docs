/**
 * Created by chenguang on 7/23/14.
 */
handler.config.interfaceUrl = {
    config_interface: function (id) {
        handler.config.interfaceUrl.refreshInterfaceField();
        handler.config.interfaceUrl.refreshField();
        handler.config.interfaceUrl.refreshCallInter();
    },
    showAddInferface: function () {
        DS.getView("config/interfaceUrl/add_config_interface", function (view) {
            var pane = $("#config_interface_container");
            pane.empty();
            pane.html(view);
        });
    },
    saveInterfaceFields: function (data, src) {
        var action = {
            action: "config.interfaceUrl.addInterfaceFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_interface_container").empty();
                handler.config.interfaceUrl.refreshInterfaceField();
            }
        });
    },
    cancelInterfaceFields: function () {
        $("#config_interface_container").empty();
    },
    refreshInterfaceField: function () {
        var pane = $('#config_interface_pane');
        pane.empty();
        var action = {
            action: 'config.interfaceUrl.queryInterfaceFields'
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.data;
                session.interfaceUrls = {};
                var html = "";
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    session.interfaceUrls[item._id] = item;
                    html +=template('config_interface_item_template',item);
                }
                $("#config_interface_pane").empty();
                $("#config_interface_pane").html(html);
            }
        })
    },
    delInterfaceFields: function (data, src) {
        if (confirm("确认删除？")) {
            var action = {
                action: 'config.interfaceUrl.delInterfaceFields',
                data: {"_id": data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    delete session.interfaceUrls[data];
                    //src.closest('tr#' + data).remove();
                    src.closest('tr').remove();
                }
            })
        }
    },
    showEditInterfaceFields: function (data, src) {
        var item = session.interfaceUrls[data];
        if (!item) {
            alert('该行内容已经被删除!');
            return;
        }
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        DS.getView('config/interfaceUrl/edit_config_interface', function (view) {
            view = render.replaceDataByObject(item, view);
            var pane = $("#config_interface_container");
            pane.empty();
            pane.html(view);
        })
    },
    editInterfaceFields: function (data, src) {
        var action = {
            action: "config.interfaceUrl.editInterfaceFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_interface_container").empty();
                handler.config.interfaceUrl.refreshInterfaceField();
            } else {
                alert('更新失败!');
            }
        });
    },
    moveInterfaceFieldUp: function (data) {
        var action = {
            action: 'config.interfaceUrl.moveInterfaceField',
            data: {"moveup": true, "_id": data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.interfaceUrl.refreshInterfaceField();
            }
        });
    },
    moveInterfaceFieldDown: function (data) {
        var action = {
            action: 'config.interfaceUrl.moveInterfaceField',
            data: {"moveup": false, "_id": data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.interfaceUrl.refreshInterfaceField();
            }
        });
    },
    refreshField: function() {
        var pane = $('#config_callUrl_pane');
        pane.empty();
        DS.getView('config/call/config_callUrl_item', function (view) {
            var action = {
                action: 'config.callUrl.queryCallUrlFields'
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var list = response.data;
                    session.callUrls = {};
                    var html = "";
                    for(var i = 0; i < list.length; i++) {
                        var item = list[i];
                        if(item) {
                            item.name = (item.name?item.name:"");
                            session.callUrls[item._id] = item;
                            html += render.call.renderList(view, item);
                        }
                    }
                    pane.html(html);
                }
            })
        });
    },
    showAddcallUrl: function() {
        DS.getView("config/call/add_config_url", function (view) {
            var pane = $("#config_callUrl_container");
            pane.empty();
            pane.html(view);
            $("#field_type").html(render.call.renderSelectOption());
        });
    },
    saveCallUrlFields: function(data, src) {
        var action = {
            action: "config.callUrl.addCallUrlFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_callUrl_container").empty();
                handler.config.interfaceUrl.refreshField();
            }
        });
    },
    showEditFields: function(data, src) {
        var item = session.callUrls[data];
        if (!item) {
            alert('该行内容已经被删除!');
            return;
        }
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        DS.getView('config/call/edit_config_url', function (view) {
            view = render.replaceDataByObject(item, view);
            var pane = $("#config_callUrl_container");
            pane.empty();
            pane.html(view);
            $("#field_type").html(render.call.renderSelectOption());
            $("#field_type").val(item.type);
            if(item.type == '2'){
                $('.urlOutOpenType').show();
                if(item.outOpenType){
                    $("#editUrlOutOpenType").val(item.outOpenType);
                }
            }
        });
    },
    delFields: function(data, src) {
        if (confirm("确认删除？")) {
            var action = {
                action: 'config.callUrl.delCallUrlFields',
                data: {"_id": data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    handler.config.interfaceUrl.refreshField();
                }
            })
        }
    },
    cancelFields: function () {
        $("#config_callUrl_container").empty();
    },
    editCallUrlFields: function (data, src) {
        var action = {
            action: "config.callUrl.editCallUrlFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_callUrl_container").empty();
                handler.config.interfaceUrl.refreshField();
            } else {
                alert('更新失败!');
            }
        });
    },
    showAddCallInter: function(){
        DS.getView("config/call/add_call_inter", function(view){
            var pane = $("#config_call_inter_container");
            pane.empty();
            pane.html(view);
        })
    },
    saveAddCallInter: function(data){
        var callInterList = getCache("callInters");
        for(var i=0; i<callInterList.length; i++){
            if(callInterList[i].callInterName == data.callInterName){
                utils.showError("已存在描述"+data.callInterName+",请修改!");
                return;
            }
        }
        handler.config.interfaceUrl.saveCallInter(data, function(response){
            $("#config_call_inter_container").empty();
            handler.config.interfaceUrl.refreshCallInter();
        });
    },
    saveCallInter: function(data, callback){
        var action = {
            action: "config.callInter.addOrEditCallInter",
            data: data
        }
        DS.send(action, function (response){
            if(!response.success){
                utils.showError(response.message);
                return;
            }
            callback(response);
        })
    },
    showEditCallInter: function(data){
        var action = {
            data: {_id: data},
            action: "config.callInter.queryCallInter"
        }
        DS.send(action, function(queryData){
            if(!queryData.success){
                utils.showError("获取对接数据失败!");
                return;
            }
            var callInterData = queryData.listData[0];
            if(callInterData){
                DS.getView("config/call/edit_call_inter", function(view){
                    var editPane = $("#config_call_inter_container");
                    editPane.empty();
                    view = render.call.renderEditCallInter(view, callInterData);
                    editPane.html(view);
                })
            }else{
                utils.showError("获取缓存失败!");
                return;
            }
        })
    },
    saveEditCallInter: function(data){
        var callInterId = data._id
        handler.config.interfaceUrl.saveCallInter(data, function(response){
            $("#config_call_inter_container").empty();
            handler.config.interfaceUrl.refreshCallInter();
//                    var paneHtml = $("#edit_call_inter_item_body").html();
//                    var appHtml = render.call.renderCallInterTable(paneHtml, response.itemName, response.itemUrl, response.itemId);
//                    $("#edit_call_inter_item_body").html(appHtml);
        });
    },
    removeCallInter: function(data){
        if (confirm("确认删除？")) {
            var action = {
                action: 'config.callInter.delCallInter',
                data: {"_id": data}
            };
            DS.send(action, function (response) {
                if (!response.success) {
                    utils.showError("删除失败!");
                    return;
                }
                $("#config_call_inter_container").empty();
                handler.config.interfaceUrl.refreshCallInter();
            })
        }
    },
    cancelDoCallInter: function(){
        $("#config_call_inter_container").empty();
    },
    refreshCallInter: function(){
        var pane = $('#config_call_inter_pane');
        pane.empty();
        var queryData = {
            accountId: session.user.account
        }
        DS.getView('config/call/config_call_inter', function(view){
            var action = {
                data: queryData,
                action: 'config.callInter.queryCallInter'
            };
            DS.send(action, function(response){
                if (response.success) {
                    var listData = response.listData;
                    if(listData && listData.length > 0){
                        var html = "";
                        for(var i=0; i<listData.length; i++) {
                            var item = listData[i];
                            html += render.call.renderCallInterList(view, item);
                        }
                        pane.html(html);
                    }
                }
            })
        });
    },
    getCallInterItem: function(data, callback){
        var action = {
            data: {_id: data},
            action: "config.callInter.queryCallInter"
        }
        DS.send(action, function(queryRes){
            if(!queryRes.success){
                utils.showError("查询弹屏对接历史失败!");
                return;
            }
            callback(queryRes);
        })
    },
    changeUrlOutOpenType: function(value){
        if(value == '2'){
            $('.urlOutOpenType').show();
        }else{
            $('.urlOutOpenType').hide();
        }
    }

}