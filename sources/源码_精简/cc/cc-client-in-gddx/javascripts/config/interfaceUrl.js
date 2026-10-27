/**
 * Created by chenguang on 7/23/14.
 */
handler.config.interfaceUrl = {
    config_interface: function (id) {
        handler.config.interfaceUrl.refreshInterfaceField();
        handler.config.interfaceUrl.refreshField();
        handler.config.interfaceUrl.refreshCallInter();
        handler.config.interfaceUrl.refreshTABField();
        handler.config.interfaceUrl.refreshDialoutField();
    },
    //showAddInferface: function () {
    //    DS.getView("config/interfaceUrl/add_config_interface", function (view) {
    //        var pane = $("#config_interface_container");
    //        pane.empty();
    //        pane.html(view);
    //    });
    //},
    showAddInferface: function () {
            var pane = $("#config_interface_container");
            pane.empty();
            var view =template("add_config_interface_template");
            pane.html(view);
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
        $("#config_interface_pane").find("tr").removeClass("active");
    },
    //refreshInterfaceField: function () {
    //    var pane = $('#config_interface_pane');
    //    pane.empty();
    //    DS.getView('config/interfaceUrl/config_interface_item', function (view) {
    //        var action = {
    //            action: 'config.interfaceUrl.queryInterfaceFields'
    //        };
    //        DS.send(action, function (response) {
    //            if (response.success) {
    //                var list = response.data;
    //                session.interfaceUrls = {};
    //                var html = "";
    //                for (var i = 0; i < list.length; i++) {
    //                    var item = list[i];
    //                    session.interfaceUrls[item._id] = item;
    //                    html += render.replaceDataByObject(list[i], view);
    //                }
    //                $("#config_interface_pane").empty();
    //                $("#config_interface_pane").html(html);
    //            }
    //        })
    //    });
    //},
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
                    src.closest("tr").remove();
                }
            })
        }
    },
    //showEditInterfaceFields: function (data, src) {
    //    var item = session.interfaceUrls[data];
    //    if (!item) {
    //        alert('该行内容已经被删除!');
    //        return;
    //    }
    //    $(src).closest("tr").addClass("active").siblings().removeClass("active");
    //    DS.getView('config/interfaceUrl/edit_config_interface', function (view) {
    //        view = render.replaceDataByObject(item, view);
    //        var pane = $("#config_interface_container");
    //        pane.empty();
    //        pane.html(view);
    //    })
    //},
    showEditInterfaceFields: function (data, src) {
        var item = session.interfaceUrls[data];
        if (!item) {
            alert('该行内容已经被删除!');
            return;
        }
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
            var view = template('edit_config_interface_template',item);
            var pane = $("#config_interface_container");
            pane.empty();
            pane.html(view);
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
    //refreshField: function() {
    //    var pane = $('#config_callUrl_pane');
    //    pane.empty();
    //    DS.getView('config/call/config_callUrl_item', function (view) {
    //        var action = {
    //            action: 'config.callUrl.queryCallUrlFields'
    //        };
    //        DS.send(action, function (response) {
    //            if (response.success) {
    //                var list = response.data;
    //                session.callUrls = {};
    //                var html = "";
    //                for(var i = 0; i < list.length; i++) {
    //                    var item = list[i];
    //                    if(item) {
    //                        item.name = (item.name?item.name:"");
    //                        session.callUrls[item._id] = item;
    //                        html += render.call.renderList(view, item);
    //                    }
    //                }
    //                pane.html(html);
    //            }
    //        })
    //    });
    //},
    refreshField: function() {
        var pane = $('#config_callUrl_pane');
        pane.empty();
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
                            item.type_name = getGeneralCache("callUrlType", item.type).code_name
                            html +=template("config_callUrl_item_template",item);
                        }
                    }
                    pane.html(html);
                }
            })

    },
       refreshDialoutField: function ()  {
           var pane = $('#config_dialout_pane');
           pane.empty();
           DS.getView('config/call/config_dialout_item', function (view) {
               var action = {
                   action: 'config.callUrl.queryDialoutUrlFields'
               };
               DS.send(action, function (response) {
                   if (response.success) {
                       var list = response.data;
                       session.dialoutUrls = {};
                       var html = "";
                       for(var i = 0; i < list.length; i++) {
                           var item = list[i];
                           if(item) {
                               item.name = (item.name?item.name:"");
                               session.dialoutUrls[item._id] = item;
                               html += render.call.renderList(view, item);
                           }
                       }
                       pane.html(html);
                   }
               })
           });
       },
    //外呼弹屏添加
    showAddDialoutUrl: function() {
        DS.getView("config/call/add_dialout_url", function (view) {
            var pane = $("#config_dialout_container");
            pane.empty();
            pane.html(view);
            $("#field_dialout_type").html(render.call.renderSelectOption());
        });
    },
    //showAddcallUrl: function() {
    //    DS.getView("config/call/add_config_url", function (view) {
    //        var pane = $("#config_callUrl_container");
    //        pane.empty();
    //        pane.html(view);
    //        $("#field_type").html(render.call.renderSelectOption());
    //    });
    //},
    showAddcallUrl: function() {
            var pane = $("#config_callUrl_container");
            pane.empty();
            pane.html(template('add_config_url_template'));
            $("#field_type").html(render.call.renderSelectOption());
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
    //添加外呼弹屏
    saveDialoutFields: function(data, src) {
        var action = {
            action: "config.callUrl.addDialoutUrlFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_dialout_container").empty();
                handler.config.interfaceUrl.refreshDialoutField();
            }
        });
    },
    //showEditFields: function(data, src) {
    //    var item = session.callUrls[data];
    //    if (!item) {
    //        alert('该行内容已经被删除!');
    //        return;
    //    }
    //    $(src).closest("tr").addClass("active").siblings().removeClass("active");
    //    DS.getView('config/call/edit_config_url', function (view) {
    //        view = render.replaceDataByObject(item, view);
    //        var pane = $("#config_callUrl_container");
    //        pane.empty();
    //        pane.html(view);
    //        $("#field_type").html(render.call.renderSelectOption());
    //        $("#field_type").val(item.type);
    //        if(item.type == '2'){
    //            $('.urlOutOpenType').show();
    //            if(item.outOpenType){
    //                $("#editUrlOutOpenType").val(item.outOpenType);
    //            }
    //        }
    //    });
    //},
    showEditFields: function(data, src) {
        var item = session.callUrls[data];
        if (!item) {
            alert('该行内容已经被删除!');
            return;
        }
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
            var view = template('edit_config_url_template',item)
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

    },
    userDialoutScreen:function(data,src){
        if (confirm("外呼弹屏只能选择启用一个,确认启用该弹屏吗？")) {
            $("#config_dialout_container").empty();
            var action = {
                action: 'config.callUrl.userDialoutScreen',
                data: {"_id": data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    handler.config.interfaceUrl.refreshDialoutField();
                    handler.config.interfaceUrl.refreshField();
                }
            })
        }

    },

    stopuserDialoutScreen:function(data,src){
        if (confirm("确认停用该弹屏吗？")) {
            $("#config_dialout_container").empty();
            var action = {
                action: 'config.callUrl.stopuserDialoutScreen',
                data: {"_id": data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    handler.config.interfaceUrl.refreshDialoutField();
                    handler.config.interfaceUrl.refreshField();
                }
            })
        }

    },
    showEditDialoutFields: function(data, src) {
        var item = session.dialoutUrls[data];
        if (!item) {
            alert('该行内容已经被删除!');
            return;
        }
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        DS.getView('config/call/edit_dielout_config_url', function (view) {
            view = render.replaceDataByObject(item, view);
            var pane = $("#config_dialout_container");
            pane.empty();
            pane.html(view);
            $("#field_dialout_type").html(render.call.renderSelectOption());
            $("#field_dialout_type").val(item.type);
            if(item.type == '2'){
                $('.urlOutOpenType').show();
                if(item.outOpenType){
                    $("#editUrlOutOpenType").val(item.outOpenType);
                }
            }
        });
    },
    delDialoutFields: function(data, src) {
        if (confirm("确认删除？")) {
            var action = {
                action: 'config.callUrl.delDialoutUrlFields',
                data: {"_id": data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    handler.config.interfaceUrl.refreshDialoutField();
                }
            })
        }
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
        $("#config_callUrl_pane").find("tr").removeClass("active");
    },

    cancelDialoutFields: function () {
        $("#config_dialout_container").empty();
        $("#config_dialout_container").find("tr").removeClass("active");
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
    editDialoutUrlFields: function (data, src) {
        var action = {
            action: "config.callUrl.editDialoutUrlFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_dialout_container").empty();
                handler.config.interfaceUrl.refreshDialoutField();
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
    },
    //客户TAB页对接
    //showAddTabUrl : function () {
    //    var action = {
    //        action: "config.tabUrl.queryTABFields"
    //    }
    //    DS.send(action, function(queryRes){
    //        if(queryRes.success){
    //            if (queryRes.data.length < 5) {
    //                DS.getView("config/tab/add_config_tab", function (view) {
    //                    var pane = $("#config_tab_container");
    //                    pane.empty();
    //                    pane.html(view);
    //                });
    //            } else {
    //                $().alertmessage('showError', '客户TAB页数量最多可添加5个');
    //            }
    //        }
    //    })
    //
    //},
    showAddTabUrl : function () {
        var action = {
            action: "config.tabUrl.queryTABFields"
        }
        DS.send(action, function(queryRes){
            if(queryRes.success){
                if (queryRes.data.length < 5) {
                        var pane = $("#config_tab_container");
                        pane.empty();
                        pane.html(template('add_config_tab_template'));
                } else {
                    $().alertmessage('showError', '客户TAB页数量最多可添加5个');
                }
            }
        })

    },
    saveTABFields : function (data, src) {
        var action = {
            action: "config.tabUrl.addTABFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_tab_container").empty();
                handler.config.interfaceUrl.refreshTABField();
            }
        });
    },
    cancelTABFields: function () {
        $("#config_tab_container").empty();
        $("#config_table_pane").find("tr").removeClass("active");
    },
    //refreshTABField: function () {
    //    var pane = $('#config_table_pane');
    //    pane.empty();
    //    DS.getView('config/tab/config_tab_item', function (view) {
    //        var action = {
    //            action: 'config.tabUrl.queryTABFields'
    //        };
    //        DS.send(action, function (response) {
    //            if (response.success) {
    //                var list = response.data;
    //                session.tabUrls = {};
    //                var html = "";
    //                for (var i = 0; i < list.length; i++) {
    //                    var item = list[i];
    //                    session.tabUrls[item._id] = item;
    //                    html += render.replaceDataByObject(list[i], view);
    //                }
    //                $("#config_table_pane").empty();
    //                $("#config_table_pane").html(html);
    //            }
    //        })
    //    });
    //},
    refreshTABField: function () {
        var pane = $('#config_table_pane');
        pane.empty();
            var action = {
                action: 'config.tabUrl.queryTABFields'
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var list = response.data;
                    session.tabUrls = {};
                    var html = "";
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        session.tabUrls[item._id] = item;
                        html += template('config_tab_item_template',item);
                    }
                    $("#config_table_pane").empty();
                    $("#config_table_pane").html(html);
                }
            })
    },
    getTABItem: function(callback){
        var action = {
            action: "config.tabUrl.queryTABFields"
        }
        DS.send(action, function(queryRes){
            if(!queryRes.success){
                //utils.showError("查询失败!");
                return;
            }
            callback(queryRes);
        })
    },
    //showEditTABFields: function (data, src) {
    //    var item = session.tabUrls[data];
    //    if (!item) {
    //        alert('该行内容已经被删除!');
    //        return;
    //    }
    //    $(src).closest("tr").addClass("active").siblings().removeClass("active");
    //    DS.getView('config/tab/edit_config_tab', function (view) {
    //        view = render.replaceDataByObject(item, view);
    //        var pane = $("#config_tab_container");
    //        pane.empty();
    //        pane.html(view);
    //    })
    //},
    showEditTABFields: function (data, src) {
        var item = session.tabUrls[data];
        if (!item) {
            alert('该行内容已经被删除!');
            return;
        }
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
            var view = template('edit_config_tab_template',item);
            var pane = $("#config_tab_container");
            pane.empty();
            pane.html(view);
    },
    editTABFields: function (data, src) {
        var action = {
            action: "config.tabUrl.editTABFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_tab_container").empty();
                handler.config.interfaceUrl.refreshTABField();
            } else {
                alert('更新失败!');
            }
        });
    },
    delTABFields: function (data, src) {
        if (confirm("确认删除？")) {
            var action = {
                action: 'config.tabUrl.delTABFields',
                data: {"_id": data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    delete session.tabUrls[data];
                    src.closest('tr#' + data).remove();
                }
            })
        }
    },
    moveTABFieldUp: function (data) {
        var action = {
            action: 'config.tabUrl.moveTABField',
            data: {"moveup": true, "_id": data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.interfaceUrl.refreshTABField();
            }
        });
    },
    moveTABFieldDown: function (data) {
        var action = {
            action: 'config.tabUrl.moveTABField',
            data: {"moveup": false, "_id": data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.interfaceUrl.refreshTABField();
            }
        });
    },
    overallSituationSave : function () {
        if ($('#config_token_check').length > 0) {
            var value = $('#config_token_check').is(':checked');
            var action = {
                action: 'config.overallSituationConfig.updateTokenConfig',
                data: {"_id":session.account._id,"tokenCheck":value}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    $().alertmessage('showSuccess', "保存成功！");
                } else {
                    $().alertmessage('showError', "保存失败！");
                }
            });
        }
    }

}