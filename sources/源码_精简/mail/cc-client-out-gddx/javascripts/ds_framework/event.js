var dsevent = {
    _listener: [],

    _contains: function(value) {
        for(var i=0;i<dsevent._listener.length;i++) {
            if(dsevent._listener[i] == value) {
                return true;
            }
        }
        return false;
    },
    publish: function(eventName, params) {
        for(var i=0;i<dsevent._listener.length;) {
            var obj = $(dsevent._listener[i]);
            if(obj.length > 0) {
                try {
                    obj.trigger(eventName, params);
                } catch (e) {
                    console.dir(e);
                }
                i++;
            } else {
                dsevent._listener.splice(i,1);
            }
        }
    },

    bind: function(filter, eventName, method) {
        var obj = $(filter);
        if(dsevent._contains(filter) && obj.length > 0){
            obj.bind(eventName, method);
            return;
        }
        if(obj.length > 0) {
            dsevent._listener.push(filter);
            obj.bind(eventName, method);
        }
    },
    evt:{
        customerRefreshIsRead:'customerRefreshIsRead',
        customerRefresh:'customerRefresh',
        customerAdd:'customerAdd',
        customerAddCancel:'customerAddCancel',
        customerUpdate:'customerUpdate',
        customerUpdateStatus:'customerUpdateStatus',
        customerUpdateOwner:'customerUpdateOwner',
        customerNew:'customerNew',
        customerBatchDel:"customerBatchDel",
        customerDelete:"customerDelete",
        action:'action',

        callItemAdd:'callItemAdd',
        searchCustomerError:'searchCustomerError',
        callAddCustomer:'callAddCustomer',

        taskNew: 'taskNew',
        taskComplete: 'taskComplete',
        taskCompleteCancel: 'taskCompleteCancel',
        taskAssignedUser: 'taskAssignedUser',

        importCustomer:'importCustomer',
        callRefreshCustomer:'callRefreshCustomer',
        callItemRinged: 'callItemRinged',
        customerAddCancelPop: 'customerAddCancelPop',
        importQuestion:'importQuestion',


        channelRefresh:'channelRefresh',

        refreshCustomerName: "refreshCustomerName",
        refreshWebchatToDoList: "refreshWebchatToDoList"
    }

}
