$(function(){
    if(SUCCESS && ERRCODE == '10000'){
        var evaluateData= CSRDIC||[];
        var evaluates='';
        var reson=''
        for(var i in  evaluateData){
            evaluates+='<span class="evaluate-label-wrap" index="'+ evaluateData[i].index+'"><label for="evaluate'+ evaluateData[i].index+'">';
            evaluates+='<input type="radio" name="name[]" key="'+ evaluateData[i].key+'" index="'+ evaluateData[i].index+'" value="'+ evaluateData[i].name+'" id="evaluate'+ evaluateData[i].index+'"/>';
            evaluates+='<span>'+ evaluateData[i].name+'</span></label></span>';
            $(".im-evaluate-container").append('<div class="service-attitude" id="reason'+ evaluateData[i].index+'"></div>');
            for(var j in  evaluateData[i].reason){
                reson='<label><input name="reason[]" type="radio" value="'+ evaluateData[i].reason[j]+'"><span>'+ evaluateData[i].reason[j]+'</span></label>';
                $(".service-attitude").eq(i).append(reson);
            }
        }
        $(".im-evaluate-all").html(evaluates);
        var node=$(".im-evaluate-all label input[type='radio']");

        node.on("change",function(){
            var num=$(".im-evaluate-all label input[type='radio']:checked").attr("index");
            $("#reason"+num).show();
            $("#reason"+num).siblings(".service-attitude").hide();
        })
        $(".evaluate-label-wrap").eq(0).find("input").attr("checked",true);
        $(".service-attitude").eq(0).show();
    }else{
        var msg = "";
        if(ERRCODE == '10005'){
            msg = "抱歉,当前未开通对机器人的评价服务功能!";
        }else if(ERRCODE == '10004'){
            msg = "您已对本次服务评价过了,谢谢!";
        }else if(ERRCODE == '10002'){
            msg = "抱歉,您本次的咨询还没有说话,系统因此无法响应您的评价请求,您可以先回到公众号里发起咨询,谢谢!";
        }else if(ERRCODE == '10007'){
            msg = "抱歉,当前尚未有客服为您服务,系统因此无法响应您的评价请求!";
        }else{
            msg = "抱歉,评价页面打开失败!";
        }
        $(".im-evaluate-wrap").hide();
        $(".weui_msg .weui_msg_desc").html(msg);
        $(".weui_msg").show();
        //$(".im-evaluate-errpage").show();
    }


    $("#appraise").on('click', function sendImCSRInfo() {

        var evaluateName = $(".evaluate-label-wrap").find("input[type='radio']:checked").val();
        var evaluateKey = $(".evaluate-label-wrap").find("input[type='radio']:checked").attr("key");
        var evaluateReason = $(".service-attitude").find("input[type='radio']:checked").val();
        var evaluateText = $(".write-im-evaluate").val();
        var data = {
            action: "sendImCSRInfo",
            appId: APPID,
            openId: OPENID,
            satisfaction: encodeURIComponent(evaluateName),
            appraiseKey: evaluateKey,
            label: evaluateReason,
            proposal: encodeURIComponent(evaluateText),
            way: WAY
        }
        $.ajax({
            type: "POST",
            url: "/command",
            cache: false,
            async: false,
            timeout: 30000,
            data: JSON.stringify(data),
            success: function (data, status) {
                //WeixinJSBridge.call('closeWindow');//关闭当前浏览器
                $(".im-evaluate-wrap").hide();
                $(".weui_msg .weui_msg_desc").html("评价已提交,谢谢!");
                $(".weui_icon_area>i").removeClass("weui_icon_warn").addClass("weui_icon_success");
                $(".weui_msg").show();

                //$(".im-evaluate-errpage>p").html(data.errmsg ||"评价成功，请返回")
                return;
            }
        });
    });

    $(".weui_opr_area .weui_btn_primary").on("click",function(){
        WeixinJSBridge.call('closeWindow');//点击确定后关闭浏览器
    })


});


