var errMsg="服务异常";
var handler={
    forgetPwd:function(data,src){
        var command={
            action:'resetPwd.forgetPwd',
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
                    var html='<p><h2 class="text-center">重置信息已经发到您的邮箱，请查收</h2></p>';
                   $(".login_main").html(html);
                }else{
                    $().alertmessage('showError', rep.message);
                }
            },
            error: function (xhr, status, error) {
                $().alertmessage('showError', '请求超时或网络问题,' + status || error);
            }
        });
    }
}
function init(){
    DS.init({
        ds_url: "/action",
        ds_handler: handler,
        ds_root_view_dir :"/views"
    });
}