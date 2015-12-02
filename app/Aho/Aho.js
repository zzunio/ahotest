(function ()
{
    'use strict';
    angular.module('Aho', ['ngMaterial']).config(function ($mdThemingProvider,$mdIconProvider)
    {
        $mdThemingProvider.theme('default').primaryPalette('green').accentPalette('brown');
        $mdIconProvider.icon('anchor', 'assets/anchor1.svg', 16);
    });
})();
