handler.resource = {
    queryPageSize: 10,
    pbx: {
        pbxList: function () {
            handler.resource.pbx.queryPbx({}, $(""));
        },
        queryPbx: function (data, src) {
            var formId = "query_pbx_form";
            data.page = src.val() || 1;
            data.limit = handler.resource.queryPageSize;
            DS.getView("resource/pbx/pbx_list_item", function (view) {
                var pane = $("table[for='" + formId + "']").find("tbody");
                ;
                pane.empty();
                var action = {
                    action: "resource.pbx.queryPbx",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var accountList = response.list;
                        var count = response.count;
                        var html = "";
                        for (var i = 0; i < accountList.length; i++) {
                            var accountListItem = accountList[i];
                            html += DS.renderMethodViewNew(view, accountListItem);
                        }
                        pane.html(html);
                        DS.updatePagination(formId, count, data.limit, data.page);
                    } else {
                        alert("查询账户异常！");
                    }
                });
            });
        },
        addPbx: function (data, src) {
            var action = {
                action: 'resource.pbx.addPbx',
                data: data
            }
            DS.send(action, function (rep) {
                if (rep.success) {
                    $('#add_pbx_model').modal('hide');
                    handler.refreshTableData("query_pbx_form");
                } else {
                    alert(rep.message || "添加pbx失败,请稍后重试!");
                }
            })
        },
        showUpdatePbx: function (data, src) {
            $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
            DS.getView('resource/pbx/update_pbx', function (view) {
                var pane = $("#resourceConfigModel");
                pane.empty();
                var action = {
                    action: "resource.pbx.getPbxInfo",
                    data: {_id: data}
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var pbx = response.data;
                        var html = DS.renderViewNew(view, pbx);
                        pane.html(html);
                        $("#resourceConfigModel").modal("show");
                    } else {
                        alert("获取pbx信息失败！");
                    }
                });

            });
        },
        updatePbx: function (data, src) {
            var action = {
                action: 'resource.pbx.updatePbx',
                data: data
            }
            DS.send(action, function (rep) {
                if (rep.success) {
                    $('#resourceConfigModel').modal('hide');
                    handler.refreshTableData("query_pbx_form");
                } else {
                    alert(rep.message || "添加pbx失败,请稍后重试!");
                }
            })
        }
    },
    serviceNum: {
        serviceNumList: function () {
            handler.resource.serviceNum.query({}, $(""));
        },
        query: function (data, src) {
            var formId = "query_serviceNum_form";
            data.page = src.val() || 1;
            data.limit = handler.resource.queryPageSize;
            DS.getView("resource/serviceNum/serviceNum_list_item", function (view) {
                var pane = $("table[for='" + formId + "']").find("tbody");
                ;
                pane.empty();
                var action = {
                    action: "resource.serviceNum.queryServiceNum",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var accountList = response.list;
                        var count = response.count;
                        var html = "";
                        for (var i = 0; i < accountList.length; i++) {
                            var accountListItem = accountList[i];
                            html += DS.renderMethodViewNew(view, accountListItem).replace(/_#mouthRent#_/g, 0).replace(/_#account#_/g, "").replace(/_#accountName#_/g, "").replace(/_#companyName#_/g, "");
                        }
                        pane.html(html);
                        DS.updatePagination(formId, count, data.limit, data.page);
                    } else {
                        alert("查询服务号异常！");
                    }
                });
            });
        },
        add: function (data, src) {
            var action = {
                action: "resource.serviceNum.add",
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    $('#add_serviceNum_model').modal('hide');
                    handler.refreshTableData("query_serviceNum_form");
                }
            });
        },
        showUpdateServiceNum: function (data, src) {
            $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
            DS.getView('resource/serviceNum/update_serviceNum', function (view) {
                var pane = $("#resourceConfigModel");
                pane.empty();
                var action = {
                    action: "resource.serviceNum.getServiceNumInfo",
                    data: {_id: data}
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var num = response.data;
                        if (!num.mouthRent) num.mouthRent = 0;
                        var html = DS.renderViewNew(view, num);
                        pane.html(html);
                        $("#resourceConfigModel").modal("show");
                    } else {
                        alert("获取服务号信息失败！");
                    }
                });

            });
        },
        updateServiceNum: function (data, src) {
            var action = {
                action: 'resource.serviceNum.updateServiceNum',
                data: data
            }
            DS.send(action, function (rep) {
                if (rep.success) {
                    $('#resourceConfigModel').modal('hide');
                    handler.refreshTableData("query_serviceNum_form");
                } else {
                    alert("更新服务号失败！");
                }
            })
        },
        showUseDID: function (data, src) {
            $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
            DS.getView('resource/serviceNum/use_did', function (view) {
                var pane = $("#resourceConfigModel");
                pane.empty();
                var html = DS.renderViewNew(view, {_id: data});
                pane.html(html);
                $("#resourceConfigModel").modal("show");
            });
        },
        useDID: function (data, src) {
            var action = {
                action: 'resource.serviceNum.useDID',
                data: data
            }
            DS.send(action, function (rep) {
                if (rep.success) {
                    $('#resourceConfigModel').modal('hide');
                    handler.refreshTableData("query_serviceNum_form");
                } else {
                    alert("服务号设置DID失败！");
                }
            })
        },
        optionDisplay: function (flag, status) {
            if (status == 'use') {
                return "hidden";
            }
        }

    },
    server: {
        line: {
            lineList: function () {
                handler.resource.server.line.query({}, $(""));
            },
            query: function (data, src) {
                var formId = "query_server_line_form";
                data.page = src.val() || 1;
                data.limit = handler.resource.queryPageSize;
                DS.getView("resource/server/line/line_list_item", function (view) {
                    var pane = $("table[for='" + formId + "']").find("tbody");
                    ;
                    pane.empty();
                    var action = {
                        action: "resource.server.line.query",
                        data: data
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var accountList = response.list;
                            var count = response.count;
                            var html = "";
                            for (var i = 0; i < accountList.length; i++) {
                                var accountListItem = accountList[i];
                                html += DS.renderMethodViewNew(view, accountListItem);
                            }
                            pane.html(html);
                            DS.updatePagination(formId, count, data.limit, data.page);
                        } else {
                            alert("查询服务号异常！");
                        }
                    });
                });
            },
            add: function (data, src) {
                var action = {
                    action: "resource.server.line.add",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        $('#add_serviceLine_model').modal('hide');
                        handler.refreshTableData("query_server_line_form");
                    }
                });
            },
            showUpdate: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/line/update', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var action = {
                        action: "resource.server.line.getLineInfo",
                        data: {_id: data}
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var pbx = response.data;
                            var html = DS.renderViewNew(view, pbx);
                            pane.html(html);
                            $("#resourceConfigModel").modal("show");
                        } else {
                            alert("获取pbx信息失败！");
                        }
                    });

                });
            },
            update: function (data, src) {
                var action = {
                    action: 'resource.server.line.update',
                    data: data
                }
                DS.send(action, function (rep) {
                    if (rep.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_line_form");
                    } else {
                        alert(rep.message || "添加pbx失败,请稍后重试!");
                    }
                })
            }
        },
        board: {
            boardList: function () {
                handler.resource.server.board.query({}, $(""));
            },
            query: function (data, src) {
                var formId = "query_server_board_form";
                data.page = src.val() || 1;
                data.limit = handler.resource.queryPageSize;
                DS.getView("resource/server/board/board_list_item", function (view) {
                    var pane = $("table[for='" + formId + "']").find("tbody");
                    ;
                    pane.empty();
                    var action = {
                        action: "resource.server.board.query",
                        data: data
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var accountList = response.list;
                            var count = response.count;
                            var html = "";
                            for (var i = 0; i < accountList.length; i++) {
                                var accountListItem = accountList[i];
                                html += DS.renderMethodViewNew(view, accountListItem);
                            }
                            pane.html(html);
                            DS.updatePagination(formId, count, data.limit, data.page);
                        } else {
                            alert("查询机柜信息异常！");
                        }
                    });
                });
            },
            add: function (data, src) {
                var action = {
                    action: "resource.server.board.add",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        $('#add_serviceBoard_model').modal('hide');
                        handler.refreshTableData("query_server_board_form");
                    } else {
                        alert(response.message || "未知错误！");
                    }
                });
            },
            showUpdate: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/update', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.getBoardInfo",
                        data: {_id: data}
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var pbx = response.data;
                            var html = DS.renderViewNew(view, pbx);
                            pane.html(html);
                            $("#resourceConfigModel").modal("show");
                        } else {
                            alert("获取机柜信息失败！");
                        }
                    });

                });
            },
            update: function (data, src) {
                var action = {
                    action: 'resource.server.board.update',
                    data: data
                }
                DS.send(action, function (rep) {
                    if (rep.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_form");
                    } else {
                        alert(rep.message || "更新机柜信息失败,请稍后重试!");
                    }
                })
            },
            showDelete: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/delete', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var name = $(src).closest("tr").find(".ds_name").text();
                    var tempData = {
                        _id: data,
                        name: name
                    };
                    console.log(tempData);
                    var html = DS.renderViewNew(view, tempData);
                    pane.html(html);
                    $("#resourceConfigModel").modal("show");

                });
            },
            delete: function (data, src) {
                var action = {
                    action: "resource.server.board.delete",
                    data: data
                };
                DS.send(action, function (resposne) {
                    if (resposne.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_form");
                    } else {
                        alert("删除机柜数据异常！");
                    }
                });
            },
            showConfig: function (data, src) {
                DS.getView('resource/server/board/config', function (view) {
                    $("#resource_server_board_info_content").html(view.replace(/_#_id#_/g, data));
                    session.resource = session.resource || {};
                    session.resource.currentBoard = data;
                    handler.resource.server.board.queryOutRoute({boardId: data}, $(""));
                    handler.resource.server.board.queryGatewayRoute({boardId: data}, $(""));
                    handler.resource.server.board.queryInRoute({boardId: data}, $(""));
                    handler.resource.server.board.queryMac({boardId: data}, $(""));

                });
            },
            queryOutRoute: function (data, src) {
                var formId = "query_server_board_outRoute_form";
                data.page = src.val() || 1;
                data.limit = handler.resource.queryPageSize;
                DS.getView("resource/server/board/board_outRoute_list_item", function (view) {
                    var pane = $("table[for='" + formId + "']").find("tbody");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.queryOutRoute",
                        data: data
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var accountList = response.list;
                            var count = response.count;
                            var html = "";
                            for (var i = 0; i < accountList.length; i++) {
                                var accountListItem = accountList[i];
                                html += DS.renderMethodViewNew(view, accountListItem);
                            }
                            pane.html(html);
                            DS.updatePagination(formId, count, data.limit, data.page);
                        } else {
                            alert("查询机柜信息异常！");
                        }
                    });
                });
            },
            onShowOutRoute: function () {

            },

            addOutRoute: function (data, src) {
                data.boardId = session.resource.currentBoard;
                var action = {
                    action: "resource.server.board.addOutRoute",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        $('#add_serviceBoard_outRoute_model').modal('hide');
                        handler.refreshTableData("query_server_board_outRoute_form");
                    } else {
                        alert(response.message || "未知错误！");
                    }
                });
            },
            showUpdateOutRoute: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/updateOutRoute', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.getBoardOutRouteInfo",
                        data: {_id: data}
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var pbx = response.data;
                            var html = DS.renderViewNew(view, pbx);
                            pane.html(html);
                            $("#resourceConfigModel").modal("show");
                        } else {
                            alert("获取机柜信息失败！");
                        }
                    });

                });
            },
            updateOutRoute: function (data, src) {
                var action = {
                    action: 'resource.server.board.updateOutRoute',
                    data: data
                }
                DS.send(action, function (rep) {
                    if (rep.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_outRoute_form");
                    } else {
                        alert(rep.message || "更新机柜信息失败,请稍后重试!");
                    }
                })
            },
            showDeleteOutRoute: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/deleteOutRoute', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var name = $(src).closest("tr").find(".ds_name").text();
                    var tempData = {
                        _id: data,
                        name: name
                    };
                    var html = DS.renderViewNew(view, tempData);
                    pane.html(html);
                    $("#resourceConfigModel").modal("show");
                });
            },
            deleteOutRoute: function (data, src) {
                var action = {
                    action: "resource.server.board.deleteOutRoute",
                    data: data
                };
                DS.send(action, function (resposne) {
                    if (resposne.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_outRoute_form");
                    } else {
                        alert("删除机柜数据异常！");
                    }
                });
            },
            queryGatewayRoute: function (data, src) {
                var formId = "query_server_gateway_route_form";
                data.page = src.val() || 1;
                data.limit = handler.resource.queryPageSize;
                DS.getView("resource/server/board/board_gateway_list_item", function (view) {
                    var pane = $("table[for='" + formId + "']").find("tbody");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.queryGatewayRoute",
                        data: data
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var accountList = response.list;
                            var count = response.count;
                            var html = "";
                            for (var i = 0; i < accountList.length; i++) {
                                var accountListItem = accountList[i];
                                html += DS.renderMethodViewNew(view, accountListItem);
                            }
                            pane.html(html);
                            DS.updatePagination(formId, count, data.limit, data.page);
                        } else {
                            alert("查询机柜信息异常！");
                        }
                    });
                });
            },
            onShowGatewayRoute: function (data, src) {

            },
            addGatewayRoute: function (data, src) {
                data.boardId = session.resource.currentBoard;
                var action = {
                    action: "resource.server.board.addGatewayRoute",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        $('#add_serviceBoard_gateway_model').modal('hide');
                        handler.refreshTableData("query_server_gateway_route_form");
                    } else {
                        alert(response.message || "未知错误！");
                    }
                });
            },
            showUpdateGatewayRoute: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/updateGatewayRoute', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.getBoardGatewayRouteInfo",
                        data: {_id: data}
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var pbx = response.data;
                            var html = DS.renderViewNew(view, pbx);
                            pane.html(html);
                            $("#resourceConfigModel").modal("show");
                        } else {
                            alert("获取机柜信息失败！");
                        }
                    });

                });
            },
            updateGatewayRoute: function (data, src) {
                var action = {
                    action: 'resource.server.board.updateGatewayRoute',
                    data: data
                }
                DS.send(action, function (rep) {
                    if (rep.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_gateway_route_form");
                    } else {
                        alert(rep.message || "更新机柜信息失败,请稍后重试!");
                    }
                })
            },
            showDeleteGatewayRoute: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/deleteGatewayRoute', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var name = $(src).closest("tr").find(".ds_name").text();
                    var tempData = {
                        _id: data,
                        name: name
                    };
                    var html = DS.renderViewNew(view, tempData);
                    pane.html(html);
                    $("#resourceConfigModel").modal("show");
                });
            },
            deleteGatewayRoute: function (data, src) {
                var action = {
                    action: "resource.server.board.deleteGatewayRoute",
                    data: data
                };
                console.log(data);
                DS.send(action, function (resposne) {
                    if (resposne.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_gateway_route_form");
                    } else {
                        alert("删除机柜数据异常！");
                    }
                });
            },
            queryInRoute: function (data, src) {
                var formId = "query_server_board_inRoute_form";
                data.page = src.val() || 1;
                data.limit = handler.resource.queryPageSize;
                DS.getView("resource/server/board/board_inRoute_list_item", function (view) {
                    var pane = $("table[for='" + formId + "']").find("tbody");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.queryInRoute",
                        data: data
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var accountList = response.list;
                            var count = response.count;
                            var html = "";
                            for (var i = 0; i < accountList.length; i++) {
                                var accountListItem = accountList[i];
                                html += DS.renderMethodViewNew(view, accountListItem);
                            }
                            pane.html(html);
                            DS.updatePagination(formId, count, data.limit, data.page);
                        } else {
                            alert("查询机柜信息异常！");
                        }
                    });
                });
            },
            onShowInRoute: function () {
                var pbx = getCache("pbx");
                var temp = "<option value='_value'>_name</option>";
                $("#inRoute_pbx_name_select").empty();
                for (var i = 0; i < pbx.length; i++) {
                    var pbxItem = pbx[i];
                    $("#inRoute_pbx_name_select").append(temp.replace(/_value/g, pbxItem._id).replace(/_name/g, pbxItem.name))
                }
            },
            addInRoute: function (data, src) {
                data.boardId = session.resource.currentBoard;
                var action = {
                    action: "resource.server.board.addInRoute",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        $('#add_serviceBoard_inRoute_model').modal('hide');
                        handler.refreshTableData("query_server_board_inRoute_form");
                    } else {
                        alert(response.message || "未知错误！");
                    }
                });
            },
            showUpdateInRoute: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/updateInRoute', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.getBoardInRouteInfo",
                        data: {_id: data}
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var pbx = response.data;
                            var html = DS.renderViewNew(view, pbx);
                            pane.html(html);
                            $("#resourceConfigModel").modal("show");
                        } else {
                            alert("获取机柜信息失败！");
                        }
                    });

                });
            },
            updateInRoute: function (data, src) {
                var action = {
                    action: 'resource.server.board.updateInRoute',
                    data: data
                }
                DS.send(action, function (rep) {
                    if (rep.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_inRoute_form");
                    } else {
                        alert(rep.message || "更新机柜信息失败,请稍后重试!");
                    }
                })
            },
            showDeleteInRoute: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/deleteInRoute', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var name = $(src).closest("tr").find(".ds_name").text();
                    var tempData = {
                        _id: data,
                        name: name
                    };
                    var html = DS.renderViewNew(view, tempData);
                    pane.html(html);
                    $("#resourceConfigModel").modal("show");
                });
            },
            deleteInRoute: function (data, src) {
                var action = {
                    action: "resource.server.board.deleteInRoute",
                    data: data
                };
                DS.send(action, function (resposne) {
                    if (resposne.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_inRoute_form");
                    } else {
                        alert("删除机柜数据异常！");
                    }
                });
            },
            queryMac: function (data, src) {
                var formId = "query_server_board_mac_form";
                data.page = src.val() || 1;
                data.limit = handler.resource.queryPageSize;
                DS.getView("resource/server/board/board_mac_list_item", function (view) {
                    var pane = $("table[for='" + formId + "']").find("tbody");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.queryMac",
                        data: data
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var accountList = response.list;
                            var count = response.count;
                            var html = "";
                            for (var i = 0; i < accountList.length; i++) {
                                var accountListItem = accountList[i];
                                html += DS.renderMethodViewNew(view, accountListItem);
                            }
                            pane.html(html);
                            DS.updatePagination(formId, count, data.limit, data.page);
                        } else {
                            alert("查询机柜信息异常！");
                        }
                    });
                });
            },
            onShowMac: function () {

            },
            addMac: function (data, src) {
                data.boardId = session.resource.currentBoard;
                var action = {
                    action: "resource.server.board.addMac",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        $('#add_serviceBoard_mac_model').modal('hide');
                        handler.refreshTableData("query_server_board_mac_form");
                    } else {
                        alert(response.message || "未知错误！");
                    }
                });
            },
            showUpdateMac: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/updateMac', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var action = {
                        action: "resource.server.board.getBoardMacInfo",
                        data: {_id: data}
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var pbx = response.data;
                            var html = DS.renderViewNew(view, pbx);
                            pane.html(html);
                            $("#resourceConfigModel").modal("show");
                        } else {
                            alert("获取机柜信息失败！");
                        }
                    });

                });
            },
            updateMac: function (data, src) {
                var action = {
                    action: 'resource.server.board.updateMac',
                    data: data
                }
                DS.send(action, function (rep) {
                    if (rep.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_mac_form");
                    } else {
                        alert(rep.message || "更新机柜信息失败,请稍后重试!");
                    }
                })
            },
            showDeleteMac: function (data, src) {
                $("body").append("<div id='resourceConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
                DS.getView('resource/server/board/deleteMac', function (view) {
                    var pane = $("#resourceConfigModel");
                    pane.empty();
                    var name = $(src).closest("tr").find(".ds_name").text();
                    var tempData = {
                        _id: data,
                        name: name
                    };
                    var html = DS.renderViewNew(view, tempData);
                    pane.html(html);
                    $("#resourceConfigModel").modal("show");
                });
            },
            deleteMac: function (data, src) {
                var action = {
                    action: "resource.server.board.deleteMac",
                    data: data
                };
                DS.send(action, function (resposne) {
                    if (resposne.success) {
                        $('#resourceConfigModel').modal('hide');
                        handler.refreshTableData("query_server_board_mac_form");
                    } else {
                        alert("删除机柜数据异常！");
                    }
                });
            },
            effectRoute: function (data, src) {
                data = {
                    boardId: session.resource.currentBoard,
                    type: data
                };

                var action = {
                    action: 'resource.server.board.effectRoute',
                    data: data
                };

                DS.send(action, function (response) {
                    if (response.success) {
                        alert("生效成功！");
                    } else {
                        alert(response.message);
                    }
                });
            }
        }
    }

}