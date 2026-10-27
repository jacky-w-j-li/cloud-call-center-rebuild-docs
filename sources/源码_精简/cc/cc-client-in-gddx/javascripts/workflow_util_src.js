/**
 * create  by zhangyang@7moor.com
 * 2014-04-09
 * @type {{}}
 */
utils.workflow={
    getObjectById: function (datas, id) {
        datas = datas || [];
        for (var i = 0; i < datas.length; i++) {
            var datasItem = datas[i];
            if (datasItem._id == id) {
                return copy(datasItem);
            }
        }
        return null;
    },
    initCascateSelect: function (colPane, field, business, tmp) {
        business = business || {};
        var dic = getCache("options", field.dic);
        var cascateTmp = "<div class='cascade-dropdown _span' fieldId = '_fieldId' cascadeIndex = '_index'></div>";
        var optionTmp = "<option value='_value'>_name</option>";
        var options = dic.options || [];
        var selectOption = function (options, val) {
            options = options || [];
            for (var opIndex = 0; opIndex < options.length; opIndex++) {
                if (options[opIndex].key == val) {
                    return options[opIndex];
                }
            }
            return [];
        }
        for (var cascateIndex = 0; cascateIndex < dic.cascade; cascateIndex++) {
            colPane.append(cascateTmp.replace(/_span/g, "span" + 12 / dic.cascade).replace(/_fieldId/g, field._id).replace(/_index/g, cascateIndex));
            field.name = dic.headers[cascateIndex];
            var cascateDiv = colPane.find(".cascade-dropdown:last");

            var selectName = field._id;
            if (cascateIndex != 0) {
                selectName += "_" + cascateIndex;
            }

            cascateDiv.append(render.replaceDataByObject(field, tmp).replace(/_name/g, selectName));

            if (cascateIndex == 0) {
                var hasDic = false;
                if (!business[field._id]) {
                    hasDic = true;
                }
                for (var i = 0; i < options.length; i++) {
                    var optionsItem = options[i];
                    cascateDiv.find("select").append(optionTmp.replace(/_value/g, optionsItem.key).replace(/_name/g, optionsItem.name));
                    if ((business[field._id] && optionsItem.key == business[field._id])) {
                        hasDic = true;
                    }
                }
                if (hasDic) {
                    cascateDiv.find("select").val(business[field._id] || field["default"]);
                } else {
                    cascateDiv.find("select").append(optionTmp.replace(/_value/g, business[field._id + '_default']).replace(/_name/g, business[field._id + '_default']))
                    cascateDiv.find("select").val(business[field._id + '_default']);
                }
            } else {
                var last = cascateDiv.prev(".cascade-dropdown");
                var lastVal = last.find("select").val();
                if (lastVal) {
                    var hasDic = false;
                    if (!business[field._id + "_" + cascateIndex]) {
                        hasDic = true;
                    }
                    options = selectOption(options, lastVal).options || [];
                    for (var i = 0; i < options.length; i++) {
                        var optionsItem = options[i];
                        cascateDiv.find("select").append(optionTmp.replace(/_value/g, optionsItem.key).replace(/_name/g, optionsItem.name));
                        if (business[field._id + "_" + cascateIndex] && optionsItem.key == business[field._id + "_" + cascateIndex]) {
                            hasDic = true;
                        }

                    }
                    if (hasDic) {
                        cascateDiv.find("select").val(business[field._id + "_" + cascateIndex]);
                    } else {
                        cascateDiv.find("select").append(optionTmp.replace(/_value/g, business[field._id + "_" + cascateIndex + '_default']).replace(/_name/g, business[field._id + "_" + cascateIndex + '_default']))
                        cascateDiv.find("select").val(business[field._id + "_" + cascateIndex + '_default']);
                    }
                }
            }


        }


    },
    initDisplayCheckBox: function (colPane, field, business, tmp) {
        business = business || {};
        var dic = getCache("options", field.dic);
        var options = dic.options || [];
        var html = $(DS.renderMethodView(tmp, field));
        var checkTmp = "<div class='inline-checkbox'><label class='inline'><input fieldgroup='1' type='checkbox' name='__id' value='__value' msgName='__fieldName' __checked  __required>__name</label></div>";
        if (field.required == "yes" || field.required == 'required') {
            checkTmp = checkTmp.replace(/__required/g, "required");
        }
        var pane = html.find(".field-option-inner");
        pane.empty();
        for (var i = 0; i < options.length; i++) {
            var optionsItem = options[i];
            if (arrayContainsStr(business[field._id], optionsItem.key)) {
                pane.append(checkTmp.replace(/__id/g, field._id + "[]").replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__checked/g, "checked").replace(/__fieldName/g, field.name));
            } else {
                pane.append(checkTmp.replace(/__id/g, field._id + "[]").replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__fieldName/g, field.name));
            }
        }
        colPane.append(html);

    },
    initDisplayRadio: function (colPane, field, business, tmp) {
        business = business || {};
        var dic = getCache("options", field.dic);
        var options = dic.options || [];
        console.log(options);
        var html = $(DS.renderMethodView(tmp, field));
        var checkTmp = "<div class='inline-checkbox'><label class='inline'><input type='radio' name='__id' value='__value' msgName='__fieldName' __checked __required>__name</label></div>";
        if (field.required == "yes" || field.required == 'required') {
            checkTmp = checkTmp.replace(/__required/g, "required");
        }
        var pane = html.find(".field-option-inner");
        pane.empty();
        for (var i = 0; i < options.length; i++) {
            var optionsItem = options[i];
            if (field["default"] == optionsItem.key) {
                pane.append(checkTmp.replace(/__id/g, field._id).replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__checked/g, "checked").replace(/__fieldName/g, field.name));
            } else {
                pane.append(checkTmp.replace(/__id/g, field._id).replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__fieldName/g, field.name));
            }
        }
        colPane.append(html);
    },
    _initQiniuUpload:function(cid,pane){
        var containerId= cid+'-business-qiniu';
        var progressId= cid+'-fsUploadProgress';
        pane=pane.find("#"+containerId).closest(".bus_attach_upload_container");
        var uploader = Qiniu.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: cid+'-pickCustomerFiles',
            multi_selection:true,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.weixin.getUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorDomain,
            unique_names: false,
            save_key: false,
            auto_start: true,
            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".business_attach_progress").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId,"business");
                        progress.setStatus("等待...");
                    });

                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId,"business");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId,"business");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function(evt,info) {
                    $().alertmessage('showSuccess', "文件上传成功");
                    pane.find(".business_attach_progress").hide();
                    window.setTimeout(function(){
                        pane.find(".business_attach_progress").find("tbody").empty();
                    },500)
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId,"business");
                    var trueName = file.name;
                    up.trueName = trueName;
                    progress.setComplete(up, info,"business");
                    var res = $.parseJSON(info);
                    var fileName = res.key;
                    var trueName = up.trueName;
                    var data={fileId:fileName,trueName:trueName,suffix:'other'};
                    var ul=pane.find(".thumbnails_customer");
                    var imgTypes=["jpg","jpeg",'gif','png',"bmp"];
                    var suffix=trueName.substring(trueName.lastIndexOf(".")+1);
                    suffix=suffix.toLowerCase();
                    if($.inArray(suffix,imgTypes)!=-1){
                        data.suffix='img';
                    };
                    var _view=template("tmpl_bus_attach",data);
                    ul.append(_view);
                },
                'Error': function(up, err, errTip) {
                    pane.find(".business_attach_progress").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var key = session.user.account+"/business/"+date+"/"+time+"/"+uuid.v1();
                    return key;
                }
            }
        });
        $('#'+containerId).on(
            'dragenter',
            function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            }
        ).on('drop', function(e) {
            e.preventDefault();
            $('#'+containerId).removeClass('draging');
            e.stopPropagation();
        }).on('dragleave', function(e) {
            e.preventDefault();
            $('#'+containerId).removeClass('draging');
            e.stopPropagation();
        }).on('dragover', function(e) {
            e.preventDefault();
            $('#'+containerId).addClass('draging');
            e.stopPropagation();
        });
    },

    createFlowCustomFields: function (customFields, flowFields, pane, business,flag) {
        var rowTmp = "<div class='row-fluid'></div>";
        var colTmp = "<div class='__spanClass col'></div>";
        var singleTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><input type='text' name='__id' value='__default' msgName='__name'  __required style='width: 94%;'></div></div></div>";
        var multiTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><textarea  name='__id'  __required style='width: 94%;' msgName='__name' >__default</textarea></div></div></div>";
        var dateTmp = flag ? "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><input size='16' class='ds_date' data-date-format='yyyy-mm-dd' style='width: 80%;' type='text' id='__id_stepAction' name='__id' msgName='__name'  value='__default' readonly ></div></div>":"<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><input size='16' class='ds_date' data-date-format='yyyy-mm-dd' style='width: 80%;' type='text' id='__id' name='__id' msgName='__name'  value='__default' readonly ></div></div>";
        var numberTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><input type='text' name='__id'dataType='Number2' msg='【__name】必须为数字！' msgName='__name' value='__default' __required style='width: 94%;'></div></div></div>";
        var dropdownTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><select name='_name' value='__default' __required msgName='__name'  style='width: 100%;'><option value=''>--请选择--</option></select></div></div>";
        var checkboxTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><div class='inline-checkbox'><label class='inline'><input msgName='__name'  type='checkbox' name='__id' value='__default'>1</label></div><div class='inline-checkbox'><label class='inline'><input type='checkbox' name='__id' value='__default'>2</label></div></div></div></div>";
        var radioTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner ds_search_item'><div class='inline-checkbox'><label class='inline'><input type='radio' msgName='__name'  name='__id' value='1'>1</label></div><div class='inline-checkbox'><label class='inline'><input type='radio' name='__id' value='2'>2</label></div></div></div></div>";
        var fileTmp = "<div class='row-fluid bus_attach' __required><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div>" +
            "<div class='field-option'><div class='field-option-inner ds_search_item'>__fileContent</div></div></div>";

        customFields = customFields || [];
        for (var i = 0; i < customFields.length; i++) {
            var row = customFields[i];
            pane.append(rowTmp);
            var rowPane = pane.children("div.row-fluid:last");
            var colNum = row.cols.length;
            for (var j = 0; j < row.cols.length; j++) {
                var col = row.cols[j];
                rowPane.append(colTmp.replace(/__spanClass/g, "span" + 12 / colNum));
                var colPane = rowPane.children("div.col:last");
                for (var k = 0; k < col.fields.length; k++) {
                    var field = col.fields[k];
                    var cacheField = utils.workflow.getObjectById(flowFields, field._id);
                    if (cacheField) {
                        var type = cacheField.type;
                        if (business){
                            cacheField["default"] = business[cacheField._id] || cacheField["default"];
                        }
                        switch (type) {
                            case 'single':
                                colPane.append(render.replaceDataByObject(cacheField, singleTmp));
                                break;
                            case 'multi':
                                colPane.append(render.replaceDataByObject(cacheField, multiTmp));
                                break;
                            case 'date':
                                cacheField.default =  cacheField.default || getCurrentDate();
                                colPane.append(render.replaceDataByObject(cacheField, dateTmp));
                                break;
                            case 'number':
                                colPane.append(render.replaceDataByObject(cacheField, numberTmp));
                                break;
                            case 'dropdown':
                                var rowContiner = $("<div class='row-fluid'></div>");
                                colPane.append(rowContiner);
                                utils.workflow.initCascateSelect(rowContiner, cacheField, business, dropdownTmp);
                                break;
                            case 'checkbox':
                                utils.workflow.initDisplayCheckBox(colPane, cacheField, business, checkboxTmp);
                                break;
                            case 'radio':
                                utils.workflow.initDisplayRadio(colPane, cacheField, business, checkboxTmp);
                                break;
                            case 'file':
                                if(business && business[cacheField._id]){
                                    if(handler.business.isStartStep(business.step)||business.isProcessAction){
                                        var qid=uuid.v1();//考虑多个附件字段
                                        var fileContent=template("tmpl_bus_add_attach",{qiniuId:qid,_id:field._id});
                                        cacheField.fileContent=fileContent;
                                        colPane.append(render.replaceDataByObject(cacheField, fileTmp));
                                        utils.workflow._initQiniuUpload(qid,pane);

                                        var attachs=business[cacheField._id]||[];
                                        var list=[];
                                        for (var l = 0; l < attachs.length; l++) {
                                            var obj = attachs[l];
                                            obj.fid=field._id;
                                            list.push(template("tmpl_bus_attach_show_edit",obj));
                                        }
                                        var containerId= qid+'-business-qiniu';
                                        var p1=pane.find("#"+containerId).closest(".bus_attach_upload_container");
                                        var p1=p1.find(".thumbnails_customer");
                                        p1.html(list.join(""));
                                    }else{
                                        var attachs=business[cacheField._id]||[];
                                        var list=[];
                                        for (var l = 0; l < attachs.length; l++) {
                                            var obj = attachs[l];
                                            obj.fid=field._id;
                                            list.push(template("tmpl_bus_attach_show",obj));
                                        }
                                        var _html=list.join("");
                                        if(list.length==0){
                                            _html="<li style='margin-top: 3px;'>无</li>";
                                        }
                                        var html='<ul class="thumbnails_customer">'+_html+'</ul>';
                                        cacheField.fileContent=html;
                                        colPane.append(render.replaceDataByObject(cacheField, fileTmp));
                                    }
                                }else{
                                    var qid=uuid.v1();
                                    var fileContent=template("tmpl_bus_add_attach",{qiniuId:qid,_id:field._id});
                                    cacheField.fileContent=fileContent;
                                    colPane.append(render.replaceDataByObject(cacheField, fileTmp));
                                    utils.workflow._initQiniuUpload(qid,pane);
                                }
                                break;
                            default :
                                console.log('the type [' + type + '] is not support!');
                        }
                    } else {
                        alert("字段定义未找到！");
                    }

                }

            }

        }
    },

}
