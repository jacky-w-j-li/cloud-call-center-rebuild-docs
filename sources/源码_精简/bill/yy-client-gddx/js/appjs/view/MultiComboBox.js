//简单的下拉多选框
Ext.define('App.view.MultiComboBox', {
    extend: 'Ext.form.ComboBox',
    alias: 'widget.multicombobox',
    xtype: 'multicombobox',
    initComponent: function(){
        this.multiSelect = true;
        this.listConfig = {
            itemTpl : Ext.create('Ext.XTemplate',
                '<input type=checkbox>{codeName}'),//这边value的要改成下拉框显示所对应的displayField字段，例如：values。name

            onItemSelect: function(record) {
                var node = this.getNode(record);
                if (node) {
                    Ext.fly(node).addCls(this.selectedItemCls);

                    var checkboxs = node.getElementsByTagName("input");
                    if(checkboxs!=null)
                    {
                        var checkbox = checkboxs[0];
                        checkbox.checked = true;
                    }
                }
            },
            listeners:{
                itemclick:function(view, record, item, index, e, eOpts ){
                    var isSelected = view.isSelected(item);
                    var checkboxs = item.getElementsByTagName("input");
                    if(checkboxs!=null)
                    {
                        var checkbox = checkboxs[0];
                        if(!isSelected)
                        {
                            checkbox.checked = true;
                        }else{
                            checkbox.checked = false;
                        }
                    }
                }
            }
        }
        this.callParent();
    },
    reset: function() {
      var arr=  Ext.select("input:checked").elements;
        for(var i=0;i<arr.length;i++){
            arr[i].checked=false;
        }
    }
});