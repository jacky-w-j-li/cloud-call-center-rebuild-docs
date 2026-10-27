function openNotify(){
    Notification.requestPermission();
}

function emitNotify(title, content, item){

    if(Notification.permission === "granted"){
        var notification = new Notification(title, {
            dir: "auto",
            lang: "",
            tag: "7moorWebchat", //实例化的notification的id
            icon: "img/logo_notify.png",
            body: content
            //sound:"audio/warning.mp3" //Note: This property is not currently supported in any browser.

        });
        notification.onshow = function(){
        };
        notification.onclick = function(){
            window.focus();
            handler.webchat.gotoWebchatMenu(null, item);
            notification.close();
            $('.modal-backdrop').hide();
            $('.modal').hide();
        };
        notification.onclose = function(){};
        notification.onerror = function(){};

    }

    //增加声音的处理
    if($("#multi-warning-tone").length>0 && localStorage.muteControl == "true"){
        $("#multi-warning-tone")[0].play();
    }

}

function emitEditPasswordNotify(title, content){

    if(Notification.permission === "granted"){
        var notification = new Notification(title, {
            dir: "auto",
            lang: "",
            tag: "7moorPasswordNotify", //实例化的notification的id
            icon: "img/logo_notify.png",
            body: content
            //sound:"audio/warning.mp3" //Note: This property is not currently supported in any browser.

        });
        notification.onshow = function(){
        };
        notification.onclick = function(){
            window.focus();
            notification.close();
        };
        notification.onclose = function(){};
        notification.onerror = function(){};

    }
}

function emitQuesNotify(title, content, item){

    if(Notification.permission === "granted"){
        var notification = new Notification(title, {
            dir: "auto",
            lang: "",
            tag: "7moorQues", //实例化的notification的id
            icon: "img/logo_notify.png",
            body: content
            //sound:"audio/warning.mp3" //Note: This property is not currently supported in any browser.

        });
        notification.onshow = function(){
        };
        notification.onclick = function(){
            window.focus();
            handler.questionnaire.gotoQuesMenu(null, item);
            notification.close();
            $('.modal-backdrop').hide();
            $('.modal').hide();
        };
        notification.onclose = function(){};
        notification.onerror = function(){};

    }


}

function emitEmailNotify(title, content, item){

    if(Notification.permission === "granted"){
        var notification = new Notification(title, {
            dir: "auto",
            lang: "",
            tag: "7moorEmail", //实例化的notification的id
            icon: "img/logo_notify.png",
            body: content
           // requireInteraction:true
            //sound:"audio/warning.mp3" //Note: This property is not currently supported in any browser.

        });
        notification.onshow = function(){
        };
        notification.onclick = function(){
            window.focus();
            handler.email.gotoEmailMenu(null, item);
            notification.close();
            $('.modal-backdrop').hide();
            $('.modal').hide();
        };
        notification.onclose = function(){
        };
        notification.onerror = function(){};

    }
    if($("#email-warning-tone").length > 0 && localStorage.muteControl == "true"){
        $("#email-warning-tone")[0].play();
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
        //     var p =  $("#nav_business");
        //     if(type == "business"){
        //          handler.business.gotoBusinessMenu(parms);
        //     }else if(type == "customerPlan"||type=="saleChance"||type=="assign"){

        //         handler.customer.gotoCustomerMenu(parms);


        //         // $("#frm_customer_normal_search  input[name='quickSearch']").after('<input name="remindSearch" class="cust_remindSearch_hidden" type="hidden" value="'+parms.cid+'"/>');
        //         // p =  $("#nav_customer");
        //         // p.click();
        //         // handler.customer.quick_subMenu_search('customer_my',$("#view_nav_customer").find(".btn_customer_my"));
        //         // $("#frm_customer_normal_search").find(".inpt_sty").val(parms.custName);
        //         // $("#frm_customer_normal_search").find(".cust_remindSearch_hidden").val(parms.cid);
        //         // $("#frm_customer_normal_search").find(".cust_remindSearch_hidden").attr("ds_flag","cust_remindSearch_hidden");
        //         // $("#frm_customer_normal_search").find(".customer_normal_search").click();
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