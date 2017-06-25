angular.module('controllers', ['ion-datetime-picker'])

.controller('AppCtrl', function($scope, $auth, $http, $ionicModal, $state, $stateParams, $ionicNavBarDelegate, $ionicPopover, BACKEND_URL) {

  var unregisterOnStateChangeSuccess = null;

  $scope.user = {
    // ALPHA_NO_GROUPS
    // firstName: 'אורח',
    // nUnseen: 0
    firstName: 'אורח'
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
        // ALPHA_NO_GROUPS
        // if ($state.is('app.gs')) {
        //   $scope.removeBackdrops();
        //   $state.go('app.sessions', {}, {reload: true});
        // } else {
          unregisterOnStateChangeSuccess();
          $scope.removeBackdrops();
          $state.reload();
        // } ALPHA_NO_GROUPS
      });
  };

  // Perform the signup action when the user submits the signup form
  $scope.doSignup = function() {
    $auth.signup($scope.signupData)
      .then(function(response) {
        $auth.setToken(response);
        $scope.closeSignup();
        unregisterOnStateChangeSuccess();
        $scope.removeBackdrops();
        $state.reload();
      });
  };  

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $auth.login($scope.loginData)
      .then(function() {
        $scope.closeLogin();
        unregisterOnStateChangeSuccess();
        $scope.removeBackdrops();
        $state.reload();
      });
  };

  // Authenticate current visitor with external auth provider
  $scope.authenticate = function(provider) {
    $auth.authenticate(provider)
      .then(function() {
        $scope.closeLogin();
        unregisterOnStateChangeSuccess();
        $scope.removeBackdrops();
        $state.reload();
      });
  };

  // Check if the current visitor is an authenticated user
  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  // ALPHA_NO_GROUPS
  // $scope.isStateIncluding = function(stateSubstring) {
  //   return new RegExp(stateSubstring).test($state.$current.name);
  // }
  //
  // $scope.unseenSessionsExist = function() {
  //   return ($scope.user.nUnseen > 0);
  // };

  $scope.onStateChangeSuccess = function(event, toState, toParams, fromState, fromParams) {
    // ALPHA_NO_GROUPS
    // if (toState.name == 'app.gs') {
    //   $scope.user.nUnseen = 0;
    // } else {
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
    // } ALPHA_NO_GROUPS
  };

  $scope.removeBackdrops = function() {
    if ($scope.loginModal) {
      $scope.loginModal.remove()
        .then(function() {
          $scope.loginModal = null;
        });
    }
    if ($scope.signupModal) {
      $scope.signupModal.remove()
        .then(function() {
          $scope.signupModal = null;
        });
    }
    if ($scope.userPopover) {
      $scope.userPopover.remove()
        .then(function() {
          $scope.userPopover = null;
        });
    }
  };

  $scope.reload = function() {
    unregisterOnStateChangeSuccess();
    $scope.removeBackdrops();
    $state.reload();
  };

  $scope.$on('$ionicView.enter', function(e) {
    $ionicNavBarDelegate.showBar(true);
  });

  $scope.$on('$stateChangeStart', function() {
    $scope.removeBackdrops();
  });

  unregisterOnStateChangeSuccess = $scope.$on('$stateChangeSuccess', $scope.onStateChangeSuccess);
})

// ALPHA_NO_GROUPS
// .controller('GroupCtrl', function($scope, $auth, $http, $ionicPopup,
//   $ionicModal, $stateParams, $state, $ionicHistory, $filter, ACTIVITY_TYPES, BACKEND_URL) {

//   $scope.groupId = null;
//   $scope.group = {};
//   $scope.showMineOnly = false;
//   $scope.activityTypes = ACTIVITY_TYPES;
//   $scope.loaded = false;

//   $ionicModal.fromTemplateUrl('templates/newSession.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.newSessionModal = modal;
//   });

