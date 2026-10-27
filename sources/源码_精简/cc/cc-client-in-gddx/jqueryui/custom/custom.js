$.widget("custom.combobox", $.ui.autocomplete,{
    _create: function() {
        this._super();
        this._on( this.element, {
            focus: function(event) {
                var val=this._value()||'';
                this.element.attr("inputDesc",val);
                this._value("");
                this.selectedItem = null;
                this.previous = this._value();
                if(!this._value()){//for show all
                    clearTimeout( this.searching );
                    this.searching = this._delay(function() {
                        // only search if the value has changed
                        if (!this._value() ) {
//                            this.selectedItem = null;
                            this.search( null, event );
                        }
                    }, this.options.delay );
                }
            },
            blur: function( event ) {
                if ( this.cancelBlur ) {
                    delete this.cancelBlur;
                    return;
                }
                clearTimeout( this.searching );
                this.close( event );
                this._change( event );
                var displayObj=this.options.displayField;
                if(displayObj && displayObj.length>0){
                    this.element.hide();
                    displayObj.show();
                }else{
                    var desc=this.element.attr("inputDesc");
                    //console.info("desc==="+desc);
                    if(!this._value() && desc){
                        this._value(desc);
                    }
                }
            }
        });
    },

    _renderMenu: function( ul, items ) {
        var that = this;
        /*        $(  "<li style='text-align: left;'><a style='width: 91.5%;display: block;' class='ui-corner-all userScope'>普通客户</a></li>" +
         "<li style='text-align: left;'><a style='width: 91.5%;display: block;' class='ui-corner-all userScope'>公海</a></li>" +
         "<li style='text-align: left;border-bottom: 1px dashed #cccccc;margin-bottom: 2px'><a style='width: 91.5%;display: block;' class='ui-corner-all userScope'>商机池</a></li>" ).appendTo( ul );
         //.append( $( "<strong style=''>" ).text( "分配给") )
         $(".userScope").on('mouseover',function(){
         $(this).addClass('ui-state-focus');
         }).on('mouseout',function(){
         $('.ui-corner-all').removeClass('ui-state-focus');
         })*/
        $.each( items, function( index, item ) {
            that._renderItemData( ul, item );
        });
    },
    _renderItem: function( ul, item ) {
        var obj=null;
        var li="<li uid='"+item._id+"'>";
        var html="<a>" + item.displayName+"["+item.exten+"]" + "</a>" ;
        //if(!item._id){//无所属人
        //    html="<a>" + item.displayName+ "</a>" ;
        //}
        if(item.category){
            var desc="";
            if(item.category=='2'){
                desc="手动公海";
            }else if(item.category=='3'){
                desc="自动公海";
            }
            html="<a>" + item.displayName;
            if(desc){
                html+="["+desc+"]";
            }
            html+= "</a>";
            li="<li uid='"+item._id+"' class='category'>";
        }
        var last=ul.find("li:last");
        if(!item.category&&last.hasClass("category")){
            li="<li uid='"+item._id+"' style='border-top: 1px dashed #cccccc;margin-top: 2px'>";
        }
        obj=$( li )
            .append( html)
            .appendTo( ul );

        return obj;
    }
});


$.widget("custom.combobox2", $.custom.combobox,{
    _renderMenu: function( ul, items ) {
        var that = this;
        $( "<li style='border-bottom: 1px solid #cccccc;text-align: center;padding: 3px ;'>" )
            .append( $( "<strong style=''>" ).text( "转给") )
            .appendTo( ul );
        $.each( items, function( index, item ) {
            that._renderItemData( ul, item );
        });
    },
    _renderItem: function( ul, item ) {
        var obj=null;
        var desc="<span style='color:red;'>离线</span>";
        if(item.online){
            desc="<span style='color:green;'>在线</span>";
        }
        if(item._id==''){
            desc="";
        }
        if(!item._id){
            obj=$( "<li uid='"+item._id+"'>" )
                .append( "<a>" + item.displayName +desc+ "</a>" )
                .appendTo( ul );
        }else{
            obj=$( "<li uid='"+item._id+"'>" )
                .append( "<a>" + item.displayName+"["+item.exten+"]" +desc+ "</a>" )
                .appendTo( ul );
        }
        return obj;
    }

});

$.widget("custom.combobox3", $.custom.combobox,{
    _renderMenu: function( ul, items ) {
        var that = this;
        $( "<li style='border-bottom: 1px solid #cccccc;text-align: center;padding: 3px ;'>" )
            .append( $( "<strong style=''>" ).text( "转到") )
            .appendTo( ul );
        $.each( items, function( index, item ) {
            that._renderItemData( ul, item );
        });
    },
    _renderItem: function( ul, item ) {
        var obj=null;
        var desc="<span style='color:red;'> 无在线座席</span>";
        if(item.onlineNum){
            desc="<span style='color:green;'> "+item.onlineNum+"位在线</span>";
        }
        if(item._id==''){
            desc="";
        }
        if(!item._id){
            obj=$( "<li uid='"+item._id+"'>" )
                .append( "<a>" + item.DisplayName + desc + "</a>" )
                .appendTo( ul );
        }else{
            obj=$( "<li uid='"+item._id+"'>" )
                .append( "<a>" + item.DisplayName+ desc +"</a>" )
                .appendTo( ul );
        }
        return obj;
    }
});

$.widget("custom.combobox4", $.custom.combobox,{
    _renderMenu: function( ul, items ) {
        var that = this;
        $( "<li style='border-bottom: 1px solid #cccccc;text-align: center;padding: 3px ;'>" )
            .append( $( "<strong style=''>" ).text( "邀请") )
            .appendTo( ul );
        $.each( items, function( index, item ) {
            that._renderItemData( ul, item );
        });
    },
    _renderItem: function( ul, item ) {
        var obj=null;
        var desc="<span style='color:red;'>离线</span>";
        if(item.online){
            desc="<span style='color:green;'>在线</span>";
        }
        if(item._id==''){
            desc="";
        }
        if(!item._id){
            obj=$( "<li uid='"+item._id+"'>" )
                .append( "<a>" + item.displayName +desc+ "</a>" )
                .appendTo( ul );
        }else{
            obj=$( "<li uid='"+item._id+"'>" )
                .append( "<a>" + item.displayName+"["+item.exten+"]" +desc+ "</a>" )
                .appendTo( ul );
        }
        return obj;
    }

});


(function($){
    $.fn.textRemindAuto = function(options){
        options = options || {};
        var defaults = {
            blurColor: "#999",
            focusColor: "#333",
            auto: true,
            chgClass: ""
        };
        var settings = $.extend(defaults,options);
        $(this).each(function(){
            if(defaults.auto){
                $(this).css("color",settings.blurColor);
            }
            var v = $.trim($(this).val());
            if(v){
                $(this).focus(function(){
                    if($.trim($(this).val()) === v){
                        $(this).val("");
                    }
                    $(this).css("color",settings.focusColor);
                    if(settings.chgClass){
                        $(this).toggleClass(settings.chgClass);
                    }
                }).blur(function(){
                    if($.trim($(this).val()) === ""){
                        $(this).val(v);
                    }
                    $(this).css("color",settings.blurColor);
                    if(settings.chgClass){
                        $(this).toggleClass(settings.chgClass);
                    }
                });
            }
        });
    };
})(jQuery);
