(function ()
{
    angular.module('Aho').factory('Viewport', function ($http, $q, Editor)
    {
        var Viewport = {};
        var signals = Editor.signals;
        var camera = Editor.camera;
        var scene = Editor.scene;
        var sceneHelpers = Editor.sceneHelpers;
        var renderer = null;

        // sceneHelpers = Editor.sceneHelpers;
        // var container = angular.element('#main-container');
        var container = document.getElementById('main-container');
        
        Viewport.objects = [];
        Viewport.transformControls = new THREE.TransformControls( camera, container );
        // Viewport.orbitControls = new THREE.OrbitControls(camera, container);
        Viewport.controls = new THREE.EditorControls( camera, container.dom );
        Viewport.controls.addEventListener( 'change', function () {
            Viewport.transformControls.update();
            signals.cameraChanged.dispatch( camera );
        } );

        sceneHelpers.add( Viewport.transformControls );
        // sceneHelpers.add( Viewport.orbitControls );



        var selectionBox = new THREE.BoxHelper();
        selectionBox.material.depthTest = false;
        selectionBox.material.transparent = true;
        selectionBox.visible = false;
        sceneHelpers.add( selectionBox );      

        Viewport.mesh = null;  
        var texture = THREE.ImageUtils.loadTexture('textures/crate.gif');
        var geometry = new THREE.BoxGeometry(200, 200, 200);
        var material = new THREE.MeshBasicMaterial(
            {
                map : texture
            }
            );

        Viewport.mesh = new THREE.Mesh(geometry, material);
        // var ambientLight = new THREE.AmbientLight(Math.random() * 0x10);
        // scene.add(ambientLight);

        // var grid = new THREE.GridHelper(500, 25);
        Editor.grid.position.y = 0;
        sceneHelpers.add(Editor.grid);

        var matrix = new THREE.Matrix4();        

        Viewport.runSlide = function ()
        {
            if (Editor.playStatus == 2)
            {
                // Viewport.mesh.rotation.x += 0.005;
                // Viewport.mesh.rotation.y += 0.01;
                THREE.glTFAnimator.update();
            }
        };        

        Viewport.animate = function() {
            requestAnimationFrame( Viewport.animate );
            Viewport.runSlide();
            Viewport.render();
        };

        Viewport.render = function() {

            sceneHelpers.updateMatrixWorld();
            scene.updateMatrixWorld();
            Viewport.transformControls.update();
            // Viewport.orbitControls.update();
            renderer.clear();
            renderer.render( scene, camera );
            renderer.render( sceneHelpers, camera );
        }        

        Viewport.updateMaterials = function() {
            Editor.scene.traverse( function ( node ) {
                if ( node.material ) {
                    node.material.needsUpdate = true;
                    if ( node.material instanceof THREE.MeshFaceMaterial ) {
                        for ( var i = 0; i < node.material.materials.length; i ++ ) {
                            node.material.materials[ i ].needsUpdate = true;
                        }
                    }
                }
            } );
        }


        signals.rendererChanged.add( function ( newRenderer ) {

            if ( renderer !== null ) {
                container.removeChild( renderer.domElement );
            }

            renderer = newRenderer;
            renderer.autoClear = false;
            renderer.autoUpdateScene = false;
            renderer.setClearColor( 0xf0f0f0 );
            renderer.setPixelRatio( window.devicePixelRatio );
            camera.aspect = (container.offsetWidth)/(container.offsetHeight); 
            camera.updateProjectionMatrix();
            renderer.setSize( container.offsetWidth, container.offsetHeight);
            container.appendChild( renderer.domElement );

            Viewport.render();

        } );

        signals.sceneGraphChanged.add( function () {
            Viewport.render();
        } );

        signals.cameraChanged.add( function () {
            Viewport.render();
        } );

        signals.helperAdded.add( function ( object ) {
            Viewport.objects.push( object.getObjectByName( 'picker' ) );
        } );

        signals.helperRemoved.add( function ( object ) {
            Viewport.objects.splice( Viewport.objects.indexOf( object.getObjectByName( 'picker' ) ), 1 );
        } );

        signals.showGridChanged.add( function ( showGrid ) {
            Editor.grid.visible = showGrid;
            Viewport.render();
        } );        

        // OBJECT SIGNAL
        signals.objectAdded.add( function ( object ) {
            var materialsNeedUpdate = false;
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Light ) materialsNeedUpdate = true;
                Viewport.objects.push( child );
            } );
            if ( materialsNeedUpdate === true ) Viewport.updateMaterials();
        } );        

        signals.objectSelected.add( function ( object ) {
            selectionBox.visible = false;
            Viewport.transformControls.detach();
            if ( object !== null ) {
                if ( object.geometry !== undefined &&
                     object instanceof THREE.Sprite === false ) {
                    selectionBox.update( object );
                    selectionBox.visible = true;
                }

                Viewport.transformControls.attach( object );
            }
            Viewport.render();
        } );        

        signals.objectChanged.add( function ( object ) {
            selectionBox.update( object );
            Viewport.transformControls.update();
            if ( object instanceof THREE.PerspectiveCamera ) {
                object.updateProjectionMatrix();
            }
            if ( Editor.helpers[ object.id ] !== undefined ) {
                Editor.helpers[ object.id ].update();
            }
            Viewport.render();
        } );        

        signals.objectRemoved.add( function ( object ) {
            var materialsNeedUpdate = false;
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Light ) materialsNeedUpdate = true;
                Viewport.objects.splice( Viewport.objects.indexOf( child ), 1 );
            } );
            if ( materialsNeedUpdate === true ) updateMaterials();
        } );


        // TransformControls
        Viewport.transformControls.addEventListener( 'change', function () {
            var object = Viewport.transformControls.object;
            if ( object !== undefined ) {
                selectionBox.update( object );
                if ( Editor.helpers[ object.id ] !== undefined ) {
                    Editor.helpers[ object.id ].update();
                }
            }
            Viewport.render();
        } );
        Viewport.transformControls.addEventListener( 'mouseDown', function () {

            var object = Viewport.transformControls.object;
            matrix.copy( object.matrix );
            Viewport.controls.enabled = false;

        } );
        Viewport.transformControls.addEventListener( 'mouseUp', function () {
            var object = Viewport.transformControls.object;
            if ( matrix.equals( object.matrix ) === false ) {
                ( 
                    function ( matrix1, matrix2 ) {
                    // editor.history.add(
                    //     function () {
                    //         matrix1.decompose( object.position, object.quaternion, object.scale );
                    //         signals.objectChanged.dispatch( object );
                    //     },
                    //     function () {
                    //         matrix2.decompose( object.position, object.quaternion, object.scale );
                    //         signals.objectChanged.dispatch( object );
                    //     }
                    // );
                    signals.objectChanged.dispatch( object );
                } 
                )( matrix.clone(), object.matrix.clone() );

            }
            // matrix.clone();
            // object.matrix.clone();
            signals.objectChanged.dispatch( object );
            Viewport.controls.enabled = true;

        } );

        Viewport.buildGLTF = function (sceneInfo)
        {
            if (sceneInfo.addLights)
            {

                var ambient = new THREE.AmbientLight(0x888888);
                scene.add(ambient);

                var directionalLight = new THREE.DirectionalLight(0xdddddd);
                directionalLight.position.set(0, -1, 1).normalize();
                scene.add(directionalLight);

                spot1 = new THREE.SpotLight(0xffffff, 1);
                spot1.position.set(-100, 200, 100);
                spot1.target.position.set(0, 0, 0);

                if (sceneInfo.shadows)
                {

                    spot1.shadowCameraNear = 1;
                    spot1.shadowCameraFar = 1024;
                    spot1.castShadow = true;
                    spot1.shadowBias = 0.0001;
                    spot1.shadowMapWidth = 2048;
                    spot1.shadowMapHeight = 2048;
                }
                scene.add(spot1);
            }
            if (sceneInfo.shadows)
            {
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }

            loader = new THREE.glTFLoader;

            // var loadStartTime = Date.now();
            // var status = document.getElementById("status");
            // status.innerHTML = "Loading...";
            loader.load(sceneInfo.url, function (data)
            {

                gltf = data;

                var object = gltf.scene;

                // var loadEndTime = Date.now();

                // var loadTime = (loadEndTime - loadStartTime) / 1000;

                // status.innerHTML = "Load time: " + loadTime.toFixed(2) + " seconds.";

                // if (sceneInfo.cameraPos)
                //     camera.position.copy(sceneInfo.cameraPos);

                // if (sceneInfo.center)
                // {
                //     Viewport.orbitControls.center.copy(sceneInfo.center);
                // }

                if (sceneInfo.objectPosition)
                {
                    object.position.copy(sceneInfo.objectPosition);

                    if (spot1)
                    {
                        spot1.position.set(sceneInfo.objectPosition.x - 100, sceneInfo.objectPosition.y + 200, sceneInfo.objectPosition.z - 100);
                        spot1.target.position.copy(sceneInfo.objectPosition);
                    }
                }

                if (sceneInfo.objectRotation)
                    object.rotation.copy(sceneInfo.objectRotation);

                if (sceneInfo.objectScale)
                    object.scale.copy(sceneInfo.objectScale);

                cameraIndex = 0;
                cameras = [];
                cameraNames = [];

                // if (gltf.cameras && gltf.cameras.length)
                // {

                //     var i,
                //     len = gltf.cameras.length;

                //     for (i = 0; i < len; i++)
                //     {

                //         var addCamera = true;
                //         var cameraName = gltf.cameras[i].parent.name;

                //         if (sceneInfo.cameras && !(cameraName in sceneInfo.cameras))
                //         {
                //             addCamera = false;
                //         }

                //         if (addCamera)
                //         {
                //             cameraNames.push(cameraName);
                //             cameras.push(gltf.cameras[i]);
                //         }

                //     }

                //     // updateCamerasList();
                //     // switchCamera(1);
                // }
                // else
                // {

                //     // updateCamerasList();
                //     // switchCamera(0);

                // }

                if (gltf.animations && gltf.animations.length)
                {

                    var i,
                    len = gltf.animations.length;
                    for (i = 0; i < len; i++)
                    {
                        var animation = gltf.animations[i];
                        animation.loop = true;
                        // There's .3333 seconds junk at the tail of the Monster animation that
                        // keeps it from looping cleanly. Clip it at 3 seconds
                        if (sceneInfo.animationTime)
                            animation.duration = sceneInfo.animationTime;
                        animation.play();
                    }
                }

                scene.add(object);
                signals.sceneGraphChanged.dispatch();

                // function switchCamera(index) {

                //     cameraIndex = index;

                //     if (cameraIndex == 0) {
                //         camera = defaultCamera;
                //     }

                //     if (cameraIndex >= 1 && cameraIndex <= cameras.length) {
                //         camera = cameras[cameraIndex - 1];
                //     }

                //     var elt = document.getElementById('cameras_list');
                //     elt.selectedIndex = cameraIndex;

                // }

                // function updateCamerasList() {

                //     var elt = document.getElementById('cameras_list');

                //     while( elt.hasChildNodes() ){
                //         elt.removeChild(elt.lastChild);
                //     }

                //     option = document.createElement("option");
                //     option.text="[default]";
                //     elt.add(option);

                //     var i, len = cameraNames.length;

                //     for (i = 0; i < len; i++) {
                //         option = document.createElement("option");
                //         option.text=cameraNames[i];
                //         elt.add(option);
                //     }

                // }
                // onWindowResize();

            }
            );

        }


        return Viewport;
    }
    );

}
)();
