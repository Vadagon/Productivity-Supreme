angular.module('main', ["ngRoute"])
.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension|blob:chrome-extension):/);
}])
.controller('AppCtrl', function($scope,$location) {
    window.location.href = "#!loading";
    $scope.data = {
        tasks: []
    };
    $scope.window = window;
    $scope.theme = {};
    $scope.Date = Date;
    $scope.app = {
        inputText: ''
    };
	$scope.showLoading = true;
    $scope.completedCount = 0;
    // $scope.listClicked=function(ev){
    //     // don't delete this method it is required for multiple checkbox in list item.
    //               ev.stopPropagation();
    // };
    // $scope.data.tasks = [
    //     {text: 'test2', completed: !1, dateCreated: Date.now(), dateCompleted: Date.now()},
    //     {text: 'test1', completed: !1, dateCreated: Date.now(), dateCompleted: Date.now()},
    //     {text: 'test3', completed: !0, dateCreated: Date.now(), dateCompleted: Date.now()},
    //     {text: 'test4', completed: !1, dateCreated: Date.now(), dateCompleted: Date.now()},
    //     {text: 'test5', completed: !1, dateCreated: Date.now(), dateCompleted: Date.now()},
    //     {text: 'test6', completed: !0, dateCreated: Date.now(), dateCompleted: Date.now()}
    // ];
    // $scope.data.tasks.sort((e)=>{return e.completed})
    $scope.listInit = function(){
        $('ul').sortable({
            forcePlaceholderSize: true,
            axis: 'y',
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
                ell.textContent = ell.textContent.replace(/(?:\r\n|\r|\n|<br>)/g, '');
                el.text = ell.textContent;
                break;
            case 'remove':
                delete $scope.data.tasks[el];
                break;
            case 'play':
                $scope.window.task = el;
                $scope.window.flow.timing = $scope.data.flow.work;
                set({tool: action, taskNum: $scope.data.tasks.indexOf(el)})
                window.location.href = "#!play";
                break;
            case 'pause':
                $scope.window.paused = !$scope.window.paused;
                $scope.window.ddd = new Date();
                $scope.window.ddd.setSeconds ( $scope.window.ddd.getSeconds() + ($scope.window.paused?$scope.window.flow.pause:$scope.window.flow.work) );
                $scope.window.paused?set('pause'):set({tool: 'play', taskNum: $scope.data.tasks.indexOf($scope.window.task)})
                break;
            case 'stop':
                set(action)
                window.location.href = '#!tasks';
                break;
            case 'done':
                set('stop')
                el.editable?0:el.completed=!0; 
                el.dateCompleted = Date.now(); 
                $scope.arrayProc();
                window.location.href = '#!tasks';
                break;
            default:
                console.log('default')
        }
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
          cb && cb(response);
        });
    }
    set('data', (data)=>{
        $scope.data = data.data;
        $scope.window.flow = data.data.flow;
        $scope.arrayProc()
        console.log(data)
        if(!data.state){
            window.location.href = "#!tasks";
        }else{
            set('flow', (e)=>{
                console.log(e)
                $scope.window.flow = Object.assign($scope.window.flow, e);
                $scope.window.task = $scope.data.tasks[e.taskNum]
                $scope.window.paused = ($scope.window.flow.state === 'pause');
                window.location.href = "#!play";
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
            case 'update':
                $scope.data = request.data;
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