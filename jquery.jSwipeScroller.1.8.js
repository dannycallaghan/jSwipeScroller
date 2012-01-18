/**
 * jSwipeScroller - touch/swipe activated scroller with drag and auto adjust after orientation change  - Danny Callaghan - danny@dannycallaghan.com - www.dannycallaghan.com
 *
 * Version: 1.8
 * Requires (found at bottom of this file) :
    'Debounced resize() / smartresize()' plugin - http://paulirish.com/2009/throttled-smartresize-jquery-event-handler/
    jQuery.ScrollTo - http://flesler.blogspot.com/2007/10/jqueryscrollto.html
    jQuery.touchWipe - http://www.netcu.de
 */
;(function ( $, window, document, undefined ) {
    
    var pluginName  =   'jSwipeScroller',
        defaults    =   {
            itemParent          :   'ul',           // tag name of individual item's parent (invariable a UL, OL or a DIV)
            item                :   'li',           // tag name of individual item (invariably an LI, or an ARTICLE),
            navClass            :   'scroller-nav', // classname of the clickable nav (for non-touch)
            showPager           :   false,          // whether to show the page indicator
            pageClass           :   'page',         // class of pager OL,
            pageLiWidth         :   12,             // pixels, need to know the width of each pager element, so we can centre it
            lazyLoadImages      :   true,           // whether to lazy load the images
            imageHolder         :   'data-o-imgsrc',// if using lazy loading of images, reference to real image source
            hotSpot             :   0.45,            // percentage of screen to be a hotspot
            snapBackSpeed       :   250,            // speed of animation used to snap the scroller back (no scroll)
            clickSensitivity    :   5              // if the touch movement x and y values are less than this, we class it as a click
        };

    function Plugin( element, options ) {
        this.element    =   element;
        this.options    =   $.extend( {}, defaults, options) ;
        this._defaults  =   defaults;
        this._name      =   pluginName;
        this.init();
    }

    Plugin.prototype.init = function () {
        var _this       =   $( this.element ),
            o			=   this.options,
            isTouch     =   ( 'ontouchstart' in document.documentElement )?	true	:	false,
            tStart      =   ( isTouch )?    'touchstart'    :   'mousedown',
            tMove       =   ( isTouch )?    'touchmove'     :   'mousemove',   
            tEnd        =	( isTouch )?	'touchend'		:	'mouseup',
            mDown       =   false;
            mouseX      =   0,
            mouseY      =   0,
            xDiff       =   0,
            yDiff       =   0,
            startPos    =   0,
            endPos      =   0;
            
        // constants
        o.itemContainer =   _this.children( o.itemParent ).first();
        o.items         =   o.itemContainer.children( o.item );
        o.itemsSize     =   o.items.size();
        o.itemWidth     =   o.items.first().width();
        o.nav           =   _this.parent().children( '.' + o.navClass );
        o.navNext       =   o.nav.children().find( '.next' );
        o.navPrev       =   o.nav.children().find( '.prev' );
        
        // add the scroll-page value to keep track of where we are
        if( typeof o.itemContainer.data( pluginName + '-page' ) === 'undefined' ){
            o.itemContainer.data( pluginName + '-page', 1 );
        }
        
        // returns if android
        isAndroid   =   function() {
            var reg = new RegExp(/android/i);
            return reg.test( navigator.userAgent.toLowerCase() );
        }
        
        // returns android version (to be used with above)
        androidVersion = function() {
            var test = navigator.userAgent.toLowerCase().match(/android\s+([\d\.]+)/);
            if( typeof test === 'object' && test instanceof Array ){
                return parseInt( test[1] );
            }
        }
        
        // returns if webkit
        isWebkit = function() {
            var reg = new RegExp(/webkit/i);
            return reg.test( navigator.userAgent.toLowerCase() );
        }

        // returns if windows
        isWindows = function() {
            var reg = new RegExp(/windows/i);
            return reg.test( navigator.userAgent.toLowerCase() );
        }

        // namespace our events
        myEvent = function( event ){
            return event + '.' + pluginName;
		}
		
		// the windows phones we have so far aren't touch devices per se, so skip them
		if( !isWindows() ){
		
    		// add start event
            _this.bind( myEvent( tStart ), function( e ) {
                if( isAndroid() ) { e.preventDefault(); }
                if( !mDown ) {
                    o.itemContainer.stop( true, true );
                    var touch = isTouch ? e.originalEvent.touches[ 0 ] || e.originalEvent.changedTouches[ 0 ] : e;
                    mDown = true;
                    mouseX = touch.pageX - this.offsetLeft;
                    mouseY = touch.pageY - this.offsetTop;
                    startPos = parseInt( o.itemContainer.css( 'left' ) ),
                    endPos = 0;
                }
                if( isAndroid() ) { return false; }
            });
            
            // add move event
            _this.bind( myEvent( tMove ), function( e ) {
                if( mDown ) {
                    var touch = isTouch ? e.originalEvent.touches[ 0 ] || e.originalEvent.changedTouches[ 0 ] : e;
                    xDiff = ( touch.pageX - this.offsetLeft ) - mouseX;
                    yDiff = ( touch.pageY - this.offsetTop ) - mouseY;
                    if( Math.abs( yDiff ) < Math.abs( xDiff ) && Math.abs( xDiff ) > 10  ){
                        e.preventDefault();
                        doDrag( _this, o, xDiff, startPos );
                    //}else if( Math.abs( yDiff ) < 10 && Math.abs( xDiff ) < 10 ){
                        //hasClicked( e, _this, o );
                    }else{
                        if( isAndroid() ){
                            var y = document.body.scrollTop - yDiff;
                            window.scrollTo(0, y);
                        }
                    }
                }
            });
            
            // add stop event
            _this.bind( myEvent( tEnd ), function( e ) {
                if( isAndroid() ) { e.preventDefault(); }
                var touch = isTouch ? e.originalEvent.touches[ 0 ] || e.originalEvent.changedTouches[ 0 ] : e;
                if( Math.abs( yDiff ) < o.clickSensitivity && Math.abs( xDiff ) < o.clickSensitivity ){
                    hasClicked( e, _this, o );
                    return;
                }
                mDown   = false;
                mouseX  =   0;
                mouseY  =   0;
                xDiff   =   0;
                yDiff   =   0;
                endPos  =   touch.pageX;
                endInteraction( _this, o, startPos, endPos );
                if( isAndroid() ) { return false; }
            });
        
        }
    
        // add click event
        _this.bind( myEvent( 'click' ), function( e ) {
            e.preventDefault();
        } );
        
        // add resize/orientation change event
        $( window ).smartresize( function(){
       		testShouldShiftRight( _this, o );
       		showNavItems( _this, o );
      	} );
      	
      	// nav for windows (for now), non touch devices, and android 1.6(?)
      	if( !isTouch || isWindows() ){
            
            // show nav
            o.nav.show();
            
            // add previous event
            o.navPrev.bind( 'click', function( e ){
                e.preventDefault();
                hasSwiped( _this, o, 'right', o.itemContainer.css( 'left' ) );
            } ).hide();
            
            // add next event
            o.navNext.bind( 'click', function( e ){
                e.preventDefault();
                hasSwiped( _this, o, 'left', o.itemContainer.css( 'left' ) );
            } );

      	}
      	
      	// should we show the pager?
        if( o.showPager === true ){
            showPaging( _this, o );
        }
        
        // load images on demand
        if( o.lazyLoadImages === true ){
            loadLazyImages( _this, o );
        }

    }
    
    // deals with the 'drag' functionality
    doDrag = function( obj, o, x, orig ){
        var el  = o.itemContainer,
            pos = orig + x;
        el.css( 'left', pos + 'px' );
    }
    
    // calculates what we should do when the user has finished swiping/moving/dragging
    endInteraction = function( obj, o, origX, newX ) {
        var el = o.itemContainer,
            screen = getViewportWidth(),
            leftHS = screen * o.hotSpot,
            rightHS = screen - leftHS;
        if( getViewportWidth() >= ( o.itemsSize * o.itemWidth ) && parseInt( o.itemContainer.data( pluginName + '-page' ) ) === 1 ){
            doAnimate( origX, origX, obj, o );
        }else if( newX > leftHS && newX < rightHS ){
            doAnimate( origX, origX, obj, o );
        }else{
            var dir = ( newX < leftHS ) ? 'left' : 'right';
            hasSwiped( obj, o, dir, origX );
        }
    }
    
    // we've had a swipe
    hasSwiped = function( obj, o, dir, origX ) {
        var moveRight   =   ( dir === 'right' ),
            parent      =	o.itemContainer,
            visEls	    =	getVisibleItems( o.itemWidth ),
            numEls		=	o.itemsSize,
            factor		=	1,
            firstIs     =   parseInt( parent.data( pluginName + '-page' ) ),
            startPos    =   origX,
            pos, endPos;
        // if we can see all the items anyway, why have the scroll functionality? 
        if( getViewportWidth() >= ( numEls * o.itemWidth ) && firstIs === 1 ){
            return;
        } 
        // calculate how much to move the carousel
		if( moveRight ){
            if( firstIs === 1 ){
                doAnimate( origX, origX, obj, o );
                return;
            }
			pos		= ( ( firstIs - 1 ) * o.itemWidth );
		}else{
			if( isLastPlace( obj, o ) === numEls ) {
                doAnimate( origX, origX, obj, o );
                return;
            }
			pos		= ( ( ( numEls - firstIs ) + 1 ) - visEls ) * o.itemWidth;
			factor 	= -1;
		}
		pos = ( pos > ( visEls * o.itemWidth ) )? factor * ( visEls * o.itemWidth ) : factor * pos;
		endPos = parseInt( startPos ) + pos;
        doAnimate( startPos, endPos, obj, o );
    }
    
    // deals with the actual animation
    doAnimate = function( start, end, obj, o ) {
        var el = o.itemContainer;
        el.animate( {
            'left'  :   end + 'px'   
        }, o.snapBackSpeed, function(){
           animationComplete( obj, end, o )
        } );
    }
    
    // called when animation has completed
    animationComplete = function( obj, end, o ) {
        var el = o.itemContainer;
        el.data( pluginName + '-page', isFirstPlace( obj, o, end ) );
        showNavItems( obj, o );
        if( o.showPager === true ){
            showPaging( obj, o );
        }
        if( o.lazyLoadImages === true ){
            loadLazyImages( obj, o, end );
        }
    }
    
    // lazy load images
  	loadLazyImages = function( obj, o, end ){
        var first = isFirstPlace( obj, o, end ),
            last = isLastPlace( obj, o );
        for( var i = 1, x = last + 1; i <= x; i = i + 1 ){
            var item = obj.children( o.itemParent ).children( o.item + ':nth-child(' + i + ')' );
            if( item.length === 0 ){ return; }
            item.find( 'img' ).each( function() {
                if( $( this ).attr( 'src' ).indexOf( 't.gif' ) !=-1 && ( $( this ).attr( o.imageHolder ) && $( this ).attr( o.imageHolder ).length > 0 ) ){
                    $( this ).attr( 'src', $( this ).attr( o.imageHolder ) )
                }
            } );
        }
  	}
    
    // works out which item is in 'first place'
    isFirstPlace = function( obj, o, pos ){
        if( !pos ){
            var parent  =	o.itemContainer,
            pos         =   parent.data( pluginName + '-left' ) ?  parent.data( pluginName + '-left' ) : parseInt( parent.css( 'left' ) );
        }
        return ( Math.abs( pos ) / o.itemWidth ) + 1;
    }
    
    // works out which item is in 'last place'
    // important: 'last place' is the position occupied by the right most FULLY VISIBLE item
    isLastPlace = function( obj, o ) {
        var screenWidth =   getViewportWidth(),
            itemWidth   =   o.itemWidth,
            itemsSize   =   o.itemsSize,
            firstItem   =   parseInt( o.itemContainer.data( pluginName + '-page' ) ),
            remaining   =   ( itemsSize - firstItem ) * itemWidth,
            result = ( parseInt( firstItem ) - 1 ) + getVisibleItems( itemWidth );
        return ( result > itemsSize ) ? itemsSize : result;
    }
    
    // works out if we should move the items further to the right on orientation change
    testShouldShiftRight = function( obj, o ) {
        var firstItem       =   parseInt( o.itemContainer.data( pluginName + '-page' ) ),
            itemWidth       =   o.itemWidth,
            itemsSize       =   o.itemsSize,
            parent          =	o.itemContainer,
            startPos        =   parseInt( parent.css( 'left' ) ),
            canFit          =   getVisibleItems( itemWidth ),
            shouldBeFirst   =   ( itemsSize - canFit ) + 1,
            endPos = ( ( shouldBeFirst - 1 ) * itemWidth ) * -1;
        if( ( firstItem + ( getVisibleItems( itemWidth ) - 1 ) ) > itemsSize && endPos <= 0 ){
            doAnimate( startPos, endPos, obj, o )
        }
    }
    
    // works out whether we should be showing the prev and/or next nav items
    showNavItems = function( obj, o ) {
        if( o.nav.is(':visible') ){
            if( isFirstPlace( obj, o ) === 1 ){
                o.navPrev.hide();
            }else{
                o.navPrev.show();
            }
            if( isLastPlace( obj, o ) === o.itemsSize ){
                o.navNext.hide();
            }else{
                o.navNext.show();
            }
        }
    }
    
    // shows the pagination, if required
    showPaging = function( obj, o ) {
        if( o.showPager !== true ){ return; }
        var page        =   obj.find( 'ol.' + o.pageClass ),
            el          =   o.itemContainer,
            allEls      =   el.children( o.item ),
            elWidth     =   o.itemWidth,
            numEls      =   o.itemsSize,
            canFit      =   getVisibleItems( elWidth ),
            frag        =   document.createDocumentFragment(),
            li          =   document.createElement( 'li' ),
            span        =   document.createElement( 'span' ),
            firstEl     =   parseInt( el.data( pluginName + '-page' ) );
            function currentInfo( numEls, firstEl, canFit ) {
                var pagesBefore = Math.ceil( ( firstEl - 1 ) / canFit ),
                    pagesAfter = Math.floor( ( numEls - ( firstEl ) ) / canFit ),
                    pages = pagesBefore + 1 + pagesAfter,
                    page = pages - pagesAfter;
                return {
                    'pages'    : pages,
                    'page'     : page
                }
            }
            var info    =   currentInfo( numEls, firstEl, canFit ),
            maxPages    =   info.pages,
            currentPage =   info.page;
        page.empty();
        if( maxPages < 2 ){
           return;
        }
        for( var i = 0, x = maxPages; i < x; i = i + 1 ){
           li.appendChild( span );
           frag.appendChild( li.cloneNode( true ) );
        }
        page.css( 'width', ( maxPages * o.pageLiWidth ) + 'px' ).append( $( frag ) ).show(); 
        page.children( 'li:nth-child(' + currentPage + ')' ).addClass( 'on' ); 
    }
    
    // we've had a click
    hasClicked = function( e, obj, o ) {
        var el  =   e.target,
            a   =   ( el.nodeType === 3 ) ? el.parentNode : el;
            a   =   ( a.nodeName.toLowerCase() !== 'a' ) ? $( a ).parents( 'a' ) : $( a );
        if( a.length > 0 ){
            var href = a.attr( 'href' );
            if( href && href.length > 0 ){
                window.location.href = href;
            }
        }
    }
    
    // get the width of the viewport
	getViewportWidth = function(){
		var viewPortWidth;
		if( typeof window.innerWidth != 'undefined' ){
			viewPortWidth = window.innerWidth;
		}else if(	typeof document.documentElement != 'undefined'
					&& typeof document.documentElement.clientWidth != 'undefined'
					&& document.documentElement.clientWidth != 0 ){
			viewPortWidth = document.documentElement.clientWidth;
		}else{
			viewPortWidth = document.getElementsByTagName( 'body' )[ 0 ].clientWidth;
		}
		return viewPortWidth;
	}
	
	// calculate amount of items we can *completely* fit on the current screen width
	getVisibleItems = function( itemWidth ){
		return Math.floor( getViewportWidth() / itemWidth );
	}
		
    $.fn[ pluginName ] = function ( options ) {
        return this.each( function () {
            if ( !$.data( this, 'plugin_' + pluginName ) ) {
                $.data( this, 'plugin_' + pluginName,
                new Plugin( this, options ) );
            }
        });
    }
	
})( jQuery, window, document );