//   $scope.closeNewSessionModal = function() {
//     $scope.newSessionModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.showNewSessionModal = function() {
//     var newSessionDatetime = new Date();
//     newSessionDatetime.setMinutes(Math.ceil(newSessionDatetime.getMinutes() / 15) * 15);
//     $scope.newSession = {};
//     $scope.newSession.datetime = newSessionDatetime;
//     $scope.newSession.type = $scope.group.type;
//     $scope.newSession.location = $scope.group.homebase;
//     $scope.newSession.extraDetails = '';
//     $scope.newSessionModal.show()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.createNewSession = function() {
//     if ((!$scope.newSession.location) || ($scope.newSession.location == '')) {
//       $ionicPopup.alert({
//         title: 'תקלה',
//         content: "<center>הקלד מיקום לפעילות</center>"
//       });
//       return;
//     }
//     if ($scope.newSession.location.length > 15) {
//       $ionicPopup.alert({
//         title: 'תקלה',
//         content: "<center>אורך מחרוזת המיקום חייב להיות 15 תווים לכל היותר</center>"
//       });
//       return;
//     }
//     if ($scope.newSession.datetime < new Date()) {
//       $ionicPopup.alert({
//         title: 'תקלה',
//         content: "<center>זמן הפעילות חייב להיות בעתיד</center>"
//       });
//       return;
//     }
//     if ($scope.newSession.type.length > 15) {
//       $ionicPopup.alert({
//         title: 'תקלה',
//         content: "<center>אורך מחרוזת סוג הפעילות חייב להיות 15 תווים לכל היותר</center>"
//       });
//       return;
//     }

//     $scope.newSession.groupId = $scope.groupId;
//     var newSession = $scope.newSession;
//     newSession.datetimeMS = newSession.datetime.getTime();
//     delete newSession.datetime;
//     $http({
//       url: BACKEND_URL + 'session/create',
//       data: newSession,
//       method: 'POST'
//     })
//       .then(function(response) {
//         $scope.closeNewSessionModal();
//         var s = response.data;
//         s.datetime = new Date(s.datetimeMS);
//         s.datetimeStr = $filter('date')(s.datetime, "dd.MM, H:mm");
//         $scope.group.nUpcoming += 1;
//         var i = $scope.group.sessions.findIndex(function(session) {
//           return (session.datetimeMS > s.datetimeMS);
//         });
//         if (i != -1) {
//           $scope.group.sessions.splice(i, 0, s);
//           $scope.showSessionInfo($scope.group.sessions[i]);
//         } else {
//           $scope.group.sessions.push(s);
//           $scope.showSessionInfo($scope.group.sessions[$scope.group.sessions.length - 1]);
//         }
//       });
//   };

//   $ionicModal.fromTemplateUrl('templates/sessionInfo.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.sessionInfoModal = modal;
//   });

//   $scope.showSessionInfo = function(session) {
//     if (!$scope.selectedSession ||
//         ($scope.selectedSession._id.toString() != session._id.toString())) {
//       $scope.selectedSession = session;
//       $scope.selectedSession.groupId = $scope.groupId;
//       $scope.selectedSession.groupName = $scope.group.name;
//     }
//     $scope.sessionInfoModal.show()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.closeSessionInfo = function() {
//     $scope.sessionInfoModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.goToGroup = function(groupId) {
//     $scope.closeSessionInfo();
//     $scope.closeGroupInfo();
//   }

//   $scope.isAuthenticated = function() {
//     return $auth.isAuthenticated();
//   };

//   $scope.onMembershipChange = function(group) {
//     if ($scope.group.isMember) {
//       $scope.group.nMembers += 1;
//       $http({
//         url: BACKEND_URL + 'group/join',
//         data: {groupId: $scope.groupId},
//         method: 'POST'
//       })
//         .then(function(response) {
//           if ($scope.group.members) {
//             $scope.group.members.push(response.data);
//           }
//         });
//     } else {
//       $scope.group.nMembers -= 1;
//       $http({
//         url: BACKEND_URL + 'group/leave',
//         data: {groupId: $scope.groupId},
//         method: 'POST'
//       })
//         .then(function() {
//           if ($scope.group.members) {
//             $scope.group.members =
//               $scope.group.members.filter(function(member) {
//                 return (member._id.toString() != $scope.userId);
//               });
//           }
//         });
//     }
//   };

