angular.module('controllers', [])

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

.controller('GroupCtrl', function($scope, $auth, $http, $stateParams, BACKEND_URL) {

  $scope.groupName = {};
  $scope.isMember = false;
  $scope.group = {};
  $scope.newSession = {};

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.onMemberChange = function() {
    if ($scope.isMember) {
      $http({
        url: BACKEND_URL + 'group/join',
        data: {groupName: $scope.groupName.name},
        method: 'POST'
      });
    } else {
      $http({
        url: BACKEND_URL + 'group/leave',
        data: {groupName: $scope.groupName.name},
        method: 'POST'
      });
    }
  };

  $scope.createSession = function() {
    if ((!$scope.newSession) || ($scope.newSession.title == "")) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a title for the new session'
      });
      return;
    }
    $scope.newSession.groupId = $scope.group._id;
    $http({
      url: BACKEND_URL + 'session/create',
      data: $scope.newSession,
      method: 'POST'
    })
      .then(function(response) {
        $scope.newSession = {};
        $scope.group.sessions.push(response.data);
      }).
      catch(function(error) {
        console.log('Create session error: ' + error.data.message + ' ' + error.status);
      });
  };

  $scope.groupName.name = $stateParams.groupName;
  if ($stateParams.isMember) {
    $scope.isMember = $stateParams.isMember;
  }

  var endPoint = BACKEND_URL + 'group/single';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint, {
    params: {name: $scope.groupName.name}
  })
    .then(function(response) {
      $scope.group = response.data;
    });
})

.controller('GroupsCtrl', function($scope, $auth, $http, $ionicPopup, $location, $state, BACKEND_URL) {

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
        $state.go('app.group', {groupName: response, isMember: true});
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.goToGroup = function(group) {
    $state.go('app.group', {groupName: group.name, isMember: group.isMember});
  };

  var endPoint = BACKEND_URL + 'group/all';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint)
    .then(function(response) {
      $scope.groups = response.data;
    });
})

.controller('SessionsCtrl', function($scope, $auth, $http, $ionicPopup, $location, BACKEND_URL) {

  // Local vars
  $scope.newSession = {};
  $scope.sessions = [];

  $scope.createSession = function() {
    if ((!$scope.newSession) || ($scope.newSession.title == "")) {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Type a title for the new session'
      });
      return;
    }
    $http({
      url: BACKEND_URL + 'session/create',
      data: $scope.newSession,
      method: 'POST'
    })
      .then(function(response) {
        $scope.newSession = {};
        console.log('Created session: ' + JSON.stringify(response));
        $scope.sessions.push(response.data);
      }).
      catch(function(error) {
        console.log('Create session error: ' + error.data.message + ' ' + error.status);
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  // Get all existing sessions on page load
  $http.get(BACKEND_URL + 'session/all')
    .then(function(response) {
      $scope.sessions = response.data;
      for (i = 0; i < $scope.sessions.length; i++) {
        $scope.sessions[i].groupStr = "";
        if ($scope.sessions[i].groupName) {
          $scope.sessions[i].groupStr = ", group name: " + $scope.sessions[i].groupName;
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
