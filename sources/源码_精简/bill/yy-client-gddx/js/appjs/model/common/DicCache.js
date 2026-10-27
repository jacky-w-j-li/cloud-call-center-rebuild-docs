Ext.define('App.model.common.DicCache', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'codeType',
            type: 'string'
        },
        {
            name: 'codeName',
            type: 'String'
        },
        {
            name: 'codeValue',
            type: 'string'
        },
        {
            name: 'codeOrder',
            type: 'string'
        },
        {
            name: 'identity',
            type: 'string'
        }
    ]

});
