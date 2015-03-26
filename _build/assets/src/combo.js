markdownEditor.combo.CropperProfile = function(config) {
    var data = JSON.parse(MODx.config['markdowneditor.cropper.profiles'] || '[]');

    config = config || {};
    Ext.applyIf(config,{
        store: new Ext.data.JsonStore({
            data: data
            ,fields: ['name', 'width', 'height', 'ratio']
        })
        ,displayField: 'name'
        ,mode: 'local'
        ,valueField: 'name'
        ,editable: false
        ,value: data[0] ? data[0].name : ''
    });

    var showDescription = parseInt(MODx.config['markdowneditor.cropper.show_description'] || 0);
    if (showDescription) {
        config.tpl = new Ext.XTemplate('<tpl for="."><div class="x-combo-list-item"><span style="font-weight: bold">{name}</span>'
            ,'<br /><tpl if="width">W:{width} </tpl><tpl if="height">H:{height} </tpl><tpl if="ratio">R:{ratio}</tpl></div></tpl>');
    }

    markdownEditor.combo.CropperProfile.superclass.constructor.call(this,config);
};
Ext.extend(markdownEditor.combo.CropperProfile,MODx.combo.ComboBox);
Ext.reg('markdowneditor-combo-cropper-profile',markdownEditor.combo.CropperProfile);