(function ()
{
    angular.module('Aho').factory('Animate', function ($http, $q, Editor)
    {
        var Animate = {};

        Animate.moveCamTo = function ()  {};

        Animate.FlyFarFarAnimation = function(duration, far) {

        }

        Animate.CreateRotationAnimation = function (period, axis)
        {

            var keys = [];
            keys.push(
            {
                time : 0,
                value : 0
            }
            );
            keys.push(
            {
                time : period,
                value : 360
            }
            );

            axis = axis || 'x';
            var trackName = '.rotation[' + axis + ']';

            var track = new THREE.NumberKeyframeTrack(trackName, keys);

            var clip = new THREE.AnimationClip('rotate.x', 10, [track]);
            //console.log( 'rotateClip', clip );

            return clip;
        };

        Animate.CreateScaleAxisAnimation = function (period, axis)
        {

            var keys = [];
            keys.push(
            {
                time : 0,
                value : 0
            }
            );
            keys.push(
            {
                time : period,
                value : 360
            }
            );

            axis = axis || 'x';
            var trackName = '.scale[' + axis + ']';

            var track = new THREE.NumberKeyframeTrack(trackName, keys);

            var clip = new THREE.AnimationClip('scale.x', 10, [track]);
            //console.log( 'scaleClip', clip );

            return clip;
        };

        Animate.CreateShakeAnimation = function (duration, shakeScale)
        {

            var keys = [];
            for (var i = 0; i < duration * 10; i++)
            {
                keys.push(
                {
                    time : (i / 10.0),
                    value : new THREE.Vector3(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0).multiply(shakeScale)
                }
                );
            }
            var trackName = '.position';
            var track = new THREE.VectorKeyframeTrack(trackName, keys);
            var clip = new THREE.AnimationClip('shake' + duration, duration, [track]);
            //console.log( 'shakeClip', clip );
            return clip;
        };

        return Animate;
    }
    );

}
)();
