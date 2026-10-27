handler.config.callConfig = {
    call_config : function() {

        //init
        handler.config.callConfig.init();
    },
    init: function() {
        var nav = $('#call_config_pbx_name');
        var body = $('#call_config_body');
        var navHtml = "";
        console.dir(session);
        if(session.account.pbx) {
            nav.html('<span>'+session.account.pbx.NickName+'('+session.account.pbx.PBX+')</span>')
        } else {
            nav.html('<h4>该账户还未配置任何PBX</h4>');
        }
        nav.html(navHtml);
    },
    getPbx: function() {
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
    showPbxConfig: function(data, src) {

    }
}