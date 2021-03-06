angular.module('main', ["ngRoute"])
.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension|blob:chrome-extension):/);
}])
.controller('AppCtrl', function($scope,$location) {
    $scope.data = {
        tasks: []
    };
    $scope.window = window;
    $scope.window.questionMark = !0;
    $scope.window.settings = {}
    $scope.theme = {};
    $scope.Date = Date;
    $scope.app = {
        inputText: ''
    };
    $scope.showLoading = true;
    $scope.completedCount = 0;


    $scope.redirectTo = redirectTo = function(e){
        if(!$scope.window.settingsOnly) 
            window.location.href = '#!'+e;
        else
            window.location.href = '#!settings';
    }
    $scope.window.settingsOnly = window.location.href.includes('#!/settings')?!0:!1;
    window.location.href = '#!loading';

    $scope.listInit = function(){
        $('ul').sortable({
            forcePlaceholderSize: true,
            axis: 'y',
            handle: "span.task-mark",
            placeholder: "li-hightlight",
            items: "li:not(.ui-state-disableded)",
            cancel: "li.ui-state-disableded",
            update: function(event, el) {
                el = el.item[0];
                let id1 = $('ul > li.not-completed').index(el)
                let id2 = parseInt($(el).attr('index'));
                if(id1 > id2) id1++;
                let prev = $scope.data.tasks[id2];
                delete $scope.data.tasks[id2];
                $scope.data.tasks = [].concat($scope.data.tasks.slice(0, id1), [prev], $scope.data.tasks.slice(id1));
                $scope.arrayProc();
            }
        });
    
        // $( "ul" ).disableSelection();
    }

    $scope.filterNormal = function(e){
        return e.completed
    }






    $scope.addTask = function(e){
        var keyCode = 13;
        if(e) keyCode = e.which || e.keyCode;
        if (keyCode !== 13 || $scope.app.inputText.length < 1) return;
        $scope.data.tasks.push({
            text: $scope.app.inputText,
            completed: !1,
            dateCreated: Date.now(), 
            dateCompleted: Date.now()
        })
        $scope.app.inputText = '';
        $scope.arrayProc()
    }
    $scope.editTask = function(x, el){
        $scope.data.tasks.forEach(function(e){
            e.editable = !1; 
        })
        if(!x) return;
        $(el).closest('li').find('label')[0].contenteditable = "true";
        setTimeout(function() {
            $(el).closest('li').find('label')[0].focus()
        }, 0);
        $scope.$apply()
    }
    $scope.removeTask = function(){
        console.log(1)
    }
    $scope.task2 = function(action, el, ell){
        switch(action) {
            case 'edit':
                $scope.data.tasks.forEach(function(e){
                    e.editable = !1;
                })
                if(!el){
                    $scope.arrayProc()
                    break;
                } 
                $(ell).closest('li').find('label')[0].contenteditable = "true";
                setTimeout(function() {
                    $(ell).closest('li').find('label')[0].focus()
                }, 0);
                break;
            case 'editing':

                break;
            case 'remove':
                delete $scope.data.tasks[$scope.data.tasks.indexOf(el)];
                $scope.arrayProc();
                break;
            case 'play':
                $scope.window.task = el;
                $scope.window.flow.timing = $scope.data.flow.work;
                set({tool: action, taskNum: $scope.data.tasks.indexOf(el)})
                redirectTo("play");
                break;
            case 'pause':
                $scope.window.paused = !$scope.window.paused;
                $scope.window.ddd = new Date();
                $scope.window.ddd.setSeconds ( $scope.window.ddd.getSeconds() + ($scope.window.paused?$scope.data.flow.pause:$scope.data.flow.work));
                $scope.window.paused?set('pause'):set({tool: 'play', taskNum: $scope.data.tasks.indexOf($scope.window.task)})
                break;
            case 'stop':
                set(action)
                redirectTo('tasks');
                break;
            case 'done':
                set('stop')
                el.editable?0:el.completed=!0; 
                el.dateCompleted = Date.now(); 
                $scope.arrayProc();
                redirectTo('tasks');
                break;
            default:
                console.log('default')
        }
    }
    $scope.save = function(){
        let tasks = $scope.data.tasks
        $scope.data = angular.copy($scope.window.settings);
        $scope.data.tasks = tasks;
        Object.keys($scope.data.flow).forEach(function(key) {
          $scope.data.flow[key] = $scope.data.flow[key]*60;
        });
        set('update')
        UIkit.notification({message: "<span uk-icon='icon: check'></span> Updated", status: 'primary'});
    }
    $scope.arrayProc = function(){
        $scope.data.tasks = $scope.data.tasks.filter(n=>{return n !== null && typeof n === 'object'});
        $scope.data.tasks.sort((a, b)=>{return a.completed?a.dateCompleted - b.dateCompleted:!1})
        $scope.data.tasks.sort((e)=>{return e.completed})
        $scope.completedCount = 0;
        $scope.data.tasks.forEach((el)=>{
            if(el.completed) $scope.completedCount++;
            if(el['$$hashKey']) delete el['$$hashKey'];
        })
        $('ul > li.not-completed').each((id, el)=>{
            $(el).attr('index', id)
        });
        set('update')
    }
    var set = function(e, cb){
        var a = {data: $scope.data};
        typeof e == 'string' ? a.tool = e : a = Object.assign(a, e);
        chrome.runtime.sendMessage(a, function(response){
            console.log(a, ' | ', response)
          cb && cb(response);
        });
    }
    set('data', (data)=>{
        $scope.data = data.data;
        $scope.window.flow = data.data.flow;
        $scope.window.settings = angular.copy($scope.data);
        Object.keys($scope.window.settings.flow).forEach(function(key) {
          $scope.window.settings.flow[key] = $scope.window.settings.flow[key]/60;
        });
        $scope.arrayProc()
        if(!data.state){
            redirectTo('tasks');
            chrome.storage.sync.get(["questionMark"], function(items) {
                $scope.window.questionMark = items.questionMark;
            });
        }else{
            set('flow', (e)=>{
                console.log(e)
                $scope.window.flow = Object.assign($scope.window.flow, e);
                $scope.window.task = $scope.data.tasks[e.taskNum]
                $scope.window.paused = ($scope.window.flow.state === 'pause');
                redirectTo("play");
            })
        } 
    });






    $scope.date = {};
    setInterval(() => {processDate(); $scope.$apply();}, 1000);
    var monthsArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    processDate()
    function processDate(){
        $scope.date = new Date();
        $scope.date.dayOfWeek = $scope.date.toString().slice(0,3).toUpperCase();
        $scope.date.day = `0${$scope.date.getDate()}`.slice(-2);
        $scope.date.month = monthsArray[$scope.date.getMonth()].toUpperCase();
        $scope.date.year = $scope.date.getFullYear();
        $scope.date.time = $scope.date.toLocaleTimeString();
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.tool){
            case 'updated':
                $scope.data = request.data;
                break;
            case 'reload':
                location.reload();
                break;
            default:
                console.log('default')
        }
    });
})
.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
})
.filter('join', function() {
    return function(input) {
      return input.join(', ');
    }
})
.config(function($routeProvider) {
    $routeProvider
    .when("/tasks", {
        templateUrl : "/src/browser_action/parts/tasks.html"
    })
    .when("/play", {
        templateUrl : "/src/browser_action/parts/play.html"
    })
    .when("/settings", {
        templateUrl : "/src/browser_action/parts/settings.html"
    })
    .when("/loading", {
        templateUrl : "/src/browser_action/parts/loading.html"
    })
    .otherwise({
        redirectTo: '/loading'
    });
});