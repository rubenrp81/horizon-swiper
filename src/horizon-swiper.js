/*
 * Horizon Swiper
 * Version 1.1.0
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
    dots: false,
    numberedDots: false,
    arrows: true,
    arrowPrevText: '',
    arrowNextText: '',
    animationSpeed: 500,
    mouseDrag: true,

    // Methods and callbacks
    onStart: function onStart() {},
    onEnd: function onEnd() {},
    onSlideStart: function onSlideStart() {},
    onSlideEnd: function onSlideEnd() {},
    onDragStart: function onDragStart() {},
    onDragEnd: function onDragEnd() {}
  };

  var defaults = {
    $window: $(window),
    $document: $(document),

    innerClass: 'horizon-inner',
    outerClass: 'horizon-outer',
    dotContainer: '<nav class="horizon-dots"></nav>',
    arrowPrev: ['<button class="horizon-prev">', '</button>'],
    arrowNext: ['<button class="horizon-next">', '</button>'],
    showArrowsClass: 'arrows',
    showDotsClass: 'dots',
    initializedClass: 'initialized',
    mouseDragClass: 'mouse-drag',
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
      that.$dots = null;
      that.$arrowPrev = null;
      that.$arrowNext = null;

      that.initialized = false;
      that.maxHeight = 0;
      that.innerContainerWidth = 0;
      that.viewportSize = 0;
      that.isAnimate = false;

      // Initialize if the document is ready and window is loaded

      var windowLoadFunction = function windowLoadFunction() {
        if (that.initialized) {
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
      that._addDots();
      that._mouseDrag();
      that.setSizes();
      that._resize();

      that._checkPosition();
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

      if (that.viewportSize < that.innerContainerWidth) {
        that.$element.addClass(defaults.initializedClass);

        if (that.settings.arrows) {
          that.$element.addClass(defaults.showArrowsClass);
        }

        if (that.settings.dots) {
          that.$element.addClass(defaults.showDotsClass);
        }
      } else {
        that.$element.removeClass(defaults.initializedClass);
        that.$element.addClass(defaults.showArrowsClass);
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
        that._checkPosition();
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

      for (var i = 0; i < that.$items.length; ++i) {
        $(that.$items[i]).attr('data-horizon-index', i);
      }
    };

    /**
     * Add dots to the swiper
     *
     * @private
     */
    Plugin.prototype._addDots = function () {
      var that = this;

      if (that.settings.dots) {
        that.$dots = $(defaults.dotContainer);

        for (var i = 0; i < that.$items.length; ++i) {
          var dotName = that.settings.numberedDots ? i : '';
          var $newDot = $('<button class="horizon-dot" data-horizon-target="' + i + '">' + dotName + '</button>');
          that.$dots.append($newDot);
        }

        that.$element.append(that.$dots);

        that.$dots.find('button').on('click', function (e) {
          e.preventDefault();
          var horizonTarget = $(this).attr('data-horizon-target');
          that._dotScroll(horizonTarget);
        });
      }
    };

    /**
     * Scroll to a dot target
     *
     * @param horizonTarget
     * @private
     */
    Plugin.prototype._dotScroll = function (horizonTarget) {
      var that = this;
      var $target = that.$dots.find('[data-horizon-index="' + horizonTarget + '"]');
      var targetWidth = $target.outerWidth(true);
      var leftOffset = 0;
      var scrollTo = 0;
      var centerValue = that.viewportSize / 2 - targetWidth / 2;

      that.isAnimate = true;
      that.settings.onSlideStart();

      for (var i = 0; i < that.$items.length; ++i) {
        if (i < horizonTarget) {
          leftOffset += $(that.$items[i]).outerWidth(true);
        }
      }

      scrollTo = leftOffset - centerValue;

      if (scrollTo < 0) {
        scrollTo = 0;
      } else if (scrollTo > that.innerContainerWidth - that.viewportSize) {
        scrollTo = that.innerContainerWidth - that.viewportSize;
      }

      that.$inner.animate({
        scrollLeft: scrollTo
      }, that.settings.animationSpeed, function () {
        that._checkPosition();
        that.settings.onSlideEnd();

        if (horizonTarget === that.$items.length) {
          that.settings.onEnd();
        } else if (horizonTarget === 0) {
          that.settings.onStart();
        }

        that.isAnimate = false;
      });
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
          if (!that.isAnimate) {
            that._scrollTo('previous');
          }
        });

        that.$arrowNext.on('click', function (e) {
          e.preventDefault();
          if (!that.isAnimate) {
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

      if (offset === 'end' || offset === 'start') {
        that.isAnimate = false;
        return;
      }

      that.settings.onSlideStart();

      that.$inner.animate({
        scrollLeft: offset[0]
      }, that.settings.animationSpeed, function () {
        if (offset[1] === 'end') {
          that.settings.onEnd();
        } else if (offset[1] === 'start') {
          that.settings.onStart();
        }

        that._checkPosition();
        that.settings.onSlideEnd();
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
      var offsetState = Math.ceil(that.$inner.scrollLeft());
      var calcActiveItem = 0;
      var viewWidth = offsetState + that.viewportSize;

      if (direction === 'next' && offsetState + that.viewportSize === that.innerContainerWidth) {
        return 'end';
      } else if (direction === 'previous' && offsetState === 0) {
        return 'start';
      }

      for (var i = 0; i < that.$items.length; ++i) {
        var width = $(that.$items[i]).outerWidth(true);
        var state = '';

        calcActiveItem += width;

        if (direction === 'next' && calcActiveItem > viewWidth) {
          if (i + 1 === that.$items.length) {
            state = 'end';
          }
          return [calcActiveItem - that.viewportSize, state];
        } else if (direction === 'previous' && calcActiveItem >= offsetState) {
          if (calcActiveItem - width <= 0) {
            state = 'start';
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
      var isTouching = false;
      var isScrolling = false;
      var scrollTimer = null;

      var updatePosition = function updatePosition(e) {
        if (!isTouchDevice) {
          newPosition = innerXposition + (mouseXposition - e.pageX);
          that.$inner.scrollLeft(newPosition);
        }
      };

      // Touch events

      that.$element.on({
        'touchstart': function touchstart(e) {
          isTouchDevice = true;
          isTouching = true;
          isScrolling = true;
          that.settings.onDragStart();
        }
      });

      defaults.$document.on({
        'touchend': function touchend(e) {
          if (isTouching) {
            that._checkPosition();
            that.settings.onDragEnd();
            isTouching = false;
          }
        }
      });

      that.$inner.scroll(function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          if (isScrolling) {
            that._checkPosition();
            that.settings.onDragEnd();
            isScrolling = false;
          }
        }, 250);
      });

      // Mouse events

      if (that.settings.mouseDrag && !isTouchDevice) {
        that.$element.addClass(defaults.mouseDragClass);

        that.$element.on({
          'mousedown': function mousedown(e) {
            isClicked = true;
            mouseXposition = e.pageX;
            innerXposition = that.$inner.scrollLeft();

            if (e.target.tagName.toLowerCase() !== 'button') {
              that.settings.onDragStart();
            }
          }
        });

        defaults.$document.on({
          'mousemove': function mousemove(e) {
            isClicked && updatePosition(e);
          },
          'mouseup': function mouseup(e) {
            if (isClicked) {
              if (e.target.tagName.toLowerCase() !== 'button') {
                that._checkPosition();
                that.settings.onDragEnd();
              }
            }
            isClicked = false;
          }
        });
      }
    };

    /**
     *  Check the scrolling position
     *
     * @private
     */
    Plugin.prototype._checkPosition = function () {
      var that = this;
      var innerOffset = that.$inner.scrollLeft();

      that.settings.arrows && that._checkArrowState(innerOffset);
      that.settings.dots && that._checkActiveDots(innerOffset);
    };

    /**
     * Check the active dots and set the active class
     *
     * @param innerOffset
     * @private
     */
    Plugin.prototype._checkActiveDots = function (innerOffset) {
      var that = this;
      var itemStart = 0;
      var itemEnd = 0;
      var range = [innerOffset, innerOffset + that.viewportSize];

      for (var i = 0; i < that.$items.length; ++i) {
        var $item = $(that.$items[i]);
        var itemWidth = $item.outerWidth(true);

        itemEnd += itemWidth;

        if (itemStart + itemWidth / 2 >= range[0] && itemEnd - itemWidth / 2 <= range[1]) {
          that.$dots.find('[data-horizon-target="' + i + '"]').addClass('active');
        } else {
          that.$dots.find('[data-horizon-target="' + i + '"]').removeClass('active');
        }

        itemStart += itemWidth;
      }
    };

    /**
     * Check for the arrow start and end position
     *
     * @param innerOffset
     * @private
     */
    Plugin.prototype._checkArrowState = function (innerOffset) {
      var that = this;

      if (innerOffset + that.viewportSize >= that.innerContainerWidth - 1) {
        that.$element.addClass(defaults.lastItemClass);
        that.$arrowNext.attr('disabled', 'disabled');
        that.$element.removeClass(defaults.firstItemClass);
        that.$arrowPrev.removeAttr('disabled');
      } else if (innerOffset <= 0) {
        that.$element.addClass(defaults.firstItemClass);
        that.$arrowPrev.attr('disabled', 'disabled');
        that.$element.removeClass(defaults.lastItemClass);
        that.$arrowNext.removeAttr('disabled');
      } else {
        that.$element.removeClass(defaults.lastItemClass).removeClass(defaults.firstItemClass);
        that.$arrowPrev.removeAttr('disabled');
        that.$arrowNext.removeAttr('disabled');
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
