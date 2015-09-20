/*
 * Horizon Swiper
 * Version 1.0.0
 * Domain ( http://horizon-swiper.sebsauer.de/ )
 * Copyright 2015 Sebastian Sauer ( http://www.sebsauer.de/ )
 * Licensed under MIT ( https://github.com/sebsauer90/horizon-swiper/blob/master/LICENSE )
 */

'use strict';

(function (factory) {
  'use strict';

  /**
   * Register plugin
   */
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    factory(require('jquery'));
  } else {
    factory(jQuery);
  }
})(function ($) {
  'use strict';

  /**
   * Global variables
   */
  var pluginName = 'horizonSwiper';
  var settings = {

    // Default settings
    item: '.horizon-item',
    showItems: 'auto',
    arrows: true,
    arrowPrevText: '',
    arrowNextText: '',
    animateionSpeed: 500,
    mouseDrag: true,

    // Methods and callbacks
    onStart: function onStart() {},
    onEnd: function onEnd() {},
    onDragStart: function onDragStart() {},
    onDragEnd: function onDragEnd() {}
  };

  var defaults = {
    $window: $(window),
    $document: $(document),

    innerClass: 'horizon-inner',
    outerClass: 'horizon-outer',
    arrowPrev: ['<button class="horizon-prev">', '</button>'],
    arrowNext: ['<button class="horizon-next">', '</button>'],
    showArrowsClass: 'show-arrows',
    firstItemClass: 'first-item',
    lastItemClass: 'last-item'
  };

  /**
   * Plugin class
   */
  var HorizonSwiper = (function () {

    /**
     * Constructor
     */
    function Plugin(element, options) {
      var that = this;
      that.settings = $.extend({}, settings, options);

      that.$element = $(element);
      that.$items = that.$element.find(this.settings.item);
      that.$inner = null;
      that.$outer = null;
      that.$arrowPrev = null;
      that.$arrowNext = null;

      that.initialized = false;
      that.maxHeight = 0;
      that.innerContainerWidth = 0;
      that.viewportSize = 0;
      that.isAnimate = false;

      // Initialize if the document is ready and window is loaded

      var windowLoadFunction = function windowLoadFunction() {
        if (that.initialized === true) {
          that.setSizes();
        } else {
          setTimeout(function () {
            windowLoadFunction();
          }, 1000);
        }
      };

      defaults.$document.ready(function () {
        that.init();
      });

      defaults.$window.load(function () {
        windowLoadFunction();
      });
    }

    /**
     * Initialize
     */
    Plugin.prototype.init = function () {
      var that = this;

      that._setWrapper();
      that._addArrows();
      that._mouseDrag();
      that.setSizes();
      that._resize();

      that.initialized = true;
    };

    /**
     * Set variable sizes
     */
    Plugin.prototype.setSizes = function () {
      var that = this;
      that.maxHeight = 0;
      that.innerContainerWidth = 0;

      for (var i = 0; i < that.$items.length; ++i) {
        var $item = $(that.$items[i]);
        var height = $item.outerHeight(true);
        var width = $item.outerWidth(true);

        if (height > that.maxHeight) {
          that.maxHeight = height;
        }
        that.innerContainerWidth += width;
      }

      that.viewportSize = that.$inner.width();
      that.$outer.css({ 'max-height': that.maxHeight + 'px' });

      if (that.viewportSize < that.innerContainerWidth && that.settings.arrows === true) {
        that.$element.addClass(defaults.showArrowsClass);
      } else {
        that.$element.removeClass(defaults.showArrowsClass);
      }
    };

    /**
     * Resize
     *
     * @private
     */
    Plugin.prototype._resize = function () {
      var that = this;
      var resizeTimeout = null;

      var resizeFunction = function resizeFunction() {
        that.setSizes();
      };

      defaults.$window.resize(function () {
        clearTimeout(resizeTimeout);
        setTimeout(function () {
          resizeFunction();
        }, 250);
      });
    };

    /**
     * Include the wrapper elements to the DOM
     *
     * @private
     */
    Plugin.prototype._setWrapper = function () {
      var that = this;
      var itemWidth = 0;

      that.$items.wrapAll('<div class="' + defaults.outerClass + '">');
      that.$items.wrapAll('<div class="' + defaults.innerClass + '">');
      that.$inner = that.$element.find('.' + defaults.innerClass);
      that.$outer = that.$element.find('.' + defaults.outerClass);

      if (that.settings.showItems !== 'auto' && that.settings.showItems === parseInt(that.settings.showItems, 10)) {
        itemWidth = 100 / that.settings.showItems;
        that.$items.css({ width: itemWidth + '%' });
      }
    };

    /**
     * Inlude navigation arrows to the DOM and bind click events
     *
     * @private
     */
    Plugin.prototype._addArrows = function () {
      var that = this;

      if (that.settings.arrows === true) {
        that.$arrowPrev = $(defaults.arrowPrev[0] + that.settings.arrowPrevText + defaults.arrowPrev[1]);
        that.$arrowNext = $(defaults.arrowNext[0] + that.settings.arrowNextText + defaults.arrowNext[1]);
        that.$arrowNext.insertAfter(that.$outer);
        that.$arrowPrev.insertAfter(that.$outer);

        that.$element.addClass(defaults.firstItemClass);
        that.$arrowPrev.attr('disabled', 'disabled');

        that.$arrowPrev.on('click', function (e) {
          e.preventDefault();
          if (that.isAnimate === false) {
            that._scrollTo('previous');
          }
        });

        that.$arrowNext.on('click', function (e) {
          e.preventDefault();
          if (that.isAnimate === false) {
            that._scrollTo('next');
          }
        });
      }
    };

    /**
     *  Scroll to the previous or next item
     *
     * @param direction
     * @private
     */
    Plugin.prototype._scrollTo = function (direction) {
      var that = this;
      var offset = that._getOffset(direction);
      that.isAnimate = true;

      if (offset === 'end-position' || offset === 'start-position') {
        that.isAnimate = false;
        return;
      }

      that.$inner.animate({
        scrollLeft: offset[0]
      }, that.settings.animateionSpeed, function () {

        if (offset[1] === 'end-position') {
          that.settings.onEnd();
        } else if (offset[1] === 'start-position') {
          that.settings.onStart();
        }

        that._checkPosition();
        that.isAnimate = false;
      });
    };

    /**
     *  Get the offset to scroll to the next or previous item
     *
     * @param direction
     * @returns [offset, position]
     * @private
     */
    Plugin.prototype._getOffset = function (direction) {
      var that = this;
      var offsetState = that.$inner.scrollLeft();
      var calcActiveItem = 0;
      var viewWidth = offsetState + that.viewportSize;

      if (direction === 'next' && offsetState + that.viewportSize === that.innerContainerWidth) {
        return 'end-position';
      }

      if (direction === 'previous' && offsetState === 0) {
        return 'start-position';
      }

      for (var i = 0; i < that.$items.length; ++i) {
        var width = $(that.$items[i]).outerWidth(true);
        var state = '';
        calcActiveItem += width;

        if (direction === 'next' && calcActiveItem > viewWidth) {
          if (i + 1 === that.$items.length) {
            state = 'end-position';
          }
          return [calcActiveItem - that.viewportSize, state];
        } else if (direction === 'previous' && calcActiveItem >= offsetState) {
          if (calcActiveItem - width <= 0) {
            state = 'start-position';
          }
          return [calcActiveItem - width, state];
        }
      }
    };

    /**
     *  Set the mouse drag support
     *
     * @private
     */
    Plugin.prototype._mouseDrag = function () {
      var that = this;
      var isTouchDevice = false;
      var isClicked = false;
      var mouseXposition = 0;
      var innerXposition = 0;
      var outerXposition = that.$inner.offset().left;
      var newPosition = 0;

      var updatePosition = function updatePosition(e) {
        if (isTouchDevice === false) {
          newPosition = innerXposition + (mouseXposition - e.pageX);
          that.$inner.scrollLeft(newPosition);
        }
      };

      if (that.settings.mouseDrag === true && isTouchDevice === false) {
        that.$element.addClass('mouse-drag');

        that.$element.on({
          'touchstart': function touchstart(e) {
            isTouchDevice = true;
            that.settings.onDragStart();
          },
          'mousedown': function mousedown(e) {
            isClicked = true;
            that.settings.onDragStart();
            mouseXposition = e.pageX;
            innerXposition = that.$inner.scrollLeft();
          },
          'touchend': function touchend(e) {
            that._checkPosition();
            that.settings.onDragEnd();
          },
          'mouseup': function mouseup(e) {
            if (e.target.tagName.toLowerCase() !== 'button') {
              that._checkPosition();
            }
            that.settings.onDragEnd();
          },
          'mousemove': function mousemove(e) {
            isClicked && updatePosition(e);
          }
        });

        defaults.$document.on({
          'mouseup': function mouseup(e) {
            isClicked = false;
          }
        });
      }
    };

    /**
     *  Check the scrolling position and set or remove the last and first item class
     *
     * @private
     */
    Plugin.prototype._checkPosition = function () {
      var that = this;

      if (that.settings.arrows === true) {
        var innerXposition = that.$inner.scrollLeft();
        var innerOffset = that.$inner.scrollLeft();

        if (innerOffset + that.viewportSize >= that.innerContainerWidth - 1) {
          that.$element.addClass(defaults.lastItemClass);
          that.$arrowNext.attr('disabled', 'disabled');

          // Reset
          that.$element.removeClass(defaults.firstItemClass);
          that.$arrowPrev.removeAttr('disabled');
        } else if (innerOffset === 0) {
          that.$element.addClass(defaults.firstItemClass);
          that.$arrowPrev.attr('disabled', 'disabled');

          // Reset
          that.$element.removeClass(defaults.lastItemClass);
          that.$arrowNext.removeAttr('disabled');
        } else {
          // Reset classes
          that.$element.removeClass(defaults.lastItemClass).removeClass(defaults.firstItemClass);

          // Remove disabled buttons
          that.$arrowPrev.removeAttr('disabled');
          that.$arrowNext.removeAttr('disabled');
        }
      }
    };

    /**
     *  Returns the class
     */
    return Plugin;
  })();

  $.fn[pluginName] = function (options) {
    this.each(function () {
      if (!$.data(this, pluginName)) {
        $.data(this, pluginName, new HorizonSwiper(this, options));
      }
    });

    return this;
  };
});
