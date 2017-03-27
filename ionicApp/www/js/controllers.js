angular.module('controllers', ['ion-datetime-picker'])

.controller('AppCtrl', function($scope, $auth, $http, $ionicModal, $state, $ionicNavBarDelegate, BACKEND_URL) {

  $scope.loginData = {};
  $scope.signupData = {};
  $scope.user = {
    displayName: 'Visitor',
    nUnseen: 0
  }

  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.loginModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.signupModal = modal;
  });

  $scope.closeLogin = function() {
    $scope.loginModal.hide();
  };

  $scope.closeSignup = function() {
    $scope.signupModal.hide();
  };

  $scope.loginToSignup = function() {
    $scope.closeLogin();
    $scope.signupData = {};
    $scope.signupModal.show();
  };

  $scope.signupToLogin = function() {
    $scope.closeSignup();
    $scope.login();
  };

  $scope.login = function() {
    $scope.loginData = {};
    $scope.loginModal.show();
  };

  $scope.logout = function() {
    $auth.logout();
    if ($state.is('app.gs')) {
      $state.go('app.sessions');
    }
  };

  // Perform the signup action when the user submits the signup form
  $scope.doSignup = function() {
    $auth.signup($scope.signupData)
      .then(function(response) {
        $auth.setToken(response);
        $scope.closeSignup();
        $state.reload('app');
      });
  };  

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $auth.login($scope.loginData)
      .then(function() {
        $scope.closeLogin();
        $state.reload('app');
      });
  };

  // Authenticate current visitor with external auth provider
  $scope.authenticate = function(provider) {
    $auth.authenticate(provider)
      .then(function() {
        $scope.closeLogin();
        $state.reload('app');
      });
  };

  // Check if the current visitor is an authenticated user
  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.isStateIncluding = function(stateSubstring) {
    return new RegExp(stateSubstring).test($state.$current.name);
  }

  $scope.unseenSessionsExist = function() {
    return ($scope.user.nUnseen > 0);
  };

  $scope.onStateChangeSuccess = function(event, toState, toParams, fromState, fromParams) {
    if (toState.name == 'app.gs') {
      $scope.user.nUnseen = 0;
    } else {
      if ($scope.isAuthenticated()) {
        $http.get(BACKEND_URL + 'user/basic')
          .then(function(response) {
            $scope.user = response.data;
          })
          .catch(function(err) {
            console.log('Error get(/user/basic): ' + JSON.stringify(err));
          });
      }
    }
  };

  $scope.$on('$ionicView.enter', function(e) {
    $ionicNavBarDelegate.showBar(true);
  });

  $scope.$on('$stateChangeSuccess', $scope.onStateChangeSuccess);
})

.controller('GroupCtrl', function($scope, $auth, $http, $ionicPopup,
  $ionicModal, $stateParams, $state, $ionicHistory, BACKEND_URL) {

  $scope.groupId = {};
  $scope.group = {};
  $scope.newSession = {};
  $scope.showMineOnly = false;

  $ionicModal.fromTemplateUrl('templates/newSession.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.newSessionModal = modal;
  });

  $scope.closeNewSessionModal = function() {
    $scope.newSessionModal.hide();
  };

  $scope.showNewSessionModal = function() {
    var newSessionDatetime = new Date();
    newSessionDatetime.setMinutes(Math.ceil(newSessionDatetime.getMinutes() / 15) * 15);
    $scope.newSession.datetime = newSessionDatetime;
    $scope.newSession.location = '';
    $scope.newSessionModal.show();
  };

  $scope.createNewSession = function() {
    if ((!$scope.newSession.location) || ($scope.newSession.location == '')) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a location for the new session'
      });
      return;
    }
    if ($scope.newSession.datetime < new Date()) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'New session must be in the future'
      });
      return;
    }

    $scope.newSession.groupId = $scope.groupId;
    var newSession = $scope.newSession;
    newSession.datetimeMS = newSession.datetime.getTime();
    delete newSession.datetime;
    $http({
      url: BACKEND_URL + 'session/create',
      data: newSession,
      method: 'POST'
    })
      .then(function(response) {
        $scope.closeNewSessionModal();
        $scope.newSession = {};
        $state.go('app.session', {sessionId: response.data._id, session: response.data});
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onMembershipChange = function() {
    if ($scope.group.isMember) {
      $scope.group.nMembers += 1;
      $http({
        url: BACKEND_URL + 'group/join',
        data: {groupId: $scope.groupId},
        method: 'POST'
      });
    } else {
      $scope.group.nMembers -= 1;
      $http({
        url: BACKEND_URL + 'group/leave',
        data: {groupId: $scope.groupId},
        method: 'POST'
      });
    }
  };

  $scope.onParticipationChange = function(session) {
    if (session.isParticipant) {
      session.nParticipants += 1;
      $http({
        url: BACKEND_URL + 'session/join',
        data: {sessionId: session._id},
        method: 'POST'
      });
    } else {
      session.nParticipants -= 1;
      $http({
        url: BACKEND_URL + 'session/leave',
        data: {sessionId: session._id},
        method: 'POST'
      });
    }
  }

  $scope.goToSession = function(session) {
    $state.go('app.session', {sessionId: session._id, session: session});
  }

  $scope.sessionInfo = function(session) {
    var templateStr = 'Location: ' + session.location + '<br>' +
        '#Participants: ' + session.nParticipants + '<br>' + 'When: ' + session.datetime;
    $ionicPopup.alert({
      title: 'Session Info',
      template: templateStr
    });
  }

  $scope.groupInfo = function() {
    var templateStr = 'Name: ' + $scope.group.name + '<br>' + 'Homebase: ' + $scope.group.homebase + '<br>' +
        '#Members: ' + $scope.group.nMembers + '<br>' + '#Upcoming sessions: ' + $scope.group.nUpcoming;
    $ionicPopup.alert({
      title: 'Group Info',
      template: templateStr
    });
  }

  $scope.groupId = $stateParams.groupId;

  if ($scope.groupId == null) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('app.groups');

  } else {

    $scope.group = $stateParams.group;
    if ($scope.group != null) {
      $scope.group.sessions = [];
    }

    var endPoint = BACKEND_URL + 'group/single';

    if ($scope.isAuthenticated()) {
      endPoint += '/user';
    }

    $http.get(endPoint, {
      params: {groupId: $scope.groupId}
    })
      .then(function(response) {
        $scope.group = response.data;
        if ($scope.group.isMember == null) {
          $scope.group.isMember = false;
        }
        $scope.group.sessions.forEach(function(session, index) {
          session.datetime = new Date(session.datetimeMS);
        });
      });
  }
})