//   $scope.onParticipationChange = function(session) {
//     if (session.isParticipant) {
//       session.nParticipants += 1;
//       $http({
//         url: BACKEND_URL + 'session/join',
//         data: {sessionId: session._id},
//         method: 'POST'
//       })
//         .then(function(response) {
//           if ($scope.selectedSession &&
//               $scope.selectedSession.participants) {
//             $scope.selectedSession.participants.push(response.data);
//           }
//         });
//     } else if (session.isOrganizer) {
//       $ionicPopup.confirm({
//         title: 'בטוח? אתה המארגן',
//         template: "<center>אם לא תאשר הגעה הפעילות כולה תתבטל</center>"
//       })
//         .then(function(res) {
//           if (!res) {
//             session.isParticipant = true;
//             return;
//           } else {
//             $scope.group.sessions.splice($scope.group.sessions.findIndex(function(s) {
//               return (s._id.toString() == session._id.toString());
//             }), 1);
//             $scope.closeSessionParticipants();
//             $scope.closeSessionInfo();
//             $http({
//               url: BACKEND_URL + 'session/leave',
//               data: {sessionId: session._id, isOrganizer: true},
//               method: 'POST'
//             });
//           }
//         });
//     } else {
//       session.nParticipants -= 1;
//       $http({
//         url: BACKEND_URL + 'session/leave',
//         data: {sessionId: session._id},
//         method: 'POST'
//       })
//         .then(function() {
//           if ($scope.selectedSession &&
//               $scope.selectedSession.participants) {
//             $scope.selectedSession.participants =
//               $scope.selectedSession.participants.filter(function(participant) {
//                 return (participant._id.toString() != $scope.userId);
//               });
//           }
//         });
//     }
//   };

//   $ionicModal.fromTemplateUrl('templates/groupInfo.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.groupInfoModal = modal;
//   });

//   $scope.showGroupInfo = function(group) {
//     $scope.groupInfoModal.show()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.closeGroupInfo = function() {
//     $scope.groupInfoModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $ionicModal.fromTemplateUrl('templates/groupMembers.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.groupMembersModal = modal;
//   });

//   $scope.showGroupMembers = function() {
//     $scope.groupInfoModal.hide()
//       .then(function() {
//         $scope.groupMembersModal.show()
//           .then(function() {
//             if (!$scope.group.members) {
//               var endPoint = BACKEND_URL + 'group/members';
//               $http.get(endPoint, {
//                 params: {groupId: $scope.group._id.toString()}
//               })
//                 .then(function(response) {
//                   $scope.group.members = response.data.members;
//                 });
//             }
//           });
//       });
//   };

//   $scope.closeGroupMembers = function() {
//     $scope.groupMembersModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.backToGroupInfo = function() {
//     $scope.groupMembersModal.hide()
//       .then(function() {
//         $scope.groupInfoModal.show()
//           .then(function() {
//             return;
//           });
//       })
//   };

//   $ionicModal.fromTemplateUrl('templates/sessionParticipants.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.sessionParticipantsModal = modal;
//   });

//   $scope.showSessionParticipants = function() {
//     $scope.sessionInfoModal.hide()
//       .then(function() {
//         $scope.sessionParticipantsModal.show()
//           .then(function() {
//             if (!$scope.selectedSession.participants) {
//               var endPoint = BACKEND_URL + 'session/single';
//               if ($scope.isAuthenticated()) {
//                 endPoint += '/user';
//               }
//               $http.get(endPoint, {
//                 params: {sessionId: $scope.selectedSession._id.toString()}
//               })
//                 .then(function(response) {
//                   $scope.selectedSession.participants = response.data.participants;
//                 });
//             }
//           });
//       });
//   };

