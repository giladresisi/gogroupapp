angular.module('controllers', ['ion-datetime-picker'])

.controller('AppCtrl', function($scope, $auth, $http, $ionicModal, $state, $ionicNavBarDelegate, $ionicPopover, BACKEND_URL) {

  $scope.user = {
    firstName: 'אורח',
    nUnseen: 0
  }

  $ionicPopover.fromTemplateUrl('templates/userMenu.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.userPopover = popover;
  });

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
    $scope.loginModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.closeSignup = function() {
    $scope.signupModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.loginToSignup = function() {
    $scope.closeLogin();
    $scope.signupData = {};
    $scope.signupModal.show()
      .then(function() {
        return;
      });
  };

  $scope.signupToLogin = function() {
    $scope.closeSignup();
    $scope.login();
  };

  $scope.login = function() {
    $scope.loginData = {};
    $scope.userPopover.hide()
      .then(function() {
        $scope.loginModal.show()
          .then(function() {
            return;
          });
      });
  };

  $scope.logout = function() {
    $auth.logout();
    $scope.userPopover.hide()
      .then(function() {
        if ($state.is('app.gs')) {
          $state.go('app.sessions');
        } else {
          $state.reload();
        }
      });
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
            $scope.user.firstName = $scope.user.displayName.substring(0, $scope.user.displayName.indexOf(" "));
          })
          .catch(function(err) {
            console.log('Error get(/user/basic): ' + JSON.stringify(err) + ', logging out...');
            $scope.logout();
          });
      } else {
        $scope.user.firstName = 'אורח';
      }
    }
  };

  $scope.$on('$ionicView.enter', function(e) {
    $ionicNavBarDelegate.showBar(true);
  });

  $scope.$on('$stateChangeStart', function() {
    $scope.userPopover.hide();
    $scope.loginModal.hide();
    $scope.signupModal.hide();
  });

  $scope.$on('$stateChangeSuccess', $scope.onStateChangeSuccess);
})

.controller('GroupCtrl', function($scope, $auth, $http, $ionicPopup,
  $ionicModal, $stateParams, $state, $ionicHistory, $filter, ACTIVITY_TYPES, BACKEND_URL) {

  $scope.groupId = null;
  $scope.group = {};
  $scope.showMineOnly = false;
  $scope.activityTypes = ACTIVITY_TYPES;

  $ionicModal.fromTemplateUrl('templates/newSession.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.newSessionModal = modal;
  });

  $scope.closeNewSessionModal = function() {
    $scope.newSessionModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.showNewSessionModal = function() {
    var newSessionDatetime = new Date();
    newSessionDatetime.setMinutes(Math.ceil(newSessionDatetime.getMinutes() / 15) * 15);
    $scope.newSession = {};
    $scope.newSession.datetime = newSessionDatetime;
    $scope.newSession.type = $scope.group.type;
    $scope.newSession.location = $scope.group.homebase;
    $scope.newSessionModal.show()
      .then(function() {
        return;
      });
  };

  $scope.createNewSession = function() {
    if ((!$scope.newSession.location) || ($scope.newSession.location == '')) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'הקלד מיקום לפעילות'
      });
      return;
    }
    if ($scope.newSession.location.length > 15) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'אורך מחרוזת המיקום חייב להיות 15 תווים לכל היותר'
      });
      return;
    }
    if ($scope.newSession.datetime < new Date()) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'זמן הפעילות חייב להיות בעתיד'
      });
      return;
    }
    if (($scope.newSession.type == $scope.activityTypes[0]) ||
        (!$scope.activityTypes.some(function(type) {return (type == $scope.newSession.type);})))
    {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'בחר סוג פעילות חוקי'
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
        var s = response.data;
        s.datetime = new Date(s.datetimeMS);
        s.datetimeStr = $filter('date')(s.datetime, "dd.MM, H:mm");
        $scope.group.nUpcoming += 1;
        var i = $scope.group.sessions.findIndex(function(session) {
          return (session.datetimeMS > s.datetimeMS);
        });
        if (i != -1) {
          $scope.group.sessions.splice(i, 0, s);
          $scope.showSessionInfo($scope.group.sessions[i]);
        } else {
          $scope.group.sessions.push(s);
          $scope.showSessionInfo($scope.group.sessions[$scope.group.sessions.length - 1]);
        }
      });
  };

  $ionicModal.fromTemplateUrl('templates/sessionInfo.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.sessionInfoModal = modal;
  });

  $scope.showSessionInfo = function(session) {
    $scope.selectedSession = session;
    $scope.selectedSession.groupId = $scope.groupId;
    $scope.selectedSession.groupName = $scope.group.name;
    $scope.sessionInfoModal.show()
      .then(function() {
        return;
      });
  };

  $scope.closeSessionInfo = function() {
    $scope.sessionInfoModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.goToGroup = function(groupId) {
    $scope.closeSessionInfo();
    $scope.closeGroupInfo();
  }

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
  };

  $ionicModal.fromTemplateUrl('templates/groupInfo.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.groupInfoModal = modal;
  });

  $scope.showGroupInfo = function(group) {
    $scope.groupInfoModal.show()
      .then(function() {
        return;
      });
  };

  $scope.closeGroupInfo = function() {
    $scope.groupInfoModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.$on('$stateChangeStart', function() {
    $scope.groupInfoModal.hide();
    $scope.sessionInfoModal.hide();
    $scope.newSessionModal.hide();
  });

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
        $scope.group.sessions.forEach(function(session, index, arr) {
          arr[index].datetime = new Date(session.datetimeMS);
          arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
        });
      });
  }
})

