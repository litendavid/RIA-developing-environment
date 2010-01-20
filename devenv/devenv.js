(function($){
	
	var addcss = function(src){
		/*$("<link>").attr({
			"rel":"Stylesheet",
			"href":src,
			"type":"text/css",
			"media":"all"
		}).appendTo("head");*/
		$.ajax({
		  url: src,
		  success: function(cssCode){
			var styleElement = $("<style>")[0];
			styleElement.type = "text/css";
			if (styleElement.styleSheet) {
			    styleElement.styleSheet.cssText = cssCode;
			} else {
			    styleElement.appendChild(document.createTextNode(cssCode));
			}
			$("head")[0].appendChild(styleElement);
		  }
		});
	};
	
/*********************************** T O O L S *****************************************
 * Each tool is contained as an object property of the tools object. For every tool:
 * ¤ the html string will make up the content of the tool tab
 * ¤ the paths in the dom object will be transformed to jQuery objects called with that path
 * ¤ every function will have the tool object as scope
 * ¤ the setup function will be run upon app loading, called with settings obj + ref to tab & button
 *
 */
	var tools = {
		dataview : { 
			dom : {
				filepath: '#prettyprintpath',
				viewbutton: '#prettyprintclick',
				outputter: '#prettyprintoutput',
				currentfile: '#prettyprintcurrent'
			},
			html: "<span>print window['</span><input type='text' id='prettyprintpath' />" + "<span>'] </span><input id='prettyprintclick' type='submit' value='print' /><span id='prettyprintcurrent'></span><br/><br/><div id='prettyprintoutput'></div>",
		   	setup: function (opts) {
				this.dom.filepath.val(opts.prettyprint);
		   		$.getScript("devenv/prettyprint/prettyprint.js");  
				this.dom.viewbutton.click(this.prettyprint);
		    },
			prettyprint: function () {  
			    var data = null,
			        result = "",
			        path = this.dom.filepath.val();  
				try { 
					data = eval("window." + path);
					result = prettyPrint(data);   
					this.dom.currentfile.text("Showing window['" + path + "']:");  
			    }  
			    catch(e) {
					result = "Cannot resolve path!";
			    }  
				this.dom.outputter.html(result);  
			}
		},
		unittest : {
			dom: {
				type: '#unittesttype'
			},
			html: "<span>Performing unit test using <span id='unittesttype'></span></span><br/><br/>",
			setup: function(opts){
				if (opts.unittest == "jspec"){
					addcss("devenv/jspec/jspec.css");
					this.dom.tab.append("<div id='jspec'></div>");
					this.dom.type.text("jspec");
					$.getScript("devenv/jspec/jspec.js",function(){
						$.getScript("devenv/application-jspec.js",function(){
							JSpec.run().report();
						});
					});
				}
				if (opts.unittest == "qunit"){
					addcss("devenv/qunit/qunit.css");
					this.dom.tab.append('<h1 id="qunit-header">QUnit results</h1><h2 id="qunit-banner"></h2><h2 id="qunit-userAgent"></h2><ol id="qunit-tests"></ol><div id="main"></div>');
					this.dom.type.text("qunit");
					$.getScript('devenv/application-qunit.js');
/*					$.getScript('devenv/qunit/qunit.js',function(){
						$.getScript('devenv/application-qunit.js');
					});*/
				}
			}
		},
		console : {
			html: "<div id='consoleWrapper'><strong>Console!</strong><span id='codemirrorbit'><span>ctrl+enter to run code, use 'print(msg)' to inspect objects. Lint code?</span> <input type='checkbox' id='lintcode' checked='checked'></input></span><span id='vanillaconsolebit'><input type='submit' value='run' id='vanillaconsolerun'></input><br/></span><textarea id='console' rows='10' cols='70' columns='70' >print(\n\twindow.Application\n);</textarea></div><div id='outputWrapper'><strong>Output</strong> <a href='#' id='clearoutput'>clear</a><ul id='consoleoutput'></ul></div>",
			setup: function(opts){				
				// add styles
				addcss("devenv/codemirror/css/docs.css");
				addcss("devenv/console/console.css");
				var _console = window._console = this;
				if (opts.codemirror) {
					$.getScript("devenv/codemirror/js/codemirror.js");
					this.dom.button.one('click', this.firstvisit);
					this.dom.vanillabit.css('display','none');
				}
				else {
					this.dom.codemirrorbit.css('display','none');
					this.dom.vanillarun.click(this.simpleRun);
				}

				this.dom.clearbutton.click(this.clear);
				
			},
			dom : {
				output: '#consoleoutput',
				textarea : '#console',
				vanillarun : '#vanillaconsolerun',
				clearbutton : '#clearoutput',
				vanillabit: '#vanillaconsolebit',
				codemirrorbit: '#codemirrorbit',
				lintcode: '#lintcode',
			},
			firstvisit: function(){
	
				this.editor = CodeMirror.fromTextArea('console', {
					height: "300px",
					parserfile: ["tokenizejavascript.js", "parsejavascript.js"],
					stylesheet: "devenv/codemirror/css/jscolors.css",
					path: "devenv/codemirror/js/",
					autoMatchParens: true,
					lineNumbers: true,
					initCallback: $.proxy(function(editor){
						var ctrl = false;
						
						editor.grabKeys($.proxy(function(){
							this.run()
						},this), function(keycode){
							if(ctrl && keycode === 13){
								ctrl = false;
								return true;
							}
							ctrl = (keycode === 17);
						});
						
						// add lineerror div
						$(".CodeMirror-line-numbers").parent().append("<div id='lineerrors'/>");
						this.dom.lineerrors = $('#lineerrors');
					},this)
				});
			},
			/*bind: function(func, scope) {
		    	return function() {
		    		return func.apply(scope, $.makeArray(arguments));
		    	};
		    },*/
			simpleRun: function(){
				this.executeCode(this.dom.textarea.text());
			},
			run: function(){
				var rawcode = this.editor.getCode();
				// remove eventual previous errors
				this.dom.lineerrors.html("");
				
				// try linting, do not execute code if fail!
				var lintcode = this.dom.lintcode.attr("checked"),
				    result = lintcode ? JSLINT(rawcode) : true,
					outputter = this.dom.output;
				if (!result) {
					outputter.text("Errors found - code not executed!");
					
					// initing variables used for error positioning
					var linenumberscon = $('.CodeMirror-line-numbers');
					var linenumbers = linenumberscon.children(),
						cmlinepos = linenumberscon.position(),
						codemirrorwrapping = $('.CodeMirror-wrapping'),
						lineoverlaydotwidth = 6;
					
					// TODO: line number errors might stack => need to group or something
					var self = this;
					for(var i in JSLINT.errors){
						(function(){
							var error = JSLINT.errors[i];
							//if (!error) return;
							var errorelem = $("<div>"+error.reason+" at line "+error.line+", character "+error.character+":<span class='lintcode'> "+error.evidence+"</span></div>");
							
							// get codemirror line number element for positioning error
							var lineelem = $(linenumbers[error.line - 1]);
							var lineelempos = lineelem.position();
							//console.log('p', lineelempos, lineelem, lineelem.offset(), cmlinepos);
		
							// need error elem at line number too
							var lineerrorelem = errorelem.clone().addClass('lineerror').appendTo(codemirrorwrapping);
							
							// create overlaying area to show error on hover
							var lineoverlay = $('<div/>')
								.addClass('lineoverlay')
								.text('»')
								.css({
									top: lineelempos.top - cmlinepos.top,
									left: lineelempos.left,
									width: lineelem.width(),
									height: lineelem.height()
								})
								.appendTo(self.dom.lineerrors)
								.hover(function(){
									lineerrorelem.css({ // position error tooltip correctly
										top: lineelem.position().top - (lineerrorelem.height() / 2),
										left: -lineelem.position().left - lineerrorelem.width() - 33
									}).show();
								}, function(){
									lineerrorelem.hide();
								})
							
							// show the error below the code area
							errorelem.appendTo(outputter);
						})()
					}
					
					// don't run code
					return false;
				}
				this.executeCode(rawcode);
			},
			executeCode: function(rawcode){
				// clean code for eval
				var quoteremover = /(\\)*'/g;
				var code = rawcode
					.replace(/[\r\n]/g, '') 
					.replace(quoteremover, function(match,b,c){
					    if(match.length == 1 || match.length % 2 != 0){
					        return "\\'";
					    } else {
					        return match;
					    }
					});
				var wrapping = ['try {', "eval(' with(_console.consoleutils){ ", code, "}')", ' } catch(e){ _console.error(e); }'];
				this.evaler(wrapping.join(' '));
			},
			error: function(e){
				this.consoleutils.print(e);
				//this.dom.output.prepend($('<li/>').html(prettyPrint(e)));
			},
			evaler: (window.execScript ? function(code) {window.execScript(code);} : function(code) {window.setTimeout(code, 0);}),
			clear: function(){
				this.dom.output.html("");
				return false;
			},
			consoleutils: {
				print: function(msg){
					_console.dom.output.prepend($('<li/>').html(prettyPrint(msg)));
				}
			}
			
		},
		filelinter: {
			dom: {
				filepath: '#lintpath',
				lintbutton: '#lintclick',
				output: '#lintoutput'
			},
			html: "<span>lint </span><input type='text' id='lintpath' />"+
			      "<span> </span><input id='lintclick' type='submit' value='lint' /><br/><br/><div id='lintoutput'></div>",
			setup: function(opts){
				this.dom.filepath.val(opts.lint);
				addcss("devenv/jslint/lintcode.css");
				$.getScript("devenv/jslint/fulljslint.js");
				this.dom.lintbutton.click(this.lintfileclick);
			},
			lintfileclick: function(){
				var path = $("#lintpath").val();
				this.dom.output.html("Loading...");
				$.ajax({
					url: path,
					success: this.printlintresult,
					error: this.showerror,
					dataType: "text",
					type: "GET"
				});
			},
			printlintresult: function(data){
				var result = JSLINT(data), outputter = this.dom.output;
				if (result) {
					outputter.text("No errors!");
				}
				else{
					outputter.text("Errors found!");
					for(var i in JSLINT.errors){
						var error = JSLINT.errors[i];
						$("<div>"+error.reason+" at line "+error.line+", character "+error.character+":<span class='lintcode'> "+error.evidence+"</span></div>").appendTo(outputter);
					}
				}
			},
			showerror: function(){
				this.dom.output.text("Couldn't find file!");
			}
		}
	};
	
/**************************** S E T U P ********************************************/
	
	var $buttonwrapper = $("<div id='devbuttons'>").appendTo("body"),
	    $tabwrapper = $("<div id='devwrapper'>").prependTo("body"),
		i=20;
		
	for(var b in tools){
		var tool = tools[b];
		// add tool tab & button
		$("<div>").attr("id",b+"button").data("me",b).append("<span>"+b+"</span>").appendTo($buttonwrapper).css("top",i);
		$("<div>").attr("id",b+"tab").data("me",b).html(tool.html).appendTo($tabwrapper);
		i += 70;
		// store tool dom references
		if (!$.isPlainObject(tool.dom)){
			tool.dom = {};
		}
		tool.dom.button = '#'+b+'button';
		tool.dom.tab = '#'+b+'tab';
		for(var selector in tool.dom){
			tool.dom[selector] = $(tool.dom[selector]);
		}
		// set scope for tool functions to tool object
		for(var f in tool){
			if ($.isFunction(tool[f])){
				tool[f] = $.proxy(tool[f],tool);
			}
		}
		// execute tool setup with settings obj
		tool.setup($.extend({},devenvsettings,{button: b+"button",tab: b+"tab"}));
	}
	// fix the clicking on the buttons to show the tabs
	$("#devbuttons > div").live("click",function(e){
		var $me = $(this), name = $me.data("me"),
		    $tab = $("#"+name+"tab",$tabwrapper),
			$siblings = $("> div",$tabwrapper).not("#"+name+"tab");
		$siblings.removeClass("show");
		$tab.toggleClass("show");
		$("> div",$buttonwrapper).not("#"+name+"button").removeClass("active");
		$me.toggleClass("active");
		e.preventDefault();
		return false;
	});
	addcss("devenv/devenv.css");
	
})(jQuery);


