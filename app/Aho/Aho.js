(function ()
{
    'use strict';
    angular.module('Aho', ['ngMaterial']).config(function ($mdThemingProvider,$mdIconProvider)
    {
        $mdThemingProvider.theme('default').primaryPalette('green').accentPalette('brown');
        $mdIconProvider.icon('anchor', 'assets/anchor1.svg', 16)
        .icon('flag', 'assets/flag3.svg', 16)
        .icon('camera', 'assets/camera.svg', 16)

        .icon('run1', 'assets/play.svg', 16)
        .icon('run2', 'assets/run2.svg', 16)
        .icon('duration', 'assets/time4.svg', 16)
        .icon('time_start', 'assets/time3.svg', 16)
        .icon('run_slide1', 'assets/play2.svg', 16)
        .icon('run_slide2', 'assets/pause6.svg', 16)
        .icon('import', 'assets/save3.svg', 16)
        .icon('save', 'assets/save4.svg', 16)
        .icon('open', 'assets/open2.svg', 16)
        .icon('magic', 'assets/magic3.svg', 16)
        .icon('atype0', 'assets/move-point.svg', 16)                
        .icon('atype1', 'assets/stop-point1.svg', 16)
        .icon('atype2', 'assets/zoom5.svg', 16)
        .icon('atype3', 'assets/fly.svg', 16)                        
        .icon('atype4', 'assets/snow1.svg', 16)
        .icon('atype5', 'assets/effect-point.svg', 16)

        ;
    });
})();
