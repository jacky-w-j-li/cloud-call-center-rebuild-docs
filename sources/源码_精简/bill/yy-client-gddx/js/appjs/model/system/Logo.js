Ext.define('App.model.system.Logo', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name:'fileName',
            type:'string'
        },
        {
            name: 'footer',
            type: 'string'
        },
        {
            name: "phone",
            type: 'string'
        },
        {
            name: 'email',
            type: 'string'
        }
    ]
});