(function ()
{
    angular.module('Aho').factory('Project', function ($http, $q, Editor)
    {
        var slideCount = 0;
        var Project = {};

        Project.slides = [
            {
                id : 1,
                sname : 'Slide 1'
            }        
        ];
        Project.playSlide = 0;
        Project.ActionList = {};
        Project.activeCam = Editor.camera;

        Project.activeSlide = Project.slides[0];

        Project.addMoveTo = function(camPos) {

        }


        Project.addSlide = function ()
        {
            slideCount++;
            Project.slides.push(
                new Slide({
                    id:slideCount,
                    sname : 'Slide ' + (slideCount + 1)
                })
            );
        }        

        Slide = function(params) {
            this.sname = params.sname;
            this.id = params.id;
        };

        Action = function(atype,duration) {
            this.atype = atype; // move to point, zoom to point, run around object, 
            this.duration = duration;
            this.loop = false;
            this.startTime = 0;
        };

        Action.prototype.play = function() {
            if (this.running)
                return;
            
            this.startTime = Date.now();
            this.running = true;

            // THREE.glTFAnimator.add(this);
        };

        Action.prototype.move_cam_to =function(newPos) {

        };

        Action.prototype.cam_zoom_to = function(newZoom) {

        };

        Action.prototype.cam_run_around = function(box) {

        };        

        return Project;
    }
    );

}
)();
