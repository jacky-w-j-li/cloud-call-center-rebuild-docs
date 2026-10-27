Ext.require('App.view.FileUpLoader');

Ext.define('App.view.account.displayNumRecord.edit',{
    extend: 'Ext.window.Window',
    alias: 'widget.editDisplayNumRecord',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '编辑透传号码备案',
    record:null,
    editMode:'addNew',
    initComponent: function(){
        Ext.applyIf(this,{
            items:[
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 70,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title: '备案信息',
                            id: 'display_num_record_info',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout:'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    fieldLabel:'编号',
                                    name:'_id',
                                    value: this.getFieldValue("_id"),
                                    hidden : true,
                                },
                                {
                                    fieldLabel:'账户编号',
                                    name:'account',
                                    maxLength: 50,
                                    columnWidth: .5,
                                    value: this.getFieldValue("account"),
                                    allowBlank: false,
                                    readOnly : this.editMode != 'addNew',
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '线路',
                                    name:'line',
                                    editable:true,
                                    store: App.util.AppUtil.getDicStore('line'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth:.5,
                                    value: this.getFieldValue('line'),
                                    allowBlank: false,
                                },
                                {
                                    xtype:'fieldset',
                                    columnWidth:1,
                                    title:'透传号码',
                                    id: 'displayNums',
                                    name: 'displayNums',
                                    collapsible: false,
                                    cls: 'background_blue',
                                    items:[
                                        {
                                            html:'<div class="line_indent" id="displayNum_record_displayNum_list_div"><span class="line_tag" hidden="true"></span></div>'
                                        },
                                        {
                                            fieldLabel: '添加号码',
                                            xtype: 'textfield',
                                            id:'add_num',
                                            labelStyle: 'width:55px',
                                            margin:'10 0 10 0',
                                            msgTarget:'side',
                                            enableKeyEvents:true,
                                            listeners:{
                                                keyup : function(obj,e){
                                                    if (e.getKey() != e.ENTER) {
                                                        return true;
                                                    }
                                                    var num = obj.getValue();
                                                    if(!num || num == ''){
                                                        return;
                                                    }
                                                    var fieldset = obj.up('fieldset');
                                                    var win = obj.up('window');

                                                    if(!fieldset.nums) {
                                                        fieldset.nums = []
                                                    }

                                                    if(fieldset.nums.indexOf(num)>=0){
                                                        //警告重复
                                                        obj.markInvalid("号码重复!");
                                                        return;
                                                    }

                                                    var numsDiv = document.getElementById("displayNum_record_displayNum_list_div");
                                                    var numSpan = win.getRenderNumber(fieldset,num,numsDiv);
                                                    numsDiv.appendChild(numSpan);

                                                    //重新布局
                                                    numsDiv.style.height = win.calcNumsDivHeight(numsDiv,win) + 'px';
                                                    win.doLayout();

                                                    fieldset.nums.push(num);
                                                    obj.reset();
                                                },
                                            }
                                        },
                                    ]
                                },
                                {
                                    xtype : 'fileuploader',
                                    labelWidth: 50,
                                    fieldLabel : '承诺函',
                                    buttonText : '选择...',
                                    allowBlank : true,
                                    id: 'display_num_record_oath_img',
                                    name: 'oathImgs',
                                    previewLocation : 'bottom',
                                    previewInitialSize : 'small',
                                    previewSizeSmall : 60,
                                    previewSizeLarge : 400,
                                    columnWidth:1,
                                    value: this.getFieldValue("oathImgs"),
                                    qiniuNameSpace : 'bill/displayNumRecord/',
                                },
                                {
                                    fieldLabel: '备注',
                                    labelWidth: 30,
                                    name: 'memo',
                                    xtype: 'textarea',
                                    value: this.getFieldValue('memo'),
                                    columnWidth: 1
                                },
                            ],
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: this.editMode=='addNew'?'添加':'更新',
                    id: 'commit_button',
                },
                {
                    text:'关闭',
                    handler: function(obj){
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        this.callParent(arguments);

        this.on({
            afterrender : function(){
                if(this.ediMode == 'addNew'){
                    return;
                }
                this.initNumDiv(this.getFieldValue('displayNums'));
            }
        });
    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return '';
        }
        return this.record.raw[fieldName];
    },
    getRenderNumber: function (fieldset,num,numsDiv) {
        var span = document.createElement('span');
        span.setAttribute('num',num);
        span.setAttribute('class','line_tag');
        span.textContent=num;

        var delSpan = document.createElement('span');
        delSpan.textContent='✗';
        delSpan.style = "color:red;cursor:pointer;margin-left: 10px;padding: 5px";
        var thisNums = fieldset.nums;
        var win = this;
        delSpan.addEventListener('click', function(event) {
            event = event || window.event;
            var delEle = (event.target || event.srcElement).parentNode;
            var delNum = delEle.getAttribute("num");

            if(thisNums && thisNums.length>0){
                thisNums.splice(thisNums.indexOf(delNum),1);
                delEle.remove();
            }

            //重新布局
            numsDiv.style.height = win.calcNumsDivHeight(numsDiv,win) + 'px';
            win.doLayout();
        });

        span.appendChild(delSpan);
        return span;
    },
    calcNumsDivHeight:function(numsDiv){
        var lineSpans = numsDiv.children || [];
        var limitWidth = numsDiv.getBoundingClientRect().width;
        var totalWidth = 0;
        var factor = 0;

        for (var i = 0; i < lineSpans.length; i++) {
            var thisSpanWidth = lineSpans[i].getBoundingClientRect().width + 5;
            totalWidth += thisSpanWidth;
            if(Math.floor((totalWidth)/(limitWidth-40)) == 1){
                factor++;
                totalWidth = thisSpanWidth;
            }
        }

        var newHeight = (factor + 1) * 40;

        return newHeight;
    },
    initNumDiv:function(nums){
        if(!nums){
            return;
        }
        var nums = this.record.raw.displayNums;
        var numsDiv = document.getElementById("displayNum_record_displayNum_list_div");
        var fieldset = this.down('fieldset#displayNums');
        fieldset.nums = nums;
        var win = this;
        nums.forEach(function(num){
            var lineSpan = win.getRenderNumber(fieldset,num,numsDiv);
            numsDiv.appendChild(lineSpan);
        });

        //重新布局
        numsDiv.style.height = win.calcNumsDivHeight(numsDiv,win) + 'px';
        win.doLayout();
    }
});