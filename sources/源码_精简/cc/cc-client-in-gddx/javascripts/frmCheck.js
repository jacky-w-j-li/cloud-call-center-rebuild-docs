var validate={
	Anything : /.*/,
    Email : /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    Phone :/^[0-9]\d{2,16}$/,
    Phone2:/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/,
    AllPhone :/^([0-9]|-){2,16}$/,
    Mobile : /^0?(13\d{9}|15\d{9}|18\d{9}|14\d{9})$/,
    Url : /^((http|ftp|https):\/\/)(([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,4})*(\/[a-zA-Z0-9\&%_\.\/-~-]*)?/,
    TEXT: /^\w+$/,
    Number : /^\d+$/,
    Number2 : /^\d+(\.\d{1,2})?$/,
    Number3 : /^[1-9]\d*$/,//正整数
    QQ : /^[1-9]\d{4,8}$/,
    Integer : /^[-\+]?\d+$/,
    Double : /^[-\+]?\d+(\.\d+)?$/,
    Character: /^[A-Za-z0-9_]+$/,
    Character2: /^[A-Za-z0-9._]+$/,
    IP : /^(([1][0-9][0-9])|([2][0-4][0-9])|([2][5][0-5])|([0-9][0-9])|([0-9]))\.(([1][0-9][0-9])|([2][0-4][0-9])|([2][5][0-5])|([0-9][0-9])|([0-9]))\.(([1][0-9][0-9])|([2][0-4][0-9])|([2][5][0-5])|([0-9][0-9])|([0-9]))\.(([1][0-9][0-9])|([2][0-4][0-9])|([2][5][0-5])|([0-9][0-9])|([0-9]))$/,
    YYYYMMDDHHDDSS : /^[12][0-9]{3}-([0][1-9]|[1][012])-([012][0-9]|[3][01]) ([01][0-9]|[2][0-3]):[0-5][0-9]:[0-5][0-9]$/,
    YYYYMMDD : /^[12][0-9]{3}-([0][0-9]|[1][012])-([012][0-9]|[3][01])$/,
    Chinese : /^[\u0391-\uFFE5]+$/,
    NotChinese : /^[^\u0391-\uFFE5]+$/,
    UnSafe : /^(([A-Z]*|[a-z]*|\d*|[-_\~!@#\$%\^&\*\.\(\)\[\]\{\}<>\?\\\/\'\"]*)|.{0,5})$|\s/,
    Age : /^[1-9]\d{0,2}$/,

    LimitLen : "validate.limit(validate.LenBT(value), getAttribute('min'), getAttribute('max'))",
    NumberLen : "this.numberLen(value,getAttribute('min'), getAttribute('max'))",
    Date : "validate.IsDate(value, getAttribute('min'), getAttribute('format'))",
    Decimal:"this.decimal(value,getAttribute('dig'))",
    Repeat : "value == document.getElementsByName(getAttribute('to'))[0].value",
    Range : "this.range(value,getAttribute('min'),getAttribute('max') )",
    RangeStr : "this.rangeStr(value,getAttribute('min'),getAttribute('max') )",
    Compare : "this.compare(value,getAttribute('operator'),getAttribute('to'))",
    Custom : "this.Exec(value, getAttribute('regexp'))",
    Unique : "this.IsUnique(getAttribute('name'))",
    CompareInput : "this.compareInput(value,getAttribute('operator'),getAttribute('to'))",
    CompareNumeric: "this.compareNumeric(value,getAttribute('operator'),getAttribute('to'))",
    SafeString : "this.IsSafe(value)",

    ErrorItem : ["0"],
    ErrorMessage : ["错误消息："],

    validate : function(form, showModel) {
        var elements =$("input,textarea,select", form);
        validate.ErrorMessage.length = 1;
        validate.ErrorItem.length = 1;
        validate.ErrorItem[0] = elements;
        var fields={};
        for(var i=0; i<elements.length; i++) {
            var item=elements[i];
        	if (item.disabled) continue;
            var require=item.getAttribute("required")==undefined?false:true;
            validate.clearState(item);
            if (require ==false && validate.trim(item.value) == "") continue;
            var _message =item.getAttribute("msg")||"";
            var fieldName =item.getAttribute("msgName")||"";
            var _dataType =item.getAttribute("dataType")||"";
            var dataTypes = !_dataType?[]:_dataType.split(",");
            var msgLen=0;
            var arrMessage=[];
            if(_message){
                arrMessage=_message.split("|");
                msgLen=arrMessage.length;
            }
            var value = validate.trim(item.value);
            var defaultMsg="";
            var type=item.getAttribute("type");
            var name=item.getAttribute('name');
            if(!name){
                continue;
            }
            if(fields[name]){
                fields[name]++;
            }else{
                fields[name]=1;
            }
            //console.info(type+"===="+name+"======"+require+"======"+fieldName);
            if(fields[name]>1  &&  (type=='radio'||type=='checkbox')) continue; //for checkbox radio

            if(require==true){
                if(!fieldName){
                    var label = $(item).prev("label");
                    if(label) fieldName=label.text();
                }
                if(fieldName && fieldName.indexOf(":")!=-1){
                    fieldName="["+fieldName.substring(0,fieldName.indexOf(":"))+"]";
                }else if(fieldName && fieldName.indexOf("：")!=-1){
                    fieldName="["+fieldName.substring(0,fieldName.indexOf("："))+"]";
                }else{
                    fieldName="["+ fieldName+"]";
                }
                defaultMsg=fieldName+'必须填写';
                if(type=='radio'||type=='checkbox'){
                    defaultMsg=fieldName+'必须选择一项';
                    if(!validate.MustChecked(name,form)){
                        validate.addError(item,i, defaultMsg);
                        continue;
                    }
                }else{
                    if(!value){
                        validate.addError(item,i, defaultMsg);
                        continue;
                    }
                }
            }
            var length =  dataTypes.length;
            if(length==0)continue;
            with(item){
                for (var j=0; j<length; j++) {
                    var k=dataTypes[j];
                    var temp = 0;
                    switch(k) {
                        case "Date" :
                        case "Repeat" :
                        case "Range" :
                        case "RangeStr" :
                        case "Compare" :
                        case "Custom" :
                        case "LimitLen" :
                        case "SafeString" :
                        case "NumberLen":
                        case "Decimal":
                        case "Unique":
                        case "CompareInput":
                        case "CompareNumeric":
                            if(!eval(validate[k])) {
                                if(msgLen>1){
                                    validate.addError(item,i, arrMessage[j]);
                                }else{
                                    validate.addError(item,i, _message);
                                }
                                temp = 1;
                            }
                            break;
                        default :
                            if(!validate[k].test(value)){
                                if(msgLen>1){
                                    validate.addError(item,i, arrMessage[j]);
                                }else{
                                    validate.addError(item,i, _message);
                                }
                                temp = 1;
                            }
                            break;
                    }
                    if (temp==1) {break;}
                }
            }

        }
        var result=validate.showErrorMsg(showModel);
        return result;
    },
    clearState : function(item){
        if(item.type=='radio'||item.type=='checkbox'){
            if($(item).attr("customColor")){
                $(item).closest("div").css({"background-color":$(item).attr("customColor")});
            }else{
                $(item).closest("div").css({"background-color":"#fff"});
            }
        } else{
            $(item).css({borderColor:"#ccc"});
        }
    },
    addError : function(item,index, str){
        validate.ErrorItem[validate.ErrorItem.length] = item;
        validate.ErrorMessage[validate.ErrorMessage.length] = validate.ErrorMessage.length + ":" + str;
    },
    showErrorMsg:function(showModel){
        if(validate.ErrorMessage.length > 1) {
            showModel = showModel || 1;
            var errCount = validate.ErrorItem.length;
            switch(showModel){
                case 1 :
                    for(var i=1;i<errCount;i++){
                       var item=validate.ErrorItem[i];
                        if(item.type=='radio'||item.type=='checkbox'){
                            $(item).closest("div").css({"background-color":"#ffcccc"});
                        } else{
                            $(item).css({borderColor:"red"});
                        }
                    }
                    alert(validate.ErrorMessage.join("\n"));
                    try{
                        validate.ErrorItem[1].focus();
                    }catch(e){}
                    break;
                default :
                    alert(validate.ErrorMessage.join("\n"));
                    break;
            }
            return false;
        }
        return true;
    },
    limit : function(len, min, max) {
        len = len || 0;
        min = min || 0;
        max = max || Number.MAX_VALUE;
        return min <= len && len <= max;
    },
    trim:function(str){
        return str.replace(/(^\s*)|(\s*$)/g,"");
    },
    LenB : function(str){
        return str.replace(/[^\x00-\xff]/g,"**").length;
    },
    LenBT : function(str){
        var v_temp = str.replace(/^\s+/g, '').replace(/\s+$/g, '');//del the blankspace, like trim().
        if(v_temp.length==0) str = v_temp;
        return str.replace(/[^\x00-\xff]/g,"*").length;
    },
    IsSafe : function(str){return !this.UnSafe.test(str);},
    Exec : function(op, reg){
        return new RegExp(reg,"g").test(op);
    },

    numberLen : function(value, min, max){
        var re = new RegExp("^[0-9]{"+min+","+max+"}$","g");
        return re.test(value);
    },

    decimal : function(value,dig){
        if ( dig == null || typeof(dig) == "undefined" || dig.length<=0 || "null" == dig ){//没有设置小数位
            var re = new RegExp("^[-+]?\\d+(.\\d+)?$","g");
            return re.test(value);
        }else{
            var re = new RegExp("^[-+]?\\d+(.\\d{0,"+dig+"})?$","g");
            return re.test(value);
        }
    },

    compare : function(op1,operator,op2){
        switch (operator) {
            case "NotEqual":
                return (op1 != op2);
            case "GreaterThan":
                return (op1 > op2);
            case "GreaterThanEqual":
                return (op1 >= op2);
            case "LessThan":
                return (op1 < op2);
            case "LessThanEqual":
                return (op1 <= op2);
            default:
                return (op1 == op2);
        }
    },

    range : function(value,minValue,maxValue){
        if ( (minValue==null || ''==minValue || typeof(minValue)== 'undefined')
            &&(maxValue==null || ''==maxValue ||typeof(maxValue) == 'undefined') ){
            return true;
        }else if ((minValue!=null && ''!=minValue && typeof(minValue)!= 'undefined')
            &&(maxValue==null || ''==maxValue ||typeof(maxValue) == 'undefined') ){
            return minValue*1 <= value*1;
        }else if ((minValue==null || ''==minValue || typeof(minValue)== 'undefined')
            &&(maxValue!=null && ''!=maxValue && typeof(maxValue) != 'undefined')){
            return value*1 <= maxValue*1;
        }else{
            return minValue*1 <= value*1 && value*1 <= maxValue*1 ;
        }
    },

    rangeStr : function(value,minValue,maxValue){
        if ( (minValue==null || ''==minValue || typeof(minValue)== 'undefined')
            &&(maxValue==null || ''==maxValue ||typeof(maxValue) == 'undefined') ){
            return true;
        }else if ((minValue!=null && ''!=minValue && typeof(minValue)!= 'undefined')
            &&(maxValue==null || ''==maxValue ||typeof(maxValue) == 'undefined') ){
            return minValue <= value;
        }else if ((minValue==null || ''==minValue || typeof(minValue)== 'undefined')
            &&(maxValue!=null && ''!=maxValue && typeof(maxValue) != 'undefined')){
            return value <= maxValue;
        }else{
            return minValue <= value  && value  <= maxValue ;
        }
    },

    compareInput : function(value1,operator,inputName){
        if (value1==null || ''==value1 || typeof(value1)== 'undefined') return true;
        var value2 = document.getElementsByName(inputName)[0].value
        if(value2==null || ''==value2 ||typeof(value2) == 'undefined' ) return true;
        switch (operator) {
            case "NotEqual":
                return (value1 != value2);
            case "GreaterThan":
                return (value1 > value2);
            case "GreaterThanEqual":
                return (value1 >= value2);
            case "LessThan":
                return (value1 < value2);
            case "LessThanEqual":
                return (value1 <= value2);
            default:
                return (value1 == value2);
        }
    },

    compareNumeric : function(value1,operator,inputName){
        if ( value1==null || ''==value1 || typeof(value1)== 'undefined') return true;
        var value2 = document.getElementsByName(inputName)[0].value
        if(value2==null || ''==value2 ||typeof(value2) == 'undefined' ) return true;
        switch (operator) {
            case "NotEqual":
                return (value1*1 != value2*1);
            case "GreaterThan":
                return (value1*1 > value2*1);
            case "GreaterThanEqual":
                return (value1*1 >= value2*1);
            case "LessThan":
                return (value1*1 < value2*1);
            case "LessThanEqual":
                return (value1*1 <= value2*1);
            default:
                return (value1*1 == value2*1);
        }
    },

    MustChecked : function(name,frm){
        var groups=$("input[name='"+name+"']", frm);
        var hasChecked = 0;
        var min = 1;
        var max = groups.length;
        for(var i=groups.length-1; i>=0; i--) {
            if (groups[i].checked) hasChecked++;
        }
        return min <= hasChecked && hasChecked <= max;
    },

    IsUnique : function(name){
        var groups = document.getElementsByName(name);
        var hasRepeat = 0;
        var values = new Array();
        for(var i=0;i<groups.length-1;i++){
            if ( values.length>0){
                for(var j=0;j<values.length-1;j++){
                    if ( groups[i].value == values[j].value ){
                        hasRepeat++;
                        return false;
                    }
                }
            }
            values[values.length]=groups[i].value;
        }
        return (hasRepeat==0)?true:false;
    },
    IsDate: function(op, min, formatString){
        try {
            var o = op.replace(/-/g, "/");
            var m = min.replace(/-/g, "/");
            var dt1 = Date.parse(o);
            var dt2 = Date.parse(m);
            return dt1 > dt2;
        }catch(e) {
            console.debug("日期格式错误" + e);
        }
    }

};