.controller('GroupsCtrl', function($scope, $auth, $http, $ionicPopup, $ionicModal, $state, BACKEND_URL) {

  // Local vars
  $scope.newGroup = {};
  $scope.groups = [];
  $scope.showMineOnly = false;

  $ionicModal.fromTemplateUrl('templates/newGroup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.newGroupModal = modal;
  });

  $scope.closeNewGroupModal = function() {
    $scope.newGroupModal.hide();
  };

  $scope.showNewGroupModal = function() {
    $scope.newGroup.name = '';
    $scope.newGroup.homebase = '';
    $scope.newGroupModal.show();
  };

  $scope.createNewGroup = function() {
    if ((!$scope.newGroup.name) || ($scope.newGroup.name == '') ||
        (!$scope.newGroup.homebase) || ($scope.newGroup.homebase == '')) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a name & homebase for the new group'
      });
      return;
    }
    $scope.newGroup.sessions = [];
    $http({
      url: BACKEND_URL + 'group/create',
      data: $scope.newGroup,
      method: 'POST'
    })
      .then(function(response) {
        $scope.closeNewGroupModal();
        $scope.newGroup = {};
        $state.go('app.group', {groupId: response.data._id, group: response.data});
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.goToGroup = function(group) {
    $state.go('app.group', {groupId: group._id, group: group});
  }

  $scope.groupInfo = function(group) {
    var templateStr = 'Name: ' + group.name + '<br>' + 'Homebase: ' + group.homebase + '<br>' +
        '#Members: ' + group.nMembers + '<br>' + '#Upcoming sessions: ' + group.nUpcoming;
    $ionicPopup.alert({
      title: 'Group Info',
      template: templateStr
    });
  }
  
  $scope.onMembershipChange = function(group) {
    if (group.isMember) {
      group.nMembers += 1;
      $http({
        url: BACKEND_URL + 'group/join',
        data: {groupId: group._id},
        method: 'POST'
      });
    } else {
      group.nMembers -= 1;
      $http({
        url: BACKEND_URL + 'group/leave',
        data: {groupId: group._id},
        method: 'POST'
      });
    }
  }

  var endPoint = BACKEND_URL + 'group/all';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint)
    .then(function(response) {
      $scope.groups = response.data;
    });
})

.controller('SessionCtrl', function($scope, $auth, $http, $stateParams, $state, $ionicHistory, BACKEND_URL) {

  $scope.sessionId = {};
  $scope.session = {};

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onParticipationChange = function() {
    if ($scope.session.isParticipant) {
      $scope.session.nParticipants += 1;
      $http({
        url: BACKEND_URL + 'session/join',
        data: {sessionId: $scope.sessionId},
        method: 'POST'
      });
    } else {
      $scope.session.nParticipants -= 1;
      $http({
        url: BACKEND_URL + 'session/leave',
        data: {sessionId: $scope.sessionId},
        method: 'POST'
      });
    }
  };

  $scope.goToGroup = function(groupId) {
    $state.go('app.group', {groupId: groupId});
  }

  $scope.sessionId = $stateParams.sessionId;

  if ($scope.sessionId == null) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('app.sessions');

  } else {

    $scope.session = $stateParams.session;

    if ($scope.session == null) {
      $scope.session = {};
    }

    if ($scope.session.isParticipant == null) {
      $scope.session.isParticipant = false;
    }

    var endPoint = BACKEND_URL + 'session/single';

    if ($scope.isAuthenticated()) {
      endPoint += '/user';
    }

    $http.get(endPoint, {
      params: {sessionId: $scope.sessionId}
    })
      .then(function(response) {
        $scope.session = response.data;
        $scope.session.datetime = new Date($scope.session.datetimeMS);
        $scope.session.groupStr = '';
        if ($scope.session.groupName) {
          $scope.session.groupStr = ', group name: ' + $scope.session.groupName;
        }
      });
  }
})

