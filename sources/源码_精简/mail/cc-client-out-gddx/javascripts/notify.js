function openNotify(){
    Notification.requestPermission();
}

function emitNotify(title, content, item){//在线客服提醒
    if(Notification.permission === "granted"){
        var notification = new Notification(title, {
            dir: "auto",
            lang: "",
            tag: "7moorWebchat", //实例化的notification的id
            icon: "img/logo_notify.png",
            body: content

        });
        notification.onshow = function(){
        };
        notification.onclick = function(){
            window.focus();
            handler.webchat.gotoWebchatMenu(null, item);
        };
        notification.onclose = function(){};
        notification.onerror = function(){};

    }
}
function dxmsgNotify(title, content, item,type,parms){//电销提醒
    if(Notification.permission === "granted"){
        var notification = new Notification(title, {
            dir: "auto",
            lang: "",
            tag: "7moor", //实例化的notification的id
            icon: "img/logo_notify.png",
            body: content

        });
        notification.onshow = function(){
        };
         notification.onclick = function(){
        //     window.focus();
        //     //之后执行的事件
            
           
        //     if(type == "business"){
        //          handler.business.gotoBusinessMenu(parms);
        //         //$("#contact_list_business input[value="+parms.businessId+"]").click();
        //     }else if(type == "customerPlan"||type=="saleChance"||type=="assign"){
        //         $("#frm_customer_normal_search  input[name='quickSearch']").after('<input name="remindSearch" class="cust_remindSearch_hidden" type="hidden" value="'+parms.cid+'"/>');
        //         p =  $("#nav_customer");
        //         p.click();
        //         handler.customer.quick_subMenu_search('customer_my',$("#view_nav_customer").find(".btn_customer_my"));
        //         $("#frm_customer_normal_search").find(".inpt_sty").val(parms.custName);
        //         $("#frm_customer_normal_search").find(".cust_remindSearch_hidden").val(parms.cid);
        //         $("#frm_customer_normal_search").find(".cust_remindSearch_hidden").attr("ds_flag","cust_remindSearch_hidden");
        //         $("#frm_customer_normal_search").find(".customer_normal_search").click();
        //     }else{
        //         p =  $("#nav_customer");
        //         p.click();
        //         $("#view_nav_customer").find(".btn_customer_my").click();
        //     }
        //     $('.modal-backdrop').hide();
        //     $('.modal').hide();
        //     notification.close();
         };
        // if(type == "business"||type == "customerPlan"||type=="saleChance"||type=="assign"){
        //     setTimeout(function() {
        //         notification.close();
        //     }, 5000);
        // }
        
        notification.onclose = function(){};
        notification.onerror = function(){};

    }
}