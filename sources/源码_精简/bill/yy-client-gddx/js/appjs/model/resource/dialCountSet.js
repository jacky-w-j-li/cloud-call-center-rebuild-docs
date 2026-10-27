Ext.define('App.model.resource.dialCountSet', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name:'_NIndex',
            type:'string'
        },
        {
            name: 'name',
            type: 'string'
        },
        {
            name: "companyName",
            type: 'string'
        },
        {
            name:'accountCount',
            type:'string'
        },
        {
            name:'accountResidualCount',
            type:'string'
        }
    ]

});