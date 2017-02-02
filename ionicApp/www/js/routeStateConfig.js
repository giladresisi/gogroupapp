// Route & state config file

app
.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('app', {
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'MenuCtrl'
    })
    .state('app.signup', {
      cache: false,
      url: '/signup',
      views: {
        'menuContent': {
          templateUrl: 'templates/signup.html',
          controller: 'SignupCtrl'
        }
      }
    })
    .state('app.login', {
      cache: false,
      url: '/login',
      views: {
        'menuContent': {
          templateUrl: 'templates/login.html',
          controller: 'LoginCtrl'
        }
      }
    })
    .state('app.logout', {
      cache: false,
      url: '/logout',
      views: {
        'menuContent': {
          template: null,
          controller: 'LogoutCtrl'
        }
      }
    })
    .state('app.profile', {
      url: '/profile',
      views: {
        'menuContent': {
          templateUrl: 'templates/profile.html'
        }
      }
    })
    .state('app.sessions', {
      cache: false,
      url: '/sessions',
      views: {
        'menuContent': {
          templateUrl: 'templates/sessions.html',
          controller: 'SessionsCtrl'
        }
      }
    })
    .state('app.groups', {
      cache: false,
      url: '/groups',
      views: {
        'menuContent': {
          templateUrl: 'templates/groups.html',
          controller: 'GroupsCtrl'
        }
      }
    })
    .state('app.group', {
      cache: false,
      url: '/group/:groupName',
      views: {
        'menuContent': {
          templateUrl: 'templates/group.html',
          controller: 'GroupCtrl'
        }
      },
      params: {
        groupName: undefined,
        isMember: null
      }
    });
    
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/sessions');
});