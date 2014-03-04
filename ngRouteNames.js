(function (angular) {
    'use strict';

    angular.module('ngRouteNames', ['ngRoute', 'ngGesture'])

        .provider('$routeNames', ['$routeProvider', function ($routeProvider) {
            var namedRoutes = {},
                paramMatcher = /(?:\:)(.*?)(?:(\/|$)\/?)/gm,
                pendingRoutes = [];

            this.when = function (path, route) {
                if (route.name) {
                    var altPath = path,
                        matches = altPath.match(paramMatcher) || [],
                        param,
                        i;

                    // this converts paths '/:param1/:param2' to '/{{param1}}/{{param2}}/'
                    for (i = 0; param = matches[i]; i += 1) {  // this will break on undefined
                        altPath = altPath.replace(param, '{{' + param.replace(/\:|\//gm, '') + '}}/');
                    }

                    // remove the trailing '/' to prevent double route change
                    if (altPath.length > 1 && altPath.charAt(altPath.length - 1) === '/') {
                        altPath.slice(0, -1);
                    }
                    namedRoutes[route.name] = altPath;
                }

                // Update the actual route provider
                $routeProvider.when(path, route);

                return this;
            };

            this.otherwise = $routeProvider.otherwise;
            this.activeClass = 'is-active';

            this.$get = ['$interpolate', '$route', '$routeParams', '$location', '$q', '$rootScope', function ($interpolate, $route, $routeParams, $location, $q, $rootScope) {
                var result,
                    checkSearch = function (searchParams, asString) {
                        // Are search params involved?
                        if (searchParams) {
                            if (searchParams === true) {
                                // maintain existing search params
                                searchParams = $location.search();
                            }

                            if (asString) {
                                // return search params as a string
                                if (typeof searchParams === 'string') {
                                    return searchParams;
                                }

                                var searchString = '',
                                    index;

                                for (index in searchParams) {
                                    if (searchParams.hasOwnProperty(index) && searchParams[index] !== undefined) {
                                        searchString += index + '=' + searchParams[index] + '&';
                                    }
                                }

                                return searchString.slice(0, -1);   // removes trailing '&', doesn't throw error on empty string
                            }

                            // else update the location with search params
                            $location.search(searchParams);
                        }

                        return '';
                    };

                // Resolve route changes
                $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
                    var name = $route.current.name,
                        params = arguments,
                        i;

                    if (name === undefined) {
                        return;
                    }

                    for (i = 0; i < pendingRoutes.length; i++) {
                        if (pendingRoutes[i][0] === name) {
                            pendingRoutes[i][1].resolve(params);
                        } else {
                            pendingRoutes[i][1].reject(params);
                        }
                    }

                    pendingRoutes = [];
                });

                // Create an interpolation function for the routes
                angular.forEach(namedRoutes, function (route, name) {
                    result = $interpolate(route, true);
                    if (!!result) {
                        namedRoutes[name] = result;
                    }
                });

                // Update the route object with named routes
                $route.to = {};
                $route.pathTo = {};
                $route.activeClass = this.activeClass;

                // For all the named routes, allow automatic param injection of the existing context with param based override 
                angular.forEach(namedRoutes, function (route, name) {
                    if (typeof route === 'function') {
                        // For routes where interpolation is required
                        $route.to[name] = function (params, search) {
                            var defer = $q.defer();

                            params = angular.extend({}, $routeParams, params);
                            $location.path(route(params));
                            checkSearch(search, false);

                            pendingRoutes.push([name, defer]);
                            return defer.promise;
                        };
                        $route.pathTo[name] = function (params, search) {
                            params = angular.extend({}, $routeParams, params);
                            return [route(params), checkSearch(search, true)];
                        };
                    } else {
                        // Less processing for static routes
                        $route.to[name] = function (params, search) {
                            var defer = $q.defer();

                            $location.path(route);
                            checkSearch(search, false);

                            pendingRoutes.push([name, defer]);
                            return defer.promise;
                        };
                        $route.pathTo[name] = function (params, search) {
                            return [route, checkSearch(search, true)];
                        };
                    }
                });

                // We just return the original route service
                return $route;
            }];
        }])
        .run(['$routeNames', function () {
            // inject $namedRoute into $route ()
        }]);

}(this.angular));