.controller('GroupsCtrl', function($scope, $auth, $http, $ionicPopup, $ionicModal, $state, ACTIVITY_TYPES, BACKEND_URL) {

  // Local vars
  $scope.groups = [];
  $scope.showMineOnly = false;
  $scope.activityTypes = ACTIVITY_TYPES;
  $scope.activityTypes[0] = '<בחר סוג פעילות קבוע>'

  $ionicModal.fromTemplateUrl('templates/newGroup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.newGroupModal = modal;
  });

  $scope.closeNewGroupModal = function() {
    $scope.newGroupModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.showNewGroupModal = function() {
    $scope.newGroup = {};
    $scope.newGroup.name = '';
    $scope.newGroup.type = $scope.activityTypes[0];
    $scope.newGroup.homebase = '';
    $scope.newGroupModal.show()
      .then(function() {
        return;
      });
  };

  $scope.createNewGroup = function() {
    if ((!$scope.newGroup.name) || ($scope.newGroup.name == '') ||
        (!$scope.newGroup.homebase) || ($scope.newGroup.homebase == '')) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'הקלד שם ומקום מפגש קבוע לקבוצה'
      });
      return;
    }
    if (($scope.newGroup.name.length > 15) ||
        ($scope.newGroup.homebase.length > 15)) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'אורכי שם קבוצה ומקום מפגש קבוע חייב להיות עד 15 תווים'
      });
      return;
    }
    if (($scope.newGroup.type == $scope.activityTypes[0]) ||
        (!$scope.activityTypes.some(function(type) {return (type == $scope.newGroup.type);})))
    {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'סוג הפעילות הקבוע חייב להיות חוקי'
      });
      return;
    }
    
    $http({
      url: BACKEND_URL + 'group/create',
      data: $scope.newGroup,
      method: 'POST'
    })
      .then(function(response) {
        $scope.closeNewGroupModal();
        $state.go('app.group', {groupId: response.data._id, group: response.data});
      });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $ionicModal.fromTemplateUrl('templates/groupInfo.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.groupInfoModal = modal;
  });

  $scope.showGroupInfo = function(group) {
    $scope.group = group;
    $scope.groupInfoModal.show()
      .then(function() {
        return;
      });
  };

  $scope.closeGroupInfo = function() {
    $scope.groupInfoModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.goToGroup = function(group) {
    $state.go('app.group', {groupId: group._id, group: group});
    $scope.closeGroupInfo();
  };
  
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

  $scope.$on('$stateChangeStart', function() {
    $scope.newGroupModal.hide();
    $scope.groupInfoModal.hide();
  });

  var endPoint = BACKEND_URL + 'group/all';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint)
    .then(function(response) {
      $scope.groups = response.data;
    });
})