/**
 * Debounced resize() / smartresize() - http://paulirish.com/2009/throttled-smartresize-jquery-event-handler/
 */
(function($,sr){var debounce=function(func,threshold,execAsap){var timeout;return function debounced(){var obj=this,args=arguments;function delayed(){if(!execAsap){func.apply(obj,args)}timeout=null};if(timeout){clearTimeout(timeout)}else if(execAsap){func.apply(obj,args)}timeout=setTimeout(delayed,(threshold||100))}};jQuery.fn[sr]=function(fn){return(fn)?this.bind('resize',debounce(fn)):this.trigger(sr)}})(jQuery,'smartresize');
/**
 * jQuery.ScrollTo - http://flesler.blogspot.com/2007/10/jqueryscrollto.html - @author Ariel Flesler - @version 1.4.2
 */
;(function(d){var k=d.scrollTo=function(a,i,e){d(window).scrollTo(a,i,e)};k.defaults={axis:'xy',duration:parseFloat(d.fn.jquery)>=1.3?0:1};k.window=function(a){return d(window)._scrollable()};d.fn._scrollable=function(){return this.map(function(){var a=this,i=!a.nodeName||d.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!i)return a;var e=(a.contentWindow||a).document||a.ownerDocument||a;return d.browser.safari||e.compatMode=='BackCompat'?e.body:e.documentElement})};d.fn.scrollTo=function(n,j,b){if(typeof j=='object'){b=j;j=0}if(typeof b=='function')b={onAfter:b};if(n=='max')n=9e9;b=d.extend({},k.defaults,b);j=j||b.speed||b.duration;b.queue=b.queue&&b.axis.length>1;if(b.queue)j/=2;b.offset=p(b.offset);b.over=p(b.over);return this._scrollable().each(function(){var q=this,r=d(q),f=n,s,g={},u=r.is('html,body');switch(typeof f){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(f)){f=p(f);break}f=d(f,this);case'object':if(f.is||f.style)s=(f=d(f)).offset()}d.each(b.axis.split(''),function(a,i){var e=i=='x'?'Left':'Top',h=e.toLowerCase(),c='scroll'+e,l=q[c],m=k.max(q,i);if(s){g[c]=s[h]+(u?0:l-r.offset()[h]);if(b.margin){g[c]-=parseInt(f.css('margin'+e))||0;g[c]-=parseInt(f.css('border'+e+'Width'))||0}g[c]+=b.offset[h]||0;if(b.over[h])g[c]+=f[i=='x'?'width':'height']()*b.over[h]}else{var o=f[h];g[c]=o.slice&&o.slice(-1)=='%'?parseFloat(o)/100*m:o}if(/^\d+$/.test(g[c]))g[c]=g[c]<=0?0:Math.min(g[c],m);if(!a&&b.queue){if(l!=g[c])t(b.onAfterFirst);delete g[c]}});t(b.onAfter);function t(a){r.animate(g,j,b.easing,a&&function(){a.call(this,n,b)})}}).end()};k.max=function(a,i){var e=i=='x'?'Width':'Height',h='scroll'+e;if(!d(a).is('html,body'))return a[h]-d(a)[e.toLowerCase()]();var c='client'+e,l=a.ownerDocument.documentElement,m=a.ownerDocument.body;return Math.max(l[h],m[h])-Math.min(l[c],m[c])};function p(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);
/**
 * jQuery.touchWipe - @author Andreas Waltl, netCU Internetagentur (http://www.netcu.de) - @version 1.1.1 (9th December 2010) 
 */
(function($){$.fn.touchwipe=function(settings){var config={min_move_x:20,min_move_y:20,wipeLeft:function(){},wipeRight:function(){},wipeUp:function(){},wipeDown:function(){},preventDefaultEvents:true};if(settings)$.extend(config,settings);this.each(function(){var startX;var startY;var isMoving=false;function cancelTouch(){this.removeEventListener('touchmove',onTouchMove);startX=null;isMoving=false}function onTouchMove(e){if(config.preventDefaultEvents){e.preventDefault()}if(isMoving){var x=e.touches[0].pageX;var y=e.touches[0].pageY;var dx=startX-x;var dy=startY-y;if(Math.abs(dx)>=config.min_move_x){cancelTouch();if(dx>0){config.wipeLeft()}else{config.wipeRight()}}else if(Math.abs(dy)>=config.min_move_y){cancelTouch();if(dy>0){config.wipeDown()}else{config.wipeUp()}}}}function onTouchStart(e){if(e.touches.length==1){startX=e.touches[0].pageX;startY=e.touches[0].pageY;isMoving=true;this.addEventListener('touchmove',onTouchMove,false)}}if('ontouchstart'in document.documentElement){this.addEventListener('touchstart',onTouchStart,false)}});return this}})(jQuery);