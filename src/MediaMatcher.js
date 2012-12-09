/**
 * MediaMatcher.js
 *
 * Project-Page: https://github.com/andreasBritten/MediaMatcher.js
 * 
 * Created:		2012-01-04	
 * Modified:	2012-12-09
 *
 * @version 1.1
 * @author Andreas Britten
 */
var mediaMatcherObjectCount = 0;

function MediaMatcher(matchObject){		
	this.queryObjects = [];		
	this.matcher = matchObject;		
	this.loadDynamicCss = true;	
	this.loadDynamicObj = true;
	this.loadDynamicJS = true;
	this.initialLoad = true;
	this.waitingTime = 0;
	this.showInfo = false;
	this.infoBox = null;
	this.timer = null;
	this.loadingInterval = null;
	this.lazyCssLoad = false;
	this.lazyCssLoadMaxTime = 20000;
	this.info = '';
	this.device = "desktop";
	this.id = "matcher"+mediaMatcherObjectCount;
	mediaMatcherObjectCount+=1;	
};
MediaMatcher.prototype = {
	init: function(){
		var id = 0;
		this.device = this.getDeviceCookie() || this.detectDevice();
		for( var query in this.matcher){	
			this.queryObjects.push( { 
				isMatching: false,
				isCssInDom: false,
				isCssLoaded: false,
				isJsInDom: false,
				isJsLoaded: false,				
				isLoaded: false,
				isLoading: false,
				isUnloading: false,
				id : 'query' + id,				
				styleLoadedInterval: null,
				styleLoadedIntervalTime: 0,
				jsLoadedCnt: 0,
				device: query.match(/(::)(.*)(::).*/) && RegExp.$2 || "all",
				queryString	: query.match(/(::.*::\s*)?(.*)/) && RegExp.$2 || "screen",
				media	: query.match(/(only\s+)?([a-zA-Z]+)(\sand)?[\s]*[\(]/) && RegExp.$2 || 'screen',
				minWidth	: query.match(/\(min\-width:[\s]*([\s]*[0-9]+)px[\s]*\)/) && parseFloat(RegExp.$1) || 0, 
				maxWidth	: query.match(/\(max\-width:[\s]*([\s]*[0-9]+)px[\s]*\)/) && parseFloat(RegExp.$1) || Number.MAX_VALUE,				
				js : this.matcher[query]['js'] || [],
				obj : this.matcher[query]['obj'] || [],				
				css : this.matcher[query]['css'] || [],
				ref : []
			} );
			id+=1;
		}
		if(this.loadDynamicCss || this.loadDynamicObj || this.loadDynamicJS){			
			var callbackFunction = this.getResizeCallback();
			if(window.orientation != undefined) window.onorientationchange = callbackFunction;
			else if(window.addEventListener) window.addEventListener( "resize", callbackFunction, false );
			else if(window.attachEvent) window.attachEvent( "onresize", callbackFunction);
		}
		this.updateMedia();
	},

	updateMedia: function(){
        var that = this;
		if(this.timer != null){window.clearTimeout(this.timer); this.timer=null;};
		
		var matching = [];
		var unmatching = [];	
		var falseLoading = [];	
		var falseUnloading = [];
		
		for( var index in this.queryObjects){
			var currentObject = this.queryObjects[index];
			currentObject.isMatching = this.matchingDevice(currentObject) && this.matchingMedia(currentObject);		
			if(currentObject.isMatching && currentObject.isUnloading) falseUnloading.push(currentObject);
			if(!currentObject.isMatching && currentObject.isLoading) falseLoading.push(currentObject);
		}
		
		for( var index in falseLoading){
			var currentObject = falseLoading[index];
			this.clearStyleLoadedTimer(currentObject);
			this.unloadStyles(currentObject);
			currentObject.isLoading = false;
			currentObject.isLoaded = false;
		}
		
		for( var index in falseUnloading){
			var currentObject = falseUnloading[index]; 
			currentObject.isUnloading = false; //isCssLoaded verhindert ein doppeltes einbinden der CSSe			
		}
		
		for( var index in this.queryObjects){
			var currentObject = this.queryObjects[index];		
			if(currentObject.isMatching && !currentObject.isLoaded) matching.push(currentObject);
			if(!currentObject.isMatching && currentObject.isLoaded) unmatching.push(currentObject);	
		}
		
		var hasMatching = matching.length > 0;
		var hasUnmatching = unmatching.length > 0;
				
		for( var index in unmatching){
			var currentObject = unmatching[index];			
			if(this.loadDynamicObj) this.unloadObjects(currentObject);
			if(this.loadDynamicJS) this.unloadJS(currentObject);			
			if(this.loadDynamicCss && !hasMatching){ 
				this.unloadStyles(currentObject);
				currentObject.isUnloading = false;
			} else if(this.loadDynamicCss){
				currentObject.isUnloading = true;
			}
			currentObject.isLoaded = false;
		}
		
		for( var index in matching){
			var currentObject = matching[index];			
			currentObject.isLoading = true;
			(function(initialLoad){				
				that.loadStyles(initialLoad,currentObject,function(){					
					var currentLoading = [];
					var currentUnloading = [];
					for( var i in that.queryObjects){
						var currentObj = that.queryObjects[i];
						if(!currentObj.isMatching && currentObj.isUnloading) currentUnloading.push(currentObj);
						if(currentObj.isMatching && currentObj.isLoading) currentLoading.push(currentObj);			
					}
					var allLoaded = true;
					for( var i in currentLoading){
						var currentObj = currentLoading[i];
						if(!currentObj.isCssLoaded){
							allLoaded = false;
							break;
						}
					}					
					if(allLoaded){
						for( var i in currentUnloading){
							if(that.loadDynamicCss){ 
								var currentObj = currentUnloading[i];
								that.unloadStyles(currentObj);
								currentObj.isUnloading = false;
							}							
						}
						for( var i in currentLoading){
							var currentObj = currentLoading[i];							
							that.loadJS(initialLoad, currentObj, function(){
								if(initialLoad || that.loadDynamicObj)that.loadObjects(currentObj,0);							
								currentObj.isLoading = false;
							});							
						}
					}					
				});				
			})(this.initialLoad);
			currentObject.isLoaded = true;
		}
		this.initialLoad = false;
	},

	matchingMedia: function(queryObject){	
		if( window.matchMedia ){ 		
			return window.matchMedia(queryObject.queryString).matches;
		}else{
			var documentWidth = window.document.documentElement["clientWidth"];
			var bodyWidth = window.document.body != null && window.document.body["clientWidth"];
			var isCompatMode =  window.document.compatMode === "CSS1Compat";		
			var currentWidth = isCompatMode && documentWidth || bodyWidth || documentWidth;
			return (currentWidth >= queryObject.minWidth && currentWidth <= queryObject.maxWidth);
		}
	},
	
	matchingDevice: function(queryObject){		
		return (queryObject.device == 'all' || this.device == queryObject.device);
	},
	
	getResizeCallback: function(){
		var myObj = this;
		var callback = function(){};
		if(this.waitingTime <= 0){
			callback = function(){myObj.updateMedia();};
		}else{
			callback = function(){
				if(myObj.timer != null) window.clearTimeout(myObj.timer);
				myObj.timer = window.setTimeout(function(){myObj.updateMedia();},myObj.waitingTime);
			};
		}
		return callback;
	},
	
	loadingMatching: function(initialLoad){

	},

    clearStyleLoadedTimer: function(queryObject){
        if(queryObject.styleLoadedInterval != null){
            window.clearInterval(queryObject.styleLoadedInterval);
            queryObject.styleLoadedInterval = null;
        }		
        queryObject.styleLoadedIntervalTime = 0;
    },
	
	getLoadedStyles: function(){
		var result = [];
		for(var index in this.queryObjects){
			if(this.queryObjects[index].isCssLoaded) result.push(this.queryObjects[index]);
		}
		return result;
	},

    styleLoaded: function(queryObject, links, callback){
        var that = this;
        var timeToWait = 25;
        this.clearStyleLoadedTimer(queryObject);
        queryObject.styleLoadedInterval = window.setInterval(function(){
            var done = [];
            for(var i in links){
                done[i] = false;
                try {
                    if (links[i].sheet && links[i].sheet.cssRules.length > 0) done[i] = true;
                    else if (links[i].styleSheet && links[i].styleSheet.cssText.length > 0) done[i] = true;
                    else if (links[i].innerHTML && links[i].innerHTML.length > 0) done[i] = true;
                }catch(ex){}
            }
            var loaded = true;
            for(var i in done) if(done[i] == false){loaded = false; break;}
            if(loaded === true || queryObject.styleLoadedIntervalTime >= that.lazyCssLoadMaxTime){
                that.clearStyleLoadedTimer(queryObject);
                if(queryObject.isMatching) callback();
            }
            queryObject.styleLoadedIntervalTime += timeToWait;
        },timeToWait);
    },

	loadStyles: function(initialLoad, queryObject, callback){
		var headElement = document.getElementsByTagName("head")[0];
		if(headElement){
            var links = [];
			if((initialLoad || this.loadDynamicCss) && !queryObject.isCssInDom){
				for(var index in queryObject['css']){
					var link = document.createElement("link");
					link.rel = "stylesheet";
					link.type = "text/css";
					link.id = this.id+'.'+queryObject.id+'.css'+index;
					link.href = queryObject['css'][index];
					headElement.appendChild(link);
					links.push(link);
				}
				if(links.length > 0) queryObject.isCssInDom = true;
			}
			var callbackFunc = function(){
				queryObject.isCssLoaded = true;				
				callback();
			};
            if(this.lazyCssLoad && links.length > 0) this.styleLoaded(queryObject,links,callbackFunc);
            else callbackFunc();
		}
	},

	unloadStyles: function(queryObject){
		var headElement = document.getElementsByTagName("head")[0];
		if(headElement && queryObject.isCssInDom){
			for(var index in queryObject['css']){
				var linkElement = document.getElementById(this.id+'.'+queryObject.id+'.css'+index);
				headElement.removeChild(linkElement);
			}
			queryObject.isCssInDom = false;
			queryObject.isCssLoaded = false;
		}
	},
	
	unloadAllStyles: function(objects){
		for(var index in objects){
			this.unloadStyles(objects[index]);
		}
	},
	
	loadJS: function(initialLoad, queryObject, callback){
		var headElement = document.getElementsByTagName("head")[0];
		if(headElement){
			if((initialLoad || this.loadDynamicJS) && !queryObject.isJsInDom && queryObject['js'].length > 0){
				queryObject.jsLoadedCnt = 0;
				var callbackFunc = function(){
					queryObject.jsLoadedCnt+=1;
					if(queryObject.jsLoadedCnt == queryObject.js.length) callback();
				};				
				for(var index in queryObject['js']){
					var script = document.createElement("script");
					script.type = "text/javascript";
					script.id = this.id+'.'+queryObject.id+'.js'+index;
					script.src = queryObject['js'][index];
					if(script.addEventListener) {
					  script.addEventListener("load",callbackFunc,false);
					}else if(script.readyState){
					  script.onreadystatechange = callbackFunc;
					}					
					headElement.appendChild(script);
				}
				queryObject.isJsInDom = true;
			}else{
				callback();
			}			
		}
	},

	unloadJS: function(queryObject){
		var headElement = document.getElementsByTagName("head")[0];
		if(headElement && queryObject.isJsInDom){
			for(var index in queryObject['js']){
				var scriptElement = document.getElementById(this.id+'.'+queryObject.id+'.js'+index);
				headElement.removeChild(scriptElement);
			}
			queryObject.isJsInDom = false;
		}
	},

	loadObjects: function(queryObject, index){
		if(index >= queryObject['obj'].length) return;		
		if(queryObject['ref'][index] == undefined || queryObject['ref'][index] == null){
            if(typeof(queryObject['obj'][index]) == 'string'){
                (function(myObj,obj,i){
                    myObj.ajaxCall(obj['obj'][i], function(data){
                        //try{
                        obj['ref'][i] = eval("(" + data + ")" );
                        //}catch(e){}
                        //try{
                        obj['ref'][i].onInit();
                        //}catch(e){}
                        //try{
                        obj['ref'][i].onMatch();
                        //}catch(e){}
                        myObj.loadObjects(obj, i+1);
                    });
                })(this,queryObject,index);
            }else{
                queryObject['ref'][index] = queryObject['obj'][index];
                //try{
                queryObject['ref'][index].onInit();
                //}catch(e){}
                //try{
                queryObject['ref'][index].onMatch();
                //}catch(e){}
                this.loadObjects(queryObject, index+1);
            }
		}else{
			//try{
			queryObject['ref'][index].onMatch();
			//}catch(e){}
			this.loadObjects(queryObject, index+1);			
		}
	},

	unloadObjects: function(queryObject){	
		for(var index in queryObject['ref']){
			try{queryObject['ref'][index].onUnmatch();}catch(e){}		
		}
	},
	
	detectDevice: function(){
		var ua = navigator.userAgent.toLowerCase();
        this.printInfo(ua);
		if(Boolean(ua.match(/iphone/)||ua.match(/ipod/)||ua.match(/ipad/)||ua.match(/blackberry/)||ua.match(/playbook/)||ua.match(/android/)|| ua.match(/(windows phone os|windows ce|windows mobile)/)||ua.match(/mobile/)||ua.match(/(gt-p1000|sgh-t849|shw-m180s)/)||ua.match(/tablet pc/)||ua.match(/tablet/)||ua.match(/(palmos|palmsource| pre\/)/)||ua.match(/kindle/)||ua.match(/(opera mini|iemobile|sonyericsson|smartphone)/)))
			return "mobile";		
		if(Boolean(ua.match(/hbbtv/)||ua.match(/nettv/)||ua.match(/ce\-html/)||ua.match(/cehtml/)||ua.match(/large screen/)||ua.match(/googletv/)||ua.match(/large/)))
			return "tv";		
		return "desktop";
	},
	
	ajaxCall: function(url, callback){
		var ajax = null;	
		try{ajax = new XMLHttpRequest();}catch(e){} // Moz Op Saf IE v7	
		if(ajax == null) try{ajax = new ActiveXObject("Microsoft.XMLHTTP");}catch(e){} // IE v6	
		if(ajax == null) try{ajax = new ActiveXObject("Msxml2.XMLHTTP");}catch(e){} // IE v5	
		if (ajax) {
			ajax.open('GET', url, true);
			ajax.onreadystatechange = function () {
				if (ajax.readyState == 4) callback(ajax.responseText);
			};
			ajax.send(null);
		}
	},

    createInfoBox: function(){
        if(this.infoBox === null){
            this.infoBox = document.createElement("div");
            this.infoBox.style.position = 'absolute';
            this.infoBox.style.top = '0px';
            this.infoBox.style.left = '0px';
            this.infoBox.style.backgroundColor = '#000';
            this.infoBox.style.color = '#fff';
            this.infoBox.style.zIndex = '99999';
        }
    },

    handleInfoBox: function(){
        this.createInfoBox();
        var bodyElement = document.getElementsByTagName("body")[0];
        if(bodyElement){
            if(this.showInfo) bodyElement.appendChild(this.infoBox);
        }
    },

    printInfo: function(info){
        if(this.showInfo === true){
            this.handleInfoBox();
            this.infoBox.innerHTML = info;
        }
    },

    setShowInfo: function(bool){
        this.showInfo = bool;
        this.handleInfoBox();
    },

	setDeviceCookie: function(time){
		var date = new Date();
		var duration = date.getTime() + (time * 60 * 60 * 1000);
		date.setTime(duration);
		document.cookie = "MediaMatcherDevice="+this.device+"; expires=" + date.toGMTString();
	},
	
	getDeviceCookie: function(){
		return document.cookie.match(/MediaMatcherDevice=([a-z]*)[;\s]*/) && RegExp.$1 || false;		
	},
	
	dynamicLoadCss: function(bool){
		this.loadDynamicCss = bool;
	},
	
	dynamicLoadJS: function(bool){
		this.loadDynamicJS = bool;
	},
	
	dynamicTriggerObj: function(bool){		
		this.loadDynamicObj = bool;
	},
	
	waitBeforeDynamicLoad: function(ms){		
		this.waitingTime = ms;
	},

    waitForCssIsLoaded: function(bool,maxTime){
        this.lazyCssLoad = bool;
        this.lazyCssLoadMaxTime = maxTime;
    },
	
	forceDevice: function(device, time){
		if(device == "auto"){			
			device = this.detectDevice();			
			time = 0;
		}
		this.device = device;		
		this.setDeviceCookie(time);
		this.updateMedia();		
	}
};