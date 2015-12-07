(function ()
{
    angular.module('Aho').factory('Add', function ($http, $q, Editor)
    {
        var Add = {};        
        var meshCount = 0;
        var cameraCount = 0;
        var lightCount = 0;
        
        Add.addBox = function() {
            var width = 100;
            var height = 100;
            var depth = 100;

            var widthSegments = 1;
            var heightSegments = 1;
            var depthSegments = 1;

            var geometry = new THREE.BoxGeometry( width, height, depth, widthSegments, heightSegments, depthSegments );
            var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial() );
            mesh.name = 'Box ' + ( ++ meshCount );

            Editor.addObject( mesh );
            Editor.select( mesh );    
        }


        Add.addCamera = function() {
            var camera = new THREE.PerspectiveCamera( 50, 1, 1, 2000 );
            camera.name = 'Máy quay ' + ( ++ cameraCount );
            // camera.position.set(500, 250, 500);
            camera.position.copy(Editor.camera.position);
            // camera.lookAt(Editor.grid);
            camera.lookAt(new THREE.Vector3());
            // Editor.camObjSelected = camera;
            Editor.addObject( camera );
            Editor.select( camera );
            Editor.signals.cameraSelected.dispatch(camera);       
        }


        Add.addAmbientLight = function() {
            var color = 0x222222;
            var light = new THREE.AmbientLight( color );
            light.name = 'Nguồn sáng lan tỏa ' + ( ++ lightCount );
            Editor.addObject( light );
            Editor.select( light );
        }

        Add.addDirectionalLight = function() {
            var color = 0xffffff;
            var intensity = 1;

            var light = new THREE.DirectionalLight( color, intensity );
            light.name = 'Nguồn sáng trực tiếp ' + ( ++ lightCount );
            light.target.name = 'DirectionalLight ' + ( lightCount ) + ' Target';

            light.position.set( 0.5, 1, 0.75 ).multiplyScalar( 200 );

            Editor.addObject( light );
            Editor.select( light );
        }

        return Add;
    }
    );

}
)();
