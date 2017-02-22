angular.module('controllers', ['ion-datetime-picker'])

.controller('AppCtrl', function($scope, $auth, $ionicModal, $state) {

  $scope.loginData = {};
  $scope.signupData = {};

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
  };

  // Perform the signup action when the user submits the signup form
  $scope.doSignup = function() {
    $auth.signup($scope.signupData)
      .then(function(response) {
        $auth.setToken(response);
        $scope.closeSignup();
        $state.reload();
      });
  };  

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $auth.login($scope.loginData)
      .then(function() {
        $scope.closeLogin();
        $state.reload();
      });
  };

  // Authenticate current visitor with external auth provider
  $scope.authenticate = function(provider) {
    $auth.authenticate(provider)
      .then(function() {
        $scope.closeLogin();
        $state.reload();
      });
  };

  // Check if the current visitor is an authenticated user
  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.isStateIncluding = function(stateSubstring) {
    return new RegExp(stateSubstring).test($state.$current.name);
  }
})

.controller('GroupCtrl', function($scope, $auth, $http, $ionicPopup,
  $ionicModal, $stateParams, $state, $ionicHistory, BACKEND_URL) {

  $scope.groupParams = {};
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
    $scope.newSession.title = '';
    $scope.newSession.location = '';
    $scope.newSessionModal.show();
  };

  $scope.createNewSession = function() {
    if ((!$scope.newSession.title) || ($scope.newSession.title == '') ||
        (!$scope.newSession.location) || ($scope.newSession.location == '')) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a title & location for the new session'
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

    $scope.newSession.groupId = $scope.groupParams._id;
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
        $state.go('app.session', {_id: response.data._id, title: response.data.title,
          location: response.data.location, nParticipants: response.data.nParicipants, isParticipant: true});
      }).
      catch(function(error) {
        $scope.closeNewSessionModal();
        console.log('Create session error: ' + error.data.message + ' ' + error.status);
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onMembershipChange = function() {
    if ($scope.groupParams.isMember) {
      $http({
        url: BACKEND_URL + 'group/join',
        data: {groupId: $scope.groupParams._id},
        method: 'POST'
      });
    } else {
      $http({
        url: BACKEND_URL + 'group/leave',
        data: {groupId: $scope.groupParams._id},
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
    $state.go('app.session', session);
  }

  $scope.groupParams = $stateParams;

  if ($scope.groupParams._id == null) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('app.groups');

  } else {

    var endPoint = BACKEND_URL + 'group/single';

    if ($scope.isAuthenticated()) {
      endPoint += '/user';
    }

    $http.get(endPoint, {
      params: {groupId: $scope.groupParams._id}
    })
      .then(function(response) {
        $scope.groupParams = response.data;
        if ($scope.groupParams.isMember == null) {
          $scope.groupParams.isMember = false;
        }
        if ($scope.groupParams.sessions) {
          $scope.groupParams.sessions.forEach(function(session, index) {
            session.datetime = new Date(session.datetimeMS);
          });
        }
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
        $state.go('app.group', {_id: response.data._id, name: response.data.name,
          homebase: response.data.homebase, isMember: true});
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.goToGroup = function(group) {
    $state.go('app.group', group);
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

  $scope.sessionParams = {};

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onParticipationChange = function() {
    if ($scope.sessionParams.isParticipant) {
      $scope.sessionParams.nParticipants += 1;
      $http({
        url: BACKEND_URL + 'session/join',
        data: {sessionId: $scope.sessionParams._id},
        method: 'POST'
      });
    } else {
      $scope.sessionParams.nParticipants -= 1;
      $http({
        url: BACKEND_URL + 'session/leave',
        data: {sessionId: $scope.sessionParams._id},
        method: 'POST'
      });
    }
  };

  $scope.sessionParams = $stateParams;

  if ($scope.sessionParams._id == null) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('app.sessions');

  } else {

    if ($scope.sessionParams.isParticipant == null) {
      $scope.sessionParams.isParticipant = false;
    }

    var endPoint = BACKEND_URL + 'session/single';

    if ($scope.isAuthenticated()) {
      endPoint += '/user';
    }

    $http.get(endPoint, {
      params: {sessionId: $scope.sessionParams._id}
    })
      .then(function(response) {
        $scope.sessionParams = response.data;
        $scope.sessionParams.datetime = new Date($scope.sessionParams.datetimeMS);
        $scope.sessionParams.groupStr = '';
        if ($scope.sessionParams.groupName) {
          $scope.sessionParams.groupStr = ', group name: ' + $scope.sessionParams.groupName;
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
    $scope.newSession.title = '';
    $scope.newSession.location = '';
    $scope.newSessionModal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.createNewSession = function() {
    if ((!$scope.newSession.title) || ($scope.newSession.title == "") ||
        (!$scope.newSession.location) || ($scope.newSession.location == '')) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a title & location for the new session'
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
        $state.go('app.session', {_id: response.data._id, title: response.data.title,
          location: response.data.location, nParticipants: response.data.nParicipants, isParticipant: true});
      }).
      catch(function(error) {
        $scope.closeNewSessionModal();
        console.log('Create session error: ' + error.data.message + ' ' + error.status);
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
    $state.go('app.session', session);
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
        session.groupStr = '';
        if (session.groupName) {
          session.groupStr = ', group name: ' + session.groupName;
        }
      });
    });
});
