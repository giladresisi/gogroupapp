// Route & state config file

app
.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('app', {
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'MenuCtrl'
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
      url: '/session/:_id',
      views: {
        'menuContent': {
          templateUrl: 'templates/session.html',
          controller: 'SessionCtrl'
        }
      },
      params: {
        _id: null,
        title: null,
        nParticipants: null,
        isParticipant: null
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
      url: '/group/:_id',
      views: {
        'menuContent': {
          templateUrl: 'templates/group.html',
          controller: 'GroupCtrl'
        }
      },
      params: {
        _id: null,
        name: null,
        isMember: null
      }
    });
    
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/sessions');
});