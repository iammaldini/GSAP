/*!
 * VERSION: 0.1.0
 * DATE: 2013-01-24
 * JavaScript
 * UPDATES AND DOCS AT: http://www.greensock.com/jquery-gsap-plugin/
 *
 * Requires TweenLite version 1.8.0 or higher and CSSPlugin. If TweenMax is loaded, it will be preferred over TweenLite
 * so that you get the most features possible (like repeat, yoyo, repeatDelay, etc.)
 *
 * @license Copyright (c) 2013, GreenSock. All rights reserved.
 * This work is subject to the terms in http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 */
(function($) {
	"use strict";

	var	_animate = $.fn.animate,
		_stop = $.fn.stop,
		_enabled = true,
		TweenLite, CSSPlugin, _warned,
		_dequeue = function(func, next) {
			if (func) {
				this.each(func);
			}
			next();
		},
		_addCallback = function(type, func, obj, vars, next) {
			if (!func && !next) {
				return;
			}
			vars[type] = next ? _dequeue : obj.each;
			vars[type + "Scope"] = obj;
			vars[type + "Params"] = next ? [func, next] : [func];
		},
		_reserved = {overwrite:1, delay:1, useFrames:1, runBackwards:1, easeParams:1, yoyo:1, immediateRender:1, repeat:1, repeatDelay:1, autoCSS:1},
		_copyCriticalReserved = function(main, sub) {
			for (var p in _reserved) {
				if (_reserved[p] && main[p] !== undefined) {
					sub[p] = main[p];
				}
			}
		},
		_createEase = function(ease) {
			return function(p) {
				return ease.getRatio(p);
			};
		},
		_easeMap = {},
		_init = function() {
			var globals = window.GreenSockGlobals || window,
				version, stale;
			TweenLite = globals.TweenMax || globals.TweenLite; //we prioritize TweenMax if it's loaded so that we can accommodate special features like repeat, yoyo, repeatDelay, etc.
			CSSPlugin = globals.CSSPlugin;
			if (TweenLite) {
				version = (TweenLite.version + ".0.0").split("."); //in case an old version of TweenLite is used that had a numeric version like 1.68 instead of a string like "1.6.8"
				stale = !(Number(version[0]) > 0 && Number(version[1]) > 7);
			}
			if (!TweenLite || !CSSPlugin || stale) {
				TweenLite = null;
				if (!_warned && window.console) {
					window.console.log("The jquery.gsap.js plugin requires the TweenMax (or at least TweenLite and CSSPlugin) JavaScript file(s)." + (stale ? " Version " + version.join(".") + " is too old." : ""));
					_warned = true;
				}
				return;
			}
			_easeMap = globals.Ease.map;
			if (!_easeMap || !$.easing) {
				return;
			}
			for (var p in _easeMap) {
				$.easing[p] = _createEase(_easeMap[p]);
			}
			_init = false;
		};

	$.fn.animate = function(prop, speed, easing, callback) {
		prop = prop || {};
		if (_init) {
			_init();
			if (!TweenLite || !CSSPlugin) {
				return _animate.call(this, prop, speed, easing, callback);
			}
		}
		if (!_enabled || prop.skipGSAP === true) {
			return _animate.call(this, prop, speed, easing, callback);
		}
		var config = $.speed(speed, easing, callback),
			vars = {ease:(_easeMap[config.easing] || _easeMap.swing)},
			obj = this,
			specEasing = (typeof(speed) === "object") ? speed.specialEasing : null,
			fallbackProps, val, p, doAnimation, specEasingVars;


		for (p in prop) {
			val = prop[p];
			if (val instanceof Array && _easeMap[val[1]]) {
				specEasing = specEasing || {};
				specEasing[p] = val[1];
				val = val[0];
			}
			if (val === "toggle" || val === "hide" || val === "show") {
				fallbackProps = fallbackProps || {};
				fallbackProps[p] = val;
			} else {
				vars[(p.indexOf("-") === -1) ? p : $.camelCase(p)] = val;
			}
		}

		if (typeof(speed) === "object" && typeof(speed.step) === "function") {
			_addCallback("onUpdate", speed.step, obj, vars);
		}
		if (specEasing) {
			specEasingVars = [];
			for (p in specEasing) {
				val = specEasingVars[specEasingVars.length] = {};
				_copyCriticalReserved(vars, val);
				val.ease = (_easeMap[specEasing[p]] || vars.ease);
				if (p.indexOf("-") !== -1) {
					p = $.camelCase(p);
				}
				val[p] = vars[p];
			}
			if (specEasingVars.length === 0) {
				specEasingVars = null;
			}
		}

		doAnimation = function(next) {
			_addCallback("onComplete", config.old, obj, vars, next);
			if (specEasingVars) {
				var i = specEasingVars.length;
				while (--i > -1) {
					TweenLite.to(obj, $.fx.off ? 0 : config.duration / 1000, specEasingVars[i]);
				}
			}
			TweenLite.to(obj, $.fx.off ? 0 : config.duration / 1000, vars);
			if (fallbackProps) {
				_animate.call(obj, fallbackProps, {duration:config.duration, easing:config.easing, queue:false});
			}
		};

		if (config.queue !== false) {
			obj.queue(config.queue, doAnimation);
		} else {
			doAnimation();
		}

		return obj;
	};


	$.fn.stop = function(clearQueue, gotoEnd) {
		_stop.call(this, clearQueue, gotoEnd);
		if (TweenLite) {
			if (gotoEnd) {
				var tweens = TweenLite.getTweensOf(this),
					i = tweens.length,
					progress;
				while (--i > -1) {
					progress = tweens[i].totalTime() / tweens[i].totalDuration();
					if (progress > 0 && progress < 1) {
						tweens[i].seek(tweens[i].totalDuration());
					}
				}
			}
			TweenLite.killTweensOf(this);
		}
		return this;
	};

	$.gsap = {enabled:function(value) {_enabled = value;}, version:"0.1.0"};

}(jQuery));