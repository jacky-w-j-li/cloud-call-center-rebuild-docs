handler.config.account = {
    menuId:'',
    config_main: function(menu) {
        var container=$("#view_"+menu);
        handler.config.account.menuId=menu;
        container.find(".nav-list>li a:first").click();
//        container.find("input[name='autoSave']").prop("checked",session.account.autoSave||false);
//        handler.config.customer.showCustomerTemplate(menu);
    },
    _initCheck:function(pane){
        var data=session.account;
        var ip=data.ipCheck;
        var email=data.emailCheck;
        var ips=data.ips||[];
        pane.find("input[name='ipCheck']").prop("checked",ip||false);
        pane.find("input[name='emailCheck']").prop("checked",email||false);
        for (var i = 0; i < ips.length; i++) {
            var ip = ips[i];
            if(i==0){
                pane.find(".ip_first").val(ip);
            }else{
                var tmplObj=pane.find("#tmpl_login_check_ip");
                var tmpl=tmplObj.html()||'';
                tmpl=tmpl.replace(/_#ip#_/g,ip);
                pane.find(".login_check_ip").append(tmpl);
            }
        }
    },

    showLoginCheck:function(){
        var container=$("#view_"+handler.config.account.menuId);
        DS.getView('config/account/login_main', function (view) {
            var pane = container.find('#config_account_pane');
            pane.html(view);
            handler.config.account._initCheck(container);
        });
    },
    saveLoginCheck: function (data, src) {
        var container=$("#view_"+handler.config.account.menuId);
        var ipCheck=data.ipCheck;
        var ips=data.ips||[];
        if(ipCheck && ips.length>0){
            var num=0;
            for(var i=0;i<ips.length;i++){
                if(!$.trim(ips[i])){
                    num++;
                    break;
                }
            }
            if(num>0){
                $().alertmessage('showError', "ip地址必须填写！");
                return;
            }
        }
        var action = {
            action: 'config.accountConfig.saveLoginCheck',
            data: data
        }
        DS.send(action, function(response){
            if(response.success){
                session.account.ipCheck = data.ipCheck;
                session.account.emailCheck = data.emailCheck;
                session.account.ips = data.ips||[];
                $().alertmessage('showSuccess', "设置成功");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    account_identity: function (data,src) {
        var pane=$("#view_company_identity");
        var action = {
            action: 'app.user.getAccountInfo',
            data: {}
        }
        DS.send(action, function(response){
            if(response.success){
                var account=response.row;
                handler.setMyAccInfo(account);
                account.balanceCls='accFee';
                if(account.balance<=0){
                    account.balanceCls='accOweFee'
                }
                var html=template("tmpl_identity_content",account);
                pane.find(".account_base").html(html);

                handler.licence.getLicenceList();
                handler.account.queryMyNum();
                handler.config.channel.queryRobot();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    redirectUcenter:function(dest){
        var action={
            action:'cc.getCCSessionId',
            data : {sid:session.id,dest:dest}
        };
        var data = $.toJSON(action.data);
        action.data = data;
        action.action_id = Math.random();
        $.ajax({
            type: "POST",
            url: "./public2cc",
            async: false,
            data: action,
            timeout: 30000,
            dataType: "json",
            success: function (rep, status) {
                if(rep.success){
                    var url=rep.url;
                    window.open(url,"_newtab");
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            },
            error: function (xhr, status, error) {
                $().alertmessage('showError', '请求超时或网络问题,' + status || error);
            }
        });
    },
    showAccountBaseInfo: function() {
        var modal = $("#modal_account_base_update");
        var body=modal.find(".modal-body");
        var accInfo=handler.getMyAccInfo();
        //console.dir(accInfo);
        DS.getView("account/account_base_update", function (view) {
            var render=template.compile(view);
            body.html(render(accInfo));
            modal.modal();
        });
    },
    updateAccBase:function(data,src){
        var modal = $("#modal_account_base_update");
        var action = {
            action: "config.account.updateAccountBaseInfo",
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                //console.dir(row);
                var pane=$("#view_company_identity");
                handler.setMyAccInfo(row);
                pane.find('.linkManName').text(row.linkManName);
                pane.find('.linkManPhone').text(row.linkManPhone);
                pane.find('.linkManEmail').text(row.linkManEmail);

                modal.modal("hide");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    }



}