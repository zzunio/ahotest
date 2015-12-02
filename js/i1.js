var app = angular.module('StarterApp', ['ngMaterial']);

app.controller('AppCtrl', ['$scope', '$mdSidenav', '$mdDialog', function ($scope, $mdSidenav, $mdDialog)
        {
            $scope.orbitControls = null;
            $scope.playStatus = 1;
            $scope.project = null;
            $scope.sysCamera = null;

            $scope.slides = [
                {
                    id : 1,
                    name : 'Slide 1'
                }
            ];
            $scope.cameras = [
                {
                    id : 1,
                    name : 'Camera 1'
                }
            ];

            $scope.activeSlide = $scope.slides[0];

            $scope.playClick = function ()
            {
                $scope.playStatus = 3 - $scope.playStatus;
                if ($scope.playStatus == 1)
                {}

                else
                {}
            }

            $scope.ss1 = function ()
            {
                $scope.camera.zoom =2;
            }

            $scope.addSlide = function ()
            {
                var ll = this.slides.length;
                $scope.slides.push(
                {
                    id : ll + 1,
                    name : 'Slide' + (ll + 1)
                }
                );
            }

            $scope.removeSlide = function (i)
            {
                $scope.slides.remove(i);
            }

            $scope.addBlankProject = function ()
            {
                var defaultProject =
                {
                    slides : [
                        {
                            id : 1,
                            name_slide : 'Trình diễn 1'
                        }
                    ],
                    pname : "Dự án Me3D 1"
                };

                $scope.project = angular.copy(defaultProject);
            }

            $scope.init = function (ww, hh)
            {
                $scope.scene = new THREE.Scene();
                $scope.vh = hh;
                $scope.vw = ww;

                // create a camera, which defines where we're looking at.
                $scope.sysCamera = new THREE.PerspectiveCamera(70, ww / hh, 1, 10000);
                $scope.camera2 = new THREE.PerspectiveCamera(30, ww / hh, 1, 1000);
                // $scope.camera = new THREE.CombinedCamera(ww / 2, hh / 2, 70, 1, 10000,  - 5000, 10000);
                $scope.sysCamera.position.z = 1000;
                $scope.camera2.position.z = 5000;
                // $scope.camera2.position.y = 2000;

                var cameraHelper = new THREE.CameraHelper( $scope.camera2 );
                $scope.scene.add(cameraHelper);

                var texture = THREE.ImageUtils.loadTexture('textures/crate.gif');

                var geometry = new THREE.BoxGeometry(200, 200, 200);
                var material = new THREE.MeshBasicMaterial(
                    {
                        map : texture
                    }
                    );

                $scope.mesh = new THREE.Mesh(geometry, material);
                $scope.scene.add($scope.mesh);

                // $scope.scene.add(new THREE.AmbientLight(0xf0f0f0));
                // var light = new THREE.SpotLight(0xffffff, 1.5);
                // light.position.set(0, 1500, 200);
                // light.castShadow = true;
                // light.shadowCameraNear = 200;
                // light.shadowCameraFar = $scope.camera.far;
                // light.shadowCameraFov = 70;
                // light.shadowBias = -0.000222;
                // light.shadowDarkness = 0.25;
                // light.shadowMapWidth = 1024;
                // light.shadowMapHeight = 1024;
                // $scope.scene.add(light);
                // spotlight = light;

                var ambientLight = new THREE.AmbientLight( Math.random() * 0x10 );
                $scope.scene.add( ambientLight );                

                var helper = new THREE.GridHelper(1000, 100);
                helper.position.y =  - 199;
                helper.material.opacity = 0.25;
                helper.material.transparent = true;
                $scope.scene.add(helper);

                // create a render, sets the background color and the size
                $scope.renderer = new THREE.WebGLRenderer();
                $scope.renderer.setPixelRatio(window.devicePixelRatio);
                $scope.renderer.setClearColor(0xf0f0f0);
                $scope.renderer.shadowMap.enabled = true; ;

                $scope.orbitControls = new THREE.OrbitControls($scope.sysCamera, $scope.renderer.domElement);

                $('#main-container').append($scope.renderer.domElement);
                // $scope.renderer.setSize( $('#main-container').innerWidth()-32, $('#main-container').innerHeight()-32);
                $scope.renderer.setSize(ww, hh);
                $scope.animate();
            };

            $scope.animate = function ()
            {
                requestAnimationFrame($scope.animate);
                $scope.runSlide();
                $scope.orbitControls.update();
                $scope.renderer.render($scope.scene, $scope.sysCamera);
            };

            $scope.runSlide = function ()
            {
                if ($scope.playStatus == 2)
                {
                    $scope.mesh.rotation.x += 0.005;
                    $scope.mesh.rotation.y += 0.01;
                }
            }

            this.cameraMoveTo = function (idCam, newPos)  {};

            this.announceClick = function (index)
            {
                $mdDialog.show(
                    $mdDialog.alert()
                    .title('You clicked!')
                    .textContent('You clicked the menu item at index ' + index)
                    .ok('Nice'));
            };

            angular.element(document).ready(function ()
            {
                $scope.init($('#main-container').innerWidth() - 32, $('#main-container').innerHeight() - 32);
                $scope.addBlankProject();
            }
            );

            this.switchScene = function (index)
            {
                //switch
            };
            this.switchCamera = function (index)
            {
                //switch
            };

        }
    ]);

app.config(function ($mdThemingProvider)
{
    $mdThemingProvider.theme('default')
    .primaryPalette('green');
}
);

// $( document ).ready(function() {
//  angular.element('body').scope().init($('#main-container').innerWidth()-32,$('#main-container').innerHeight()-32);
// });
