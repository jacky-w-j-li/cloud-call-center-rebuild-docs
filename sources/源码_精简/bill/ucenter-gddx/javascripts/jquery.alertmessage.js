(function($)
{
    var settings = {
        inEffect: 			{opacity: 'show'},
        inEffectDuration: 	600,
        stayTime: 			2000,
        text: 				'',
        sticky: 			false,
        type: 				'info'
    };

    var methods = {
        init : function(options)
        {
            if (options) {
                $.extend( settings, options );
            }
        },

        showAlert : function(options)
        {
            var localSettings = {};
            $.extend(localSettings, settings, options);

            var itemWrapAll, itemInner,itemClose;
            itemWrapAll	= (!$('.alert-container').length) ? $('<div></div>').addClass('alert-container').appendTo('body') : $('.alert-container');
            itemInner	= $('<div></div>').hide().addClass('alert alert-dismissable alert-' + localSettings.type).appendTo(itemWrapAll).html(localSettings.text).animate(localSettings.inEffect, localSettings.inEffectDuration);
            itemClose	= $('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>').prependTo(itemInner);
            if(!localSettings.sticky)
            {
                setTimeout(function()
                    {
                        $().alertmessage('removeAlert', itemInner, localSettings);
                    },
                    localSettings.stayTime);
            }
            return itemInner;
        },

        showInfo : function (message)
        {
            var options = {text : message, type : 'info'};
            return $().alertmessage('showAlert', options);
        },

        showSuccess : function (message)
        {
            var options = {text : message, type : 'success'};
            return $().alertmessage('showAlert', options);
        },

        showError : function (message)
        {
            var options = {text : message, type : 'danger'};
            return $().alertmessage('showAlert', options);
        },

        showWarning : function (message)
        {
            var options = {text : message, type : 'warning'};
            return $().alertmessage('showAlert', options);
        },

        removeAlert: function(obj, options)
        {
            obj.animate({opacity: '0'}, 600, function()
            {
                obj.parent().animate({height: '0px'}, 300, function()
                {
                    obj.parent().remove();
                });
            });
        }
    };

    $.fn.alertmessage = function( method ) {
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist' );
        }
    };

})(jQuery);