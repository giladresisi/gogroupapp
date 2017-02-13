angular.module('controllers', ['ion-datetime-picker'])

.controller('MenuCtrl', function($scope, $auth) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  
  // Check if the current visitor is an authenticated user
  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };
})

.controller('GroupCtrl', function($scope, $auth, $http, $ionicPopup, $ionicModal, $stateParams, $state, BACKEND_URL) {

  $scope.groupParams = {};
  $scope.group = {};
  $scope.newSession = {};

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
    $scope.newSessionModal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.createNewSession = function() {
    if ((!$scope.newSession.title) || ($scope.newSession.title == "")) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a title for the new session'
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

    $scope.newSession.groupId = $scope.group._id;
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
        $state.go('app.session', response.data);
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
        data: {groupId: $scope.groupParams.groupId},
        method: 'POST'
      });
    } else {
      $http({
        url: BACKEND_URL + 'group/leave',
        data: {groupId: $scope.groupParams.groupId},
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
    $state.go('app.session', {title: session.title, sessionId: session._id, nParticipants: session.nParticipants, isParticipant: session.isParticipant});
  }

  $scope.groupParams = $stateParams;
  if ($scope.groupParams.isMember == null) {
    $scope.groupParams.isMember = false;
  }

  var endPoint = BACKEND_URL + 'group/single';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint, {
    params: {groupId: $scope.groupParams.groupId}
  })
    .then(function(response) {
      $scope.group = response.data;
    });
})

.controller('GroupsCtrl', function($scope, $auth, $http, $ionicPopup, $state, BACKEND_URL) {

  // Local vars
  $scope.newGroup = {};
  $scope.groups = [];

  $scope.createGroup = function() {
    if ((!$scope.newGroup.name) || ($scope.newGroup.name == "")) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a name for the new group'
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
        $scope.newGroup = {};
        $state.go('app.group', {groupName: response.name, groupId: response._id, isMember: true});
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.goToGroup = function(group) {
    $state.go('app.group', {groupName: group.name, groupId: group._id, isMember: group.isMember});
  }
  
  $scope.onMembershipChange = function(group) {
    if (group.isMember) {
      $http({
        url: BACKEND_URL + 'group/join',
        data: {groupId: group._id},
        method: 'POST'
      });
    } else {
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

.controller('SessionCtrl', function($scope, $auth, $http, $stateParams, BACKEND_URL) {

  $scope.sessionParams = {};

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onParticipationChange = function() {
    if ($scope.sessionParams.isParticipant) {
      $http({
        url: BACKEND_URL + 'session/join',
        data: {sessionId: $scope.sessionParams.sessionId},
        method: 'POST'
      }).
        then(function(response) {
          $scope.sessionParams.nParticipants += 1;
        });
    } else {
      $http({
        url: BACKEND_URL + 'session/leave',
        data: {sessionId: $scope.sessionParams.sessionId},
        method: 'POST'
      }).
        then(function(response) {
          $scope.sessionParams.nParticipants -= 1;
        });
    }
  };

  $scope.sessionParams = $stateParams;
  console.log('Params: ' + JSON.stringify($scope.sessionParams));
  if ($scope.sessionParams.isParticipant == null) {
    $scope.sessionParams.isParticipant = false;
  }

})

.controller('SessionsCtrl', function($scope, $auth, $http, $state, $ionicPopup, $ionicModal, BACKEND_URL) {

  // Local vars
  $scope.newSession = {};
  $scope.sessions = [];

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
    $scope.newSessionModal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.createNewSession = function() {
    if ((!$scope.newSession.title) || ($scope.newSession.title == "")) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a title for the new session'
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
        $state.go('app.session', response.data);
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
    console.log('Going to session: ' + JSON.stringify(session));
    $state.go('app.session', {title: session.title, sessionId: session._id, nParticipants: session.nParticipants, isParticipant: session.isParticipant});
  }

  var endPoint = BACKEND_URL + 'session/all';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint)
    .then(function(response) {
      $scope.sessions = response.data;
      for (i = 0; i < $scope.sessions.length; i++) {
        $scope.sessions[i].groupStr = '';
        if ($scope.sessions[i].groupName) {
          $scope.sessions[i].groupStr = ', group name: ' + $scope.sessions[i].groupName;
        }
      }
    });
})

.controller('LogoutCtrl', function($scope, $auth, $state, $ionicHistory) {

  // Make sure the user is currently authenticated (else - do nothing)
  if (!$auth.isAuthenticated()) {
    return;
  }

  // Log out current user using auth module
  $auth.logout()
    .then(function() {
      
      // Erase history so when navigating to home page there won't be a back button icon
      $ionicHistory.nextViewOptions({
        historyRoot: true
      });

      // Navigate back to sessions page using the ap states
      $state.go('app.sessions');
    });
})

.controller('SignupCtrl', function($scope, $auth, $state, $ionicHistory) {

  $scope.signupData = {};

  // Perform the signup action when the user submits the signup form
  $scope.doSignup = function() {

    // Login using the auth module
    $auth.signup($scope.signupData)
      .then(function(response) {
        $auth.setToken(response);

        // Erase history so when navigating to home page there won't be a back button icon
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });

        // Navigate back to sessions page using the ap states
        $state.go('app.sessions');
      });
  };
})

.controller('LoginCtrl', function($scope, $auth, $state, $ionicHistory) {

  // Init login data structs
  $scope.loginData = {};

  // Go back to home page after successful login / authentication
  $scope.closeLogin = function() {

    // Erase history so when navigating to home page there won't be a back button icon
    $ionicHistory.nextViewOptions({
      historyRoot: true
    });

    // Navigate back to sessions page using the ap states
    $state.go('app.sessions');
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    // Login using the auth module
    $auth.login($scope.loginData)
      .then(function() {

        // Navigate back to home page after successful login
        $scope.closeLogin();
      });
  };

  // Authenticate current visitor with external auth provider
  $scope.authenticate = function(provider) {

    // Authenticate with provider using the auth module
    $auth.authenticate(provider)
      .then(function() {

        // Navigate back to home page after successful authentication
        $scope.closeLogin();
      });
  };
});
