(function ()
{
    angular.module('Aho').factory('Editor', function ($http, $q)
    {
        var Editor = {};

        var SIGNALS = signals;

        Editor.signals =
        {

            editScript : new SIGNALS.Signal(),

            // player

            startPlayer : new SIGNALS.Signal(),
            stopPlayer : new SIGNALS.Signal(),

            // actions

            showModal : new SIGNALS.Signal(),

            // notifications

            editorCleared : new SIGNALS.Signal(),

            savingStarted : new SIGNALS.Signal(),
            savingFinished : new SIGNALS.Signal(),

            themeChanged : new SIGNALS.Signal(),

            transformModeChanged : new SIGNALS.Signal(),
            snapChanged : new SIGNALS.Signal(),
            spaceChanged : new SIGNALS.Signal(),
            rendererChanged : new SIGNALS.Signal(),

            sceneGraphChanged : new SIGNALS.Signal(),

            cameraChanged : new SIGNALS.Signal(),
            cameraSelected : new SIGNALS.Signal(),
            cameraAdded : new SIGNALS.Signal(),
            camObjMove : new SIGNALS.Signal(),
            vcamMove : new SIGNALS.Signal(), // di chuyen camera ao

            geometryChanged : new SIGNALS.Signal(),

            objectSelected : new SIGNALS.Signal(),
            objectFocused : new SIGNALS.Signal(),

            objectAdded : new SIGNALS.Signal(),
            objectChanged : new SIGNALS.Signal(),
            objectRemoved : new SIGNALS.Signal(),

            helperAdded : new SIGNALS.Signal(),
            helperRemoved : new SIGNALS.Signal(),

            materialChanged : new SIGNALS.Signal(),

            scriptAdded : new SIGNALS.Signal(),
            scriptChanged : new SIGNALS.Signal(),
            scriptRemoved : new SIGNALS.Signal(),

            fogTypeChanged : new SIGNALS.Signal(),
            fogColorChanged : new SIGNALS.Signal(),
            fogParametersChanged : new SIGNALS.Signal(),
            windowResize : new SIGNALS.Signal(),

            showGridChanged : new SIGNALS.Signal(),
            slideAdded : new SIGNALS.Signal()

        };

        Editor.playStatus = 1;
        Editor.camera = new THREE.PerspectiveCamera(70, 1, 1, 100000);
        Editor.camera.position.set(500, 250, 500);
        Editor.camera.lookAt(new THREE.Vector3());
        Editor.camera.name = 'Camera';

        Editor.scene = new THREE.Scene();
        Editor.scene.name = 'Scene';

        Editor.sceneHelpers = new THREE.Scene();

        Editor.object = {};
        Editor.geometries = {};
        Editor.materials = {};
        Editor.textures = {};
        Editor.scripts = {};


        Editor.selected = null;
        Editor.helpers = {};
        Editor.zhelpers = {}; // cac doi tuong danh dau vi tri de nhan biet khi hide helper
        Editor.grid = new THREE.GridHelper(500, 25);

        Editor.camObjSelected = null;
        Editor.virtualCam = null;
        // Editor.cameras = {};

        // Editor.renderer = new THREE.WebGLRenderer();

        Editor.addObject = function (object)
        {

            var scope = this;

            object.traverse(function (child)
            {

                if (child.geometry !== undefined)
                    scope.addGeometry(child.geometry);
                if (child.material !== undefined)
                    scope.addMaterial(child.material);
                Editor.addHelper(child);
            }
            );

            Editor.scene.add(object);

            this.signals.objectAdded.dispatch(object);
            this.signals.sceneGraphChanged.dispatch();

        };

        Editor.removeObject = function ( object ) {
            if ( object.parent === null ) return; // avoid deleting the camera or scene
            var scope = this;
            object.traverse( function ( child ) {
                scope.removeHelper( child );
            } );
            object.parent.remove( object );
            this.signals.objectRemoved.dispatch( object );
            this.signals.sceneGraphChanged.dispatch();

        },        

        Editor.addGeometry = function (geometry)
        {
            this.geometries[geometry.uuid] = geometry;
        },

        Editor.addMaterial = function (material)
        {
            this.materials[material.uuid] = material;
        };    

        Editor.addHelper = function () {
            var geometry = new THREE.SphereBufferGeometry( 20, 4, 2 );
            var material = new THREE.MeshBasicMaterial( { color: 0xff0000, visible: false } );
            return function ( object ) {

                var helper;
                var zhelper;
                if ( object instanceof THREE.Camera ) {
                    helper = new THREE.CameraHelper( object,10 );  
                    var geometry2 = new THREE.BoxGeometry( 20, 20, 20 );
                    var material2 = new THREE.MeshBasicMaterial( { color: 0x00ff00, visible: true } );                    
                    zhelper = new THREE.Mesh( geometry2, material2 );
                    zhelper.position.copy(object.position); 

                } else if ( object instanceof THREE.PointLight ) {

                    helper = new THREE.PointLightHelper( object, 10 );

                } else if ( object instanceof THREE.DirectionalLight ) {

                    helper = new THREE.DirectionalLightHelper( object, 20 );

                } else if ( object instanceof THREE.SpotLight ) {

                    helper = new THREE.SpotLightHelper( object, 10 );

                } else if ( object instanceof THREE.HemisphereLight ) {

                    helper = new THREE.HemisphereLightHelper( object, 10 );

                } else if ( object instanceof THREE.SkinnedMesh ) {

                    helper = new THREE.SkeletonHelper( object );

                } else {

                    // no helper for this object type
                    return;

                }
                var picker = new THREE.Mesh( geometry, material );
                picker.name = 'picker';
                picker.userData.object = object;
                helper.add( picker );

                Editor.sceneHelpers.add( helper );
                Editor.sceneHelpers.add( zhelper );
                Editor.helpers[ object.uuid ] = helper;
                Editor.zhelpers[object.uuid] = zhelper;
                Editor.signals.helperAdded.dispatch( helper );


            };

        }();   

        Editor.removeHelper = function ( object ) {
            if ( Editor.helpers[ object.uuid ] !== undefined ) {
                var helper = Editor.helpers[ object.uuid ];
                helper.parent.remove( helper );
                delete Editor.helpers[ object.uuid ];
                Editor.signals.helperRemoved.dispatch( helper );
            }
        }

        Editor.loadProject = function ()  {},

        Editor.exportProject = function ()
        {
            // return
            // {
            //     camera : this.camera.toJSON(),
            //     scene : this.scene.toJSON()
            // };
        },

        Editor.removeObject = function (object)
        {

            if (object.parent === null)
                return; // avoid deleting the camera or scene

            var scope = this;

            // object.traverse(function (child)
            // {
            //     scope.removeHelper(child);
            // }
            // );
            object.parent.remove(object);

            // this.signals.objectRemoved.dispatch(object);
            // this.signals.sceneGraphChanged.dispatch();

        },


        Editor.select = function (object)
        {


            if (Editor.selected === object) {
                return;
            } else {
                if (Editor.selected instanceof THREE.Camera) {
                    Editor.helpers[Editor.selected.uuid].visible = false;
                    Editor.zhelpers[Editor.selected.uuid].position.copy(Editor.selected.position);
                    Editor.zhelpers[Editor.selected.uuid].visible = true;
                }
            }

            var uuid = null;

            if (object !== null)
            {
                uuid = object.uuid;
            }
            Editor.selected = object;
            if (Editor.selected instanceof THREE.Camera) {
                Editor.helpers[Editor.selected.uuid].visible = true;
                Editor.zhelpers[Editor.selected.uuid].visible = false;
            }

            Editor.signals.objectSelected.dispatch(object);
            // this.config.setKey('selected', uuid);
        };

        Editor.deselect = function () {
            Editor.select( null );
        };
        return Editor;
    }
    );

}
)();
