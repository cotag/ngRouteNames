(function (angular) {
    'use strict';

    angular.module('ngRouteNames')
        .directive('goto', ['$route', '$location', '$mobileClick', '$parse', function ($route, $location, $mobile, $parse) {
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
                            updateActive();
                            // path is our cached goto function, search is our parsed search param
                            url = path(attrs, search(scope, {}));

                            // if this is an A element then we want to set the href
                            if (isLink) {
                                element.attr('href', url[0] + '?' + url[1]);
                            }
                        };


                    // Process search attribute if defined
                    if (attrs.search) {
                        search = $parse(attrs.search);
                        delete attrs.search;
                    } else {
                        // no-op function unless search exists
                        search = function () {};
                    }
                    updateLink();

                    // Keep the links up to date
                    element.addClass(attrs.goto);
                    scope.$on('$routeChangeSuccess', updateLink);

                    // Follow clicks using mobile events where available
                    $mobile.gestureOn(element, 'tap', attrs).bind('tap', function (event) {
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