//   $scope.closeSessionParticipants = function() {
//     $scope.sessionParticipantsModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.backToSessionInfo = function() {
//     $scope.sessionParticipantsModal.hide()
//       .then(function() {
//         $scope.sessionInfoModal.show()
//           .then(function() {
//             return;
//           });
//       })
//   };

//   $scope.sessionIcon = function(session) {
//     if (session.isOrganizer) {
//       return 'icon ion-android-people balanced';
//     } else {
//       return 'icon ion-android-people positive';
//     }
//   };

//   $scope.$on('$stateChangeStart', function() {
//     $scope.groupInfoModal.hide();
//     $scope.sessionInfoModal.hide();
//     $scope.newSessionModal.hide();
//     $scope.groupMembersModal.hide();
//     $scope.sessionParticipantsModal.hide();
//   });

//   $scope.groupId = $stateParams.groupId;

//   if ($scope.groupId == null) {
//     $ionicHistory.nextViewOptions({
//       disableBack: true
//     });
//     $state.go('app.groups', {}, {reload:true});

//   } else {

//     $scope.group = $stateParams.group;
//     if ($scope.group != null) {
//       $scope.group.sessions = [];
//     }

//     var endPoint = BACKEND_URL + 'group/single';

//     if ($scope.isAuthenticated()) {
//       endPoint += '/user';
//       $scope.userId = $auth.getPayload().sub.toString();
//     }

//     $http.get(endPoint, {
//       params: {groupId: $scope.groupId}
//     })
//       .then(function(response) {
//         $scope.loaded = true;
//         $scope.group = response.data;
//         if ($scope.group.isMember == null) {
//           $scope.group.isMember = false;
//         }
//         $scope.group.sessions.forEach(function(session, index, arr) {
//           arr[index].datetime = new Date(session.datetimeMS);
//           arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
//         });
//       });
//   }
// })

// .controller('GroupsCtrl', function($scope, $auth, $http, $ionicPopup, $ionicModal, $state, ACTIVITY_TYPES, BACKEND_URL) {

//   // Local vars
//   $scope.groups = [];
//   $scope.showMineOnly = false;
//   $scope.activityTypes = ACTIVITY_TYPES;
//   $scope.loaded = false;

//   $ionicModal.fromTemplateUrl('templates/newGroup.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.newGroupModal = modal;
//   });

//   $scope.closeNewGroupModal = function() {
//     $scope.newGroupModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.showNewGroupModal = function() {
//     $scope.newGroup = {};
//     $scope.newGroup.name = '';
//     $scope.newGroup.type = "<בחר או הקלד סוג פעילות קבוע>";
//     $scope.newGroup.homebase = '';
//     $scope.newGroup.extraDetails = '';
//     $scope.newGroupModal.show()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.createNewGroup = function() {
//     if ((!$scope.newGroup.name) || ($scope.newGroup.name == '') ||
//         (!$scope.newGroup.homebase) || ($scope.newGroup.homebase == '')) {
//       $ionicPopup.alert({
//         title: 'תקלה',
//         content: "<center>הקלד שם ומקום מפגש קבוע לקבוצה</center>"
//       });
//       return;
//     }
//     if (($scope.newGroup.name.length > 15) ||
//         ($scope.newGroup.homebase.length > 15)) {
//       $ionicPopup.alert({
//         title: 'תקלה',
//         content: "<center>אורכי שם קבוצה ומקום מפגש קבוע חייב להיות עד 15 תווים</center>"
//       });
//       return;
//     }
//     if ($scope.newSession.type.length > 15) {
//       $ionicPopup.alert({
//         title: 'תקלה',
//         content: "<center>אורך מחרוזת סוג הפעילות הקבוע חייב להיות 15 תווים לכל היותר</center>"
//       });
//       return;
//     }
    
//     $http({
//       url: BACKEND_URL + 'group/create',
//       data: $scope.newGroup,
//       method: 'POST'
//     })
//       .then(function(response) {
//         $scope.closeNewGroupModal();
//         $state.go('app.group', {groupId: response.data._id, group: response.data}, {reload: true});
//       });
//   };

