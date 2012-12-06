# MediaMatcher.js
### A lightweight and easy to use polyfill to combine Stylesheets (CSS) and JavaScripts (JS) using CSS3 Media Queries

- Version: 1.0 
- Created: 2012-01-04 
- Author: Andreas Britten
- Page: https://github.com/andreasBritten/MediaMatcher.js

The main goal of this script was to change the behavior (JS) of a site at the same time it's layout (CSS) changes. In additon, the script should be easy to use, lightweight and it should utilize common CSS3 Media Query syntax.

The script provides native Media Query matching if the browser supports it. Also, the script provides a simple "min-width" and "max-width" matching for browsers like Internet Explorer 7 which does not support media queries.

So far we tested the script successfully on the current Firefox, Chrome, Opera, Safari and Internet Explorer 7-9. 

We included a example to give you a impression of how the script works and what you can do with it.

Building pages with a [responsive web design](http://www.webdesignshock.com/responsive-web-design/) can be a difficult task when you want to trigger JavaScript after your Stylesheets is loaded. So I hope my script can help you with this task :)

How to use?
======

You are ready to use MediaMatcher after six steps: 

1. Download and add MediaMatcher.js to your site

<pre>	
	&lt;script type="text/javascript" src="./MediaMatchter.js"&gt;&lt;/script&gt;	
</pre>

2. Create a new MediaMatcher Object. Pass your media queries as key values of an object and add to them all "CSS" (css), "JavaScript" (js) and "MatchObjects" (obj) you want to load/unload if the associated query matches/unmatches ("MatchObjects" are explained below).

<pre>
	&lt;script&gt;
		var mediaMatcher = new MediaMatcher({			
			'screen and (min-width: 0px) and (max-width: 600px)': {
				'css': ['./css/mobile.css'],
				'js':  ['./js/jQueryMobile.js'],				
				'obj': [{
							onInit:    function(){ mobileLoaded(); },
							onMatch:   function(){ mobileTriggerd(); },
							onUnmatch: function(){ mobileUntriggerd(); }
						}]				
			},				
			'screen and (min-width: 601px) and (max-width: 1600px)': {
				'css': [./'css/normal.css'],
				'js':  ['./js/jQuery.js'],				
				'obj': [{
							onInit:    function(){ normalLoaded(); },
							onMatch:   function(){ normalTriggerd(); },
							onUnmatch: function(){ normalUntriggerd(); }
						}]				
			},				
			'screen and (min-width: 1601px)': {
				'css': [./'css/tv.css'],
				'js':  ['./js/jQuery.js'],				
				'obj': [{
							onInit:    function(){ tvLoaded(); },
							onMatch:   function(){ tvTriggerd(); },
							onUnmatch: function(){ tvUntriggerd(); }
						}]				
			}
		});
</pre>

3. Define which type of files you would like to load/unload/trigger dynamically on resizing the browser and which you would like to load and trigger just once when the page is loaded.

<pre>
		mediaMatcher.dynamicLoadCss(true);
		mediaMatcher.dynamicLoadJS(false);
		mediaMatcher.dynamicTriggerObj(true);	
</pre>

4. Define in ms how long MediaMatchter should wait during window-resizing before it calculates it's new state. A value of 0ms means that the new state is calculated on every window-resize event providing a seemless response. By increasing the time you can achieve certain effects: Lower your data stream and improve the overall performance. For us a value of 75ms was a perfect compromise. Just try what time works best for you :)

<pre>
	mediaMatcher.waitBeforeDynamicLoad(75);	
</pre>

5. Define if MediaMatcher should wait until all CSS files are loaded before the associated "MatchObject" is triggerd. You can also define a timeout in ms if the CSS is for some reason not available or took forever to load. WARNING: This only works correctly when a webserver delivers the CSS file (Apache, Tomcat, ...). On a lokal filesystem we saw some problems with this feature in some browsers (Chrome for example ). Also, it will not wait for CSS files you inclueded by an @import statement inside the loaded CSS file.

<pre>
	mediaMatcher.waitForCssIsLoaded(true,1000);
</pre>

6. Initialize (start up) your MediaMatcher and your done!

<pre>
		mediaMatcher.init();
	&lt;/script&gt;
</pre>

What is a "MatchObject"?
======

As you have noticed in the section above you can add "MatchObjects" (obj) to your MediaMatcher. A "MatchObject" is a plain JavaScript object providing a special structure. 

Our idea was to trigger a special function of an object when the associated query matches and to trigger another function when the query unmatches. Those functions are only triggered on a state-change event. This enables, for example, to bind events on match and to unbind them on unmatch. There is also a init function which is called only once the object is first triggerd.

Here is a "MatchObject" with the required structure:

<pre>
{
	onInit: function(){
		// Do something on init (first trigger)
	},
	onMatch: function(){
		// Do something on match
	},
	onUnmatch: function(){
		// Do something on unmatch
	}
}
</pre>

You can enhance those objects by adding your own functions and member variables. Within those object you have also access to the global namespace if you want to use jQuery or other frameworks ;)

How does it work?
======

CSS: 
 - MediaMatcher simply adds and removes &lt;link&lt; tags into your &lt;head&lt; tag
 
JS: 
 - MediaMatcher simply adds and removes &lt;script&lt; tags into your &lt;head&lt; tag

OBJ: 
 - If the associated MediaQuery matches "onMatch" is triggerd. If it doesn't match anymore "onUnmatch" will be triggerd. "onInit" will be triggerd immediately before the first "onMatch" is called.

Final words
======

Because it is our first version of the script we really would appreciate some experiences and suggestions for improvements from you guys :)

Please check out some other great CSS3 Media Query polyfill scripts like [response.js](https://github.com/scottjehl/Respond), [css3-mediaqueries-js](http://code.google.com/p/css3-mediaqueries-js/) and [EnhanceJS](http://filamentgroup.com/lab/introducing_enhancejs_smarter_safer_apply_progressive_enhancement/). We took some inspirations from those scripts so big props to the authors! :)