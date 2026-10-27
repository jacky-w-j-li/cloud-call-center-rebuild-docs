handler.task = {
    pageSize: 10,
    task_list: function (menu) {
        handler.task.searchTask(null, $('#contact_list_'+menu).find('.contacts_caption'));
    },
    moreTask: function (data, view) {
        dsevent.publish(dsevent.evt.customerAdd);
    },

    showTaskInCustomer: function (cid, pane, menu, taskId) {
        DS.getView('task/task', function (view) {
            view = view.replace(new RegExp('_#customer#_', 'g'), cid);
            pane.html(view);
            if (taskId) {
                handler.task.getTask({_id: taskId}, function (task) {
                    handler.task._showTask(menu, task, pane.find('.task_detail_pane'));
                });
            } else {
                handler.task.getCustomerIncompleteTask({customer: cid}, function (tasks) {
                    for (var i = 0; i < tasks.length; i++) {
                        handler.task._showTask(menu, tasks[i], pane.find('.task_detail_pane'));
                    }
                });
            }
        });
    },
    showAddTask: function (cid, src) {
        var pane = src.closest('#task_pane').find('.task_add_pane');
        if (pane.find('.task_add').length > 0)
            return;
        DS.getView('task/task_add', function (view) {
            var menu = src.closest('.task_container').attr('ds_menu');

            view = view.replace(new RegExp('_#cid#_', 'g'), cid)
                .replace(new RegExp('_#menu#_', 'g'), menu);
            var tags = getCache('tags');
            var menuView = '';
            for (var i in tags) {
                menuView += '<li role="presentation" class="ds_do_action" ds_action="task.addTagView" ds_data="' + i + '">' +
                    '<a role="menuitem" tabindex="-1" href="#">' + tags[i] + '</a></li>';
            }
            view = view.replace('_#menuview#_', menuView);
            pane.prepend(view);
        });
    },
    cancelAddTask: function (data, src) {
        src.closest('.task_add').remove();
    },
    showTask: function (customerId, src) {
        var menu = src.attr('ds_menu');
        var taskId = src.attr('ds_task');
        handler.customer.loadCustInfo(customerId, menu, 'business', taskId);
    },
    completeTask: function (taskId, src) {
        var complete = src.attr('ds_complete');
        if (complete == "0") {
            handler.task.doCompleteTask({_id: taskId}, function (res) {
                src.attr('ds_complete', '1');
                dsevent.publish(dsevent.evt.taskComplete, {_id: taskId});
            });
        } else {
            handler.task.cancelCompleteTask({_id: taskId}, function (res) {
                src.attr('ds_complete', '0');
                dsevent.publish(dsevent.evt.taskCompleteCancel, {_id: taskId});
            });
        }
    },

    showTaskComplete: function (detailPane) {
        detailPane.find('.task_check').addClass('completed');
        detailPane.find('.task_title_bar').addClass('completed');
    },

    showTaskCompleteCancel: function (detailPane) {
        detailPane.find('.task_check').removeClass('completed');
        detailPane.find('.task_title_bar').removeClass('completed');

    },
    showTaskComments: function (taskId, src) {
        var menu = src.closest('.task_container').attr('ds_menu');
        var daTodo = src.attr('ds_todo');
        if (daTodo == '1') {
            src.closest('div').addClass('dropup');
            src.attr('ds_todo', '0');
            handler.task.updateTaskComments(taskId, menu);
        } else {
            src.closest('div').removeClass('dropup');
            src.attr('ds_todo', '1');
        }
    },
    updateTaskComments: function (taskId, menu) {
        var src = $('#task_detail_item_' + menu + '_' + taskId).find('.show_comments');
        var timestamp = src.attr('timestamp');
        var daTodo = src.attr('ds_todo');
        handler.task.getTaskComments({task: taskId, sortTime:{$gt: parseInt(timestamp)}}, function (data) {
            if (data) {
                var menu = src.attr('ds_menu');
                var pane = src.closest('#task_detail_item_' + menu + '_' + taskId).find('.feed_story');
                if(data.length > 0) {
                    src.attr('timestamp', data[data.length-1].sortTime);
                }
                handler.task._showTaskComments(data, pane);
            }
        });
    },
    addTagView: function (tag, src) {
        var tagPane = src.closest('.row_item').find('.task_detail_tag');
        if (tagPane.find('.' + tag).length == 1) {
            return;
        }
        var tags = getCache('tags');
        var tagName = tags[tag];
        tagPane.append('<span class="text-tag ' + tag + '"><input class="hidden" name="tags[]" value="' + tag + '">' +
            '<span class="text-button">' +
            '<span class="text-label">' + tagName + '</span>' +
            '<a class="text-remove ds_do_action" ds_action="task.removeTagView" ds_data="' + tag + '"></a></span></span>');
    },
    removeTagView: function (tag, src) {
        src.closest('.task_detail_tag').find('.' + tag).remove();
    },
    addTag: function (taskId, src) {
        var tag = src.attr('ds_tag');
        var pane = src.closest('.task_detail_tag');
        if (pane.find('.' + tag).length > 0)
            return;
        var action = {
            action: 'app.task.addTaskTag',
            data: {
                _id: taskId,
                tag: tag
            }
        };
        DS.send(action, function(response){
            if(response.success) {
                var name = getCache('tags')[tag];
                handler.task._showTagInTask(taskId, tag, name, pane);
            }
        });
    },
    removeTag: function (taskId, src) {
        var tag = src.attr('ds_tag');
        var action = {
            action: 'app.task.deleteTaskTag',
            data: {
                _id: taskId,
                tag: tag
            }
        };
        DS.send(action, function(response){
            if(response.success){
                handler.task._removeTagInTask(tag, src.closest('.task_detail_tag'));
            }
        });
    },
    /**
     *添加任务
     *
     * @param data
     * {
     * title:string,
     * detail:string,
     * tags:[],
     * master:assignUser
     * customer:customerId
     * }
     * @param callback
     * true or false
     */
    addTask: function (data, src) {
        data.tags = data.tags || [];
        var action = {
            action: "app.task.addTask",
            data: data
        };
        var menu = src.closest('.task_container').attr('ds_menu');
        var taskPane = src.closest('#task_pane');
        DS.send(action, function (response) {
            if (response.success) {
                src.closest('.task_add').remove();
                handler.task._showTask(menu, response.data, taskPane.find('.task_detail_pane'));
            } else {
                alert('添加任务失败');
            }
        });
    },
    /**
     *获取我的代办业务
     *
     * @param callback
     * []
     */
    getMyIncompleteTask: function (callback) {
        var action = {
            action: "app.task.query",
            data: {queryType: "incomplete"}
        };
        DS.send(action, function (response) {
            var task = [];
            if (response.success) {
                task = response.data;
            }
            callback(task);
        });
    },
    /**
     * 获取我分配的业务
     * @param callback
     * []
     */
    getMyAssignTask: function (callback) {
        var action = {
            action: "app.task.query",
            data: {queryType: "assign"}
        };
        DS.send(action, function (response) {
            var task = [];
            if (response.success) {
                task = response.data;
            }
            callback(task);
        });
    },
    /**
     * 获取我的全部业务
     * @param callback
     * []
     */
    getMyAllTask: function (callback) {
        var action = {
            action: "app.task.query",
            data: {queryType: "all"}
        };
        DS.send(action, function (response) {
            var task = [];
            if (response.success) {
                task = response.data;
            }
            callback(task);
        });
    },
    getCustomerIncompleteTask: function (data, callback) {
        data.isComplete = false;
        var action = {
            action: "app.task.query",
            data: data
        };
        DS.send(action, function (response) {
            var task = [];
            if (response.success) {
                task = response.data;
            }
            callback(task);
        });
    },
    getCustomerHistoryTask: function (data, callback) {
        var action = {
            action: "app.task.query",
            data: data
        };
        DS.send(action, function (response) {
            var task = [];
            if (response.success) {
                task = response.data;
            }
            callback(task);
        });
    },
    getTaskComments: function (data, callback) {
        var action = {
            action: "app.task.getTaskComments",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(response.data);
            } else {
                callback(null);
            }
        });
    },
    getTask: function (data, callback) {
        var action = {
            action: 'app.task.getTaskById',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(response.data);
            } else {
                callback(null);
            }
        });
    },
    /*
     * 完成任务
     * @param data
     * {_id:taskId}
     * @param callback
     * {
     *     task obj
     * }
     */
    doCompleteTask: function (data, callback) {
        var action = {
            action: "app.task.doCompleteTask",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(response.data);
            } else {
                callback(null);
            }
        });
    },
    /**
     * 取消完成任务
     * @param data
     * {_id:taskId}
     * @param callback
     * {
     *     task obj
     * }
     */
    cancelCompleteTask: function (data, callback) {
        var action = {
            action: "app.task.cancelCompleteTask",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(response.data);
            } else {
                callback(null);
            }
        });
    },
    /**
     * 添加任务comments
     * @param data
     * {
     *     task : taskId,
     *     comment : content,
     * }
     * @param callback
     * {
     *     comment obj
     * }
     */
    addComments: function (data, src) {
        var action = {
            action: "app.task.addComments",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var menu = src.closest('.task_container').attr('ds_menu');
                handler.task.updateTaskComments(data.task, menu);
                src.closest('.feed_back').find('#comment_input_' + menu + '_' + data.task).val('');
            }
        });
    },
    assignToUser: function (data, callback) {
        var action = {
            action: "app.task.assignToUser",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(response.data);
            } else {
                callback(null);
            }
        });
    },
    moreTask: function(data, src) {
        var pane = src.closest('.ds_search_pane');
        var index = parseInt(pane.attr('ds_index'))+1;
        var queryType = pane.attr('query_type');
        var query = getSearchCondition(pane);
        handler.task._queryTask(index, queryType, query.data, query.queryDisplay, pane);
    },
    searchTask: function(data, src) {
        var pane = src.closest('.ds_search_pane');
        pane.attr('ds_index', '1');
        var index = 1;
        var queryType = pane.attr('query_type');
        var query = getSearchCondition(pane);
        handler.task._queryTask(index, queryType, query.data, query.queryDisplay, pane);
    },
    _queryTask: function (index, queryType, query, queryDisplay, pane) {
        var action = {
            action: 'app.task.query',
            data: {
                query: query,
                queryType: queryType,
                option: {
                    index: index,
                    pageSize: handler.task.pageSize
                }
            }
        };
        var menu = pane.attr('ds_menu');
        var listPane = pane.find('.list-inside');
        DS.send(action, function(response){
            if(response.success){
                renderSearchResult(pane, index,handler.task.pageSize, query, queryDisplay, response);
                if(response.list.length > 0){
                    DS.getView('task/task_list_item', function (myView) {
                        listPane.append(handler.task._getTaskListItemView(myView, menu, response.list));
                    });
                    var collapsePane = pane.find('.search.collapse');
                    if(collapsePane.hasClass('in'))
                        collapsePane.collapse('hide');
                }
            }
        });
    },
    _showTask: function (menu, task, taskPane) {
        DS.getView('task/task_detail_item', function (view) {
            var vTime = getNotifyDate(task.lastUpdateTime);
            var timeStr = vTime.displayName;
            view = view.replace(new RegExp('_#_id#_', 'g'), task._id)
                .replace(new RegExp('_#menu#_', 'g'), menu)
                .replace(new RegExp('_#title#_', 'g'), task.title)
                .replace(new RegExp('_#detail#_', 'g'), task.detail)
                .replace(new RegExp('_#lastUpdateTime#_', 'g'), timeStr)
                .replace(new RegExp('_#master#_', 'g'), task.master);
            var userName = getCache('agents', task.master).name;
            view = view.replace(new RegExp('_#master_name#_', 'g'), userName);
            taskPane.prepend(view);
            if(task.isComplete){
                taskPane.find('.task_check').addClass('completed');
                taskPane.find('.task_title_bar').addClass('completed');
                taskPane.find('.task_check').attr('ds_complete', '1');
            }
            var tags = getCache('tags');
            var menuView = '';
            for (var i in tags) {
                menuView += '<li role="presentation" class="ds_do_action" ds_action="task.addTag" ds_data="' +
                    task._id + '" ds_tag="' + i + '"><a role="menuitem" tabindex="-1" href="#">' + tags[i] + '</a></li>';
            }
            taskPane.find('#task_detail_item_' + menu + '_' + task._id).find('.task_add_tag_menu').html(menuView);
            var tagView = '';
            for (var i in task.tags) {
                var t = task.tags[i];
                var name = tags[t];
                tagView += '<span class="text-tag ' + t + '"><span class="text-button"><span class="text-label">'
                    + name + '</span><a class="text-remove ds_do_action" ds_action="task.removeTag" ds_data="' + task._id + '"' +
                    ' ds_tag="' + t + '"></a></span></span>'
            }
            taskPane.find('#task_detail_item_' + menu + '_' + task._id).find('.task_detail_tag').prepend(tagView);
        });
    },
    _showTagInTask: function (taskId, tag, name, pane) {
        pane.prepend('<span class="text-tag ' + tag + '"><span class="text-button"><span class="text-label">'
            + name + '</span><a class="text-remove ds_do_action" ds_action="task.removeTag" ds_data="' + taskId + '"' +
            ' ds_tag="' + tag + '"></a></span></span>');
    },
    _removeTagInTask: function (tag, pane) {
        pane.find('span.' + tag).remove();
    },
    _showTaskComments: function (commentsArray, pane) {

        var url = 'task/task_feed_comments';
        DS.getView(url, function (myView) {
            var html = '';
            for(var i=0;i<commentsArray.length;i++) {
                var comments = commentsArray[i];
                var type = comments.type;
                var view = myView;
                var content = '';
                if (type == 'act') {
                    view = view.replace('_#content_class#_', 'feed_action');
                    if (comments.action == 'create') {
                        content = '创建了此任务';
                    } else if (comments.action == 'assign') {
                        content = '将此任务分配给了 [' + getCache('agents', comments.assignUser).name + ']';
                    } else if (comments.action == 'complete') {
                        content = '完成了此任务';
                    } else if (comments.action == 'cancelComplete') {
                        content = '取消完成此任务';
                    } else if (comments.action == 'addTag') {
                        content = '添加了业务类型-'+ getCache('tags')[comments.tag];
                    } else if (comments.action == 'deleteTag') {
                        content = '删除了业务类型-'+getCache('tags')[comments.tag];
                    }
                } else {
                    view = view.replace('_#content_class#_', 'feed_comments');
                    content = comments.comment;
                }
                var vTime = getNotifyDate(comments.time).displayName;

                html += view.replace(new RegExp('_#user#_', 'g'), getCache('agents', comments.user).name)
                    .replace(new RegExp('_#content#_', 'g'), content)
                    .replace(new RegExp('_#time#_', 'g'), vTime);
            }

            pane.append(html);
        });
    },
    _getTaskListItemView: function(myView, menu, tasks) {
        myView = myView.replace(new RegExp('_#menu#_', 'g'), menu);
        var view = '';
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            var master = getCache('agents', task.master).name;
            var tempView = myView.replace(new RegExp('_#taskId#_', 'g'), task._id)
                .replace(new RegExp('_#status#_', 'g'), task.customerDetail.status)
                .replace(new RegExp('_#status_name#_', 'g'), getCache('custTmpls', task.customerDetail.dbType)
                    .status[task.customerDetail.status])
                .replace(new RegExp('_#name#_', 'g'), task.customerDetail.name)
                .replace(new RegExp('_#user_title#_', 'g'), '客户描述')
                .replace(new RegExp('_#customerId#_', 'g'), task.customer)
                .replace(new RegExp('_#title#_', 'g'), task.title)
                .replace(new RegExp('_#master#_', 'g'), master)
                .replace(new RegExp('_#lastUpdateTime_title#_', 'g'), '最后更新时间：' + task.lastUpdateTime)
                .replace(new RegExp('_#lastUpdateTime#_', 'g'), getNotifyDate(task.lastUpdateTime).displayName);
            if (task.isComplete) {
                tempView = tempView.replace(new RegExp('_#completed#_', 'g'), 'completed')
                    .replace(new RegExp('_#dscompleted#_', 'g'), '1');
            } else {
                tempView = tempView.replace(new RegExp('_#completed#_', 'g'), '')
                    .replace(new RegExp('_#dscompleted#_', 'g'), '0');
            }
            view += tempView;
        }
        return view;
    },
    getTaskOfCustomer: function(customerID, callback) {
        var data = {
            customer: customerID
        };
        var action = {
            action: 'app.task.query',
            data: {
                query: data,
                queryType: 'all',
                option: {
                    index: 1,
                    pageSize: handler.task.pageSize
                }
            }
        };
        DS.send(action, function (response) {
            if(response.success) {
                callback(null, response.list);
            }else {
                callback(new Error());
            }
        });
    },
    taskCreateEvtHandler : function(event){
        var data = $.evalJSON(event.Data);
        var create = data.assignNum;
        var complete = data.createNum;
        var count = create + complete;
        var businessNav = $("#nav_menu_business");
        var createMenu = $("#my_uncomplete_task");
        var completeMenu = $("#my_assigned_task");

        if(count > 0){
            var badge = businessNav.find(".badge-important");
            if(badge.length > 0){
                badge.html(count);
                badge.css('display', 'inline');
            } else {
                var html = '<span class="badge badge-important" style="position: absolute; margin-top: -7px;padding-left: 4px;padding-right: 4px;font-size: 10px;border-radius: 10px;display:inline;">'+count+'</span>';
                var a = businessNav.find("a").html("业务"+html);
            }
        } else {
            var badge = businessNav.find(".badge-important");
            if(badge.length > 0){
                badge.css('display','none');
            }
        }

        if(create > 0){
            var badge = createMenu.find(".badge-important");
            if(badge.length > 0){
                badge.html(create);
                badge.show();
            } else {
                var html = '<span class="badge badge-important" style="float: right;margin-right: 10px; margin-top: 1px;padding-left: 4px;padding-right: 4px;font-size: 10px;border-radius: 10px;">'+create+'</span>';
                createMenu.append(html);
            }
        } else {
            var badge = createMenu.find(".badge-important");
            if(badge.length > 0){
                badge.hide();
            }
        }

        if(complete > 0){
            var badge = completeMenu.find(".badge-important");
            if(badge.length > 0){
                badge.html(complete);
                badge.show();
            } else {
                var html = '<span class="badge badge-important" style="float: right;margin-right: 10px; margin-top: 1px;padding-left: 4px;padding-right: 4px;font-size: 10px;border-radius: 10px;">'+complete+'</span>';
                completeMenu.append(html);
            }
        } else {
            var badge = completeMenu.find(".badge-important");
            if(badge.length > 0){
                badge.hide();
            }
        }

    },
    taskCompleteEvtHandler : function(event){
        var data = $.evalJSON(event.Data);
        var create = data.assignNum;
        var complete = data.createNum;
        var count = create + complete;
        var businessNav = $("#nav_menu_business");
        var createMenu = $("#my_uncomplete_task");
        var completeMenu = $("#my_assigned_task");

        if(count > 0){
            var badge = businessNav.find(".badge-important");
            if(badge.length > 0){
                badge.html(count);
                badge.css('display', 'inline');
            } else {
                var html = '<span class="badge badge-important" style="position: absolute; margin-top: -7px;padding-left: 4px;padding-right: 4px;font-size: 10px;border-radius: 10px;display: inline;">'+count+'</span>';
                var a = businessNav.find("a").html("业务"+html);
            }
        } else {
            var badge = businessNav.find(".badge-important");
            if(badge.length > 0){
                badge.css('display', 'none');
            }
        }

        if(create > 0){
            var badge = createMenu.find(".badge-important");
            if(badge.length > 0){
                badge.html(create);
                badge.show();
            } else {
                var html = '<span class="badge badge-important" style="float: right;margin-right: 10px; margin-top: 1px;padding-left: 4px;padding-right: 4px;font-size: 10px;border-radius: 10px;">'+create+'</span>';
                createMenu.append(html);
            }
        } else {
            var badge = createMenu.find(".badge-important");
            if(badge.length > 0){
                badge.hide();
            }
        }

        if(complete > 0){
            var badge = completeMenu.find(".badge-important");
            if(badge.length > 0){
                badge.html(complete);
                badge.show();
            } else {
                var html = '<span class="badge badge-important" style="float: right;margin-right: 10px; margin-top: 1px;padding-left: 4px;padding-right: 4px;font-size: 10px;border-radius: 10px;">'+complete+'</span>';
                completeMenu.append(html);
            }
        } else {
            var badge = completeMenu.find(".badge-important");
            if(badge.length > 0){
                badge.hide();
            }
        }
    }
}