//   $scope.isAuthenticated = function() {
//     return $auth.isAuthenticated();
//   };

//   $ionicModal.fromTemplateUrl('templates/groupInfo.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.groupInfoModal = modal;
//   });

//   $scope.showGroupInfo = function(group) {
//     $scope.group = group;
//     $scope.groupInfoModal.show()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.closeGroupInfo = function() {
//     $scope.groupInfoModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.goToGroup = function(group) {
//     $state.go('app.group', {groupId: group._id, group: group}, {reload: true});
//     $scope.closeGroupInfo();
//   };
  
//   $scope.onMembershipChange = function(group) {
//     if (group.isMember) {
//       group.nMembers += 1;
//       $http({
//         url: BACKEND_URL + 'group/join',
//         data: {groupId: group._id},
//         method: 'POST'
//       })
//         .then(function(response) {
//           if ($scope.group.members) {
//             $scope.group.members.push(response.data);
//           }
//         });
//     } else {
//       group.nMembers -= 1;
//       $http({
//         url: BACKEND_URL + 'group/leave',
//         data: {groupId: group._id},
//         method: 'POST'
//       })
//         .then(function() {
//           if ($scope.group.members) {
//             $scope.group.members =
//               $scope.group.members.filter(function(member) {
//                 return (member._id.toString() != $scope.userId);
//               });
//           }
//         });
//     }
//   }

//   $ionicModal.fromTemplateUrl('templates/groupMembers.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.groupMembersModal = modal;
//   });

//   $scope.showGroupMembers = function() {
//     $scope.groupInfoModal.hide()
//       .then(function() {
//         $scope.groupMembersModal.show()
//           .then(function() {
//             if (!$scope.group.members) {
//               var endPoint = BACKEND_URL + 'group/members';
//               $http.get(endPoint, {
//                 params: {groupId: $scope.group._id.toString()}
//               })
//                 .then(function(response) {
//                   $scope.group.members = response.data.members;
//                 });
//             }
//           });
//       });
//   };

//   $scope.closeGroupMembers = function() {
//     $scope.groupMembersModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.backToGroupInfo = function() {
//     $scope.groupMembersModal.hide()
//       .then(function() {
//         $scope.groupInfoModal.show()
//           .then(function() {
//             return;
//           });
//       })
//   };

//   $scope.$on('$stateChangeStart', function() {
//     $scope.newGroupModal.hide();
//     $scope.groupInfoModal.hide();
//     $scope.groupMembersModal.hide();
//   });

//   var endPoint = BACKEND_URL + 'group/all';

//   if ($scope.isAuthenticated()) {
//     endPoint += '/user';
//     $scope.userId = $auth.getPayload().sub.toString();
//   }

//   console.log("Groups loading");

//   $http.get(endPoint)
//     .then(function(response) {
//       console.log("Groups loaded");
//       $scope.loaded = true;
//       $scope.groups = response.data;
//     });
// })

