Ext.define('App.controller.resource.zj.location', {
    extend: 'Ext.app.Controller',
    initFlag: false,
    refs: [
        {
            ref: 'queryGrid',
            selector: 'locationQueryPanel > grid[class="query"]'
        },
        {
            ref: 'buildingQueryGrid',
            selector: 'setLocationWin >  grid[class="query"]'
        },
        {
            ref: 'buildingPanel',
            selector: 'setLocationWin'
        }
    ],
    init: function () {
        this.control({
            'locationQueryPanel >  button#add_location_tool': {
                click: this.showAddLoaction
            },
            'addLocationWindow >  button#create_new_location_button': {
                click: this.addLocation
            },
            'locationQueryPanel >  button#update_location_tool': {
                click: this.showUpdateLocation
            },
            'updateLocationWindow >  button#update_location_button': {
                click: this.updateLocation
            },
            'locationQueryPanel >  button#delete_location_tool': {
                click: this.deleteLocation
            },
            'locationQueryPanel >  button#set_location_tool': {
                click: this.showSetLocation
            },
            'locationQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showUpdateLocation
            },
            'setLocationWin >  button#add_building_tool': {
                click: this.showAddBuilding
            },
            'addBuildingWindow >  button#create_new_building_button': {
                click: this.addBuilding
            },
            'setLocationWin >  button#update_building_tool': {
                click: this.showUpdateBuilding
            },
            'updateBuildingWindow >  button#update_building_button' :{
                click: this.updateBuilding
            },
            'setLocationWin >  button#delete_building_tool' :{
                click : this.deleteBuilding
            },
            'setLocationWin >  grid[class="query"]': {
                selectionchange: this.buildingEnableDockItems,
                itemdblclick: this.showUpdateBuilding
            }

        });
        this.initFlag = true;
    },
    deleteBuilding : function(obj){
        var selection = this.getBuildingQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var name = selection.get("name");
        var self = this;
        Ext.Msg.confirm("警告", "确认删除写字楼[" + name + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request('bill.resource.zj.deleteBuilding', {_id: id}, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除写字楼信息成功！");
                        self.getBuildingQueryGrid().store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }
        });
    },
    updateBuilding : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.zj.updateBuilding', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新写字楼信息成功！");
                    win.close();
                    self.getBuildingQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showUpdateBuilding: function (obj) {
        var selection = this.getBuildingQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.zj.getBuildingInfo', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.zj.location.updateBuilding', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("写字楼修改");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    buildingEnableDockItems: function (selModel, selections) {
        var grid = this.getBuildingQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    addBuilding: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.zj.addBuilding', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加写字楼成功！");
                    win.close();
                    self.getBuildingQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showAddBuilding: function (obj) {
        var locationId = this.getBuildingPanel().locationId;
        var win = Ext.create('App.view.resource.zj.location.addBuilding', {
            animateTarget: obj,
            locationId: locationId
        });
        win.show();
    },
    showSetLocation: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var win = Ext.create('App.view.resource.zj.location.setLocation', {
            locationId: id,
            animateTarget: obj
        });
        win.setTitle(selection.get('name') + '---->' + '写字楼管理');
        win.show();
    },
    deleteLocation: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var name = selection.get("name");
        var self = this;
        Ext.Msg.confirm("警告", "确认删除区域[" + name + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request('bill.resource.zj.deleteLocation', {_id: id}, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除区域信息成功！");
                        self.getQueryGrid().store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }
        });
    },
    updateLocation: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.zj.updateLocation', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新区域信息成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showUpdateLocation: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.zj.getLocationInfo', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.zj.location.updateLocation', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("区域修改");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showAddLoaction: function (obj) {
        var win = Ext.create('App.view.resource.zj.location.addLocation', {
            animateTarget: obj
        });
        win.show();
    },
    addLocation: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.zj.addLocation', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加区域成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    }


})
