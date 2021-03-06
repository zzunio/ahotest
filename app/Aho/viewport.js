(function ()
{
    angular.module('Aho').factory('Viewport', function ($http, $q, Editor)
    {
        var Viewport = {};
        var signals = Editor.signals;
        var camera = Editor.camera;
        var camera2 = null;
        var scene = Editor.scene;
        var sceneHelpers = Editor.sceneHelpers;
        var renderer = null;
        var renderer2 = null;

        var onDownPosition = new THREE.Vector2();
        var onUpPosition = new THREE.Vector2();
        var onDoubleClickPosition = new THREE.Vector2();

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();

        var mixers = [];
        var clock = new THREE.Clock();       
        // sceneHelpers = Editor.sceneHelpers;
        // var container = angular.element('#main-container');
        var container = document.getElementById('my-canvas');
        var clearColor = 0x474747;

        Viewport.vh = 0; // canvas height
        Viewport.vw = 0; // canvas width

        Viewport.objects = [];
        Viewport.transformControls = new THREE.TransformControls(camera, container);
        // Viewport.orbitControls = new THREE.OrbitControls(camera, container);
        Viewport.controls = new THREE.EditorControls(camera, container.dom);
        Viewport.controls.addEventListener('change', function ()
        {
            Viewport.transformControls.update();
            // signals.cameraChanged.dispatch(camera);
        }
        );

        sceneHelpers.add(Viewport.transformControls);
        // sceneHelpers.add( Viewport.orbitControls );


        var selectionBox = new THREE.BoxHelper();
        selectionBox.material.depthTest = false;
        selectionBox.material.transparent = true;
        selectionBox.visible = false;
        sceneHelpers.add(selectionBox);

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
                TWEEN.update();
            }
        };

        Viewport.animate = function ()
        {
            requestAnimationFrame(Viewport.animate);
            Viewport.runSlide();
            var delta = clock.getDelta();

            for ( var i = 0; i < mixers.length; i ++ ) {
                mixers[ i ].update( delta );
            }                        
            Viewport.render();
            Viewport.render2();

        };

        Viewport.render2 = function () { 
            // render preview camera
            renderer2.clear();
            renderer2.render(scene,camera2);
            renderer2.render(sceneHelpers, camera2);
        }

        Viewport.render = function ()
        {

            sceneHelpers.updateMatrixWorld();
            scene.updateMatrixWorld();
            Viewport.transformControls.update();
            // Viewport.orbitControls.update();
            renderer.clear();
            renderer.render(scene, camera);
            renderer.render(sceneHelpers, camera);
        }

        Viewport.updateMaterials = function ()
        {
            Editor.scene.traverse(function (node)
            {
                if (node.material)
                {
                    node.material.needsUpdate = true;
                    if (node.material instanceof THREE.MeshFaceMaterial)
                    {
                        for (var i = 0; i < node.material.materials.length; i++)
                        {
                            node.material.materials[i].needsUpdate = true;
                        }
                    }
                }
            }
            );
        }

        Viewport.initCamPreview = function() {
            ww = $('#cam-preview').width();
            hh = $('#cam-preview').height(); 
            camera2 = new THREE.PerspectiveCamera(70, ww / hh, 1, 100000);
            camera2.position.copy( camera.position );
            camera2.rotation.copy( camera.rotation );
            camera2.near = camera.near;
            camera2.far = camera.far;              
            renderer2 = new THREE.WebGLRenderer();
            renderer2.autoClear = false;
            // renderer2.autoUpdateScene = true;
            renderer2.setClearColor(0x9C9C9C);
            renderer2.setPixelRatio(window.devicePixelRatio);
            camera2.aspect = ww / hh;
            camera2.updateProjectionMatrix();
            renderer2.setSize(ww, hh);            
            var cam_preview_dom = document.getElementById('cam-preview');
            console.log(cam_preview_dom);
            cam_preview_dom.appendChild(renderer2.domElement);
            Viewport.render2();
            // Viewport.render();
        }

        function getIntersects(point, objects)
        {

            mouse.set((point.x * 2) - 1,  - (point.y * 2) + 1);

            raycaster.setFromCamera(mouse, camera);

            return raycaster.intersectObjects(objects);

        };

        function getMousePosition(dom, x, y)
        {

            var rect = dom.getBoundingClientRect();
            return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];

        };

        function handleClick()
        {
            if (onDownPosition.distanceTo(onUpPosition) == 0)
            {
                var intersects = getIntersects(onUpPosition, Viewport.objects);
                if (intersects.length > 0)
                {
                    var object = intersects[0].object;
                    if (object.userData.object !== undefined)
                    {
                        // helper
                        Editor.select(object.userData.object);
                    }
                    else
                    {
                        Editor.select(object);
                    }
                }
                else
                {
                    Editor.select(null);
                }
                Viewport.render();
            }

        };

        function onMouseDown(event)
        {
            if (Editor.notClick) return;
            event.preventDefault();
            var array = getMousePosition(container, event.clientX, event.clientY);
            onDownPosition.fromArray(array);
            document.addEventListener('mouseup', onMouseUp, false);
            document.addEventListener( 'mousemove', onMouseMove, false );
        };

        function onMouseMove (event) {
            // if (Editor.camObjSelected!=null){
            //     if (Editor.selected.uuid==Editor.camObjSelected.uuid) {
            //         signals.camObjMove.dispatch();
            //     }      
            // }            
        }

        function onMouseUp(event)
        {

            var array = getMousePosition(container, event.clientX, event.clientY);
            onUpPosition.fromArray(array);
            handleClick();
            document.removeEventListener('mouseup', onMouseUp, false);
            document.removeEventListener( 'mousemove', onMouseMove, false );

        };

        function onDoubleClick( event ) {

            var array = getMousePosition( container, event.clientX, event.clientY );
            onDoubleClickPosition.fromArray( array );
            var intersects = getIntersects( onDoubleClickPosition, Viewport.objects );
            if ( intersects.length > 0 ) {
                var intersect = intersects[ 0 ];
                signals.objectFocused.dispatch( intersect.object );
            }
        };

        container.addEventListener( 'mousedown', onMouseDown, false );
        container.addEventListener( 'dblclick', onDoubleClick, false );        
                

        // TransformControls
        Viewport.transformControls.addEventListener('change', function ()
        {            
            // if (Editor.notClick) return;
            var object = Viewport.transformControls.object;
            if (object !== undefined)
            {
                selectionBox.update(object);
                if (Editor.helpers[object.uuid] !== undefined)
                {
                    Editor.helpers[object.uuid].update();
                    signals.camObjMove.dispatch();
                    if (Editor.virtualCam!=null){
                       if (Editor.selected.uuid == Editor.virtualCam.uuid) {
                            signals.vcamMove.dispatch();
                        }
                    }
                }
            }
            Viewport.render();
        }
        );
        Viewport.transformControls.addEventListener('mouseDown', function ()
        {

            var object = Viewport.transformControls.object;
            matrix.copy(object.matrix);
            Viewport.controls.enabled = false;

        }
        );
        Viewport.transformControls.addEventListener('mouseUp', function ()
        {
            var object = Viewport.transformControls.object;
            if (matrix.equals(object.matrix) === false)
            {
                (
                    function (matrix1, matrix2)
                {
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
                    signals.objectChanged.dispatch(object);
                }
                )(matrix.clone(), object.matrix.clone());

            }
            // matrix.clone();
            // object.matrix.clone();
            signals.objectChanged.dispatch(object);
            Viewport.controls.enabled = true;

        }
        );

        Viewport.buildGLTF = function (sceneInfo)
        {
            if (sceneInfo.addLights)
            {

                var ambient = new THREE.AmbientLight(0x888888);
                scene.add(ambient);

                var directionalLight = new THREE.DirectionalLight(0xdddddd);
                directionalLight.position.set(0, -1, 1).normalize();                
                Editor.addObject(directionalLight);

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
                Editor.addObject(spot1);
            }
            // if (sceneInfo.shadows)
            // {
            //     renderer.shadowMap.enabled = true;
            //     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // }

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
                
                Editor.addObject(object);
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

        Viewport.testAnimation1 = function() {
                var loader = new THREE.JSONLoader();
                loader.load( "assets/animated/flamingo.js", function( geometry ) {

                    var material = new THREE.MeshPhongMaterial( {
                        color: 0xffffff,
                        morphTargets: true,
                        vertexColors: THREE.FaceColors,
                        shading: THREE.FlatShading
                    } );
                    var mesh = new THREE.Mesh( geometry, material );

                    mesh.position.x = - 150;
                    mesh.position.y = 150;
                    mesh.scale.set( 1.5, 1.5, 1.5 );

                    // scene.add( mesh );
                    Editor.addObject( mesh );

                    var mixer = new THREE.AnimationMixer( mesh );
                    mixer.addAction( new THREE.AnimationAction( geometry.animations[ 0 ] ).warpToDuration( 1 ) );

                    mixers.push( mixer );

                } );      
        }

        Viewport.testDAE = function() {
                var loader = new  THREE.ColladaLoader();
                loader.options.convertUpAxis = true;    
                loader.load('assets/33.dae', function (collada){
                    dae = collada.scene;
                    dae.scale.x = dae.scale.y = dae.scale.z = 3;
                    dae.traverse(function (child){
                        if (child.colladaId == "Suzanne"){
                            child.traverse(function(e){
                                e.castShadow = true;
                                e.receiveShadow = true;
                                if (e.material instanceof THREE.MeshPhongMaterial){
                                    e.material.needsUpdate = true;
                                }                   
                            });
                        }
                        else if (child.colladaId == "Plane"){
                            child.traverse(function(e){
                                e.castShadow = true;
                                e.receiveShadow = true;
                            });
                        }   
                    });
                    dae.updateMatrix();         
                    Editor.scene.add(dae);
                    // Editor.addObject( mesh );
                });             
        }

        signals.rendererChanged.add(function (newRenderer)
        {
            if (renderer !== null)
            {
                container.removeChild(renderer.domElement);
            }
            renderer = newRenderer;
            renderer.autoClear = false;
            renderer.autoUpdateScene = false;
            renderer.setClearColor(clearColor);
            renderer.setPixelRatio(window.devicePixelRatio);
            camera.aspect = (Viewport.vw) / (Viewport.vh);
            camera.updateProjectionMatrix();
            renderer.setSize(Viewport.vw, Viewport.vh);            
            container.appendChild(renderer.domElement);
            Viewport.render();
        }
        );

        signals.sceneGraphChanged.add(function ()
        {
            Viewport.render();
            Viewport.render2();
        }
        );

        signals.cameraChanged.add(function ()
        {
            Viewport.render();
        }
        );        

        signals.cameraSelected.add(function (cam)
        {
            Editor.camObjSelected = cam;
            camera2.position.copy( cam.position );
            camera2.rotation.copy( cam.rotation );
            // camera2.aspect = cam.aspect;
            camera2.near = cam.near;
            camera2.far = cam.far;  
            camera2.updateProjectionMatrix();
            Viewport.transformControls.update();
            Viewport.render2();
        }
        );

        signals.camObjMove.add(function ()
        {   
            if (Editor.camObjSelected!=null) {
                camera2.position.copy( Editor.camObjSelected.position );
                camera2.rotation.copy( Editor.camObjSelected.rotation );
                // camera2.aspect = cam.aspect;
                camera2.near = Editor.camObjSelected.near;
                camera2.far = Editor.camObjSelected.far;              
                camera2.updateProjectionMatrix();
                Viewport.render2();                
            }
        }
        );        

        signals.helperAdded.add(function (object)
        {
            Viewport.objects.push(object.getObjectByName('picker'));
        }
        );

        signals.helperRemoved.add(function (object)
        {
            Viewport.objects.splice(Viewport.objects.indexOf(object.getObjectByName('picker')), 1);
        }
        );

        signals.materialChanged.add( function ( material ) {
            Viewport.render();
        } );

        signals.showGridChanged.add(function (showGrid)
        {
            Editor.grid.visible = showGrid;
            Viewport.render();
        }
        );

        signals.windowResize.add( function () {
            camera.aspect = container.offsetWidth / container.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( container.offsetWidth, container.offsetHeight );
            Viewport.render();
        } );        


        // OBJECT SIGNAL
        signals.objectAdded.add(function (object)
        {
            var materialsNeedUpdate = false;
            object.traverse(function (child)
            {
                if (child instanceof THREE.Light)
                    materialsNeedUpdate = true;
                Viewport.objects.push(child);
            }
            );
            if (materialsNeedUpdate === true)
                Viewport.updateMaterials();
        }
        );

        signals.objectSelected.add(function (object)
        {            
            if (Editor.notClick) return;

            selectionBox.visible = false;
            Viewport.transformControls.detach();
            if (object !== null)
            {
                if (object.geometry !== undefined &&
                    object instanceof THREE.Sprite === false)
                {
                    selectionBox.update(object);
                    selectionBox.visible = true;
                }

                Viewport.transformControls.attach(object);
            }
            Viewport.render();
        }
        );

        signals.objectFocused.add( function ( object ) {
            Viewport.controls.focus( object );
        } );


        signals.objectChanged.add(function (object)
        {
            selectionBox.update(object);
            Viewport.transformControls.update();
            if (object instanceof THREE.PerspectiveCamera)
            {
                object.updateProjectionMatrix();
                if (Editor.camObjSelected!=null) {
                 if (object.uuid == Editor.camObjSelected.uuid) {
                    signals.cameraSelected.dispatch(Editor.camObjSelected);
                }                   
                }
            }
            if (Editor.helpers[object.id] !== undefined)
            {
                Editor.helpers[object.id].update();
            }
            Viewport.render(); 
            
        }
        );

        signals.objectRemoved.add(function (object)
        {
            var materialsNeedUpdate = false;
            if (object instanceof THREE.PerspectiveCamera) {
                    delete Editor.cameras[object.uuid];
                }                

            object.traverse(function (child)
            {
                if (child instanceof THREE.Light)
                    materialsNeedUpdate = true;
                Viewport.objects.splice(Viewport.objects.indexOf(child), 1);
            }
            );
            if (materialsNeedUpdate === true)
                updateMaterials();
        }
        );

        signals.editorCleared.add( function () {
            Viewport.controls.center.set( 0, 0, 0 );
            Viewport.render();
        } );        

        signals.transformModeChanged.add( function ( mode ) {
            Viewport.transformControls.setMode( mode );
        } );

        signals.geometryChanged.add( function ( geometry ) {
            selectionBox.update( Editor.selected );
            Viewport.render();
        } );                

        return Viewport;
    }
    );

}
)();
