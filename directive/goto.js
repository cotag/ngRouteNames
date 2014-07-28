(function (angular) {
    'use strict';
    
    var hashPrefix,
        emptyString = '',
        mod = angular.module('ngRouteNames');

        mod.value('GOTO_SEARCH_DEFAULT', angular.noop);
    
        mod.config(['$locationProvider', function ($locationProvider) {
            hashPrefix = '#' + $locationProvider.hashPrefix();
        }])
        .directive('goto', ['$route', '$location', '$gestureClick', '$parse', 'GOTO_SEARCH_DEFAULT', function ($route, $location, $mobile, $parse, GOTO_SEARCH_DEFAULT) {
            return {
                scope: false,
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var path = $route.pathTo[attrs.goto],
                        search,
                        url,
                        isActive = false,
                        isLink = element[0].tagName === 'A',
                        updateActive = function () {
                            if ($route.current && attrs.goto === $route.current.name) {
                                element.addClass($route.activeClass);
                                isActive = true;
                            } else if (isActive) {
                                element.removeClass($route.activeClass);
                                isActive = false;
                            }
                        },
                        updateLink = function () {
                            var prefix = $location.$$html5 ? emptyString : hashPrefix;
                            
                            updateActive();
                            // path is our cached goto function, search is our parsed search param
                            url = path(attrs, search(scope, {}));

                            // if this is an A element then we want to set the href
                            if (isLink) {
                                if (url[1].length > 0) {
                                    element.attr('href', prefix + url[0] + '?' + url[1]);
                                } else {
                                    element.attr('href', prefix + url[0]);
                                }
                            }
                        };


                    // Process search attribute if defined
                    if (attrs.search) {
                        search = $parse(attrs.search);
                        delete attrs.search;
                    } else {
                        // no-op function unless search exists
                        search = GOTO_SEARCH_DEFAULT;
                    }
                    updateLink();

                    // Keep the links up to date
                    element.addClass(attrs.goto);
                    scope.$on('$routeChangeSuccess', updateLink);

                    // Follow clicks using mobile events where available
                    $mobile.gestureOn(element, 'tap', attrs).on('tap', function (event) {
                        scope.$apply(function () {
                            $location.path(url[0]).search(url[1]);    // Use the previously processed path
                        });
                        if (attrs.preventDefault === 'true') {
                            event.preventDefault();
                        }
                        if (attrs.stopPropagation === 'true') {
                            event.stopPropagation();
                        }
                    });
                }
            };
        }]);

}(this.angular));
