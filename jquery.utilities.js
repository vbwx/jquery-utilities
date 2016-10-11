/*jshint -W061*/

// jQuery Utilities
// Copyright (C) 2013-2016 Bernhard Waldbrunner
/*
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 *	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function ($) {
	"use strict";

	$.fn.toggleAttr = function (name, on, off, state) {
		function set ($el, state)
		{
			return state === null ? $el.removeProp(name) :
									$el.attr(name, (state ? on : off));
		}

		return (typeof state === "undefined" || state === "TOGGLE" ?
				this.each(function (i, elem) {
					var $el = $(elem);
					set($el, $el.attr(name) !== on);
				}) :
				set(this, state)
		);
	};

	$.fn.toggleProp = function (name, on, off, state) {
		function set ($el, state)
		{
			return state === null ? $el.removeProp(name) :
									$el.prop(name, (state ? on : off));
		}

		return (typeof state === "undefined" || state === "TOGGLE" ?
				this.each(function (i, elem) {
					var $el = $(elem);
					set($el, $el.prop(name) !== on);
				}) :
				set(this, state)
		);
	};

	$.fn.enable = function () {
		return this.prop('disabled', false);
	};

	$.fn.disable = function () {
		return this.prop('disabled', true);
	};

	$.fn.revert = function (attr) {
		return this.each(function (i, el) {
			$(el).attr(attr, el.getAttribute(attr));
		});
	};

	$.fn.checked = function (chk) {
		if (typeof chk === "undefined") {
			return this.prop('checked');
		}
		this.toggleProp('checked', true, false, (chk === null ? "TOGGLE" : !!chk));
		return this;
	};

	$.toggleCheck = function (selector) {
		if (typeof selector === "undefined") {
			selector = ":first";
		}
		$($.toggleCheck.element + selector).change(function () {
			$('input:checkbox[name="' + this.name + '"]:not(' +
				selector + ')').prop("checked", $(this).attr("checked"));
		});
	};

	$.encode = function (str) {
		return $('<div/>').text(str).html();
	};

	$.decode = function (str) {
		return $('<div/>').html(str).text();
	};

	$.fn.selectText = function (start, end) {
		return this.each(function (i, field) {
			field.focus();
			if (field.createTextRange)
			{
				var selRange = field.createTextRange();
				selRange.collapse(true);
				selRange.moveStart('character', start);
				selRange.moveEnd('character', end);
				selRange.select();
			}
			else if (field.setSelectionRange)
			{
				field.setSelectionRange(start, end);
			}
			else if (typeof field.selectionStart !== "undefined")
			{
				field.selectionStart = start;
				field.selectionEnd = end;
			}
		});
	};

	$.fn.putCursor = function (pos) {
		if (typeof pos === "undefined" || pos === Number.MAX_VALUE || pos === false) {
			pos = null;
		}
		else if (pos === true || pos === Number.MIN_VALUE) {
			pos = 0;
		}
		else {
			pos = parseInt(pos);
		}
		return this.each(function () {
			var $el = $(this);
			$el.focus();
			if (this.setSelectionRange) {
				var len = (pos === null ? $el.val().length*2 : pos);
				this.setSelectionRange(len, len);
			}
			else if (pos === null) {
				$el.val($el.val());
			}
			if (!pos) {
				this.scrollTop = (pos === null ? 999999 : 0);
			}
		});
	};

	$.fn.cond = function (bool) {
		return bool ? this : $();
	};

	function convertShortCode (code, name, extName)
	{
		if (typeof code === "undefined" || !code.length) {
			return '';
		}
		code = code
				.replace(/(\b|#)val(ue)?\b/ig, '_'+name+'.val()')
				.replace(/@(\w[\w:-]*)/ig, name+'.getAttribute("$1")')
				.replace(/@\(/g, 'String.prototype.toUpperCase.call(')
				.replace(/@\.\(/g, 'String.prototype.toLowerCase.call(')
				.replace(/#(\w[\w:-]*)/ig, '_'+name+'.prop("$1")')
				.replace(/#\(/g, 'parseInt(')
				.replace(/#\.\(/g, 'parseFloat(')
				.replace(/\$([a-z_]\w*)\b/ig, '_'+name+'.$1')
				.replace(/\$('[^']+')/g, '_'+name+".is($1)")
				.replace(/\$\.('[^']+')/g, '_'+name+".has($1)")
				.replace(/`/g, "\\'")
				.replace(/<>/g, '!=');
		if (extName) {
			code = code.replace(/%\[([^\]]+)]\b/g, extName+'[$1]');
		}
		return code;
	}

	function prepareString (match)
	{
		if (match[2]) {
			return match[3].replace(/^['"]|["']$/g, '').unescape();
		}
		return match[3];
	}

	$.extend($.expr[':'], {
		cmp: function (node, idx, match, stack) {
			var E = $.__cmp;
			if (!idx)
			{
				E.cmpFunc = convertShortCode(match[3], 'node', 'stack');
				if (/=$/.test(E.cmpFunc)) {
					E.cmpFunc += "''";
				}
				$.__shortCode = E.cmpFunc;
			}
			var _node = $(node);
			var ret = eval(E.cmpFunc);
			return ret;
		},

		icontains: function (node, idx, match) {
			return (node.textContent || node.innerText || $(node).text() || "")
					.toLowerCase()
					.indexOf(prepareString(match).toLowerCase()) >= 0;
		}
	});

	$.__cmp = {
		cmpFunc: null
	};

	$.fn.max = function (prop, first) {
		if (!prop) {
			prop = "parseFloat(value)";
		}
		else if (/^\w+$/.test(prop)) {
			prop = 'parseFloat(#' + prop + ')';
		}
		$.__shortCode = prop;
		return this.reduce('var v = Number.MIN_VALUE', 'if ('+prop+'>v) v = '+prop,
						   prop+' === v', (first ? 'v = null' : ''));
	};

	$.fn.min = function (prop, first) {
		if (!prop) {
			prop = "parseFloat(value)";
		}
		else if (/^\w+$/.test(prop)) {
			prop = 'parseFloat(#' + prop + ')';
		}
		$.__shortCode = prop;
		return this.reduce('var v = Number.MAX_VALUE', 'if ('+prop+'<v) v = '+prop,
						   prop+' === v', (first ? 'v = null' : ''));
	};

	$.fn.ev = function (prop, all) {
		if (!prop) {
			prop = $.__shortCode || 'value';
		}
		else if (/^\w+$/.test(prop)) {
			prop = 'parseFloat(#' + prop + ')';
		}
		prop = convertShortCode(prop, 'node', 'nodes');
		var nodes = this;
		if (all)
		{
			var values = [];
			this.each(function (i) {
				var node = this, _node = $(this);
				values[i] = eval(prop);
			});
			return values;
		}
		else
		{
			if (!this.length) {
				return null;
			}
			var node = this[0], _node = this.eq(0);
			return eval(prop);
		}
	};

	$.fn.reduce = function (before, each, filter, after) {
		eval(before);
		var nodes = this;
		each = convertShortCode(each, 'node', 'nodes');
		filter = convertShortCode(filter, 'node');
		after = convertShortCode(after, 'node');
		this.each(function (idx) {
			var node = this, _node = $(this);
			eval(each);
		});
		return this.filter(function (idx) {
			var node = this, _node = $(this);
			if (eval(filter))
			{
				eval(after);
				return true;
			}
			return false;
		});
	};

	$.fn.concat = function (sep, js, alt) {
		var r = (typeof alt === "number" ? 0 : "");
		if (typeof js === "string" && js !== "") {
			if (/^[$_a-z][$\w]*$/i.test(js) && !(/^val(ue)?$/.test(js))) {
				js += "(value)";
			}
			js = convertShortCode(js, 'elem', '_elem');
			$.__shortCode = js;
		}
		else {
			js = null;
		}
		if (sep !== null && sep !== false) {
			switch (typeof sep) {
				case "undefined":
					sep = "\n";
					break;
				case "number":
				case "object":
					sep = sep.toString();
					break;
			}
		}
		this.each(function () {
			var elem = this, _elem = $(this);
			r += (js ? eval(js) : _elem.val());
			if (typeof sep === "string" && sep !== "") {
				r += sep;
			}
		});
		return (!r && typeof alt !== "undefined" && (typeof alt !== "number" ||
				!isNaN(r)) ? alt : r);
	};

	$.fn.sum = function (js, alt) {
		var sum = this.concat(null, js || "Number(val)", 0);
		return (isNaN(sum) && typeof alt !== "undefined" ? alt : sum);
	};

	$.fn.outside = function (ename, cb) {
	    return this.each(function(){
	        var $this = $(this), self = this;

	        $(document).bind(ename, function tempo (e) {
	            if (e.target !== self && !$.contains(self, e.target)) {
	                cb.apply(self, [e]);
					$(document).unbind(ename, tempo);
	            }
	        });
	    });
	};

	$.fn.isBound = function(type, fn) {
	    var data = $._data(this[0], 'events');
		if (data) {
			data = data[type];
		}

	    if (typeof data === "undefined" || !data.length) {
	        return false;
		}
		return (-1 !== $.inArray(fn, data));
	};

	$.fn.field = function(name) {
		return this.find(':input[name="'+name+'"]');
	};

	/*!
	 * hoverIntent r7 // 2013.03.11 // jQuery 1.9.1+
	 * http://cherne.net/brian/resources/jquery.hoverIntent.html
	 *
	 * You may use hoverIntent under the terms of the MIT license. Basically that
	 * means you are free to use hoverIntent as long as this header is left intact.
	 * Copyright 2007, 2013 Brian Cherne
	 */
	$.fn.hoverIntent = function(handlerIn,handlerOut,selector) {
		var cfg = {
			interval: 100,
			sensitivity: 7,
			timeout: 0
		};
		if ( typeof handlerIn === "object" ) {
			cfg = $.extend(cfg, handlerIn );
		} else if ($.isFunction(handlerOut)) {
			cfg = $.extend(cfg, { over: handlerIn, out: handlerOut, selector: selector } );
		} else {
			cfg = $.extend(cfg, { over: handlerIn, out: handlerIn, selector: handlerOut } );
		}
		var cX, cY, pX, pY;
		var track = function(ev) {
			cX = ev.pageX;
			cY = ev.pageY;
		};
		var compare = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < cfg.sensitivity ) {
				$(ob).off("mousemove.hoverIntent",track);
				ob.hoverIntent_s = 1;
				return cfg.over.apply(ob,[ev]);
			} else {
				pX = cX; pY = cY;
				ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , cfg.interval );
			}
		};
		var delay = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			ob.hoverIntent_s = 0;
			return cfg.out.apply(ob,[ev]);
		};
		var handleHover = function(e) {
			var ev = jQuery.extend({},e);
			var ob = this;
			if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }
			if (e.type === "mouseenter") {
				pX = ev.pageX; pY = ev.pageY;
				$(ob).on("mousemove.hoverIntent",track);
				if (ob.hoverIntent_s !== 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , cfg.interval );}
			} else {
				$(ob).off("mousemove.hoverIntent",track);
				if (ob.hoverIntent_s === 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , cfg.timeout );}
			}
		};
		return this.on({'mouseenter.hoverIntent':handleHover,'mouseleave.hoverIntent':handleHover}, cfg.selector);
	};
})(jQuery);
