// Route & state config file

app
.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('app', {
      abstract: true,
      cache: false,
      templateUrl: 'templates/tabs.html',
      controller: 'AppCtrl'
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
    .state('app.session', {
      cache: false,
      url: '/session/:sessionId',
      views: {
        'menuContent': {
          templateUrl: 'templates/session.html',
          controller: 'SessionCtrl'
        }
      },
      params: {
        sessionId: null,
        session: null
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
      url: '/group/:groupId',
      views: {
        'menuContent': {
          templateUrl: 'templates/group.html',
          controller: 'GroupCtrl'
        }
      },
      params: {
        groupId: null,
        group: null
      }
    })
    .state('app.gs', {
      cache: false,
      url: '/groupSessions',
      views: {
        'menuContent': {
          templateUrl: 'templates/groupSessions.html',
          controller: 'GroupSessionsCtrl'
        }
      }
    });
    
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/sessions');
});