.controller('SessionsCtrl', function($scope, $auth, $http, $state, $ionicPopup, $ionicModal, BACKEND_URL) {

  // Local vars
  $scope.newSession = {};
  $scope.sessions = [];
  $scope.showMineOnly = false;

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/newSession.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.newSessionModal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeNewSessionModal = function() {
    $scope.newSessionModal.hide();
  };

  // Open the login modal
  $scope.showNewSessionModal = function() {
    var newSessionDatetime = new Date();
    newSessionDatetime.setMinutes(Math.ceil(newSessionDatetime.getMinutes() / 15) * 15);
    $scope.newSession.datetime = newSessionDatetime;
    $scope.newSession.location = '';
    $scope.newSessionModal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.createNewSession = function() {
    if ((!$scope.newSession.location) || ($scope.newSession.location == '')) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a location for the new session'
      });
      return;
    }
    if ($scope.newSession.datetime < new Date()) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'New session must be in the future'
      });
      return;
    }

    var newSession = $scope.newSession;
    newSession.datetimeMS = newSession.datetime.getTime();
    delete newSession.datetime;
    $http({
      url: BACKEND_URL + 'session/create',
      data: newSession,
      method: 'POST'
    })
      .then(function(response) {
        $scope.closeNewSessionModal();
        $scope.newSession = {};
        $state.go('app.session', {sessionId: response.data._id, session: response.data});
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onParticipationChange = function(session) {
    if (session.isParticipant) {
      session.nParticipants += 1;
      $http({
        url: BACKEND_URL + 'session/join',
        data: {sessionId: session._id},
        method: 'POST'
      });
    } else {
      session.nParticipants -= 1;
      $http({
        url: BACKEND_URL + 'session/leave',
        data: {sessionId: session._id},
        method: 'POST'
      });
    }
  }

  $scope.goToSession = function(session) {
    $state.go('app.session', {sessionId: session._id, session: session});
  }

  $scope.sessionInfo = function(session) {
    var templateStr = 'Location: ' + session.location + '<br>' +
        '#Participants: ' + session.nParticipants + '<br>' + 'When: ' + session.datetime;
    if (session.groupName != null) {
      templateStr += '<br>' + 'Group: ' + session.groupName;
    }
    $ionicPopup.alert({
      title: 'Session Info',
      template: templateStr
    });
  }

  var endPoint = BACKEND_URL + 'session/all';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint)
    .then(function(response) {
      $scope.sessions = response.data;
      $scope.sessions.forEach(function(session, index) {
        session.datetime = new Date(session.datetimeMS);
      });
    });
})
.controller('GroupSessionsCtrl', function($scope, $auth, $http, $state, $ionicPopup, BACKEND_URL) {

  // Local vars
  $scope.nUnseen = 0;
  $scope.groupSessions = [];
  $scope.showMineOnly = false;

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onParticipationChange = function(session) {
    if (session.isParticipant) {
      session.nParticipants += 1;
      $http({
        url: BACKEND_URL + 'session/join',
        data: {sessionId: session._id},
        method: 'POST'
      });
    } else {
      session.nParticipants -= 1;
      $http({
        url: BACKEND_URL + 'session/leave',
        data: {sessionId: session._id},
        method: 'POST'
      });
    }
  }

  $scope.goToSession = function(session) {
    $state.go('app.session', {sessionId: session._id, session: session});
  }

  $scope.sessionInfo = function(session) {
    var templateStr = 'Location: ' + session.location + '<br>' +
        '#Participants: ' + session.nParticipants + '<br>' + 'When: ' + session.datetime;
    if (session.groupName != null) {
      templateStr += '<br>' + 'Group: ' + session.groupName;
    }
    $ionicPopup.alert({
      title: 'Session Info',
      template: templateStr
    });
  }

  $scope.sessionBGColor = function(session) {
    if (session.unseen) {
      return '#F0F8FF';
    } else {
      return 'white';
    }
  }

  $http.get(BACKEND_URL + 'user/groups/sessions')
    .then(function(response) {
      $scope.sessions = response.data;
      $scope.sessions.forEach(function(session, index) {
        session.datetime = new Date(session.datetimeMS);
        if (session.unseen) {
          $scope.nUnseen++;
        }
      });
    });
});
