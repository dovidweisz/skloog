(function($){
	var $document, $body, 
		$centeredLayer, centeredContentNode, centeredHideNode, visibleCentered,
		$relativeLayer, relativeContentNode, relativeHideNode, visibleRelative,
		widgetCounter = 0,
		registry = {},
		whenDocumentReady = new $.Deferred,
		tt = {
			"preProcess" : function(){
				whenDocumentReady.then(function(){
					$(".tooltipper").each(function(){
						getWidget(this);
					});
				});
			},
			"addProfile" : function(profileName, profile){
				profiles[profileName] = profile;
			}
		},
		optProps = {
			triggerEvent : "click", // options are click, and hover
			viewType : "centered", // options are centered, or relative
			contentType : "inline", //options are inline local and remote
			expireRemote : null,
			content : null, 
			prefetchContent : false, // if set to true content will be set on start
			addlClass : null, // space sepparated list of classes to define classes for the layer
			hoverTimeout : 750, // milliseconds to wait before hiding by hover
			profile : null,
			relPosOffset : 5,
			relPosOrder : "right,left,top,bottom,right"


		},
		profiles = {
			"tooltip" : {
				triggerEvent : "hover",
				viewType : "relative",
				contentType : "inline"
			},
			"centeredOnClick" :  {
				triggerEvent : "click",
				viewType : "centered",
				contentType : "local"
			},
			"remoteRefreshingTT" : {
				triggerEvent : "hover",
				viewType : "relative",
				contentType : "remote",
				expireRemote : 5000
			}
		};
	$(function(){
		whenDocumentReady.resolve();
		$document = $(document),
		$body = $(document.body);
		$document.on("click", ".tooltipper", function(e){
			e.preventDefault();
			getWidget(this).click();
		}).on("mouseover", ".tooltipper", function(){
			getWidget(this).hoverIn();
		}).on("mouseout", ".tooltipper", function(){
			getWidget(this).hoverOut();
		});
	});
	function getWidget(domNode){
		if(! domNode.id){
			domNode.id = "tooltipper" + widgetCounter++;
		}
		if(registry[domNode.id]){
			return registry[domNode.id];
		}
		return registry[domNode.id] = new Widget(domNode);
	}
	var shoWers = {
		"centered" : function(){
			var centeredSize;
			if(visibleCentered){
				visibleCentered.hideLayer();
			}
			getCentered();
			centeredContentNode.innerHTML = this.content;
			if(this.addlClass){
				$centeredLayer.addClass(this.addlClass);
			}
			$centeredLayer.show();
			centeredSize = getSize($centeredLayer);
			$centeredLayer.css({
				"margin-left" : "-" + parseInt(centeredSize.w /2 , 10) + "px",
				"margin-top" : "-" + parseInt(centeredSize.h /2 , 10) + "px"
			})
			visibleCentered = this;
			this._visible = true;
		},
		"relative" : function(){
			getRelative();
			if(visibleRelative){
				visibleRelative.hideLayer();
			}
			if(this.addlClass){
				$relativeLayer.addClass(this.addlClass);
			}
			$relativeLayer.show();
			relativeContentNode.innerHTML = this.content;
			this.positionRelatively();
			visibleRelative = this;
			this._visible = true;
		}
	},
	hiders = {
		"centered" : function(){
			if(visibleCentered){
				getCentered().hide();
				centeredContentNode.innerHTML = "";
				if(this.addlClass){
					$centeredLayer.removeClass(this.addlClass);
				}
				visibleCentered = null;
			}
			this._visible = false;
		},
		"relative" : function(){
			getRelative().hide();
			relativeContentNode.innerHTML = "";
			if(this.addlClass){
					$relativeLayer.removeClass(this.addlClass);
				}
			visibleRelative = null;
			this._visible = false;
		}
	};

	function getCentered(){
		if(! $centeredLayer){
			var layerNode = document.createElement("div");
			layerNode.className = "ttCenteredLayer";
			centeredContentNode = document.createElement("div");
			centeredHideNode = document.createElement("a");
			centeredHideNode.className = "ttcHide";
			centeredHideNode.href = "#";
			centeredHideNode.innerHTML = "Hide";
			centeredHideNode.onclick = function(){
				if(visibleCentered){
					visibleCentered.hideLayer();
				}
				return false;
			}
			layerNode.appendChild(centeredHideNode);
			layerNode.appendChild(centeredContentNode);
			document.body.appendChild(layerNode);
			$centeredLayer = $(layerNode);
		}
		return $centeredLayer;
	}
	function getRelative(){
		if( ! $relativeLayer){
			var layerNode = document.createElement("div");
			layerNode.className = "ttRelativeLayer";
			relativeContentNode = document.createElement("div");
			relativeHideNode = document.createElement("a");
			relativeHideNode.className = "ttcHide";
			relativeHideNode.href = "#";
			relativeHideNode.innerHTML = "Hide";
			relativeHideNode.onclick = function(){
				if(visibleRelative){
					visibleRelative.hideLayer();
				}
				return false;
			}
			layerNode.appendChild(relativeHideNode);
			layerNode.appendChild(relativeContentNode);
			document.body.appendChild(layerNode);
			$relativeLayer = $(layerNode);
			whenDocumentReady.then(function(){
				$relativeLayer.hover(function(){
					if(visibleRelative){
						visibleRelative.hoverIn();
					}
				},function(){
					if(visibleRelative){
						visibleRelative.hoverOut();
					}
				})
			});
		}
		return $relativeLayer;
	}
	function getSize(node){
		if(! node.jQuery){
			node = $(node);
		}
		return {
			h : node.outerHeight(),
			w : node.outerWidth()
		}
	}
	function getBox(node){
		if(! node.jQuery){
			node = $(node);
		}
		return $.extend(node.offset(), getSize(node));
	}
	function Widget(domNode){
		this.$node = $(domNode);
		var props = this.$node.attr("data-tt"),
			contentReady = new $.Deferred,
			contentSetCalled = false,
			hoverSetTimeout = null;

		this._visible = null;
		
		this.start = function(){
			var parsedProps, profile;
			if(props){
				try{
					parsedProps = $.parseJSON(props)
				}catch(e){
					console.error("data-tt is not valid JSON", e);
				}
				if(parsedProps){
					profile = parsedProps.profile ? profiles[parsedProps.profile] || null : null;
					$.extend(this, optProps, profile, parsedProps);
				}
			}
			this.showLayer = shoWers[this.viewType];
			this.hideLayer = hiders[this.viewType]; 
			if(this.prefetchContent){
				this.setContent();	
			}
			
		}
		this.setContent = function(){
			// only run this code once
			if(! contentSetCalled){
				({
					"inline" : function(){
						// do nothing
						contentReady.resolve();
					},
					"local" : function(){
						if(!this.content && domNode.href ){
							if(! (this.content = domNode.href.split("#")[1])){
								console.error("cant find a valid content reference");
							}
						}
						if(this.content = document.getElementById(this.content)){
							if(this.tagName === "SCRIPT"){
								this.content = this.content.text;
							}else{
								this.content = this.content.innerHTML;
							}
							contentReady.resolve();
						}
					},
					"remote" : function(){
						var contentRef;
						if(!this.content && domNode.href ){
							this.content = this.$node.attr("href");
						}
						contentRef  = this.content;
						$.ajax(this.content).then($.proxy(function(content){
							this.content = content;
							contentReady.resolve();
							if(this.expireRemote !== null){
								window.setTimeout($.proxy(function(){
									contentSetCalled = false;
									this.content = contentRef;
									contentReady = new $.Deferred;
								}, this), this.expireRemote);
							}
						}, this));
					}
				})[this.contentType].apply(this);
				contentSetCalled = true;
			}
			return contentReady;
		}
		this.click = function(){
			if(this.triggerEvent === "click"){
				this.setContent().then($.proxy(this.showLayer, this));
			}
		}
		this.hoverIn = function(){
			if(this.triggerEvent === "hover"){
				if(typeof hoverSetTimeout === "number"){
					window.clearTimeout(hoverSetTimeout);
					hoverSetTimeout = null;
				}
				this.setContent().then($.proxy(this.showLayer, this));
			}
		}
		this.hoverOut = function(){
			if(this.triggerEvent === "hover"){
				hoverSetTimeout = window.setTimeout($.proxy(function(){
					this.hideLayer();
					hoverSetTimeout = null;
				}, this), this.hoverTimeout);
			}
		}
		this.positionRelatively = function(){
			var layerSize = getSize($relativeLayer),
				nodeBox = getBox(this.$node),
				bodySize = getSize($body),
				widget = this,
			tests = {
				"right" : function(){
					return nodeBox.left + nodeBox.w + layerSize.w + widget.relPosOffset < bodySize.w;
				},
				"left" : function(){
					return nodeBox.left - layerSize.w - widget.relPosOffset > 0;
				},
				"bottom" : function(){
					return nodeBox.top + nodeBox.h + layerSize.h + widget.relPosOffset < bodySize.h;
				},
				"top" : function(){
					return nodeBox.top - layerSize.h - widget.relPosOffset > 0;
				}
			},
			genPositions = {
				"right" : function(){
					return {
						"top" : nodeBox.top + nodeBox.h / 2 - layerSize.h / 2,
						"left" : nodeBox.left + nodeBox.w + widget.relPosOffset
					}
				},
				"left" : function(){
					return {
						"top" : nodeBox.top + nodeBox.h / 2 - layerSize.h / 2,
						"left" : nodeBox.left - layerSize.w - widget.relPosOffset
					}
				},
				"bottom" : function(){
					return {
						"top" : nodeBox.top + nodeBox.h + widget.relPosOffset,
						"left" : nodeBox.left + nodeBox.w / 2 - layerSize.w / 2
					}
				},
				"top" : function(){
					return {
						"top" : nodeBox.top - layerSize.h - widget.relPosOffset,
						"left" : nodeBox.left + nodeBox.w / 2 - layerSize.w / 2
					}
				}
			},
			relPosOrder = this.relPosOrder.split(","), position; 
			while(position = relPosOrder.shift()){
				if(! genPositions[position]){
					throw(position + " is not a valid position!");
				}
				if(relPosOrder.length === 0 || tests[position]()){
					position = genPositions[position]();
					$relativeLayer.css({
						"top" : parseInt(position.top, 10) + "px",
						"left" : parseInt(position.left, 10) + "px"
					});
					return this;
				}
			}

		}
		this.showLayer = null;
		this.hideLayer = null;
		this.start();
		
	}

	jQuery.tt = tt;
	

})(jQuery);
