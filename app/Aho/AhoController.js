(function ()
{
    angular.module('Aho').controller('AhoController', [
            '$scope', '$mdSidenav', '$mdDialog', '$q', 'Editor', 'Viewport', 'Add', 'Project',
            AhoController
        ]);

    function AhoController($scope, $mdSidenav, $mdDialog, $q, Editor, Viewport, Add, Project)
    {
        var self = this;
        $scope.project = Project;
        $scope.playStatus = 1;

        $scope.config =
        {
            transType : [
                "translate",
                "rotate",
                "scale"
            ],
            showGrid : true
        }

        $scope.playClick = function ()
        {
            Editor.playStatus = 3 - Editor.playStatus;
            $scope.playStatus = Editor.playStatus;
            if (Editor.playStatus == 1)
            {

            }
            else
            {
                Project.playAll();
            }
        }

        $scope.testGLTF = function ()
        {
            Project.clear();
            Viewport.buildGLTF(
            {
                name : "Monster",
                url : "assets/gltf/monster/monster.json",
                cameraPos : new THREE.Vector3(30, 10, 1000),
                objectScale : new THREE.Vector3(0.1, 0.1, 0.1),
                objectPosition : new THREE.Vector3(0, 1, 0),
                objectRotation : new THREE.Euler(-Math.PI / 2, 0, -Math.PI / 2),
                animationTime : 3,
                addLights : true,
                shadows : true,
                addGround : true
            }
            );
        }


        $scope.testAnimation1 = function() {
            Viewport.testAnimation1();
        }

        $scope.ss1 = function ()
        {
            Editor.camera.zoom = 2;
            Editor.camera.updateProjectionMatrix();
        }

        $scope.addSlide = function ()
        {
            Project.addSlide();
        }

        $scope.removeSlide = function (i)
        {
            $scope.slides.remove(i);
        }

        $scope.addBlankProject = function ()
        {
            console.log($scope.project);            

            // var defaultProject =
            // {
            //     slides : [
            //         {
            //             id : 1,
            //             name_slide : 'Trình diễn 1'
            //         }
            //     ],
            //     pname : "Dự án Me3D 1"
            // };

            // $scope.project = angular.copy(defaultProject);
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

        this.addBasic = function (funcName)
        {
            Add[funcName]();
        }

        angular.element(document).ready(function ()
        {
            var renderer = new THREE.WebGLRenderer();
            Viewport.vw = $('#main-container').width()-1;
            Viewport.vh = $('#main-container').height()-37;
            Editor.signals.rendererChanged.dispatch(renderer);
            Viewport.initCamPreview();
            $scope.addBlankProject();
            Viewport.animate();
        }
        );

        // this.switchScene = function (index)
        // {
        //     //switch
        // };
        // this.switchCamera = function (index)
        // {
        //     //switch
        // };

    }
}
)();
