var Vue = require('vue');
Vue.config.debug = true;
Vue.use(require('vue-resource'));

require('./utilities.js');

var vm = new Vue({
    el: '#container',
    data: {
        fullRepoName: null,
        username: null,
	repos: null,
        repo: null,
        fileUrl: null,
	editor: null,
	github: null,
	loggedIn: false,
	githubParams: {
	    id: 'efe3f24dd42bf7881928',
	    redirect_uri: 'http://localhost:8080',
	    state: 'bobo',
	    gateway: 'http://localhost:9999/authenticate/'
	},
	token: null,
	message: null,
	error: null,
	loading: null
    },
    created: function(){
	var storedToken = localStorage.getItem('token');
	var code = getParameter('code');

	if(storedToken){
	    this.token = storedToken;
	    this.getUserName(this.getUserRepos(this.initRepo));
	}
	else if(code){
	    var hash = window.location.hash;
	    history.replaceState({},window.document.title, '/' + hash);
	    var vm = this;
	    this.getGithubToken(code, function(){ vm.getUserName(vm.getUserRepos) });
	}
    },
    methods: {
	loginGithub: function(){
	    var hash = window.location.hash;
	    
	    var github_uri = "https://github.com/login/oauth/authorize?"
		+ 'client_id=' + this.githubParams.id
		+ '&redirect_uri=' + this.githubParams.redirect_uri + encodeURIComponent(hash)
		+ '&state=' + this.githubParams.state
		+'&scope=repo';

	    window.location.href = github_uri;
	},
	getGithubToken: function(code, callback){
	    var url = this.githubParams.gateway + code;
	    var vm = this;
	    
	    this.$http.get(url).then(
		function(response){
		    var data = response.data;
		    if(data.token){
			vm.token = data.token;
			localStorage.setItem('token', vm.token);

			if(callback)
			    callback.apply(vm);
		    }
		    else{
			vm.token = null;
			localStorage.removeItem('token');
			vm.displayError(data.error, data);
		    }
		});
	},
	getUserName: function(callback){
	    var vm = this;
	    
	    this.$http.get('https://api.github.com/user?'
			   + 'access_token=' + this.token)
		.then(
		    function(data){
			vm.username = data.data.login;

			if(callback)
			    callback.apply(vm);
		    },
		    function(data){
			vm.token = null;
			localStorage.removeItem('token');
			vm.displayError(data.responseText, data);
		    });
	},
	getUserRepos: function(callback){
	    var vm = this;
	    
	    this.$http.get('https://api.github.com/user/repos?'
			   + 'access_token=' + this.token)
		.then(
		    function(data){
			var names = data.data.map(
			    function(repo){ return repo.full_name });
			vm.repos = names;

			if(callback)
			    callback.apply(vm);
		    },
		    function(data){
			vm.displayError(data.responseText, data);
		    });
	},
	initRepo: function(hash){
	    var hash = window.location.hash;
	    if(hash != '' && hash != '#'){
		var path = hash.substr(1).split('/');
		this.repo = path[0] + '/' + path[1];
	    }
	},
	logout: function(){
	    this.username = null;
	    this.repo = null;
	    this.path = null;
	    this.token = null;
	    this.repos = null;
            this.fileUrl = null;
	    this.editor = null;
	    this.github = null;
	    this.loggedIn = false;
	    window.location.hash = '';
	    localStorage.removeItem('token');
	},
        editFile: function(args){
            this.fileUrl = args.url;
	    this.editor = args.editor;
        },
	changeEditingFile: function(fileUrl){
	    this.fileUrl = fileUrl;
	},
	displayMsg: function(msg){
	    this.loading = null;
	    this.error = null;
	    this.message = msg;
	    console.log("msg: " + this.message);
	},
	displayError: function(msg, obj){
	    this.message = null;
	    this.loading = null;
	    this.error =  msg;
	    console.log("Error");
	    console.log(msg);
	    console.log(obj);
	},
	clearMsg: function(n){
	    this.message = null;
	},
	clearError: function(n){
	    this.error = null;
	},
	startLoading: function(){
	    this.message = null;
	    this.error = null;
	    this.loading = true;
	},
	doneLoading: function(){
	    this.loading = null;
	}
    },
    components: {
        githubFileExplorer: require('./components/github-file-explorer'),
        githubFileEditor: require('./components/github-file-editor')
    }    
});
