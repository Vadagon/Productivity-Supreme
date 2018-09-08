angular.module('main', ["ngRoute"])
.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension|blob:chrome-extension):/);
}])
.controller('AppCtrl', function($scope,$location) {
    $scope.data = {
        tasks: []
    };
    $scope.theme = {};
    $scope.Date = Date;
    $scope.app = {
        inputText: ''
    };
	$scope.showLoading = true;
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
                if(!el) break;
                $(ell).closest('li').find('label')[0].contenteditable = "true";
                setTimeout(function() {
                    $(ell).closest('li').find('label')[0].focus()
                }, 0);
                break;
            case 'remove':
                delete $scope.data.tasks[el];
                $scope.arrayProc()
                break;
            case 'play':
                console.log(action)
                break;
            default:
                console.log('default')
        }
    }
    $scope.arrayProc = function(){
        $scope.data.tasks = $scope.data.tasks.filter(n=>{return n !== null && typeof n === 'object'});
        $scope.data.tasks.sort((a, b)=>{return a.dateCompleted - b.dateCompleted})
        $scope.data.tasks.sort((e)=>{return e.completed})
        $('ul > li.not-completed').each((id, el)=>{
            $(el).attr('index', id)
        });
        set()
        console.log($scope.data.tasks)
    }
    var set = function(e, cb){
        chrome.runtime.sendMessage({tool: "update", data: $scope.data});
    }
    var get = function(cb){
        chrome.runtime.sendMessage({tool: "data"}, function(response) {
          $scope.data = response.data;
          console.log($scope.data)
          cb && cb($scope.data);
        });
    }
    get();





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
    .when("/", {
        templateUrl : "/src/browser_action/parts/tasks.html"
    })
    .when("/list", {
        templateUrl : "/src/browser_action/parts/tasks.html"
    })
    .otherwise({
        templateUrl : "/src/browser_action/parts/loading.html"
    });
});