.controller('SessionsCtrl', function($scope, $auth, $http, $state, $ionicPopup, $ionicModal, $filter, ACTIVITY_TYPES, BACKEND_URL) {

  // Local vars
  $scope.sessions = [];
  $scope.showMineOnly = false;
  $scope.activityTypes = ACTIVITY_TYPES;

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/newSession.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.newSessionModal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeNewSessionModal = function() {
    $scope.newSessionModal.hide()
      .then(function() {
        return;
      });
  };

  // Open the login modal
  $scope.showNewSessionModal = function() {
    var newSessionDatetime = new Date();
    newSessionDatetime.setMinutes(Math.ceil(newSessionDatetime.getMinutes() / 15) * 15);
    $scope.newSession = {};
    $scope.newSession.datetime = newSessionDatetime;
    $scope.newSession.type = $scope.activityTypes[0];
    $scope.newSession.location = '';
    $scope.newSessionModal.show()
      .then(function() {
        return;
      });
  };

  // Perform the login action when the user submits the login form
  $scope.createNewSession = function() {
    if ((!$scope.newSession.location) || ($scope.newSession.location == '')) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'הקלד מיקום לפעילות'
      });
      return;
    }
    if ($scope.newSession.location.length > 15) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'אורך מחרוזת המיקום חייב להיות 15 תווים לכל היותר'
      });
      return;
    }
    if ($scope.newSession.datetime < new Date()) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'זמן הפעילות חייב להיות בעתיד'
      });
      return;
    }
    if (($scope.newSession.type == $scope.activityTypes[0]) ||
        (!$scope.activityTypes.some(function(type) {return (type == $scope.newSession.type);})))
    {
      $ionicPopup.alert({
        title: 'תקלה',
        content: 'בחר סוג פעילות חוקי'
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
        var s = response.data;
        s.datetime = new Date(s.datetimeMS);
        s.datetimeStr = $filter('date')(s.datetime, "dd.MM, H:mm");
        var i = $scope.sessions.findIndex(function(session) {
          return (session.datetimeMS > s.datetimeMS);
        });
        if (i != -1) {
          $scope.sessions.splice(i, 0, s);
          $scope.showSessionInfo($scope.sessions[i]);
        } else {
          $scope.sessions.push(s);
          $scope.showSessionInfo($scope.sessions[$scope.sessions.length - 1]);
        }
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

  $ionicModal.fromTemplateUrl('templates/sessionInfo.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.sessionInfoModal = modal;
  });

  $scope.showSessionInfo = function(session) {
    $scope.selectedSession = session;
    $scope.sessionInfoModal.show()
      .then(function() {
        return;
      });
  };

  $scope.closeSessionInfo = function() {
    $scope.sessionInfoModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.goToGroup = function(groupId) {
    $scope.closeSessionInfo();
    $state.go('app.group', {groupId: groupId});
  };

  $scope.$on('$stateChangeStart', function() {
    $scope.newSessionModal.hide();
    $scope.sessionInfoModal.hide();
  });

  var endPoint = BACKEND_URL + 'session/all';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
  }

  $http.get(endPoint)
    .then(function(response) {
      $scope.sessions = response.data;
      $scope.sessions.forEach(function(session, index, arr) {
        arr[index].datetime = new Date(session.datetimeMS);
        arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
      });
    });
})
.controller('GroupSessionsCtrl', function($scope, $auth, $http, $state, $ionicModal, $filter, ACTIVITY_TYPES, BACKEND_URL) {

  // Local vars
  $scope.unseen = [];
  $scope.seen = [];
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

  $ionicModal.fromTemplateUrl('templates/sessionInfo.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.sessionInfoModal = modal;
  });

  $scope.showSessionInfo = function(session) {
    $scope.selectedSession = session;
    $scope.sessionInfoModal.show()
      .then(function() {
        return;
      });
  };

  $scope.closeSessionInfo = function() {
    $scope.sessionInfoModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.goToGroup = function(groupId) {
    $state.go('app.group', {groupId: groupId});
    $scope.closeSessionInfo();
  }

  $scope.$on('$stateChangeStart', function() {
    $scope.sessionInfoModal.hide();
  });

  $http.get(BACKEND_URL + 'user/groups/sessions')
    .then(function(response) {
      $scope.unseen = response.data.unseen;
      $scope.seen = response.data.seen;
      $scope.unseen.forEach(function(session, index, arr) {
        arr[index].datetime = new Date(session.datetimeMS);
        arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
      });
      $scope.seen.forEach(function(session, index, arr) {
        arr[index].datetime = new Date(session.datetimeMS);
        arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
      });
    });
});
