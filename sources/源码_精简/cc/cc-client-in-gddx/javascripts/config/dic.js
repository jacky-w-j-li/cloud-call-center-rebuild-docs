handler.config.dic={
    pageSize:10,
    config_dic:function(menu){
        var container=$("#view_dic_config");
        container.find('#query_dic_condition').keydown(function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                event.stopImmediatePropagation();
                container.find('.btn_dic_search').click();
            }
        });
        handler.config.dic.queryDicList();
    },
    queryDicList : function(data,src){
        var container=$("#view_dic_config");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.dic.pageSize;
        var formID = "dic_query_frm";
        var action={
            action:'config.dic.queryDicList' ,
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                var list = response.list;
                var pane=container.find('#dic_list_pane');
                pane.empty();
                container.find('#tmpl_dic_list').tmpl(list).appendTo(pane);
                DS.updatePagination(formID, response.count, handler.config.dic.pageSize, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    } ,
    showDicAdd:function(data ,src){
        var container=$("#view_dic_config");
        var pane = container.find('#dic_detail_pane');
        DS.getView('config/dic/dic_add',function(view){
            pane.html(view);
        });
    },
    saveDic:function(data,src){
        var container = $("#view_dic_config");
        var pane = container.find('#dic_detail_pane');
        var isexistence = false;
        $.each(getCache('options'),function(){
            if(this.name == data.name) {
                isexistence = true;
            }
        });
        if(isexistence){
            $().alertmessage('showError',"该字典名称已建立");
            return;
        }
        if(data.name =="满意度调查选项"){
            $().alertmessage('showError',"请勿使用默认字典名称");
            return ;
        }
        var action = {
            action: 'config.dic.addDic',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                pane.empty();
                addCache("options",response.data);
                container.find('.contacts_caption .refresh').click();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    } ,
    showDicEdit:function(id,src){
        var container=$("#view_dic_config");
        var pane =container.find('#dic_detail_pane');
        var tds = src.closest('tr').children();
        var name = $(tds[0]).html().trim() || '';
        var cascade = $(tds[1]).html().trim() || '';
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        DS.getView('config/dic/dic_edit',function(view){
            pane.html(view);
            pane.find('.dicId').val(id);
            pane.find("input[name='name']").val(name);
            pane.find('.dic_edit input:radio').each(function(){
                if($(this).val()==cascade){
                    $(this).attr('checked','true');
                }
            });
        });
    },
    updateDic:function(data,src){
        var container=$("#view_dic_config");
        var pane = src.closest('#dic_detail_pane');
        var isexistence = false;

        $.each(getCache('options'),function(){
            if(this._id == data._id){
                return true;
            }
            if(this.name == data.name) {
                isexistence = true;
            }
        });
        if(isexistence){
            $().alertmessage('showError',"该字典名称已建立");
            return;
        }
        var action={
            action:'config.dic.updateDic',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                pane.empty();
                updateCache("options",data._id,response.data);
                container.find('.contacts_caption .btn_dic_search').click();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

    },
    delDic:function(data,src){
        var conf = confirm("确定删除该字典吗？");
        if(!conf) return;
        data.accountId = session.user.account;
        var action={
            action:'config.dic.delDic',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                removeCache("options",data._id);
                var parent = src.closest('.right_content');
                var pane = parent.find('#dic_detail_pane');
                pane.empty();
                parent.find('#dic_query_frm .refresh').click();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    } ,


    getDicById:function(key){
        var dicts = getCache('options');
        for(var i=0;i<dicts.length;i++){
            var options = dicts[i].options || [];
            if(options.length != 0){
                var result =handler.config.dic.getDicByIdFor(key,options);
                if(result){
                    return result;
                }
            }
        }
    },
    getDicByIdFor:function(key,options){
        for(var i = 0;i<options.length;i++){
            var dic = options[i];
            if(dic.key == key){
                return {"key":key,"name":dic.name};
            }
            var opts = dic.options || [];
            if(opts.length != 0){
                var result = handler.config.dic.getDicByIdFor(key,opts);
                if(result){
                    return result;
                }
            }
        }
    }  ,
    showDicConfig:function(id,src){
        var container=$("#view_dic_config");
        var pane = container.find('#dic_detail_pane');
        var dic=$('.ds_do_action[ds_data='+id+']').parent().prev().prev().text().trim();
        var action = {
            action:'config.dic.findOneAppDic',
            data:{_id:id}
        };
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        DS.send(action,function(response){
            if(response.success){
                var data = response.data;
                DS.getView('config/dic/dic_config_edit',function(view){
                    if(dic == "满意度调查选项"){
                        view = view.replace("__readOnly1","readOnly").replace("__readOnly2","readOnly").replace("___sys","sys");
                    }else{
                        view = view.replace("__readOnly1","").replace("__readOnly2","").replace("___sys","");
                    }
                    pane.html(view);
                    pane.find('#frm_dic_edit  .ds_do_action').attr('ds_data' , data._id);
                    var str = '.dicDiv'+data.cascade;
//                    pane.find('.nameDic').html('——  '+data.name);
                    pane.find('.dic_edit_pane').append($('#tmpl_dic_edit').tmpl(data));
                    pane.find(str).closest('.dicEverTop').nextAll().css('display','none');
                    /*div内容*/
                    handler.config.dic.editDicDiv(data,pane);

                    if(data.cascade=="1"){
                        pane.find(".sys_dic_2").remove();
                        pane.find(".sys_dic_3").remove();
                    }else if(data.cascade=="2"){
                        pane.find(".sys_dic_3").remove();
                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    }  ,
    editDicDiv:function(data,pane){
        var dics = data.options || [];
        var headers = pane.find('.DicHeader input');

        if(data.headers && data.headers.length != 0){
            for(var i = 0;i<headers.length;i++){
                $(headers[i]).val(data.headers[i]);
            }
        }
        if(dics.length == 0){
            return ;
        }
        var html1 = "<ul >";
        var html2 = '';
        var html3 = '';
        var dicD1 = pane.find('.dicDiv'+1);
        var dicD2 = pane.find('.dicDiv'+2);
        var dicD3 = pane.find('.dicDiv'+3);
        dicD1.empty();
        dicD2.empty();
        dicD3.empty();

        for(var i=0;i<dics.length;i++){
            var options1 = dics[i];
            var key1 = parseInt(options1.key);
            html1+="<div ds_data='sign"+i+"' class='actionforcheckbox' ds_action='config.dic.addNextDic'>";
            if(options1.state == '1'){
                html1+="<input type='checkbox'  class='actionforcheckbox' id='checked"+options1.key+"' ds_data='"+options1.key+"'  ds_action='config.dic.disableDic' >"
            }else{
                html1+="<input type='checkbox' checked class='actionforcheckbox' id='checked"+options1.key+"' ds_data='"+options1.key+"'  ds_action='config.dic.disableDic' >"
            }
            html1+= "<input name='dic[]'state='"+options1.state+"' key='"+options1.key+"' type='text' placeholder='字典项' value='"+options1.name+"' style='width:80px;' required msgName='字典项'/>"
            /*DIv2*/
            html1 += "</div>";
            var dicOp1 = options1.options || [];
            if(dicOp1.length!=0) html2+="<ul class='sign"+i+"'>";

            for(var j=0;j<dicOp1.length;j++){
                var options2 = dicOp1[j];

                    html2+="<div ds_data='sign"+i+'_'+j+"' class='actionforcheckbox' ds_action='config.dic.addNextDic'>"
                     if(options1.state == '1'&&options2.state=='1'){
                         html2+="<input type='checkbox'  class='actionforcheckbox' disabled id='checked"+options2.key+"' ds_data='"+options2.key+"'  ds_action='config.dic.disableDic' >"
                     }else if(options1.state == '1'&&(options2.state == '2'||options2.state == 'undefined')){
                         html2+="<input type='checkbox'  class='actionforcheckbox' checked disabled id='checked"+options2.key+"' ds_data='"+options2.key+"'  ds_action='config.dic.disableDic' >"
                     }else if((options1.state == '2'||options1.state == 'undefined')&&options2.state=='1'){
                         html2+="<input type='checkbox'  class='actionforcheckbox'  id='checked"+options2.key+"' ds_data='"+options2.key+"'  ds_action='config.dic.disableDic' >"
                     } else if((options1.state == '2'||options1.state == 'undefined')&&(options2.state == '2'||options2.state == 'undefined')){
                         html2+="<input type='checkbox' checked class='actionforcheckbox'  id='checked"+options2.key+"' ds_data='"+options2.key+"'  ds_action='config.dic.disableDic' >"
                     } else {
                         html2+="<input type='checkbox' checked class='actionforcheckbox'  id='checked"+options2.key+"' ds_data='"+options2.key+"'  ds_action='config.dic.disableDic' >"
                     }
                    html2 +="<input name='dic[]'state='"+options2.state+"' key='"+options2.key+"' type='text' placeholder='字典项' value='"+options2.name+"' style='width:80px;' required msgName='字典项'/>"
                    html2 +=  "</div>";

                /*div3开始*/
                var dicOp2 = options2.options || [];
                if(dicOp2.length!=0) html3+="<ul  class='sign"+i+"_"+j+"'>";

                for(var k=0;k<dicOp2.length;k++){
                    var options3 = dicOp2[k];
                    var key3 = parseInt(options3.key);

                    html3+="<div ds_data='sign"+i+'_'+j+'_'+k+"' class='actionforcheckbox' ds_action='config.dic.addNextDic'>"

                    if(options1.state=="1"){
                        html3+="<input type='checkbox' disabled class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"
                    }  else if((options2.state=="2"||options2.state=="undefined")&&options3.state=="1"){
                        html3+="<input type='checkbox'   class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"
                    }  else if((options2.state=="2"||options2.state=="undefined")&&options3.state=="2"){
                        html3+="<input type='checkbox' checked class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"
                    }  else if((options2.state=="2"||options2.state=="undefined")&&options3.state=="undefined"){
                        html3+="<input type='checkbox' checked class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"
                    }  else if(options2.state=="1"&options3.state=="2"){
                        html3+="<input type='checkbox' disabled checked class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"

                    }  else if(options2.state=="1"&&options3.state=="undefined"){
                        html3+="<input type='checkbox' disabled  checked class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"

                    }  else if(options2.state=="1"&&options3.state=="1"){
                        html3+="<input type='checkbox'  disabled class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"

                    }  else {
                        html3+="<input type='checkbox'  checked class='actionforcheckbox' id='checked"+options3.key+"' ds_data='"+options3.key+"'  ds_action='config.dic.disableDic' >"
                    }

                    html3+=  "<input name='dic[]' state='"+options3.state+"' key='"+options3.key+"' type='text' placeholder='字典项' value='"+options3.name+"' style='width:80px;' required msgName='字典项'/>"
                    html3+= "</div>"
                }

                if(dicOp2.length!=0) {html3+='</ul>';}
                /*div3结束*/

            }

            if(dicOp1.length!=0) {html2+='</ul>';}
            /*div2结束*/

        }


        html1+='</ul>';
        dicD1.html(html1);
        dicD2.html(html2);
        dicD3.html(html3);

        dicD1.find('ul').addClass('pressed');
        dicD1.find('ul div:first').click();

    } ,

    addNextDic:function(sign,src){
        var all = parseInt(src.closest('.dic_edit_pane').children('input:hidden').attr('cascade'));
        src.siblings().removeClass('show');
        src.addClass('show');
        var index = parseInt(src.closest('.dicSpan').attr('sign'));
        if(index >= all){
            return ;
        }
        var nextDiv = src.closest('.dicEverTop').next().find('.dicSpan');
        var nextUl = nextDiv.find('ul.'+sign);

        if(!nextUl || nextUl.length == 0){
            var html = "<ul class=\"pressed "+sign+"\"><div ds_data=\""+sign+'_0'+"\" class='ds_do_action show' ds_action='config.dic.addNextDic'> "+
                "<input name='dic[]' state='2' type='text' placeholder='字典项' style='width:70px;' required msgName='字典项'/></div></ul>";   /*新加字段1会自动带出下级字段*/
            nextDiv.append(html);
            nextUl = nextDiv.find('ul.'+sign);
        }
        var nextNextDiv = nextDiv.closest('.dicEverTop').next().find('.dicSpan').find('ul');
        nextNextDiv.removeClass('pressed');
        nextDiv.find("ul").removeClass('pressed');
        nextUl.addClass('pressed');
        nextUl.find('div:first').click();
        src.find('input').focus();
    } ,
    updateDicConfig:function(data,src){
        var id=data._id;
        if(getCache('options',id).name == "满意度调查选项"){
            for(var len=data.dic.length,i=len/2;i<len;i++){
                for(var j = i+1;j<len;j++){
                    if(data.dic[i]==data.dic[j]){
                        $().alertmessage('showError', "满意度调查选项第二级有重复值！");
                        return ;
                    }

                }
            }
        }
        var parent = src.closest('#dic_detail_pane');
        var all = parseInt(parent.find('.messDicInp').attr('cascade'));
        var optionsNode = [];
        var divFlag='dicDiv'+1;
        var inputs1 = parent.find('.'+divFlag+' input[type="text"]');
        var headerInputs = parent.find('.DicHeader input');
        var headers=[];
        if(headerInputs && headerInputs!=0){
            for(var i=0;i<all;i++){
                if(!$(headerInputs[i]).val()){
                    $().alertmessage('showError', '头信息需要填写！！');
                    $(headerInputs[i]).focus();
                    return ;
                }
                headers.push($(headerInputs[i]).val());
            }
        }
        for(var i=1;i<=all;i++){
            var dicDiv = parent.find('.dicDiv'+i);
            var divUls = dicDiv.find('ul');
            for(var uu=0;uu<divUls.length;uu++){
                var eleUls = $(divUls[uu]);
                var ulInputs = eleUls.find(':text');
                var ulInputsLength = ulInputs.length;
                for(var j=0;j<ulInputsLength;j++){
                    var eleInput1 = $(ulInputs[j]);
//                    console.log(eleInput1.state)
                    for(var k=j+1;k<ulInputsLength;k++){
//                        console.log(eleInput1.state)
                        var eleInput2 = $(ulInputs[k]);
                        if(eleInput1.val() && eleInput1.val() == eleInput2.val() ){
                            $().alertmessage('showError', "\""+eleInput1.val()+'\" 重复！');
                            return ;
                        }
                    }
                }
                if(i==1){//字典第一级至少有一个选项是启用状态功能 ,i==1表示 只在字典的第一级做这种功能处理。
                    var n=0;//统计是停用状态的个数
                    for(var m=0;m<ulInputsLength;m++){
                        var opt =$( ulInputs[m]);
                        if(opt.attr("state")=="1"){
                            n++ ;
                        }
                        if(n==ulInputsLength){
                            $().alertmessage('showError', "请保证字典第一级选项至少有一个是启用的。");
                            return;
                        }
                    }
                }
                if(i==2){//字典第一级至少有一个选项是启用状态功能 ,i==1表示 只在字典的第一级做这种功能处理。
                    if(getCache('options',id).name == "满意度调查选项"){
                        var n=0;//统计是停用状态的个数
                        for(var m=0;m<ulInputsLength;m++){
                            var opt =$( ulInputs[m]);
                            if(opt.attr("state")=="1"){
                                n++ ;
                            }
                            if(n==ulInputsLength){
                                $().alertmessage('showError', "请保证满意度调查选项字典第二级选项至少有一个是启用的。");
                                return;
                            }
                        }
                    }

                }
            }
        }

        if(inputs1 && inputs1.length!=0){
            for(var j=0;j<inputs1.length;j++){
                var ele = $(inputs1[j]);
                if(!validate.trim(ele.val())){
                    continue;
                }
                /**state代表是否停用的状态*,1代表停用，2代表启用*/
                var field = {'name':validate.trim(ele.val()),'options':[]};

                if(ele.attr('key')){
                    field.key=ele.attr('key');
                }else{
                    field.key = uuid.v1();
                }

                if(ele.attr('state')){
                    field.state=ele.attr('state');
                }   else{
                    field.state="2";
                }
//
//                if(ele.attr('state')=="undefined"){
//                    field.state="2";
//                }
                field.options=handler.config.dic.getDicOptionsArray(inputs1[j] , all , 1 , j);
                if(!field.options){
                    $().alertmessage('showError', "满意度调查选项的满意值只能为0-9！");
                    return;
                }
                optionsNode.push(field);
            }
        }

        var action ={
            action:'config.dic.updateOneAppDic',
            data:{'_id':id,'options':optionsNode,'accountId':session.user.account,'headers':headers}
        } ;
        DS.send(action,function(response){
            if(response.success){
                parent.empty();
                var dics = getCache('options');
                for(var i=0;i<dics.length;i++){
                    if(dics[i]._id == id){
                         dics[i].options = optionsNode;
                        dics[i].headers = headers;
                    }
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        },'POST');

    },
    getDicOptionsArray:function(inputs1 , all ,i,j){
        var ele1 = $(inputs1);
        var parent = ele1.closest('form');
        var field2 = {};
        var docMenu = [];

        if(i<all){
            var divFlag = 'dicDiv'+(i+1);
            var sign = ele1.parent().attr("ds_data");
            var inputs2 = parent.find('.'+divFlag+' .'+sign+' input[type="text"]');

            if(inputs2 && inputs2.length!=0){

                for(var k=0;k<inputs2.length;k++){
                    var ele2 = $(inputs2[k]);
                    if(!validate.trim(ele2.val())){
                        continue;
                    }
                    field2 = {'name':validate.trim(ele2.val()),'options':[]};
                    if(ele2.attr('key')){
                        field2.key = ele2.attr('key');
                    }else{
                        field2.key = uuid.v1();
                    }

                    if(ele2.attr('state')){
                        field2.state=ele2.attr('state');
                    }  else{
                        field2.state="2"
                    }
                    if(ele2.attr('state')=="undefined"){
                        field2.state="2";
                    }

                    if(i+1 < all){
                        field2.options=handler.config.dic.getDicOptionsArray(inputs2[k] , all , i+1,k);
                    }
                    if($('.sys_dic_2 input[name=header]').val() == "满意值"){
                        if(!field2.name.match("^[0-9]{1}$")){
                            return false;
                        }
                    }
                    docMenu.push(field2);
                }
            }
        }
        return docMenu;
    } ,

    disableDic:function(key,src){
        var cc= $("input[key="+key+"]").parent().attr("ds_data") ;
        var divs = $("div[ds_data*="+cc+"_]");
        if( $("input[key="+key+"]").attr("state")=="2"|| $("input[key="+key+"]").attr("state")=="undefined"  ){

            $("input[key="+key+"]").attr("state","1");
            $("input[key="+key+"]").css("color","red");

            for(var i=0;i<divs.length;i++){
               $(divs[i].firstChild).attr("disabled",true) ;
            }
        }
        else   {
            $("input[key="+key+"]").attr("state","2");
            $("input[key="+key+"]").css("color","red");
            for(var i=0;i<divs.length;i++){
                $(divs[i].firstChild).attr("disabled",false) ;
            }
        }

    } ,


    cleanmarkdic:function(diccm){
        var oneFlag = new Array();
        var twoFlag = new Array();
        var threeFlag = new Array();
        for(var i=0;i<diccm.length;i++){
            var options = diccm[i].options || [];

            for(var m=0;m<options.length;m++){
                if(options[m]!=''&&(options[m].state)) {
                    if(options[m].state=='1'){
                        oneFlag.push(options[m].key);
                        continue;
                    }
                    options[m].options=options[m].options||[];
                    for(var j=0;j<options[m].options.length;j++){
                        var options1= options[m].options;
                        if(options1[j]!=''){
                            if(options1[j].state=='1'){
                                twoFlag.push(options1[j].key);
                                continue;
                            }
                            options1[j].options=options1[j].options||[];
                            for(var k=0;k<options1[j].options.length;k++){
                                var options2=options1[j].options;
                                if(options2[k]&&(options2[k].state=='1')){
                                    threeFlag.push(options2[k].key);

                                }

                            }
                        }
                    }
                }
            }
        }
        for(var i=0;i<diccm.length;i++){
            var options = diccm[i].options || [];
            for(var m=0;m<options.length;m++){

                if(options[m]!='') {
                    if ($.inArray(options[m].key, oneFlag) > -1) {

                        options.splice(m,1);
                        m=m-1;
                        continue;
                    }
                    options[m].options=options[m].options||[];
                    for(var j=0;j<options[m].options.length;j++){
                        var options1= options[m].options;
                        if(options1[j]!=''){
                            if ($.inArray(options1[j].key, twoFlag) > -1) {

                                options1.splice(j,1);
                                continue;
                            }
                            options1[j].options=options1[j].options||[];
                            for(var k=0;k<options1[j].options.length;k++){
                                var options2=options1[j].options;
                                if(options2[k]!=''){
                                    if ($.inArray(options2[k].key, threeFlag) > -1) {

                                        options2.splice(k,1);
                                        continue;
                                    }

                                }
                            }
                        }
                    }
                }
            }
        }
        session.dicMap.options = diccm;
    },
    cancelDeal: function (src) {
        var container=$("#view_dic_config");
        container.find('#dic_detail_pane').empty();
    }
}

function removeDicRow(src) {
    var nowDiv = src.closest('.dicEverTop').find('ul.pressed div.show');
    var preDiv = nowDiv.prev();
    var nextDiv = nowDiv.next();
    var signs = nowDiv.attr('ds_data');
    var nextDic = nowDiv.closest('.dicEverTop').next();
    var optionid = $('#frm_dic_edit  .ds_do_action').attr('ds_data');
    var myddcxx = getCache('options',optionid);
    var istwo = "";

    if (nextDic.length != 0 && nextDic.find('.' + signs).length != 0) {
        istwo = "no";
        var nextnextDic = nextDic.next();
        if (nextnextDic.length != 0) {
            var divs = nextDic.find('.' + signs).children();
            for (var i = 0; i < divs.length; i++) {
                var sign2 = $(divs[i]).attr('ds_data');
                if (nextnextDic.find('.' + sign2).length != 0) {
                    nextnextDic.find('.' + sign2).remove();
                }
            }
        }
        nextDic.find('.' + signs).remove();
    }
    if(istwo != "no"&&myddcxx.name == "满意度调查选项" && nowDiv.length == 1){
        alert("至少需要保留一个值！");
        return;
    }
    nowDiv.remove();
    if (preDiv.length > 0) {
        preDiv.click();
    } else {
        nextDiv.click();
    }

}
function addDicRow(targ) {
    var target = targ.find('div:last');
    var sign = '';
    if (target.length == 0) {
        var classes = targ.attr('class');
        sign = classes.split(' ')[0];

        var html = "<div ds_data=\"" + sign + '_0' + "\" class='ds_do_action show' ds_action='config.dic.addNextDic'> " +
            "<input name='dic[]' state='2'  type='text' placeholder='字典项' style='width:80px;' required msgName='字典项'/></div>";
        targ.append(html);
        return;
    }
    var signs = target.attr('ds_data').substring(4).split('_');
    sign = 'sign';
    for (var i = 0; i < signs.length - 1; i++) {
        sign += signs[i] + '_';
    }
    sign += (parseInt(signs[signs.length - 1]) + 1);
    var html1 = "<div ds_data='" + sign + "' class='ds_do_action show' ds_action='config.dic.addNextDic'>" +
        "<input name='dic[]' state='2' type='text' placeholder='字典项' value='' style='width:80px;' required msgName='字典项'/></div>";
    target.after(html1);
    target.next().siblings().removeClass('show');
    target.next().click();
    target.next().find('input').focus();
}

