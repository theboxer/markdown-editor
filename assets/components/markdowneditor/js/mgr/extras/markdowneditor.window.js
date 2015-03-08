MarkdownEditor.window.Cropper = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        modal: false
        ,layout: 'auto'
        ,closeAction: 'hide'
        ,shadow: true
        ,resizable: true
        ,collapsible: true
        ,maximizable: false
        ,autoHeight: false
        ,autoScroll: true
        ,allowDrop: true
        ,width: 800
        ,title: 'Crop the image'
        ,cls: 'modx-window'
        ,html: '<div class="image-upload-wrapper"><img src="' + URL.createObjectURL(config.file) + '"></div>'
        ,tbar: [{
            text: '<i class="icon icon-arrows"></i> Move'
            ,scope: this
            ,param: 'move'
            ,action: 'setDragMode'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-crop"></i> Crop'
            ,scope: this
            ,param: 'crop'
            ,action: 'setDragMode'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-search-plus"></i> Zoom In'
            ,scope: this
            ,param: 0.1
            ,action: 'zoom'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-search-minus"></i> Zoom Out'
            ,scope: this
            ,param: -0.1
            ,action: 'zoom'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-rotate-left"></i> Rotate left'
            ,scope: this
            ,param: -90
            ,action: 'rotate'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-rotate-right"></i> Rotate right'
            ,scope: this
            ,param: 90
            ,action: 'rotate'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-remove"></i> Clear cropper'
            ,scope: this
            ,param: null
            ,action: 'clear'
            ,handler: this.callCropperAction
        }]
        ,buttons: [{
            text: _('cancel')
            ,scope: this
            ,handler: this.close
        },{
            text: 'Upload'
            ,cls: 'primary-button'
            ,scope: this
            ,crop: 0
            ,handler: this.upload
        },{
            text: 'Crop & Upload'
            ,cls: 'primary-button'
            ,scope: this
            ,crop: 1
            ,handler: this.upload
        }]
        ,listeners: {
            'show': {
                fn: function() {
                    $('.image-upload-wrapper > img').cropper({
                        //aspectRatio: 1,
                        crop: function (data) {
                            this.imageData = [
                                '{"x":' + data.x,
                                '"y":' + data.y,
                                '"height":' + data.height,
                                '"width":' + data.width,
                                '"rotate":' + data.rotate + '}'
                            ].join();
                        }.bind(this)
                    });
                },
                scope: this
            }
        }
    });
    MarkdownEditor.window.Cropper.superclass.constructor.call(this,config);
    this.config = config;

};
Ext.extend(MarkdownEditor.window.Cropper, Ext.Window,{
    imageData: ''
    ,upload: function(button) {

        var sb = Ext.get('status-bar');
        var uploader = Ext.DomHelper.insertFirst(sb,{
            tag: 'div',
            id: 'upload_progress',
            html: '<div class="progress"></div><i class="icon icon-spinner icon-spin"></i> Uploading image: ' + this.config.file.name
        });

        var formData = new FormData();
        formData.append('file', this.config.file);
        formData.append('action', 'mgr/editor/imageupload');
        formData.append('imageData', this.imageData);
        formData.append('name', this.config.file.name);
        formData.append('crop', button.crop);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', MarkdownEditor_config.connectorUrl);
        xhr.setRequestHeader('Powered-By', 'MODx');
        xhr.setRequestHeader('modAuth', Ext.Ajax.defaultHeaders.modAuth);

        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                var complete = (event.loaded / event.total * 100 | 0);
                sb.child('.progress').setWidth(complete + '%');
            }
        };

        xhr.onload = function () {
            if (xhr.status === 200) {
                var res = JSON.parse(xhr.responseText);
                if (res.success == true) {
                    uploader.remove();
                    this.config.md.editor.insert('![' + res.name + '](' + res.path + ' "' + res.name + '")');
                }
            }
        }.bind(this);

        xhr.send(formData);

        $('.image-upload-wrapper > img').cropper("destroy");
        this.close();
    }

    ,callCropperAction: function(btn) {
        $('.image-upload-wrapper > img').cropper(btn.action, btn.param);
    }
});
Ext.reg('markdowneditor-window-cropper',MarkdownEditor.window.Cropper);
