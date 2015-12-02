(function ()
{
    angular.module('Aho').factory('Add', function ($http, $q, Editor)
    {
        var Add = {};        
        var meshCount = 0;
        var cameraCount = 0;
        
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
            var camera = new THREE.PerspectiveCamera( 50, 1, 1, 10000 );
            camera.name = 'PerspectiveCamera ' + ( ++ cameraCount );
            // camera.position.set(500, 250, 500);
            camera.position.copy(Editor.camera.position);
            // camera.lookAt(Editor.grid);
            camera.lookAt(new THREE.Vector3());
            Editor.addObject( camera );
            Editor.select( camera );
        }

        return Add;
    }
    );

}
)();
