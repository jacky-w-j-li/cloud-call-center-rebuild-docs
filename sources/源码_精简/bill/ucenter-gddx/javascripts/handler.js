var handler = {
    showPage: function(data, src) {
        var url = data;
//        var paneId=url.substring(url.lastIndexOf("/")+1);
        src.closest("#left_pane").find(".list-group-item").removeClass("active");
        src.addClass("active");
        DS.getView(url, function(view){
            if(view) {
                $("#right_pane").html(view);
//                $("#right_pane > div").hide();
//                $("#right_pane").find("#"+paneId).html(view);
//                $("#right_pane").find("#"+paneId).show();
                var action = src.attr('action');
                var actionHandler = eval('DS._ds_handler.' + action);
                var btn=$("#right_pane").find(".btn-selectNum");
                if(btn.length>0){
                    if(isHasFunc('func_direct_select_num')){
                        btn.show();
                    }else{
                        btn.remove();
                    }
                }
                if(actionHandler){
                    actionHandler();
                }
            }
        });
    },
    loadMainView:function(url,src){
        if(src){
            var product=src.attr("ds_product");
            handler.account.productType=product;
        }
        if(url=="NA"){
            $().alertmessage('showInfo', '您还没有购买该产品,如需要请联系咨询！');
            return;
        }
        DS.getView(url, function(view){
            if(view){
                $("#ucenter_main").html(view);
                if(session.account.billLoginName){
                    if(session.account.billIdentity=='proxy' && session.account.proxyType=='channel'){
                        $("#main-panel").find(".invoiceRecord").remove();
                    }
                }else{
                    if(session.account.createMethod=='proxy' && session.account.proxyType=='channel' && !session.account.isInvoice){
                        $("#main-panel").find(".invoiceRecord").remove();
                    }
                }

                var tmplData={
                    domain:domain
                }
                $("#ucenter_main").find(".pane_tmpl_download_main").html(template("tmpl_login_download_main",tmplData));
                $("#ucenter_main").find('#left_pane').find('a:first').click();

                if(!isHasFunc('func_sip_num_manager')){
                    $("#main-panel").find(".sipNo").remove();
                }

                if(isHasFunc("query_call_detail")){
                    $("#main-panel").find(".cc_billMenu").remove();
                    $("#main-panel").find(".zj_billMenu").remove();
                }

            }
        });
    },
    loadMainView2Dest:function(url,dest){
        DS.getView(url, function(view){
            if(view){
                $("#ucenter_main").html(view);
                if(session.account.createMethod=='proxy' && !session.account.isInvoice){
                    $("#main-panel").find(".invoiceRecord").remove();
                }
                var tmplData={
                    domain:domain
                }
                $("#ucenter_main").find(".pane_tmpl_download_main").html(template("tmpl_login_download_main",tmplData));
                //console.info("dest======"+dest);
                if(dest=='pay'){
                    $("#ucenter_main").find('#left_pane').find('.payRecord').click();
                }else if(dest=='cost'){
                    $("#ucenter_main").find('#left_pane').find('.costRecord').click();
                }else if(dest=='invoice'){
                    var _menu=$("#ucenter_main").find('#left_pane').find('.invoiceRecord');
                    if(_menu.length>0){//for proxy control
                        _menu.click();
                    }else{
                        $("#ucenter_main").find('#left_pane').find('a:first').click();
                    }
                }else{
                    $("#ucenter_main").find('#left_pane').find('a:first').click();
                }
            }
        });
    },
    initAccountTitle:function(){
        var acc=session.account;
        $(".user-header").find('.uc_company').text(acc.companyName);
        $(".user-header").find('.uc_finance_balance').text(acc.financeAccount ? handler.formatRound2Money(acc.financeAccount.balance) + '元' : '无' );
        if (acc.financeAccount) {
            $(".user-header").find('#uc_finance_balance_id').css('display', '');
        }
//        $(".user-header").find('.uc_accountname').text("("+acc.name+")");
//        $(".user-header").find('.uc_email').text("["+acc.linkManEmail+"]");
        $(".user-header").find('.uc_balance').text(handler.formatRound2Money(acc.balance));
        $(".user-header").find('.uc_overdraw').text(handler.formatRound2Money(acc.overdraw||0));
        $('#popover_account_pay').popover({
            container: 'body'
        });
    },
    saveTaobao:function(param,src){
//        var frm=$("#frm_taobao_finish");
//        var data = DS.util.getDataOfForm(frm);
//        data=data.data;
//        frm.find('input[name="data"]').val($.toJSON(data));
//        frm.submit();
        var command={
            action:'taobao.finishTaobao',
            data:$.toJSON(param)
        }
        $.ajax({
            type: "GET",
            url: "/public",
            data: command,
            timeout: 30000,
            dataType: "json",
            success: function (rep, status){
                if(rep.success){
                    window.location.href=rep.url;
                }else{
                    $().alertmessage('showError', rep.message);
                }
            },
            error: function (xhr, status, error) {
                $().alertmessage('showError', '请求超时或网络问题,' + status || error);
            }
        });
    },
    resetPwd:function(data,src){
        var command={
            action:'resetPwd.resetPwd',
            data:$.toJSON(data)
        }
        $.ajax({
            type: "GET",
            url: "/public",
            data: command,
            timeout: 30000,
            dataType: "json",
            success: function (rep, status){
                if(rep.success){
                    $().alertmessage('showSuccess', "密码重置成功，请重新登录");
                    window.setTimeout(function(){
                        window.location.href="./";
                    },900);

                }else{
                    $().alertmessage('showError', rep.message);
                }
            },
            error: function (xhr, status, error) {
                $().alertmessage('showError', '请求超时或网络问题,' + status || error);
            }
        });
    },
    /*
    * 精确到小数点后两位，四舍五入
    * */
    format2Decimal : function (amount) {
        var i = parseFloat(amount);
        if(isNaN(i)) { i = 0.00; }
        var minus = '';
        if(i < 0) { minus = '-'; }
        i = Math.abs(i);
        i = parseInt((i + .005) * 100);
        i = i / 100;
        var s = new String(i);
        if(s.indexOf('.') < 0) { s += '.00'; }
        if(s.indexOf('.') == (s.length - 2)) { s += '0'; }
        s = minus + s;
        return s;
    },
    formatFee : function (number) {
        number=number||0;
        return Math.round(number*10000);
    },
    formatTrueFee : function (number) {
        number=number||0;
        return number/10000;
    },
    formatRoundMoney:function(number) {
        return Math.round(number*10000)/10000;
    },
    formatRound2Money : function (number) {
        number=number||0;
        return handler.formatMoney(number/10000);
    },
    formatMoney:function(amount) {
        var i = parseFloat(amount);
        if(isNaN(i)) { i = 0.00; }
        var minus = '';
        if(i < 0) { minus = '-'; }
        i = Math.abs(i);
        i = parseInt((i + .005) * 100);
        i = i / 100;
        var s = new String(i);
        if(s.indexOf('.') < 0) { s += '.00'; }
        if(s.indexOf('.') == (s.length - 2)) { s += '0'; }
        s = minus + s;
        return s;
    },
    getDicOptions:function(dic,currentVal,showDft){
        var html=[];
        if(showDft!='no'){
            html.push("<option value=''>--请选择--</option>");
        }
        var selectOptionHtml = "<option value='__value' selected>__name</option>";
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=getCache(dic);
        if(!ary || ary.length==0) return null;
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            if(dic=='agents'){
                if(currentVal && currentVal==obj._id){
                    html.push(selectOptionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.displayName));
                } else{
                    html.push(optionHtml.replace(/__value/g,obj._id).replace(/__name/g,obj.displayName));
                }
            }else{
                if(currentVal && currentVal==obj._id){
                    html.push(selectOptionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
                } else{
                    html.push(optionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
                }
            }
        }
        return html.join("");
    },
    getProductFee:function(){
        var products=session.account.products;
        var id=session.account._id+"_"+handler.account.productType;
        for (var i = 0; i < products.length; i++) {
            var obj = products[i];
            if(obj._id==id){
                return obj;
            }
        }
        return {};
    },
    getCCPbxOptions:function(val){
        var html="";
        var ccFee=handler.getProductFee();
        var pbx=ccFee.pbx||[];
        var dic=[];
        for (var i = 0; i < pbx.length; i++) {
            var obj = pbx[i];
            dic.push({codeValue:obj.PBX,codeName:obj.NickName});
        }
        html=getDicOptions(dic,val);
        return html;
    },
    getCCPbxDesc:function(val){
        var ccFee=handler.getProductFee();
        var pbx=ccFee.pbx||[];
        var desc="";
        for (var i = 0; i < pbx.length; i++) {
            var obj = pbx[i];
            if(obj.PBX==val){
                desc=obj.NickName;
                break;
            }
        }
        return desc;
    },
    getZJSipStatusDesc:function(val){
        if(val){
            if(val == 'Registered'){
                return '<font color="green">已注册</font>'
            }else if(val == 'Unregistered'){
                return '<font color="red">未注册</font>';
            }else{
                return '未知';
            }
        }else{
            return '未知';
        }
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
        frm.find(".sp_item").removeClass("showField");
        frm.find(".sp_item:first").addClass("showField");
        frm.find(".city_item").removeClass("showField");
        frm.find(".city_item:first").addClass("showField");
    }

}
$.ajaxSetup({
    cache: true
});
/**
 * load  handler js
 */

$.getScript("./javascripts/handler/zjNum.js");
$.getScript("./javascripts/handler/agent.js");
$.getScript("./javascripts/handler/tel.js");
$.getScript("./javascripts/handler/fee.js");
$.getScript("./javascripts/handler/batch.js");
$.getScript("./javascripts/handler/fax.js");
$.getScript("./javascripts/handler/sipNo.js");
$.getScript("./javascripts/handler/accFee.js");
$.getScript("./javascripts/handler/licence.js");
$.getScript("./javascripts/handler/hangUpSms.js");
$.getScript("./javascripts/handler/invoice.js");
$.getScript("./javascripts/handler/custFee.js");
$.getScript("./javascripts/handler/sms.js");



