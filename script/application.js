(function($){
	var appname = 'Application',
	Singleton = {
		init: function(){
			$("h1").text("App initialized!");
		},
		data: {
			somedata: 'foobar',
		}
	};
	window[appname] = Singleton;  // expose the singleton
	Singleton.init();                   // initiate application
})(jQuery);
