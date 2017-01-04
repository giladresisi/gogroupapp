angular.module('controllers', [])

.controller('AppCtrl', function($scope, $auth) {

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

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
})

.controller('LogoutCtrl', function($scope, $ionicPopup, $auth, $state, $ionicHistory) {

  // Make sure the user is currently authenticated (else - do nothing)
  if (!$auth.isAuthenticated()) {
    return;
  }

  // Log out current user using auth module
  $auth.logout()
    .then(function() {
      $ionicPopup.alert({
        title: 'Success',
        content: 'Logged out!'
      });
      
      // Erase history so when navigating to home page there won't be a back button icon
      $ionicHistory.nextViewOptions({
        historyRoot: true
      });

      // Navigate back to home page using the ap states
      $state.go('app.playlists');
    });
})

.controller('SignupCtrl', function($scope, $ionicPopup, $auth, $state, $ionicHistory) {

  $scope.signupData = {};

  // Perform the signup action when the user submits the signup form
  $scope.doSignup = function() {

    // Login using the auth module
    $auth.signup($scope.signupData)
      .then(function(response) {
        $auth.setToken(response);
        $ionicPopup.alert({
          title: 'Success',
          content: 'Successful email & pass signup!'
        });

        // Erase history so when navigating to home page there won't be a back button icon
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });

        // Navigate back to home page using the ap states
        $state.go('app.playlists');
      })
      .catch(function(response) {
        $ionicPopup.alert({
          title: 'Error',
          content: response.data.message
        });
      });
  };
})

.controller('LoginCtrl', function($scope, $ionicPopup, $auth, $state, $ionicHistory) {

  // Init login data structs
  $scope.loginData = {};

  // Go back to home page after successful login / authentication
  $scope.closeLogin = function() {

    // Erase history so when navigating to home page there won't be a back button icon
    $ionicHistory.nextViewOptions({
      historyRoot: true
    });

    // Navigate back to home page using the ap states
    $state.go('app.playlists');
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    // Login using the auth module
    $auth.login($scope.loginData)
      .then(function() {
        $ionicPopup.alert({
          title: 'Success',
          content: 'Successful email & pass login!'
        });

        // Navigate back to home page after successful login
        $scope.closeLogin();
      })
      .catch(function(error) {
        $ionicPopup.alert({
          title: 'Error',
          content: error.data.message + error.status
        });
      });
  };

  // Authenticate current visitor with external auth provider
  $scope.authenticate = function(provider) {

    // Authenticate with provider using the auth module
    $auth.authenticate(provider)
      .then(function() {
        $ionicPopup.alert({
          title: 'Success',
          content: 'Successful auth with ' + provider + '!'
        });

        // Navigate back to home page after successful authentication
        $scope.closeLogin();
      })
      .catch(function(error) {
        $ionicPopup.alert({
          title: 'Error',
          content: error.message || (error.data && error.data.message) || error
        });
      });
  };
});
