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
  $ionicModal, $stateParams, $state, $ionicHistory, $filter, ACTIVITY_TYPES, BACKEND_URL) {

  $scope.groupId = {};
  $scope.group = {};
  $scope.newSession = {};
  $scope.showMineOnly = false;
  $scope.activityTypes = ACTIVITY_TYPES;

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
    $scope.newSession.type = $scope.group.type;
    $scope.newSession.location = $scope.group.homebase;
    $scope.newSessionModal.show();
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
    var templateStr = 'סוג הפעילות: ' + session.type + '<br>' + 'מיקום: ' + session.location + '<br>' +
        'משתתפים: ' + session.nParticipants + '<br>' + 'מתי: ' + session.datetimeStr;
    $ionicPopup.alert({
      title: 'מידע על הפעילות',
      template: templateStr
    });
  }

  $scope.groupInfo = function() {
    var templateStr = 'שם הקבוצה: ' + $scope.group.name + '<br>' + 'סוג פעילות קבוע: ' + $scope.group.type + '<br>' + 
		'מקום מפגש קבוע: ' + $scope.group.homebase + '<br>' + 'חברים: ' + $scope.group.nMembers + '<br>' + 
		'פעילויות קרובות: ' + $scope.group.nUpcoming;
    $ionicPopup.alert({
      title: 'מידע על הקבוצה',
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
        $scope.group.sessions.forEach(function(session, index, arr) {
          arr[index].datetime = new Date(session.datetimeMS);
          arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
        });
      });
  }
})

.controller('GroupsCtrl', function($scope, $auth, $http, $ionicPopup, $ionicModal, $state, ACTIVITY_TYPES, BACKEND_URL) {

  // Local vars
  $scope.newGroup = {};
  $scope.groups = [];
  $scope.showMineOnly = false;
  $scope.activityTypes = ACTIVITY_TYPES;

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
    $scope.newGroup.type = $scope.activityTypes[0];
    $scope.newGroup.homebase = '';
    $scope.newGroupModal.show();
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
    var templateStr = 'שם הקבוצה: ' + group.name + '<br>' + 'סוג פעילות קבוע: ' + group.type + '<br>' + 
		'מקום מפגש קבוע: ' + group.homebase + '<br>' + 'חברים: ' + group.nMembers + '<br>' + 
		'פעילויות קרובות: ' + group.nUpcoming;
    $ionicPopup.alert({
      title: 'מידע על הקבוצה',
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

.controller('SessionCtrl', function($scope, $auth, $http, $stateParams, $state, $ionicHistory, $filter, BACKEND_URL) {

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
        $scope.session.datetimeStr = $filter('date')($scope.session.datetime, "dd.MM, H:mm");
        $scope.session.groupStr = '';
        if ($scope.session.groupName) {
          $scope.session.groupStr = ', group name: ' + $scope.session.groupName;
        }
      });
  }
})

.controller('SessionsCtrl', function($scope, $auth, $http, $state, $ionicPopup, $ionicModal, $filter, ACTIVITY_TYPES, BACKEND_URL) {

  // Local vars
  $scope.newSession = {};
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
    $scope.newSessionModal.hide();
  };

  // Open the login modal
  $scope.showNewSessionModal = function() {
    var newSessionDatetime = new Date();
    newSessionDatetime.setMinutes(Math.ceil(newSessionDatetime.getMinutes() / 15) * 15);
    $scope.newSession.datetime = newSessionDatetime;
    $scope.newSession.type = $scope.activityTypes[0];
    $scope.newSession.location = '';
    $scope.newSessionModal.show();
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
    var templateStr = 'סוג הפעילות: ' + session.type + '<br>' + 'מיקום: ' + session.location + '<br>' +
        'משתתפים: ' + session.nParticipants + '<br>' + 'מתי: ' + session.datetimeStr;
    if (session.groupName != null) {
      templateStr += '<br>' + 'קבוצה: ' + session.groupName;
    }
    $ionicPopup.alert({
      title: 'מידע על הפעילות',
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
      $scope.sessions.forEach(function(session, index, arr) {
        arr[index].datetime = new Date(session.datetimeMS);
        arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
      });
    });
})
.controller('GroupSessionsCtrl', function($scope, $auth, $http, $state, $ionicPopup, $filter, ACTIVITY_TYPES, BACKEND_URL) {

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

  $scope.goToSession = function(session) {
    $state.go('app.session', {sessionId: session._id, session: session});
  }

  $scope.sessionInfo = function(session) {
    var templateStr = 'סוג הפעילות: ' + session.type + '<br>' + 'מיקום: ' + session.location + '<br>' +
        'משתתפים: ' + session.nParticipants + '<br>' + 'מתי: ' + session.datetimeStr;
    if (session.groupName != null) {
      templateStr += '<br>' + 'Group: ' + session.groupName;
    }
    $ionicPopup.alert({
      title: 'מידע על הפעילות',
      template: templateStr
    });
  }

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