.controller('SessionsCtrl', function($scope, $auth, $http, $state, $ionicPopup, $ionicModal, $filter, ACTIVITY_TYPES, BACKEND_URL) {

  // Local vars
  $scope.sessions = [];
  $scope.showMineOnly = false;
  $scope.activityTypes = ACTIVITY_TYPES;
  $scope.loaded = false;

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
    $scope.loginModal.show()
      .then(function() {
        return;
      });
  };

  // Perform the signup action when the user submits the signup form
  $scope.doSignup = function() {
    $auth.signup($scope.signupData)
      .then(function(response) {
        $auth.setToken(response);
        $scope.closeSignup();
        $scope.removeBackdrops();
        $state.reload();
      });
  };  

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $auth.login($scope.loginData)
      .then(function() {
        $scope.closeLogin();
        $scope.removeBackdrops();
        $state.reload();
      });
  };

  // Authenticate current visitor with external auth provider
  $scope.authenticate = function(provider) {
    $auth.authenticate(provider)
      .then(function() {
        $scope.closeLogin();
        $scope.removeBackdrops();
        $state.reload();
      });
  };

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
    $scope.yearFromNow = new Date();
    $scope.yearFromNow.setFullYear($scope.yearFromNow.getFullYear() + 1);
    $scope.newSession = {};
    $scope.newSession.type = "<בחר או הקלד סוג פעילות>";
    $scope.newSession.location = '';
    $scope.newSession.extraDetails = '';
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
        content: "<center>הקלד מיקום לפעילות</center>"
      });
      return;
    }
    if ($scope.newSession.location.length > 15) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: "<center>אורך מחרוזת המיקום חייב להיות 15 תווים לכל היותר</center>"
      });
      return;
    }
    if (!$scope.newSession.datetime) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: "<center>בחר תאריך ושעה לפעילות</center>"
      });
      return;
    }
    if (($scope.newSession.datetime < new Date()) || ($scope.newSession.datetime > $scope.yearFromNow)) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: "<center>זמן הפעילות חייב להיות בעתיד ובשנה הקרובה</center>"
      });
      return;
    }
    if ($scope.newSession.type.length > 15) {
      $ionicPopup.alert({
        title: 'תקלה',
        content: "<center>אורך מחרוזת סוג הפעילות חייב להיות 15 תווים לכל היותר</center>"
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
        s.isOrganizer = true;
        s.organizerMark = '* ';
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

  function sessionIsSelectedWithParticipants(session) {
    return ($scope.selectedSession &&
            ($scope.selectedSession._id.toString() == session._id.toString()) &&
            $scope.selectedSession.participants);
  }

  $scope.onParticipationChange = function(session) {
    if (session.isParticipant) {
      session.nParticipants += 1;
      $http({
        url: BACKEND_URL + 'session/join',
        data: {sessionId: session._id},
        method: 'POST'
      })
        .then(function(response) {
          if (sessionIsSelectedWithParticipants(session)) {
            $scope.selectedSession.participants.push(response.data);
          }
        });
    } else if (session.isOrganizer) {
      $ionicPopup.confirm({
        title: 'בטוח? אתה המארגן',
        template: "<center>אם לא תאשר הגעה הפעילות כולה תתבטל</center>"
      })
        .then(function(res) {
          if (!res) {
            session.isParticipant = true;
            return;
          } else {
            $scope.sessions.splice($scope.sessions.findIndex(function(s) {
              return (s._id.toString() == session._id.toString());
            }), 1);
            $scope.closeSessionParticipants();
            $scope.closeSessionInfo();
            $http({
              url: BACKEND_URL + 'session/leave',
              data: {sessionId: session._id, isOrganizer: true},
              method: 'POST'
            });
          }
        });
    } else {
      session.nParticipants -= 1;
      if (sessionIsSelectedWithParticipants(session)) {
        $scope.selectedSession.participants =
          $scope.selectedSession.participants.filter(function(participant) {
            return (participant._id.toString() != $scope.userId);
          });
      }
      $http({
        url: BACKEND_URL + 'session/leave',
        data: {sessionId: session._id, isOrganizer: false},
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
    if (!$scope.selectedSession ||
        ($scope.selectedSession._id.toString() != session._id.toString())) {
      $scope.selectedSession = session;
    }
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

  $ionicModal.fromTemplateUrl('templates/sessionParticipants.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.sessionParticipantsModal = modal;
  });

  $scope.showSessionParticipants = function() {
    $scope.sessionInfoModal.hide()
      .then(function() {
        $scope.sessionParticipantsModal.show()
          .then(function() {
            if (!$scope.selectedSession.participants) {
              var endPoint = BACKEND_URL + 'session/single';
              if ($scope.isAuthenticated()) {
                endPoint += '/user';
              }
              $http.get(endPoint, {
                params: {sessionId: $scope.selectedSession._id.toString()}
              })
                .then(function(response) {
                  $scope.selectedSession.participants = response.data.participants;
                });
            }
          });
      });
  };

  $scope.closeSessionParticipants = function() {
    $scope.sessionParticipantsModal.hide()
      .then(function() {
        return;
      });
  };

  $scope.backToSessionInfo = function() {
    $scope.sessionParticipantsModal.hide()
      .then(function() {
        $scope.sessionInfoModal.show()
          .then(function() {
            return;
          });
      })
  };

  // ALPHA_NO_GROUPS
  // $scope.goToGroup = function(groupId) {
  //   $scope.closeSessionInfo();
  //   $state.go('app.group', {groupId: groupId}, {reload: true});
  // };

  $scope.sessionIcon = function(session) {
    if (session.isOrganizer) {
      return 'icon ion-android-people balanced';
    } else {
      return 'icon ion-android-people positive';
    }
  };

  $scope.removeBackdrops = function() {
    if ($scope.newSessionModal) {
      $scope.newSessionModal.remove()
        .then(function() {
          $scope.newSessionModal = null;
        });
    }
    if ($scope.sessionInfoModal) {
      $scope.sessionInfoModal.remove()
        .then(function() {
          $scope.sessionInfoModal = null;
        });
    }
    if ($scope.sessionParticipantsModal) {
      $scope.sessionParticipantsModal.remove()
        .then(function() {
          $scope.sessionParticipantsModal = null;
        });
    }
    if ($scope.loginModal) {
      $scope.loginModal.remove()
        .then(function() {
          $scope.loginModal = null;
        });
    }
    if ($scope.signupModal) {
      $scope.signupModal.remove()
        .then(function() {
          $scope.signupModal = null;
        });
    }
  };

  $scope.$on('$stateChangeStart', function() {
    $scope.removeBackdrops();
  });

  var endPoint = BACKEND_URL + 'session/all';

  if ($scope.isAuthenticated()) {
    endPoint += '/user';
    $scope.userId = $auth.getPayload().sub.toString();
  }

  console.log("Sessions loading");

  $http.get(endPoint)
    .then(function(response) {
      console.log("Sessions loaded");
      $scope.loaded = true;
      $scope.sessions = response.data;
      $scope.sessions.forEach(function(session, index, arr) {
        arr[index].datetime = new Date(session.datetimeMS);
        arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
      });
    });
})

// ALPHA_NO_GROUPS
// .controller('GroupSessionsCtrl', function($scope, $auth, $http, $state, $ionicModal, $ionicPopup, $filter, ACTIVITY_TYPES, BACKEND_URL) {

//   // Local vars
//   $scope.unseen = [];
//   $scope.seen = [];
//   $scope.showMineOnly = false;
//   $scope.loaded = false;

//   $scope.isAuthenticated = function() {
//     return $auth.isAuthenticated();
//   };

//   function sessionIsSelectedWithParticipants(session) {
//     return ($scope.selectedSession &&
//             ($scope.selectedSession._id.toString() == session._id.toString()) &&
//             $scope.selectedSession.participants);
//   }

//   $scope.onParticipationChange = function(session) {
//     if (session.isParticipant) {
//       session.nParticipants += 1;
//       $http({
//         url: BACKEND_URL + 'session/join',
//         data: {sessionId: session._id},
//         method: 'POST'
//       })
//         .then(function(response) {
//           if (sessionIsSelectedWithParticipants(session)) {
//             $scope.selectedSession.participants.push(response.data);
//           }
//         });
//     } else if (session.isOrganizer) {
//       $ionicPopup.confirm({
//         title: 'בטוח? אתה המארגן',
//         template: "<center>אם לא תאשר הגעה הפעילות כולה תתבטל</center>"
//       })
//         .then(function(res) {
//           if (!res) {
//             session.isParticipant = true;
//             return;
//           } else {
//             if (session.unseen) {
//               $scope.unseen.splice($scope.unseen.findIndex(function(s) {
//                 return (s._id.toString() == session._id.toString());
//               }), 1);
//             } else {
//               $scope.seen.splice($scope.seen.findIndex(function(s) {
//                 return (s._id.toString() == session._id.toString());
//               }), 1);
//             }
//             $scope.closeSessionParticipants();
//             $scope.closeSessionInfo();
//             $http({
//               url: BACKEND_URL + 'session/leave',
//               data: {sessionId: session._id, isOrganizer: true},
//               method: 'POST'
//             });
//           }
//         });
//     } else {
//       session.nParticipants -= 1;
//       if (sessionIsSelectedWithParticipants(session)) {
//         $scope.selectedSession.participants =
//           $scope.selectedSession.participants.filter(function(participant) {
//             return (participant._id.toString() != $scope.userId);
//           });
//       }
//       $http({
//         url: BACKEND_URL + 'session/leave',
//         data: {sessionId: session._id, isOrganizer: false},
//         method: 'POST'
//       });
//     }
//   };

//   $scope.onParticipationChange = function(session) {
//     if (session.isParticipant) {
//       session.nParticipants += 1;
//       $http({
//         url: BACKEND_URL + 'session/join',
//         data: {sessionId: session._id},
//         method: 'POST'
//       });
//     } else {
//       session.nParticipants -= 1;
//       $http({
//         url: BACKEND_URL + 'session/leave',
//         data: {sessionId: session._id},
//         method: 'POST'
//       });
//     }
//   }

//   $ionicModal.fromTemplateUrl('templates/sessionInfo.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.sessionInfoModal = modal;
//   });

//   $scope.showSessionInfo = function(session) {
//     $scope.selectedSession = session;
//     $scope.sessionInfoModal.show()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.closeSessionInfo = function() {
//     $scope.sessionInfoModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.goToGroup = function(groupId) {
//     $state.go('app.group', {groupId: groupId}, {reload: true});
//     $scope.closeSessionInfo();
//   }

//   $ionicModal.fromTemplateUrl('templates/sessionParticipants.html', {
//     scope: $scope
//   }).then(function(modal) {
//     $scope.sessionParticipantsModal = modal;
//   });

//   $scope.showSessionParticipants = function() {
//     $scope.sessionInfoModal.hide()
//       .then(function() {
//         $scope.sessionParticipantsModal.show()
//           .then(function() {
//             var endPoint = BACKEND_URL + 'session/single/user';
//             $http.get(endPoint, {
//               params: {sessionId: $scope.selectedSession._id.toString()}
//             })
//               .then(function(response) {
//                 $scope.selectedSession.participants = response.data.participants;
//               });
//           });
//       });
//   };

//   $scope.closeSessionParticipants = function() {
//     $scope.sessionParticipantsModal.hide()
//       .then(function() {
//         return;
//       });
//   };

//   $scope.backToSessionInfo = function() {
//     $scope.sessionParticipantsModal.hide()
//       .then(function() {
//         $scope.sessionInfoModal.show()
//           .then(function() {
//             return;
//           });
//       })
//   };

//   $scope.sessionIcon = function(session) {
//     if (session.isOrganizer) {
//       return 'icon ion-android-people balanced';
//     } else {
//       return 'icon ion-android-people positive';
//     }
//   };

//   $scope.$on('$stateChangeStart', function() {
//     $scope.sessionInfoModal.hide();
//     $scope.sessionParticipantsModal.hide();
//   });

//   $scope.userId = $auth.getPayload().sub.toString();

//   console.log("Group Sessions loading");

//   $http.get(BACKEND_URL + 'user/groups/sessions')
//     .then(function(response) {
//       console.log("Group Sessions loaded");
//       $scope.loaded = true;
//       $scope.unseen = response.data.unseen;
//       $scope.seen = response.data.seen;
//       $scope.unseen.forEach(function(session, index, arr) {
//         arr[index].datetime = new Date(session.datetimeMS);
//         arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
//       });
//       $scope.seen.forEach(function(session, index, arr) {
//         arr[index].datetime = new Date(session.datetimeMS);
//         arr[index].datetimeStr = $filter('date')(arr[index].datetime, "dd.MM, H:mm");
//       });
//     });
// });
