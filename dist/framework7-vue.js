/**
 * Framework7 Vue 2.0.0-beta.1
 * Build full featured iOS & Android apps using Framework7 & Vue
 * http://framework7.io/vue/
 *
 * Copyright 2014-2017 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: October 9, 2017
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Framework7Vue = {})));
}(this, (function (exports) { 'use strict';

var Utils = {
  isTrueProp: function isTrueProp(val) {
    return val === true || val === '';
  },
  isStringProp: function isStringProp(val) {
    return typeof val === 'string' && val !== '';
  },
  isObject: function isObject(o) {
    return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
  },
  now: function now() {
    return Date.now();
  },
  extend: function extend() {
    var args = [], len$1 = arguments.length;
    while ( len$1-- ) args[ len$1 ] = arguments[ len$1 ];

    var deep = true;
    var to;
    var from;
    if (typeof args[0] === 'boolean') {
      var assign;
      (assign = args, deep = assign[0], to = assign[1]);
      args.splice(0, 2);
      from = args;
    } else {
      var assign$1;
      (assign$1 = args, to = assign$1[0]);
      args.splice(0, 1);
      from = args;
    }
    for (var i = 0; i < from.length; i += 1) {
      var nextSource = args[i];
      if (nextSource !== undefined && nextSource !== null) {
        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            if (!deep) {
              to[nextKey] = nextSource[nextKey];
            } else if (Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
              Utils.extend(to[nextKey], nextSource[nextKey]);
            } else if (!Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
              to[nextKey] = {};
              Utils.extend(to[nextKey], nextSource[nextKey]);
            } else {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
    }
    return to;
  },
};

/* eslint no-underscore-dangle: "off" */
var VueRouter = {
  proto: {
    pageComponentLoader: function pageComponentLoader(routerEl, component, componentUrl, options, resolve, reject) {
      var router = this;
      var el = router.$el[0];
      var routerVue = el.__vue__;
      if (!routerVue || !routerVue.pages) {
        reject();
      }
      var id = Utils.now();
      var pageData = {
        component: component,
        id: id,
        params: Utils.extend({}, options.route.params),
      };
      routerVue.$f7route = options.route;
      routerVue.pages.push(pageData);
      routerVue.$nextTick(function () {
        var pageEl = el.children[el.children.length - 1];
        pageData.el = pageEl;

        var pageEvents;
        if (component.on) {
          var pageVueFound;
          var pageVue = pageEl.__vue__;
          while (pageVue.$parent && !pageVueFound) {
            if (pageVue.$parent.$el === pageEl) {
              pageVue = pageVue.$parent;
            } else {
              pageVueFound = true;
            }
          }
          if (pageVue) {
            pageEvents = Utils.extend({}, component.on);
            Object.keys(pageEvents).forEach(function (pageEvent) {
              pageEvents[pageEvent] = pageEvents[pageEvent].bind(pageVue);
            });
          }
        }

        resolve(pageEl, { pageEvents: pageEvents });
      });
    },
    removePage: function removePage($pageEl) {
      if (!$pageEl) { return; }
      var router = this;
      var routerVue = router.$el[0].__vue__;

      var pageEl;
      if ('length' in $pageEl) {
        // Dom7
        if ($pageEl.length === 0) { return; }
        pageEl = $pageEl[0];
      } else {
        pageEl = $pageEl;
      }
      if (!pageEl) { return; }
      var pageVueFound;
      routerVue.pages.forEach(function (page, index) {
        if (page.el === pageEl) {
          pageVueFound = true;
          routerVue.pages.splice(index, 1);
        }
      });
      if (!pageVueFound) {
        pageEl.parentNode.removeChild(pageEl);
      }
    },
    tabComponentLoader: function tabComponentLoader(tabEl, component, componentUrl, options, resolve, reject) {
      if (!tabEl) { reject(); }

      var tabVue = tabEl.__vue__;
      if (!tabVue) { reject(); }

      var id = Utils.now();
      tabVue.$set(tabVue, 'tabContent', {
        id: id,
        component: component,
        params: Utils.extend({}, options.route.params),
      });

      var pageEvents;
      if (component.on) {
        pageEvents = Utils.extend({}, component.on);
        Object.keys(pageEvents).forEach(function (pageEvent) {
          pageEvents[pageEvent] = pageEvents[pageEvent].bind(tabVue);
        });
      }

      tabVue.$nextTick(function () {
        var tabContentEl = tabEl.children[0];
        resolve(tabContentEl, { pageEvents: pageEvents });
      });
    },
    removeTabContent: function removeTabContent(tabEl) {
      if (!tabEl) { return; }

      var tabVue = tabEl.__vue__;
      if (!tabVue) {
        tabEl.innerHTML = ''; // eslint-disable-line
        return;
      }

      tabVue.tabContent = null;
    },
  },
};

/* eslint no-param-reassign: "off" */
var vuePlugin = {
  install: function install(Vue, Framework7) {
    // Event Hub
    var eventHub = new Vue();

    // Flags
    var f7Ready = false;
    var f7Instance;

    // Define protos
    Object.defineProperty(Vue.prototype, '$f7', {
      get: function get() {
        return f7Instance;
      },
    });

    var $theme = {};
    Object.defineProperty(Vue.prototype, '$theme', {
      get: function get() {
        return {
          ios: f7Instance ? f7Instance.theme === 'ios' : $theme.ios,
          md: f7Instance ? f7Instance.theme === 'md' : $theme.md,
        };
      },
    });
    Vue.prototype.Dom7 = Framework7.$;
    Vue.prototype.$$ = Framework7.$;
    Vue.prototype.$device = (Framework7.Device || Framework7.device);

    // Init F7
    function initFramework7(rootEl, params, routes) {
      var f7Params = Utils.extend({}, (params || {}), { root: rootEl });
      if (routes && routes.length && !f7Params.routes) { f7Params.routes = routes; }

      f7Instance = new Framework7(f7Params);
      f7Ready = true;
      eventHub.$emit('f7Ready', f7Instance);
    }

    // Extend Router
    Framework7.Router.use(VueRouter);

    // Mixin
    Vue.mixin({
      beforeCreate: function beforeCreate() {
        var self = this;
        if (self === self.$root) {
          var ref = (self.$options.framework7 || {});
          var theme = ref.theme;
          if (theme === 'md') { $theme.md = true; }
          if (theme === 'ios') { $theme.ios = true; }
          if (!theme || theme === 'auto') {
            $theme.ios = !!(Framework7.Device || Framework7.device).ios;
            $theme.md = !(Framework7.Device || Framework7.device).ios;
          }
        }

        var $route;
        var $router;
        var parent = self;
        while (parent && !$router && !$route) {
          if (parent.$f7route) { $route = parent.$f7route; }
          if (parent.$f7router) { $router = parent.$f7router; }
          else if (parent.f7View) {
            $router = parent.f7View.router;
          }
          parent = parent.$parent;
        }

        self.$f7route = $route;
        self.$f7router = $router;
      },
      mounted: function mounted() {
        var self = this;
        if (self === self.$root) {
          initFramework7(self.$root.$el, self.$options.framework7, self.$options.routes);
        }
        if (!self.onF7Ready) { return; }
        if (f7Ready) { self.onF7Ready(f7Instance); }
        else {
          eventHub.$on('f7Ready', function (f7) {
            self.onF7Ready(f7);
          });
        }
      },
    });
  },
};

var views = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"views",class:_vm.classes},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-views',
    props: {
      tabs: Boolean,
    },
    computed: {
      classes: function classes() {
        var co = {
          tabs: this.tabs,
        };
        return co;
      },
    },
  };

var view = {
    name: 'f7-view',
    render: function render(c) {
      var self = this;
      var pages = self.pages.map(function (page) { return c(page.component, {
        tag: 'component',
        props: page.params ? page.params || {} : {},
        key: page.id,
      }); });
      return c(
        'div',
        {
          staticClass: 'view',
          ref: 'view',
          class: self.classes,
          on: {
            'swipeback:move': self.onSwipeBackMove,
            'swipeback:beforechange': self.onSwipeBackBeforeChange,
            'swipeback:afterchange': self.onSwipeBackAfterChange,
            'swipeback:beforereset': self.onSwipeBackBeforeReset,
            'swipeback:afterreset': self.onSwipeBackAfterReset,
            'tab:show': self.onTabShow,
            'tab:hide': self.onTabHide,
          },
        },
        [
          self.$slots.default,
          pages ]
      );
    },
    beforeDestroy: function beforeDestroy() {
      var self = this;
      if (self.f7View && self.f7View.destroy) { self.f7View.destroy(); }
    },
    props: {
      tab: Boolean,
      tabActive: Boolean,

      url: String,
      main: Boolean,
      stackPages: String,
      xhrCache: String,
      xhrCacheIgnore: Array,
      xhrCacheIgnoreGetParameters: Boolean,
      xhrCacheDuration: Number,
      preloadPreviousPage: Boolean,
      uniqueHistory: Boolean,
      uniqueHistoryIgnoreGetParameters: Boolean,
      allowDuplicateUrls: Boolean,
      reloadPages: Boolean,
      removeElements: Boolean,
      removeElementsWithTimeout: Boolean,
      removeElementsTimeout: Number,
      restoreScrollTopOnBack: Boolean,
      // Swipe Back
      iosSwipeBack: Boolean,
      iosSwipeBackAnimateShadow: Boolean,
      iosSwipeBackAnimateOpacity: Boolean,
      iosSwipeBackActiveArea: Number,
      iosSwipeBackThreshold: Number,
      // Push State
      pushState: Boolean,
      pushStateRoot: String,
      pushStateAnimate: Boolean,
      pushStateAnimateOnLoad: Boolean,
      pushStateSeparator: String,
      pushStateOnLoad: Boolean,
      // Animate Pages
      animate: Boolean,
      // iOS Dynamic Navbar
      iosDynamicNavbar: Boolean,
      iosSeparateDynamicNavbar: Boolean,
      // Animate iOS Navbar Back Icon
      iosAnimateNavbarBackIcon: Boolean,
      // MD Theme delay
      materialPageLoadDelay: Number,

      init: {
        type: Boolean,
        default: true,
      },

      colorTheme: String,
    },
    data: function data() {
      return {
        pages: [],
      };
    },
    computed: {
      classes: function classes() {
        var co = {
          'view-main': this.main,
          'tab-active': this.tabActive,
          tab: this.tab,
        };
        if (this.colorTheme) { co[("color-theme-" + (this.colorTheme))] = true; }
        return co;
      },
    },
    methods: {
      onF7Ready: function onF7Ready(f7) {
        var self = this;
        if (!self.init) { return; }

        // Init View
        self.f7View = f7.views.create(self.$el, self.$options.propsData);
      },
      onSwipeBackMove: function onSwipeBackMove(event) {
        this.$emit('swipeback:move', event, event.detail);
      },
      onSwipeBackBeforeChange: function onSwipeBackBeforeChange(event) {
        this.$emit('swipeback:beforechange', event, event.detail);
      },
      onSwipeBackAfterChange: function onSwipeBackAfterChange(event) {
        this.$emit('swipeback:afterchange', event, event.detail);
      },
      onSwipeBackBeforeReset: function onSwipeBackBeforeReset(event) {
        this.$emit('swipeback:beforereset', event, event.detail);
      },
      onSwipeBackAfterReset: function onSwipeBackAfterReset(event) {
        this.$emit('swipeback:afterreset', event, event.detail);
      },
      onTabShow: function onTabShow(e) {
        this.$emit('tab:show', e);
      },
      onTabHide: function onTabHide(e) {
        this.$emit('tab:hide', e);
      },
    },
  };

var f7PageContent = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"page-content",class:_vm.classes,on:{"tab:show":_vm.onTabShow,"tab:hide":_vm.onTabHide}},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-page-content',
    render: function render(c) {
      var self = this;

      var ptrEl;
      var infiniteEl;

      if (self.ptr && (self.ptrPreloader)) {
        ptrEl = c('div', { staticClass: 'ptr-preloader' }, [
          c('div', { staticClass: 'preloader' }),
          c('div', { staticClass: 'ptr-arrow' }) ]);
      }
      if ((self.infinite) && self.infinitePreloader) {
        infiniteEl = c('div', { staticClass: 'preloader infinite-scroll-preloader' });
      }
      return c('div', {
        staticClass: 'page-content',
        class: self.classes,
        attrs: {
          'data-ptr-distance': self.ptrDistance,
          'data-infinite-distance': self.infiniteDistance,
        },
        on: {
          'ptr:pullstart': self.onPtrPullStart,
          'ptr:pullmove': self.onPtrPullMove,
          'ptr:pullend': self.onPtrPullEnd,
          'ptr:refresh': self.onPtrRefresh,
          'ptr:done': self.onPtrRefreshDone,
          infinite: self.onInfinite,
          'tab:show': self.onTabShow,
          'tab:hide': self.onTabHide,
        },
      }, (self.infiniteTop ? [ptrEl, infiniteEl, self.$slots.default] : [ptrEl, self.$slots.default, infiniteEl]));
    },
    props: {
      tab: Boolean,
      tabActive: Boolean,
      ptr: Boolean,
      ptrDistance: Number,
      ptrPreloader: {
        type: Boolean,
        default: true,
      },
      infinite: Boolean,
      infiniteTop: Boolean,
      infiniteDistance: Number,
      infinitePreloader: {
        type: Boolean,
        default: true,
      },
      hideBarsOnScroll: Boolean,
      hideNavbarOnScroll: Boolean,
      hideToolbarOnScroll: Boolean,
      messagesContent: Boolean,
      loginScreen: Boolean,
    },
    computed: {
      classes: function classes() {
        var self = this;
        return {
          tab: self.tab,
          'tab-active': self.tabActive,
          'ptr-content': this.ptr,
          'infinite-scroll-content': this.infinite,
          'infinite-scroll-top': this.infiniteTop,
          'hide-bars-on-scroll': this.hideBarsOnScroll,
          'hide-navbar-on-scroll': this.hideNavbarOnScroll,
          'hide-toolbar-on-scroll': this.hideToolbarOnScroll,
          'messages-content': this.messagesContent,
          'login-screen-content': this.loginScreen,
        };
      },
    },
    methods: {
      onPtrPullStart: function onPtrPullStart(event) {
        this.$emit('ptr:pullstart', event);
      },
      onPtrPullMove: function onPtrPullMove(event) {
        this.$emit('ptr:pullmove', event);
      },
      onPtrPullEnd: function onPtrPullEnd(event) {
        this.$emit('ptr:pullend', event);
      },
      onPtrRefresh: function onPtrRefresh(event) {
        this.$emit('ptr:refresh', event.detail);
      },
      onPtrRefreshDone: function onPtrRefreshDone(event) {
        this.$emit('ptr:done', event);
      },
      onInfinite: function onInfinite(event) {
        this.$emit('infinite', event);
      },
      onTabShow: function onTabShow(e) {
        var self = this;
        self.$emit('tab:show', e);
      },
      onTabHide: function onTabHide(e) {
        var self = this;
        self.$emit('tab:hide', e);
      },
    },
  };

var page = {
    name: 'f7-page',
    components: {
      f7PageContent: f7PageContent,
    },
    render: function render(c) {
      var fixedList = [];
      var staticList = [];
      var self = this;

      var pageContentEl;

      var fixedTags = ('navbar toolbar tabbar subnavbar searchbar messagebar fab').split(' ');

      var tag;
      var child;
      var withSubnavbar;
      var withSearchbar;

      if (self.$slots.default) {
        for (var i = 0; i < self.$slots.default.length; i += 1) {
          child = self.$slots.default[i];
          tag = child.tag;
          if (!tag) {
            staticList.push(child);
            continue;
          }
          var isFixed = false;
          if (tag.indexOf('subnavbar') >= 0) { withSubnavbar = true; }
          if (tag.indexOf('searchbar') >= 0) { withSearchbar = true; }
          for (var j = 0; j < fixedTags.length; j += 1) {
            if (tag.indexOf(fixedTags[j]) >= 0) {
              isFixed = true;
            }
          }
          if (isFixed) { fixedList.push(child); }
          else { staticList.push(child); }
        }
      }

      if (fixedList.length > 0 && withSearchbar) {
        fixedList.push(c('div', { class: { 'searchbar-overlay': true } }));
      }
      if (self.pageContent) {
        pageContentEl = c('f7-page-content', {
          props: {
            ptr: self.ptr,
            ptrDistance: self.ptrDistance,
            ptrPreloader: self.ptrPreloader,
            infinite: self.infinite,
            infiniteTop: self.infiniteTop,
            infiniteDistance: self.infiniteDistance,
            infinitePreloader: self.infinitePreloader,
            hideBarsOnScroll: self.hideBarsOnScroll,
            hideNavbarOnScroll: self.hideNavbarOnScroll,
            hideToolbarOnScroll: self.hideToolbarOnScroll,
            messagesContent: self.messagesContent,
            loginScreen: self.loginScreen,
          },
          on: {
            'ptr:pullstart': self.onPtrPullStart,
            'ptr:pullmove': self.onPtrPullMove,
            'ptr:pullend': self.onPtrPullEnd,
            'ptr:refresh': self.onPtrRefresh,
            'ptr:done': self.onPtrRefreshDone,
            infinite: self.onInfinite,
          },
        }, [self.$slots.static, staticList]);
      } else {
        pageContentEl = [];
        if (self.$slots.default && fixedList.length > 0) {
          for (var i$1 = 0; i$1 < self.$slots.default.length; i$1 += 1) {
            if (fixedList.indexOf(self.$slots.default[i$1]) < 0) {
              pageContentEl.push(self.$slots.default[i$1]);
            }
          }
        } else {
          pageContentEl = [self.$slots.default];
        }
      }
      fixedList.push(self.$slots.fixed);

      if (withSubnavbar) { self.classesPage['with-subnavbar'] = true; }

      var pageEl = c('div', {
        staticClass: 'page',
        class: self.classes,
        attrs: {
          'data-name': self.name,
        },
        on: {
          'page:mounted': self.onPageMounted,
          'page:init': self.onPageInit,
          'page:reinit': self.onPageReinit,
          'page:beforein': self.onPageBeforeIn,
          'page:afterain': self.onPageAfterIn,
          'page:beforeout': self.onPageBeforeOut,
          'page:afterout': self.onPageAfterOut,
          'page:beforeremove': self.onPageBeforeRemove,
        },
      }, [fixedList, pageContentEl]);

      return pageEl;
    },
    props: {
      name: String,
      stacked: Boolean,
      withSubnavbar: Boolean,
      subnavbar: Boolean,
      noNavbar: Boolean,
      noToolbar: Boolean,
      tabs: Boolean,
      pageContent: {
        type: Boolean,
        default: true,
      },
      colorTheme: String,
      noSwipeback: Boolean,
      // Page Content Props
      ptr: Boolean,
      ptrDistance: Number,
      ptrPreloader: {
        type: Boolean,
        default: true,
      },
      infinite: Boolean,
      infiniteTop: Boolean,
      infiniteDistance: Number,
      infinitePreloader: {
        type: Boolean,
        default: true,
      },
      hideBarsOnScroll: Boolean,
      hideNavbarOnScroll: Boolean,
      hideToolbarOnScroll: Boolean,
      messagesContent: Boolean,
      loginScreen: Boolean,
    },
    computed: {
      classes: function classes() {
        var co = {
          stacked: this.stacked,
          tabs: this.tabs,
          'page-with-subnavbar': this.subnavbar || this.withSubnavbar,
          'no-navbar': this.noNavbar,
          'no-toolbar': this.noToolbar,
          'no-swipeback': this.noSwipeback,
        };
        if (this.theme) { co[("color-theme-" + (this.colorTheme))] = true; }
        return co;
      },
    },
    methods: {
      onPtrPullStart: function onPtrPullStart(event) {
        this.$emit('ptr:pullstart', event);
      },
      onPtrPullMove: function onPtrPullMove(event) {
        this.$emit('ptr:pullmove', event);
      },
      onPtrPullEnd: function onPtrPullEnd(event) {
        this.$emit('ptr:pullend', event);
      },
      onPtrRefresh: function onPtrRefresh(event) {
        this.$emit('ptr:refresh', event.detail);
      },
      onPtrRefreshDone: function onPtrRefreshDone(event) {
        this.$emit('ptr:done', event);
      },
      onInfinite: function onInfinite(event) {
        this.$emit('infinite', event);
      },
      onPageMounted: function onPageMounted(event) {
        this.$emit('page:mounted', event, event.detail);
      },
      onPageInit: function onPageInit(event) {
        this.$emit('page:init', event, event.detail);
      },
      onPageReinit: function onPageReinit(event) {
        this.$emit('page:reinit', event, event.detail);
      },
      onPageBeforeIn: function onPageBeforeIn(event) {
        this.$emit('page:beforein', event, event.detail);
      },
      onPageBeforeOut: function onPageBeforeOut(event) {
        this.$emit('page:beforeout', event, event.detail);
      },
      onPageAfterOut: function onPageAfterOut(event) {
        this.$emit('page:afterout', event, event.detail);
      },
      onPageAfterIn: function onPageAfterIn(event) {
        this.$emit('page:afteranimation', event, event.detail);
      },
      onPageBeforeRemove: function onPageBeforeRemove(event) {
        this.$emit('page:beforeremove', event, event.detail);
      },
    },
  };

var Mixins = {
  linkIconProps: {
    icon: String,
    iconMaterial: String,
    iconIon: String,
    iconFa: String,
    iconF7: String,
    iconIfMd: String,
    iconIfIos: String,
    iconSize: [String, Number],
  },
  linkRouterProps: {
    back: Boolean,
    external: Boolean,
    force: Boolean,
    reload: Boolean,
    animate: Boolean,
    ignoreCache: Boolean,
    reloadCurrent: Boolean,
    reloadAll: Boolean,
    reloadPrevious: Boolean,
    view: String,
  },
  linkRouterAttrs: function linkRouterAttrs(self) {
    var force = self.force;
    var reloadCurrent = self.reloadCurrent;
    var reloadPrevious = self.reloadPrevious;
    var reloadAll = self.reloadAll;
    var animate = self.animate;
    var ignoreCache = self.ignoreCache;
    var view = self.view;

    return {
      'data-force': force,
      'data-reload-current': reloadCurrent,
      'data-reload-all': reloadAll,
      'data-reload-previous': reloadPrevious,
      'data-animate': ('animate' in self.$options.propsData) ? animate.toString() : undefined,
      'data-ignore-cache': ignoreCache,
      'data-view': Utils.isStringProp(view) ? view : false,
    };
  },
  linkRouterClasses: function linkRouterClasses(self) {
    var back = self.back;
    var linkBack = self.linkBack;
    var external = self.external;

    return {
      back: back || linkBack,
      external: external,
    };
  },
  linkActionsProps: {
    // Panel
    panelOpen: [Boolean, String],
    panelClose: [Boolean, String],

    // Popup
    popupOpen: [Boolean, String],
    popupClose: [Boolean, String],

    // Popover
    popoverOpen: [Boolean, String],
    popoverClose: [Boolean, String],

    // Login Screen
    loginScreenOpen: [Boolean, String],
    loginScreenClose: [Boolean, String],

    // Picker
    sheetOpen: [Boolean, String],
    sheetClose: [Boolean, String],

    // Sortable
    sortableEnable: [Boolean, String],
    sortableDisable: [Boolean, String],
    sortableToggle: [Boolean, String],
  },
  linkActionsAttrs: function linkActionsAttrs(self) {
    var panelOpen = self.panelOpen;
    var panelClose = self.panelClose;
    var popupOpen = self.popupOpen;
    var popupClose = self.popupClose;
    var popoverOpen = self.popoverOpen;
    var popoverClose = self.popoverClose;
    var loginScreenOpen = self.loginScreenOpen;
    var loginScreenClose = self.loginScreenClose;
    var sheetOpen = self.sheetOpen;
    var sheetClose = self.sheetClose;
    var sortableEnable = self.sortableEnable;
    var sortableDisable = self.sortableDisable;
    var sortableToggle = self.sortableToggle;

    return {
      'data-panel': Utils.isStringProp(panelOpen) || Utils.isStringProp(panelClose),
      'data-popup': Utils.isStringProp(popupOpen) || Utils.isStringProp(popupClose),
      'data-popover': Utils.isStringProp(popoverOpen) || Utils.isStringProp(popoverClose),
      'data-sheet': Utils.isStringProp(sheetOpen) || Utils.isStringProp(sheetClose),
      'data-login-screen': Utils.isStringProp(loginScreenOpen) || Utils.isStringProp(loginScreenClose),
      'data-sortable': Utils.isStringProp(sortableEnable) || Utils.isStringProp(sortableDisable) || Utils.isStringProp(sortableToggle),
    };
  },
  linkActionsClasses: function linkActionsClasses(self) {
    var panelOpen = self.panelOpen;
    var panelClose = self.panelClose;
    var popupOpen = self.popupOpen;
    var popupClose = self.popupClose;
    var popoverOpen = self.popoverOpen;
    var popoverClose = self.popoverClose;
    var loginScreenOpen = self.loginScreenOpen;
    var loginScreenClose = self.loginScreenClose;
    var sheetOpen = self.sheetOpen;
    var sheetClose = self.sheetClose;
    var sortableEnable = self.sortableEnable;
    var sortableDisable = self.sortableDisable;
    var sortableToggle = self.sortableToggle;
    return {
      'panel-close': Utils.isTrueProp(panelClose),
      'panel-open': panelOpen || panelOpen === '',
      'popup-close': Utils.isTrueProp(popupClose),
      'popup-open': popupOpen || popupOpen === '',
      'popover-close': Utils.isTrueProp(popoverClose),
      'popover-open': popoverOpen || popoverOpen === '',
      'sheet-close': Utils.isTrueProp(sheetClose),
      'sheet-open': sheetOpen || sheetOpen === '',
      'login-screen-close': Utils.isTrueProp(loginScreenClose),
      'login-screen-open': loginScreenOpen || loginScreenOpen === '',
      'sortable-enable': Utils.isTrueProp(sortableEnable),
      'sortable-disable': Utils.isTrueProp(sortableDisable),
      'sortable-toggle': Utils.isTrueProp(sortableToggle),
    };
  },
};

var f7Badge = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('span',{staticClass:"badge",class:_vm.color ? ("color-" + _vm.color) : ''},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-badge',
    props: {
      color: String,
    },
  };

var f7Icon = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('i',{staticClass:"icon",class:_vm.classes,style:({'font-size':_vm.sizeComputed})},[_vm._v(_vm._s(_vm.iconTextComputed)),_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-icon',
    props: {
      color: String,
      material: String, // Material Icons
      f7: String, // Framework7 Icons
      ion: String, // Ionicons
      fa: String, // Font Awesome
      icon: String, // Custom
      ifMd: String,
      ifIos: String,
      size: [String, Number],
    },
    computed: {
      sizeComputed: function sizeComputed() {
        var self = this;
        var size = self.size;
        if (typeof size === 'number' || parseFloat(size) === size * 1) {
          size = size + "px";
        }
        return size;
      },
      iconTextComputed: function iconTextComputed() {
        var self = this;
        var text = self.material || self.f7;
        if (self.ifMd && self.$theme.md && (self.ifMd.indexOf('material:') >= 0 || self.ifMd.indexOf('f7:') >= 0)) {
          text = self.ifMd.split(':')[1];
        } else if (self.ifIos && self.$theme.ios && (self.ifIos.indexOf('material:') >= 0 || self.ifIos.indexOf('f7:') >= 0)) {
          text = self.ifIos.split(':')[1];
        }
        return text;
      },
      classes: function classes() {
        var classes = {};
        var self = this;
        if (self.ifMd || self.ifIos) {
          var parts = self[self.$theme.md ? 'ifMd' : 'ifIos'].split(':');
          var prop = parts[0];
          var value = parts[1];
          if (prop === 'material' || prop === 'fa' || prop === 'f7') {
            classes.fa = prop === 'fa';
            classes['material-icons'] = prop === 'material';
            classes['f7-icons'] = prop === 'f7';
          }
          if (prop === 'fa' || prop === 'ion') {
            classes[(prop + "-" + value)] = true;
          }
          if (prop === 'icon') {
            classes[value] = true;
          }
        } else {
          classes = {
            'material-icons': this.material,
            'f7-icons': this.f7,
            fa: this.fa,
          };
          if (this.ion) { classes[("ion-" + (this.ion))] = true; }
          if (this.fa) { classes[("fa-" + (this.fa))] = true; }
          if (this.icon) { classes[this.icon] = true; }
        }
        if (this.color) { classes[("color-" + (this.color))] = true; }
        return classes;
      },
    },
  };

var LinkProps = Utils.extend(
    {
      noLinkClass: Boolean,
      noFastClick: Boolean,
      color: String,
      rippleColor: String,
      textColor: String,
      text: String,
      tabLink: [Boolean, String],
      tabLinkActive: Boolean,
      iconOnly: Boolean,
      badge: [String, Number],
      iconBadge: [String, Number],
      badgeColor: [String],
      href: {
        type: String,
        default: '#',
      },
    },
    Mixins.linkIconProps,
    Mixins.linkRouterProps,
    Mixins.linkActionsProps
  );

  var f7Link = {
    name: 'f7-link',
    components: {
      f7Badge: f7Badge,
      f7Icon: f7Icon,
    },
    props: LinkProps,
    render: function render(c) {
      var self = this;
      var isTabbarLabel = (self.tabLink || self.tabLink === '') && self.$parent && self.$parent.tabbar && self.$parent.labels;

      var iconEl;
      var textEl;
      var badgeEl;
      var iconBadgeEl;

      if (self.text) {
        if (self.badge) { badgeEl = c('f7-badge', { props: { color: self.badgeColor } }, self.badge); }
        textEl = c('span', { class: { 'tabbar-label': isTabbarLabel } }, [self.text, badgeEl]);
      }
      if (self.icon || self.iconMaterial || self.iconIon || self.iconFa || self.iconF7 || (self.iconIfMd && self.$theme.md) || (self.iconIfIos && self.$theme.ios)) {
        if (self.iconBadge) { iconBadgeEl = c('f7-badge', { props: { color: self.badgeColor } }, self.iconBadge); }
        iconEl = c('f7-icon', {
          props: {
            material: self.iconMaterial,
            ion: self.iconIon,
            fa: self.iconFa,
            f7: self.iconF7,
            icon: self.icon,
            ifMd: self.iconIfMd,
            ifIos: self.iconIfIos,
            size: self.iconSize,
          },
        }, [iconBadgeEl]);
      }
      if (
        self.iconOnly ||
        (!self.text && self.$slots.default && self.$slots.default.length === 0) ||
        (!self.text && !self.$slots.default)
      ) {
        self.classes['icon-only'] = true;
      }
      self.classes.link = !(self.noLinkClass || isTabbarLabel);
      var linkEl = c('a', {
        class: self.classes,
        attrs: self.attrs,
        on: {
          click: self.onClick,
        },
      }, [iconEl, textEl, self.$slots.default]);
      return linkEl;
    },
    computed: {
      attrs: function attrs() {
        var self = this;
        var href = self.href;
        var target = self.target;
        var tabLink = self.tabLink;
        return Utils.extend(
          {
            href: href,
            target: target,
            'data-tab': Utils.isStringProp(tabLink),
          },
          Mixins.linkRouterAttrs(self),
          Mixins.linkActionsAttrs(self)
        );
      },
      classes: function classes() {
        var self = this;
        var noFastclick = self.noFastclick;
        var tabLink = self.tabLink;
        var rippleColor = self.rippleColor;
        var color = self.color;
        var textColor = self.textColor;

        return Utils.extend(
          ( obj = {
            'tab-link': tabLink || tabLink === '',
            'no-fastclick': noFastclick,
          }, obj[("ripple-color-" + rippleColor)] = rippleColor, obj[("color-" + color)] = color, obj[("text-color-" + textColor)] = textColor, obj ),
          Mixins.linkRouterClasses(self),
          Mixins.linkActionsClasses(self)
        );
        var obj;
      },
    },
    methods: {
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
    },
  };

var f7NavLeft = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"left",class:{ sliding: _vm.sliding }},[(_vm.backLink)?_c('f7-link',{class:{'icon-only': (_vm.backLink === true || _vm.backLink && _vm.$theme.md)},attrs:{"href":_vm.backLinkUrl || '#',"back":"","icon":"icon-back","text":_vm.backLink !== true && !_vm.$theme.md ? _vm.backLink : undefined},on:{"click":_vm.onBackClick}}):_vm._e(),_vm._v(" "),_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-nav-left',
    components: {
      f7Link: f7Link,
    },
    props: {
      backLink: [Boolean, String],
      backLinkUrl: String,
      sliding: Boolean,
    },
    methods: {
      onBackClick: function onBackClick(e) {
        this.$emit('back-click', e);
        this.$emit('click:back', e);
      },
    },
  };

var f7NavTitle = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"title",class:{sliding: _vm.sliding}},[_vm._t("default",[_vm._v(_vm._s(_vm.title))])],2)},
staticRenderFns: [],
    name: 'f7-nav-title',
    props: {
      sliding: Boolean,
      title: String,
    },
  };

var navbar = {
    name: 'f7-navbar',
    components: {
      f7NavLeft: f7NavLeft,
      f7NavTitle: f7NavTitle,
    },
    render: function render(c) {
      var self = this;
      var innerEl;
      var leftEl;
      var titleEl;
      if (self.inner) {
        if (self.backLink) {
          leftEl = c('f7-nav-left', {
            props: {
              backLink: self.backLink,
              backLinkUrl: self.backLinkUrl,
            },
            on: {
              'back-click': self.onBackClick,
            },
          });
        }
        if (self.title) {
          titleEl = c('f7-nav-title', {
            props: {
              title: self.title,
            },
          });
        }
        innerEl = c('div', { staticClass: 'navbar-inner', class: { sliding: self.sliding } }, [leftEl, titleEl, self.$slots.default]);
      }
      return c('div', {
        staticClass: 'navbar',
        class: self.classes,
      }, [self.$slots['before-inner'], innerEl, self.$slots['after-inner']]);
    },
    updated: function updated() {
      var self = this;
      if (!self.$f7) { return; }
      self.$nextTick(function () {
        self.$f7.navbar.size(self.$el);
      });
    },
    props: {
      backLink: [Boolean, String],
      backLinkUrl: String,
      sliding: {
        type: Boolean,
        default: true,
      },
      title: String,
      colorTheme: String,
      color: String,
      hidden: Boolean,
      noShadow: Boolean,
      inner: {
        type: Boolean,
        default: true,
      },
    },
    computed: {
      classes: function classes() {
        var self = this;
        var co = {
          'navbar-hidden': self.hidden,
        };
        if (self.colorTheme) { co[("color-theme-" + (self.colorTheme))] = true; }
        // if (this.layout) co[`layout-${this.layout}`] = true;
        if (self.noShadow) { co['no-shadow'] = true; }
        return co;
      },
    },
    methods: {
      hide: function hide(animate) {
        var self = this;
        if (!self.$f7) { return; }
        self.$f7.navbar.hide(self.$el, animate);
      },
      show: function show(animate) {
        var self = this;
        if (!self.$f7) { return; }
        self.$f7.navbar.show(self.$el, animate);
      },
      size: function size() {
        var self = this;
        if (!self.$f7) { return; }
        self.$f7.navbar.size(self.$el);
      },
      onBackClick: function onBackClick(e) {
        this.$emit('back-click', e);
        this.$emit('click:back', e);
      },
    },
  };

var navRight = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"right",class:{ sliding: _vm.sliding }},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-nav-right',
    props: {
      sliding: Boolean,
    },
  };

var block = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"block",class:_vm.classes,on:{"tab:show":_vm.onTabShow,"tab:hide":_vm.onTabHide}},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-block',
    props: {
      inset: Boolean,
      tabletInset: Boolean,
      strong: Boolean,
      tabs: Boolean,
      tab: Boolean,
      tabActive: Boolean,
      accordionList: Boolean,
      noHairlines: Boolean,
      noHairlinesBetween: Boolean,
      noHairlinesMd: Boolean,
      noHairlinesBetweenMd: Boolean,
      noHairlinesIos: Boolean,
      noHairlinesBetweenIos: Boolean,
    },
    computed: {
      classes: function classes() {
        var self = this;
        return {
          inset: self.inset,
          'block-strong': self.strong,
          'accordion-list': self.accordionList,
          'tablet-inset': self.tabletInset,
          tabs: self.tabs,
          tab: self.tab,
          'tab-active': self.tabActive,
          'no-hairlines': self.noHairlines,
          'no-hairlines-between': self.noHairlinesBetween,
          'no-hairlines-md': self.noHairlinesMd,
          'no-hairlines-between-md': self.noHairlinesBetweenMd,
          'no-hairlines-ios': self.noHairlinesIos,
          'no-hairlines-between-ios': self.noHairlinesBetweenIos,
        };
      },
    },
    methods: {
      onTabShow: function onTabShow(e) {
        this.$emit('tab:show', e);
      },
      onTabHide: function onTabHide(e) {
        this.$emit('tab:hide', e);
      },
    },
  };

var blockTitle = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"block-title"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-block-title',
  };

var blockHeader = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"block-header"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-block-header',
  };

var blockFooter = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"block-footer"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-block-footer',
  };

var f7CardHeader = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"card-header"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-card-header',
  };

var f7CardContent = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"card-content",class:{'card-content-padding': _vm.padding}},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-card-content',
    props: {
      padding: {
        type: Boolean,
        default: true,
      },
    },
  };

var f7CardFooter = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"card-footer"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-card-footer',
  };

var card = {
    name: 'f7-card',
    components: {
      f7CardHeader: f7CardHeader,
      f7CardContent: f7CardContent,
      f7CardFooter: f7CardFooter,
    },
    render: function render(c) {
      var self = this;
      var headerEl;
      var contentEl;
      var footerEl;

      if (self.title || (self.$slots && self.$slots.header)) {
        headerEl = c('f7-card-header', [self.title, self.$slots.header]);
      }
      if (self.content || (self.$slots && self.$slots.content)) {
        contentEl = c('f7-card-content', { props: { padding: self.padding } }, [self.content, self.$slots.content]);
      }
      if (self.footer || (self.$slots && self.$slots.footer)) {
        footerEl = c('f7-card-footer', [self.footer, self.$slots.footer]);
      }
      return c('div', { staticClass: 'card' }, [headerEl, contentEl, footerEl, self.$slots.default]);
    },
    props: {
      title: [String, Number],
      content: [String, Number],
      footer: [String, Number],
      padding: {
        type: Boolean,
        default: true,
      },
    },
  };

var chip = {
    name: 'f7-chip',
    render: function render(c) {
      var self = this;
      var mediaEl;
      var labelEl;
      var deleteEl;
      if (self.$slots && self.$slots.media) {
        mediaEl = c('div', { staticClass: 'chip-media', class: self.mediaClasses }, self.$slots.media);
      }
      if (self.text || (self.$slots && self.$slots.text)) {
        labelEl = c('div', { staticClass: 'chip-label' }, [self.text, self.$slots.text]);
      }
      if (self.deleteable) {
        deleteEl = c('a', {
          staticClass: 'chip-delete',
          attrs: {
            href: '#',
          },
          on: {
            click: self.onDeleteClick,
          },
        });
      }
      return c('div', {
        staticClass: 'chip',
        class: self.chipClasses,
      }, [mediaEl, labelEl, deleteEl]);
    },
    props: {
      media: String,
      text: [String, Number],
      deleteable: Boolean,
      color: String,
      bgColor: String,
      textColor: String,
      mediaBgColor: String,
      mediaTextColor: String,
    },
    computed: {
      mediaClasses: function mediaClasses() {
        var c = {};
        if (this.mediaTextColor) { c[("text-color-" + (this.mediaTextColor))] = true; }
        if (this.mediaBgColor) { c[("bg-color-" + (this.mediaBgColor))] = true; }
        return c;
      },
      chipClasses: function chipClasses() {
        var c = {};
        if (this.color) { c[("color-" + (this.color))] = true; }
        if (this.bgColor) { c[("bg-color-" + (this.bgColor))] = true; }
        if (this.textColor) { c[("text-color-" + (this.textColor))] = true; }
        return c;
      },
    },
    methods: {
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
      onDeleteClick: function onDeleteClick(event) {
        this.$emit('delete', event);
      },
    },
  };

var col = {
    name: 'f7-col',
    props: {
      tag: {
        type: String,
        default: 'div',
      },
      width: {
        type: [Number, String],
        default: 'auto',
      },
      tabletWidth: {
        type: [Number, String],
      },
      desktopWidth: {
        type: [Number, String],
      },
    },
    render: function render(c) {
      var self = this;
      return c(self.tag, {
        class: ( obj = {
          col: self.width === 'auto',
        }, obj[("col-" + (self.width))] = self.width !== 'auto', obj[("tablet-" + (self.tabletWidth))] = self.tabletWidth, obj[("desktop-" + (self.desktopWidth))] = self.desktopWidth, obj )
      }, [self.$slots.default]);
      var obj;
    },
  };

var row = {
    name: 'f7-row',
    props: {
      noGap: Boolean,
      tag: {
        type: String,
        default: 'div',
      },
    },
    render: function render(c) {
      var self = this;
      return c(self.tag, {
        staticClass: 'row',
        class: {
          'no-gap': self.noGap,
        },
      }, [self.$slots.default])
    },
  };

var preloader = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('span',{staticClass:"preloader",class:(_vm.color ? ("color-" + _vm.color) : ''),style:({'width': (_vm.sizeComputed ? (_vm.sizeComputed + "px") : ''), 'height': (_vm.sizeComputed ? (_vm.sizeComputed + "px") : '')})},[(_vm.$theme.md)?_c('span',{staticClass:"preloader-inner"},[_c('span',{staticClass:"preloader-inner-gap"}),_vm._v(" "),_vm._m(0),_vm._v(" "),_vm._m(1)]):_vm._e()])},
staticRenderFns: [function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('span',{staticClass:"preloader-inner-left"},[_c('span',{staticClass:"preloader-inner-half-circle"})])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('span',{staticClass:"preloader-inner-right"},[_c('span',{staticClass:"preloader-inner-half-circle"})])}],
    name: 'f7-preloader',
    props: {
      color: String,
      size: [Number, String],
    },
    computed: {
      sizeComputed: function sizeComputed() {
        var s = this.size;
        if (s && typeof s === 'string' && s.indexOf('px') >= 0) {
          s = s.replace('px', '');
        }
        return s;
      },
    },
  };

var statusbar = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"statusbar"})},
staticRenderFns: [],
    name: 'f7-statusbar',
  };

var subnavbar = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"subnavbar",class:_vm.sliding ? 'sliding' : ''},[(_vm.inner)?_c('div',{staticClass:"subnavbar-inner"},[_vm._t("default")],2):_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-subnavbar',
    props: {
      sliding: Boolean,
      inner: {
        type: Boolean,
        default: true,
      },
    },
  };

var tabs = {
    name: 'f7-tabs',
    render: function render(c) {
      var self = this;
      var tabsEl = c('div', { staticClass: 'tabs' }, [self.$slots.default]);
      if (self.animated || self.swipeable) { return c('div', { class: self.classes }, [tabsEl]); }
      return tabsEl;
    },
    props: {
      animated: Boolean,
      swipeable: Boolean,
    },
    computed: {
      classes: function classes() {
        return {
          'tabs-animated-wrap': this.animated,
          'tabs-swipeable-wrap': this.swipeable,
        };
      },
    },
  };

var tab = {
    name: 'f7-tab',
    props: {
      tabActive: Boolean,
      id: String,
    },
    data: function data() {
      return {
        tabContent: null,
      };
    },
    render: function render(c) {
      var self = this;

      return c(
        'div', {
          staticClass: 'tab',
          attrs: {
            id: self.id,
          },
          class: {
            active: self.tabActive,
          },
          on: {
            'tab:show': self.onTabShow,
            'tab:hide': self.onTabHide,
          },
        },
        [self.tabContent ? c(self.tabContent.component, { tag: 'component', props: self.tabContent.params, key: self.tabContent.id }) : self.$slots.default]
      );
    },
    methods: {
      show: function show(animated) {
        if (!this.$f7) { return; }
        this.$f7.tab.show(this.$el, animated);
      },
      onTabShow: function onTabShow(e) {
        this.$emit('tab:show', e);
      },
      onTabHide: function onTabHide(e) {
        this.$emit('tab:hide', e);
      },
    },
  };

var fab = {
    name: 'f7-fab',
    render: function render(c) {
      var self = this;

      var linkChildren = [];
      var fabChildren = [];

      if (self.$slots.default) {
        for (var i = 0; i < self.$slots.default.length; i += 1) {
          var child = self.$slots.default[i];
          if (child.tag.indexOf('fab-buttons') >= 0) {
            fabChildren.push(child);
          } else {
            linkChildren.push(child);
          }
        }
      }

      var linkEl = c('a', {
        on: {
          click: self.onClick,
        },
      }, linkChildren);

      fabChildren.push(linkEl);

      return c('div', {
        staticClass: 'fab',
        class: self.classes,
        attrs: {
          'data-morph-to': self.morphTo,
        },
      }, fabChildren);
    },
    props: {
      color: String,
      morphTo: String,
      position: {
        type: String,
        default: 'right-bottom',
      },
    },
    computed: {
      classes: function classes() {
        var self = this;
        return ( obj = {
          'fab-morph': self.morphTo,
        }, obj[("fab-" + (self.position))] = true, obj[("color-" + (self.color))] = self.color, obj );
        var obj;
      },
    },
    methods: {
      onClick: function onClick(event) {
        var self = this;
        self.$emit('click', event);
      },
    },
  };

var fabButton = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('a',{class:_vm.classes,on:{"click":_vm.onClick}},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-fab-button',
    props: {
      color: String,
      fabClose: Boolean,
    },
    computed: {
      classes: function classes() {
        var self = this;
        return ( obj = {
          'fab-close': self.fabClose,
        }, obj[("color-" + (self.color))] = self.color, obj );
        var obj;
      },
    },
    methods: {
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
    },
  };

var fabButtons = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"fab-buttons",class:_vm.classes},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-fab-buttons',
    props: {
      color: String,
      position: {
        type: String,
        default: 'top',
      },
    },
    computed: {
      classes: function classes() {
        var self = this;
        return ( obj = {}, obj[("color-" + (self.color))] = self.color, obj[("fab-buttons-" + (self.position))] = true, obj );
        var obj;
      },
    },
  };

var toolbar = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"toolbar",class:_vm.classes},[_vm._t("before-inner"),_vm._v(" "),_c('div',{staticClass:"toolbar-inner"},[_vm._t("default")],2),_vm._v(" "),_vm._t("after-inner")],2)},
staticRenderFns: [],
    name: 'f7-toolbar',
    props: {
      bottomMd: Boolean,
      tabbar: Boolean,
      labels: Boolean,
      scrollable: Boolean,
      colorTheme: String,
      color: String,
      hidden: Boolean,
      noShadow: Boolean,
    },
    updated: function updated() {
      var self = this;
      if (self.tabbar && self.$f7) {
        self.$nextTick(function () {
          self.$f7.toolbar.init(self.$el);
        });
      }
    },
    computed: {
      classes: function classes() {
        var self = this;
        var co = {
          'toolbar-bottom-md': self.bottomMd,
          tabbar: self.tabbar,
          'tabbar-labels': self.labels,
          'tabbar-scrollable': self.scrollable,
          'toolbar-hidden': self.hidden,
          'no-shadow': self.noShadow,
        };
        if (self.colorTheme) { co[("color-theme-" + (self.colorTheme))] = true; }
        if (self.color) { co[("color-" + (self.color))] = true; }
        return co;
      },
    },
    methods: {
      hide: function hide(animate) {
        var self = this;
        if (!self.$f7) { return; }
        self.$f7.toolbar.hide(this.$el, animate);
      },
      show: function show(animate) {
        var self = this;
        if (!self.$f7) { return; }
        self.$f7.toolbar.show(this.$el, animate);
      },
    },
  };

var progressbar = {
    name: 'f7-progressbar',
    render: function render(c) {
      var self = this;
      var color = self.color;
      var progress = self.progress;
      var infinite = self.infinite;
      return c('span', {
        staticClass: 'progressbar',
        class: [(color ? ("color-" + color) : ''), (infinite ? 'progressbar-infinite' : '')].join(' '),
        attrs: {
          'data-progress': progress,
        },
      }, [
        c('span', {
          style: {
            transform: progress ? ("translate3d(" + (-100 + progress) + "%, 0, 0)") : '',
          },
        }) ]);
    },
    props: {
      color: String,
      progress: Number,
      infinite: Boolean,
    },
    methods: {
      set: function set(progress, speed) {
        var self = this;
        if (self.$f7) { return; }
        self.$f7.progressbar.set(self.$el, progress, speed);
      },
      show: function show(progress, color) {
        var self = this;
        if (!self.$f7) { return; }
        self.$f7.progressbar.show(self.$el, progress, color);
      },
      hide: function hide() {
        var self = this;
        if (!self.$f7) { return; }
        self.$f7.progressbar.hide(self.$el);
      },
    },
  };

var loginScreenTitle = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"login-screen-title"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-login-screen-title',
  };

var initialUpdate = false;

  var swiper = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"swiper-container"},[_c('div',{staticClass:"swiper-wrapper"},[_vm._t("default")],2),_vm._v(" "),(_vm.paginationComputed === true)?_c('div',{staticClass:"swiper-pagination"}):_vm._e(),_vm._v(" "),(_vm.scrollbarComputed === true)?_c('div',{staticClass:"swiper-scrollbar"}):_vm._e(),_vm._v(" "),(_vm.navigationComputed === true)?_c('div',{staticClass:"swiper-button-next"}):_vm._e(),_vm._v(" "),(_vm.navigationComputed === true)?_c('div',{staticClass:"swiper-button-prev"}):_vm._e()])},
staticRenderFns: [],
    name: 'f7-swiper',
    beforeDestroy: function beforeDestroy() {
      var self = this;
      if (!self.init) { return; }
      if (self.swiper && self.swiper.destroy) { self.swiper.destroy(); }
    },
    updated: function updated() {
      var self = this;
      if (!initialUpdate) {
        initialUpdate = true;
        return;
      }
      if (self.swiper && self.swiper.update) { self.swiper.update(); }
    },
    props: {
      params: Object,
      pagination: Boolean,
      scrollbar: Boolean,
      navigation: Boolean,
      init: {
        type: Boolean,
        default: true,
      },
    },
    computed: {
      paginationComputed: function paginationComputed() {
        var self = this;
        if (self.pagination === true || (self.params && self.params.pagination && !self.params.pagination.el)) {
          return true;
        }
        return false;
      },
      scrollbarComputed: function scrollbarComputed() {
        var self = this;
        if (self.scrollbar === true || (self.params && self.params.scrollbar && !self.params.scrollbar.el)) {
          return true;
        }
        return false;
      },
      navigationComputed: function navigationComputed() {
        var self = this;
        if (self.navigation === true || (self.params && self.params.navigation && !self.params.navigation.nextEl && !self.params.navigation.prevEl)) {
          return true;
        }
        return false;
      },
    },
    methods: {
      onF7Ready: function onF7Ready(f7) {
        var self = this;
        if (!self.init) { return; }
        var params = {
          pagination: {},
          navigation: {},
          scrollbar: {},
        };
        if (self.params) { Utils.extend(params, self.params); }
        if (self.pagination && !params.pagination.el) { params.pagination.el = '.swiper-pagination'; }
        if (self.navigation && !params.navigation.nextEl && !params.navigation.prevEl) {
          params.navigation.nextEl = '.swiper-button-next';
          params.navigation.prevEl = '.swiper-button-prev';
        }
        if (self.scrollbar && !params.scrollbar.el) { params.scrollbar.el = '.swiper-scrollbar'; }

        self.swiper = f7.swiper.create(this.$el, params);
      },
    },
  };

var swiperSlide = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"swiper-slide"},[(_vm.zoom)?_c('div',{staticClass:"swiper-zoom-container"},[_vm._t("default")],2):_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-swiper-slide',
    props: {
      zoom: Boolean,
    },
  };

var list = {
    name: 'f7-list',
    beforeDestroy: function beforeDestroy() {
      var self = this;
      if (!(self.virtual && self.virtualInit && self.f7VirtualList)) { return; }
      if (self.f7VirtualList.destroy) { self.f7VirtualList.destroy(); }
    },
    watch: {
      'virtualListParams.items': function onItemsChange() {
        // Items Updated
        var self = this;
        if (!(self.virtual && self.virtualInit && self.f7VirtualList)) { return; }
        self.f7VirtualList.replaceAllItems(self.virtualListParams.items);
      },
    },
    render: function render(c) {
      var self = this;

      var listChildren = [];
      var ulChildren = [];

      if (self.$slots.default) {
        for (var i = 0; i < self.$slots.default.length; i += 1) {
          var tag = self.$slots.default[i].tag;
          if (tag && !(tag === 'li' || tag.indexOf('list-item') >= 0 || tag.indexOf('list-button') >= 0)) {
            listChildren.push(self.$slots.default[i]);
          } else {
            ulChildren.push(self.$slots.default[i]);
          }
        }
      }
      var blockEl = c(
        self.form ? 'form' : 'div',
        {
          staticClass: 'list',
          class: {
            inset: self.inset,
            'tablet-inset': self.tabletInset,
            'media-list': self.mediaList,
            'simple-list': self.simpleList,
            'links-list': self.linksList,
            sortable: self.sortable,
            'accordion-list': self.accordionList,
            'contacts-block': self.contactsList,
            'virtual-list': self.virtualList,
            tab: self.tab,
            'tab-active': self.tabActive,
            'no-hairlines': self.noHairlines,
            'no-hairlines-between': self.noHairlinesBetween,
            'no-hairlines-md': self.noHairlinesMd,
            'no-hairlines-between-md': self.noHairlinesBetweenMd,
            'no-hairlines-ios': self.noHairlinesIos,
            'no-hairlines-between-ios': self.noHairlinesBetweenIos,
            'form-store-data': self.formStoreData,
            'inline-labels': self.inlineLabels,
          },
          on: {
            'sortable:enable': self.onSortableEnable,
            'sortable:disable': self.onSortableDisable,
            'sortable:sort': self.onSortableSort,
            'tab:show': self.onTabShow,
            'tab:hide': self.onTabHide,
          },
        },
        [
          ulChildren.length > 0 ? [c('ul', {}, ulChildren), listChildren] : listChildren ]
      );
      return blockEl;
    },
    props: {
      inset: Boolean,
      tabletInset: Boolean,
      mediaList: Boolean,
      grouped: Boolean,
      sortable: Boolean,
      accordionList: Boolean,
      contactsList: Boolean,
      simpleList: Boolean,
      linksList: Boolean,

      noHairlines: Boolean,
      noHairlinesBetween: Boolean,
      noHairlinesMd: Boolean,
      noHairlinesBetweenMd: Boolean,
      noHairlinesIos: Boolean,
      noHairlinesBetweenIos: Boolean,

      // Tab
      tab: Boolean,
      tabActive: Boolean,

      // Form
      form: Boolean,
      formStoreData: Boolean,
      inlineLabels: Boolean,

      // Virtual List
      virtualList: Boolean,
      virtualListInit: {
        type: Boolean,
        default: true,
      },
      virtualListParams: Object,
    },
    methods: {
      onSortableEnable: function onSortableEnable(event) {
        this.$emit('sortable:enable', event);
      },
      onSortableDisable: function onSortableDisable(event) {
        this.$emit('sortable:disable', event);
      },
      onSortableSort: function onSortableSort(event) {
        this.$emit('sortable:sort', event, event.detail);
      },
      onTabShow: function onTabShow(e) {
        this.$emit('tab:show', e);
      },
      onTabHide: function onTabHide(e) {
        this.$emit('tab:hide', e);
      },
      onF7Ready: function onF7Ready(f7) {
        var self = this;
        // Init Virtual List
        if (!(self.virtual && self.virtualInit)) { return; }
        var $$ = self.$$;
        var $el = $$(self.$el);
        var templateScript = $el.find('script');
        var template = templateScript.html();
        if (!template && templateScript.length > 0) {
          template = templateScript[0].outerHTML;
          template = /\<script type="text\/template7"\>(.*)<\/script>/.exec(template)[1];
        }
        if (!template && !self.virtualRenderItem && !self.virtualRenderExternal) { return; }
        if (template) { template = self.$t7.compile(template); }

        self.f7VirtualList = f7.virtualList(self.$el, {
          items: self.virtualItems || [],
          template: template,
          height: self.virtualHeight || undefined,
          cols: self.virtualCols,
          rowsBefore: self.virtualRowsBefore || undefined,
          rowsAfter: self.virtualRowsAfter || undefined,
          showFilteredItemsOnly: self.virtualFilteredOnly,
          searchByItem: self.virtualSearchByItem,
          searchAll: self.virtualSearchAll,
          renderItem: self.virtualRenderItem,
          renderExternal: self.virtualRenderExternal,
          emptyTemplate: self.virtualEmptyTemplate,
          onItemBeforeInsert: function onItemBeforeInsert(list, item) {
            self.$emit('virtual:itembeforeinsert', list, item);
          },
          onBeforeClear: function onBeforeClear(list, fragment) {
            self.$emit('virtual:beforeclear', list, fragment);
          },
          onItemsBeforeInsert: function onItemsBeforeInsert(list, fragment) {
            self.$emit('virtual:itemsbeforeinsert', list, fragment);
          },
          onItemsAfterInsert: function onItemsAfterInsert(list, fragment) {
            self.$emit('virtual:itemsafterinsert', list, fragment);
          },
        });
      },
    },
  };

var f7ListItemContent = {
    name: 'f7-list-item-content',
    components: {
      f7Badge: f7Badge,
    },
    render: function render(c) {
      var self = this;
      var slotsContentStart = [];
      var slotsContent = [];
      var slotsContentEnd = [];
      var slotsInnerStart = [];
      var slotsInner = [];
      var slotsInnerEnd = [];
      var slotsAfterStart = [];
      var slotsAfter = [];
      var slotsAfterEnd = [];
      var slotsMediaStart = [];
      var slotsMedia = [];
      var slotsMediaEnd = [];
      var slotsTitle = [];
      var slotsSubtitle = [];
      var slotsText = [];
      var slotsHeader = [];
      var slotsFooter = [];

      var ref = [];
      var titleEl = ref[0];
      var afterWrapEl = ref[1];
      var afterEl = ref[2];
      var badgeEl = ref[3];
      var innerEl = ref[4];
      var titleRowEl = ref[5];
      var subtitleEl = ref[6];
      var textEl = ref[7];
      var mediaEl = ref[8];
      var inputEl = ref[9];
      var inputIconEl = ref[10];
      var headerEl = ref[11];
      var footerEl = ref[12];

      if (self.$slots.default && self.$slots.default.length > 0) {
        for (var i = 0; i < self.$slots.default.length; i += 1) {
          var slotName = self.$slots.default[i].data ? self.$slots.default[i].data.slot : undefined;
          if (!slotName || (slotName === 'inner')) { slotsInner.push(self.$slots.default[i]); }
          if (slotName === 'content-start') { slotsContentStart.push(self.$slots.default[i]); }
          if (slotName === 'content') { slotsContent.push(self.$slots.default[i]); }
          if (slotName === 'content-end') { slotsContentEnd.push(self.$slots.default[i]); }
          if (slotName === 'after-start') { slotsAfterStart.push(self.$slots.default[i]); }
          if (slotName === 'after') { slotsAfter.push(self.$slots.default[i]); }
          if (slotName === 'after-end') { slotsAfterEnd.push(self.$slots.default[i]); }
          if (slotName === 'media-start') { slotsMediaStart.push(self.$slots.default[i]); }
          if (slotName === 'media') { slotsMedia.push(self.$slots.default[i]); }
          if (slotName === 'media-end') { slotsMediaEnd.push(self.$slots.default[i]); }
          if (slotName === 'inner-start') { slotsInnerStart.push(self.$slots.default[i]); }
          if (slotName === 'inner-end') { slotsInnerEnd.push(self.$slots.default[i]); }
          if (slotName === 'title') { slotsTitle.push(self.$slots.default[i]); }
          if (slotName === 'subtitle') { slotsSubtitle.push(self.$slots.default[i]); }
          if (slotName === 'text') { slotsText.push(self.$slots.default[i]); }
          if (slotName === 'header') { slotsHeader.push(self.$slots.default[i]); }
          if (slotName === 'footer') { slotsFooter.push(self.$slots.default[i]); }
        }
      }

      // Input
      if (self.radio || self.checkbox) {
        inputEl = c('input', {
          attrs: {
            value: self.inputValue,
            name: self.inputName,
            checked: self.checked,
            readonly: self.readonly,
            disabled: self.disabled,
            required: self.required,
            type: self.radio ? 'radio' : 'checkbox',
          },
          on: {
            change: self.onChange,
          },
          domProps: {
            checked: self.checked,
            disabled: self.disabled,
            required: self.required,
          },
        });
        inputIconEl = c('i', { staticClass: ("icon icon-" + (self.radio ? 'radio' : 'checkbox')) });
      }
      // Media
      if (self.media || slotsMediaStart.length || slotsMedia.length || slotsMediaEnd.length) {
        mediaEl = c('div', { staticClass: 'item-media' }, [slotsMediaStart, slotsMedia, slotsMediaEnd]);
      }
      // Inner Elements
      if (self.header || slotsHeader.length) {
        headerEl = c('div', { staticClass: 'item-header' }, [self.header, slotsHeader]);
      }
      if (self.footer || slotsFooter.length) {
        footerEl = c('div', { staticClass: 'item-footer' }, [self.footer, slotsFooter]);
      }
      if (self.title || slotsTitle.length) {
        titleEl = c('div', { staticClass: 'item-title' }, [!self.mediaList && headerEl, self.title, slotsTitle, !self.mediaList && footerEl]);
      }
      if (self.subtitle || slotsSubtitle.length) {
        subtitleEl = c('div', { staticClass: 'item-subtitle' }, [self.subtitle, slotsSubtitle]);
      }
      if (self.text || slotsText.length) {
        textEl = c('div', { staticClass: 'item-text' }, [self.text, slotsText]);
      }
      if (self.after || self.badge || slotsAfter.length) {
        if (self.after) {
          afterEl = c('span', [self.after]);
        }
        if (self.badge) {
          badgeEl = c('f7-badge', { props: { color: self.badgeColor } }, [self.badge]);
        }
        afterWrapEl = c('div', { staticClass: 'item-after' }, [slotsAfterStart, afterEl, badgeEl, slotsAfter, slotsAfterEnd]);
      }
      if (self.mediaList) {
        titleRowEl = c('div', { staticClass: 'item-title-row' }, [titleEl, afterWrapEl]);
      }
      innerEl = c('div', { staticClass: 'item-inner' }, self.mediaList ? [slotsInnerStart, headerEl, titleRowEl, subtitleEl, textEl, slotsInner, footerEl, slotsInnerEnd] : [slotsInnerStart, titleEl, afterWrapEl, slotsInner, slotsInnerEnd]);

      // Finalize
      return c((self.checkbox || self.radio) ? 'label' : 'div', {
        staticClass: 'item-content',
        class: {
          'item-checkbox': self.checkbox,
          'item-radio': self.radio,
          'item-input': self.itemInput || self.itemInputForced,
          'inline-label': self.inlineLabel || self.inlineLabelForced,
          'item-input-with-info': self.itemInputWithInfo || self.itemInputWithInfoForced,
        },
        on: {
          click: self.onClick,
        },
      }, [slotsContentStart, inputEl, inputIconEl, mediaEl, innerEl, slotsContent, slotsContentEnd]);
    },
    props: {
      title: [String, Number],
      text: [String, Number],
      media: String,
      subtitle: [String, Number],
      header: [String, Number],
      footer: [String, Number],
      after: [String, Number],
      badge: [String, Number],
      badgeColor: String,
      mediaList: Boolean,
      itemInput: Boolean,
      itemInputWithInfo: Boolean,
      inlineLabel: Boolean,

      checkbox: Boolean,
      checked: Boolean,
      radio: Boolean,
      inputName: String,
      inputValue: [String, Number, Boolean, Array],
      readonly: Boolean,
      required: Boolean,
      disabled: Boolean,
    },
    methods: {
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
      onChange: function onChange(event) {
        this.$emit('change', event);
      },
      onInput: function onInput(event) {
        this.$emit('input', event);
      },
    },
  };

var ListItemProps = Utils.extend(
    {
      title: [String, Number],
      text: [String, Number],
      media: String,
      subtitle: [String, Number],
      header: [String, Number],
      footer: [String, Number],

      // Link Props
      link: [Boolean, String],
      noFastclick: Boolean,

      after: [String, Number],
      badge: [String, Number],
      badgeColor: String,

      mediaItem: Boolean,
      mediaList: Boolean,
      divider: Boolean,
      groupTitle: Boolean,
      swipeout: Boolean,
      sortable: Boolean,
      accordionItem: Boolean,
      accordionItemOpened: Boolean,

      // Smart Select
      smartSelect: Boolean,
      smartSelectParams: Object,

      // Inputs
      checkbox: Boolean,
      radio: Boolean,
      checked: Boolean,
      inputName: String,
      inputValue: [String, Number, Boolean, Array],
      readonly: Boolean,
      required: Boolean,
      disabled: Boolean,
      itemInput: Boolean,
      itemInputWithInfo: Boolean,
      inlineLabel: Boolean,
    },
    Mixins.linkRouterProps,
    Mixins.linkActionsProps
  );

  var listItem = {
    name: 'f7-list-item',
    components: {
      f7ListItemContent: f7ListItemContent,
    },
    props: ListItemProps,
    render: function render(c) {
      var self = this;

      var liChildren;
      var linkEl;
      var itemContentEl;

      if (!self.simpleListComputed) {
        // Item Content
        itemContentEl = c('f7-list-item-content', {
          props: {
            title: self.title,
            text: self.text,
            media: self.media,
            subtitle: self.subtitle,
            after: self.after,
            header: self.header,
            footer: self.footer,
            badge: self.badge,
            badgeColor: self.badgeColor,
            mediaList: self.mediaListComputed,
            accordionItem: self.accordionItem,

            checkbox: self.checkbox,
            checked: self.checked,
            radio: self.radio,
            inputName: self.inputName,
            inputValue: self.inputValue,
            readonly: self.readonly,
            required: self.required,
            disabled: self.disabled,
            itemInput: self.itemInput || self.itemInputForced,
            itemInputWithInfo: self.itemInputWithInfo || self.itemInputWithInfoForced,
            inlineLabel: self.inlineLabel || self.inlineLabelForced,
          },
          on: (self.link || self.accordionItem || self.smartSelect) ? {} : { click: self.onClick, change: self.onChange },
        }, [
          self.$slots['content-start'],
          self.$slots.content,
          self.$slots['content-end'],
          self.$slots['media-start'],
          self.$slots.media,
          self.$slots['media-end'],
          self.$slots['inner-start'],
          self.$slots.inner,
          self.$slots['inner-end'],
          self.$slots['after-start'],
          self.$slots.after,
          self.$slots['after-end'],
          self.$slots.header,
          self.$slots.footer,
          self.$slots.title,
          self.$slots.subtitle,
          self.$slots.text,
          (self.swipeout || self.accordionItem ? [] : self.$slots.default) ]);

        // Link
        if (self.link || self.accordionItem || self.smartSelect) {
          linkEl = c('a', {
            attrs: Utils.extend(
              {
                href: self.link === true || self.accordionItem || self.smartSelect ? '#' : self.link,
                target: self.target,
              },
              Mixins.linkRouterAttrs(self),
              Mixins.linkActionsAttrs(self)
            ),
            class: Utils.extend(
              {
                'item-link': true,
                'no-fastclick': self.noFastclick,
                'smart-select': self.smartSelect,
              },
              Mixins.linkRouterClasses(self),
              Mixins.linkActionsClasses(self)
            ),
            on: {
              click: self.onClick,
            },
          }, [itemContentEl]);
        }
      }

      if (self.divider || self.groupTitle) {
        liChildren = [c('span', self.$slots.default || self.title)];
      } else if (self.simpleListComputed) {
        liChildren = [self.title, self.$slots.default];
      } else {
        var linkItemEl = (self.link || self.smartSelect || self.accordionItem) ? linkEl : itemContentEl;
        if (self.swipeout) {
          liChildren = [c('div', { class: { 'swipeout-content': true } }, [linkItemEl])];
        } else {
          liChildren = [linkItemEl];
        }
        if (self.sortableComputed) {
          liChildren.push(c('div', { class: { 'sortable-handler': true } }));
        }
        if (self.swipeout || self.accordionItem) {
          liChildren.push(self.$slots.default);
        }
        liChildren.unshift(self.$slots['root-start']);
        liChildren.push(self.$slots.root);
      }

      return c(
        'li',
        {
          class: {
            'item-divider': self.divider,
            'list-group-title': self.groupTitle,
            'media-item': self.mediaItem,
            swipeout: self.swipeout,
            'accordion-item': self.accordionItem,
            'accordion-item-opened': self.accordionItemOpened,
          },
          on: {
            'swipeout:open': self.onSwipeoutOpen,
            'swipeout:opened': self.onSwipeoutOpened,
            'swipeout:close': self.onSwipeoutClose,
            'swipeout:closed': self.onSwipeoutClosed,
            'swipeout:delete': self.onSwipeoutDelete,
            'swipeout:deleted': self.onSwipeoutDeleted,
            swipeout: self.onSwipeout,
            'accordion:open': self.onAccOpen,
            'accordion:opened': self.onAccOpened,
            'accordion:close': self.onAccClose,
            'accordion:closed': self.onAccClosed,
          },
        },
        liChildren
      );
    },
    computed: {
      sortableComputed: function sortableComputed() {
        return this.sortable || this.$parent.sortable || this.$parent.sortableComputed;
      },
      mediaListComputed: function mediaListComputed() {
        return this.mediaList || this.mediaItem || this.$parent.mediaList || this.$parent.mediaListComputed;
      },
      simpleListComputed: function simpleListComputed() {
        return this.simpleList || this.$parent.simpleList || (this.$parent.$parent && this.$parent.simpleList);
      },
    },
    mounted: function mounted() {
      var self = this;
      if (!self.smartSelect) { return; }
      var smartSelectParams = Utils.extend({ el: self.$el.querySelector('a.smart-select') }, (self.smartSelectParams || {}));
      self.f7SmartSelect = self.$f7.smartSelect.create(smartSelectParams);
    },
    beforeDestroy: function beforeDestroy() {
      var self = this;
      if (self.smartSelect && self.f7SmartSelect) {
        self.f7SmartSelect.destroy();
      }
    },
    methods: {
      onClick: function onClick(event) {
        var self = this;
        if (self.smartSelect && self.f7SmartSelect) {
          self.f7SmartSelect.open();
        }
        if (event.target.tagName.toLowerCase() !== 'input') {
          self.$emit('click', event);
        }
      },
      onSwipeoutDeleted: function onSwipeoutDeleted(event) {
        this.$emit('swipeout:deleted', event);
      },
      onSwipeoutDelete: function onSwipeoutDelete(event) {
        this.$emit('swipeout:delete', event);
      },
      onSwipeoutClose: function onSwipeoutClose(event) {
        this.$emit('swipeout:close', event);
      },
      onSwipeoutClosed: function onSwipeoutClosed(event) {
        this.$emit('swipeout:closed', event);
      },
      onSwipeoutOpen: function onSwipeoutOpen(event) {
        this.$emit('swipeout:open', event);
      },
      onSwipeoutOpened: function onSwipeoutOpened(event) {
        this.$emit('swipeout:opened', event);
      },
      onSwipeout: function onSwipeout(event) {
        this.$emit('swipeout', event);
      },
      onAccClose: function onAccClose(event) {
        this.$emit('accordion:close', event);
      },
      onAccClosed: function onAccClosed(event) {
        this.$emit('accordion:closed', event);
      },
      onAccOpen: function onAccOpen(event) {
        this.$emit('accordion:open', event);
      },
      onAccOpened: function onAccOpened(event) {
        this.$emit('accordion:opened', event);
      },
      onChange: function onChange(event) {
        this.$emit('change', event);
      },
      onInput: function onInput(event) {
        this.$emit('input', event);
      },
    },
  };

var listItemCell = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"item-cell"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-list-item-cell',
  };

var listItemRow = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"item-row"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-list-item-row',
  };

var ListButtonProps = Utils.extend(
    {
      noFastclick: Boolean,
      title: [String, Number],
      text: [String, Number],
      tabLink: [Boolean, String],
      link: [Boolean, String],
      href: [Boolean, String],
      tabindex: [Number, String],
      color: String,
      rippleColor: String,
      textColor: String,
    },
    Mixins.linkRouterProps,
    Mixins.linkActionsProps
  );

  var listButton = {
    name: 'f7-list-button',
    render: function render(c) {
      var self = this;
      var linkEl = c('a', {
        staticClass: 'item-link list-button',
        attrs: self.attrs,
        class: self.classes,
        on: {
          click: self.onClick,
        },
      }, [self.title, self.$slots.default]);
      return c('li', {}, [linkEl]);
    },
    props: ListButtonProps,
    computed: {
      attrs: function attrs() {
        var self = this;
        // Link Props
        var link = self.link;
        var href = self.href;
        var target = self.target;
        var tabLink = self.tabLink;

        return Utils.extend(
          {
            href: ((typeof link === 'boolean' && typeof href === 'boolean') ? '#' : (link || href)),
            target: target,
            'data-tab': Utils.isStringProp(tabLink),
          },
          Mixins.linkRouterAttrs(self),
          Mixins.linkActionsAttrs(self)
        );
      },
      classes: function classes() {
        var self = this;

        var noFastclick = self.noFastclick;
        var tabLink = self.tabLink;
        var rippleColor = self.rippleColor;
        var color = self.color;
        var textColor = self.textColor;

        return Utils.extend(
          ( obj = {
            'tab-link': tabLink || tabLink === '',
            'no-fastclick': noFastclick,
          }, obj[("color-" + color)] = color, obj[("ripple-color-" + rippleColor)] = rippleColor, obj[("text-color-" + textColor)] = textColor, obj ),
          Mixins.linkRouterClasses(self),
          Mixins.linkActionsClasses(self)
        );
        var obj;
      },
    },
    methods: {
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
    },
  };

var swipeoutActions = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{class:("swipeout-actions-" + _vm.sideComputed)},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-swipeout-actions',
    props: {
      left: Boolean,
      right: Boolean,
      side: String,
    },
    computed: {
      sideComputed: function sideComputed() {
        if (!this.side) {
          if (this.left) { return 'left'; }
          if (this.right) { return 'right'; }
          return 'right';
        }
        return this.side;
      },
    },
    data: function data() {
      return {};
    },
  };

var swipeoutButton = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('a',{class:_vm.classes,on:{"click":_vm.onClick}},[_vm._t("default",[_vm._v(_vm._s(_vm.text))])],2)},
staticRenderFns: [],
    name: 'f7-swipeout-button',
    props: {
      text: String,
      overswipe: Boolean,
      close: Boolean,
      delete: Boolean,
      color: String,
    },
    computed: {
      classes: function classes() {
        var co = {
          'swipeout-overswipe': this.overswipe,
          'swipeout-delete': this.delete,
          'swipeout-close': this.close,
        };
        co[("color-" + (this.color))] = this.color;
        return co;
      },
    },
    methods: {
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
    },
  };

var ButtonProps = Utils.extend(
    {
      noFastClick: Boolean,
      color: String,
      rippleColor: String,
      textColor: String,
      text: String,
      tabLink: [Boolean, String],
      tabLinkActive: Boolean,
      href: {
        type: String,
        default: '#',
      },

      round: Boolean,
      roundMd: Boolean,
      roundIos: Boolean,
      fill: Boolean,
      fillMd: Boolean,
      fillIos: Boolean,
      big: Boolean,
      bigMd: Boolean,
      bigIos: Boolean,
      small: Boolean,
      smallMd: Boolean,
      smallIos: Boolean,
      raised: Boolean,
      outline: Boolean,
      active: Boolean,
    },
    Mixins.linkIconProps,
    Mixins.linkRouterProps,
    Mixins.linkActionsProps
  );

  var button = {
    name: 'f7-button',
    components: {
      f7Icon: f7Icon,
    },
    props: ButtonProps,
    render: function render(c) {
      var self = this;
      var iconEl;
      var textEl;
      if (self.text) {
        textEl = c('span', {}, self.text);
      }
      if (self.icon || self.iconMaterial || self.iconIon || self.iconFa || self.iconF7 || self.iconIfMd || self.iconIfIos) {
        iconEl = c('f7-icon', {
          props: {
            material: self.iconMaterial,
            ion: self.iconIon,
            fa: self.iconFa,
            f7: self.iconF7,
            icon: self.icon,
            ifMd: self.iconIfMd,
            ifIos: self.iconIfIos,
            size: self.iconSize,
          },
        });
      }
      self.classes.button = true;
      var linkEl = c('a', {
        class: self.classes,
        attrs: self.attrs,
        on: {
          click: self.onClick,
        },
      }, [iconEl, textEl, self.$slots.default]);

      return linkEl;
    },
    computed: {
      attrs: function attrs() {
        var self = this;
        var href = self.href;
        var target = self.target;
        var tabLink = self.tabLink;
        return Utils.extend(
          {
            href: href,
            target: target,
            'data-tab': Utils.isStringProp(tabLink),
          },
          Mixins.linkRouterAttrs(self),
          Mixins.linkActionsAttrs(self)
        );
      },
      classes: function classes() {
        var self = this;
        var noFastclick = self.noFastclick;
        var tabLink = self.tabLink;
        var rippleColor = self.rippleColor;
        var color = self.color;
        var textColor = self.textColor;
        var round = self.round;
        var roundIos = self.roundIos;
        var roundMd = self.roundMd;
        var fill = self.fill;
        var fillIos = self.fillIos;
        var fillMd = self.fillMd;
        var big = self.big;
        var bigIos = self.bigIos;
        var bigMd = self.bigMd;
        var small = self.small;
        var smallIos = self.smallIos;
        var smallMd = self.smallMd;
        var raised = self.raised;
        var active = self.active;
        var outline = self.outline;

        return Utils.extend(
          ( obj = {
            'tab-link': tabLink || tabLink === '',
            'no-fastclick': noFastclick,

            'button-round': round,
            'button-round-ios': roundIos,
            'button-round-md': roundMd,
            'button-fill': fill,
            'button-fill-ios': fillIos,
            'button-fill-md': fillMd,
            'button-big': big,
            'button-big-ios': bigIos,
            'button-big-md': bigMd,
            'button-small': small,
            'button-small-ios': smallIos,
            'button-small-md': smallMd,
            'button-raised': raised,
            'button-active': active,
            'button-outline': outline,
          }, obj[("ripple-color-" + rippleColor)] = rippleColor, obj[("color-" + color)] = color, obj[("text-color-" + textColor)] = textColor, obj ),
          Mixins.linkRouterClasses(self),
          Mixins.linkActionsClasses(self)
        );
        var obj;
      },
    },
    methods: {
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
    },
  };

var segmented = {
    name: 'f7-segmented',
    props: {
      color: String,
      raised: Boolean,
      round: Boolean,
      tag: {
        type: String,
        default: 'div',
      },
    },
    render: function render(c) {
      var self = this;
      return c(self.tag, {
        staticClass: 'segmented',
        class: ( obj = {
          'segmented-raised': self.raised,
          'segmented-round': self.round,
        }, obj[("color-" + (self.color))] = self.color, obj ),
      }, [self.$slots.default]);
      var obj;
    },
  };

var accordion = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"accordion-list"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-accordion',
  };

var accordionItem = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"accordion-item",class:{'accordion-item-opened': _vm.opened},on:{"accordion:open":_vm.onOpen,"accordion:opened":_vm.onOpened,"accordion:close":_vm.onClose,"accordion:closed":_vm.onClosed}},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-accordion-item',
    props: {
      opened: Boolean
    },
    methods: {
      onOpen: function (event) {
        this.$emit('accordion:open', event);
      },
      onOpened: function (event) {
        this.$emit('accordion:opened', event);
      },
      onClose: function (event) {
        this.$emit('accordion:close', event);
      },
      onClosed: function (event) {
        this.$emit('accordion:closed', event);
      }
    }
  };

var accordionToggle = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"accordion-item-toggle"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-accordion-toggle',
  };

var accordionContent = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"accordion-item-content"},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-accordion-content',
  };

var checkbox = {
    name: 'f7-checkbox',
    props: {
      color: String,
      checked: Boolean,
      name: [Number, String],
      value: [Number, String, Boolean],
      disabled: Boolean,
      readonly: Boolean,
    },
    render: function render(c) {
      var self = this;

      var inputEl = c('input', {
        attrs: {
          type: 'checkbox',
          name: self.name,
        },
        domProps: {
          value: self.value,
          disabled: self.disabled,
          readonly: self.readonly,
          checked: self.checked,
        },
        on: {
          change: self.onChange,
        },
      });

      var iconEl = c('i', { staticClass: 'icon-checkbox' });

      return c('label', {
        staticClass: 'checkbox',
        class: ( obj = {
          disabled: self.disabled,
        }, obj[("color-" + (self.color))] = self.color, obj ),
      }, [inputEl, iconEl, self.$slots.default]);
      var obj;
    },
    methods: {
      onChange: function onChange(event) {
        this.$emit('change', event);
      }
    },
  };

var radio = {
    name: 'f7-radio',
    props: {
      color: String,
      checked: Boolean,
      name: [Number, String],
      value: [Number, String, Boolean],
      disabled: Boolean,
      readonly: Boolean,
    },
    render: function render(c) {
      var self = this;

      var inputEl = c('input', {
        attrs: {
          type: 'radio',
          name: self.name,
        },
        domProps: {
          value: self.value,
          disabled: self.disabled,
          readonly: self.readonly,
          checked: self.checked,
        },
        on: {
          change: self.onChange,
        },
      });

      var iconEl = c('i', { staticClass: 'icon-radio' });

      return c('label', {
        staticClass: 'radio',
        class: ( obj = {
          disabled: self.disabled,
        }, obj[("color-" + (self.color))] = self.color, obj ),
      }, [inputEl, iconEl, self.$slots.default]);
      var obj;
    },
    methods: {
      onChange: function onChange(event) {
        this.$emit('change', event);
      }
    },
  };

var f7Range = {
    name: 'f7-range',
    render: function render(c) {
      var self = this;

      return c('div', {
        staticClass: 'range-slider',
        class: ( obj = {
          disabled: self.disabled,
        }, obj[("color-" + (self.color))] = self.color, obj ),
      });
      var obj;
    },
    props: {
      init: {
        type: Boolean,
        default: true,
      },
      value: [Number, Array, String],
      min: [Number, String],
      max: [Number, String],
      step: {
        type: [Number, String],
        default: 1,
      },
      label: Boolean,
      dual: Boolean,
      disabled: Boolean,
      color: String,
    },
    watch: {
      value: function value(newValue) {
        var self = this;
        if (!self.f7Range) { return; }
        self.f7Range.setValue(newValue);
      },
    },
    beforeDestroy: function beforeDestroy() {
      var self = this;
      if (self.f7Range && self.f7Range.destroy) { self.f7Range.destroy(); }
    },
    methods: {
      setValue: function setValue(newValue) {
        var self = this;
        if (self.f7Range && self.f7Range.setValue) { self.f7Range.setValue(newValue); }
      },
      getValue: function getValue(newValue) {
        var self = this;
        if (self.f7Range && self.f7Range.getValue) {
          return self.f7Range.getValue(newValue);
        }
        return undefined;
      },
      onF7Ready: function onF7Ready(f7) {
        var self = this;
        if (!self.init) { return; }
        self.$nextTick(function () {
          self.f7Range = f7.range.create({
            el: self.$el,
            value: self.value,
            min: self.min,
            max: self.max,
            step: self.step,
            label: self.label,
            dual: self.dual,
            on: {
              change: function change(range, value) {
                self.$emit('range:change', value);
              },
            },
          });
        });
      },
    },
  };

var f7Toggle = {
    name: 'f7-toggle',
    render: function render(c) {
      var self = this;

      return c('label', {
        staticClass: 'toggle',
        class: ( obj = {
          disabled: self.disabled,
        }, obj[("color-" + (self.color))] = self.color, obj ),
      }, [
        c('input', {
          attrs: {
            type: 'checkbox',
          },
          domProps: {
            disabled: self.disabled,
            readonly: self.readonly,
            checked: self.checked,
          },
        }),
        c('span', { staticClass: 'toggle-icon' }) ]);
      var obj;
    },
    props: {
      init: {
        type: Boolean,
        default: true,
      },
      checked: Boolean,
      disabled: Boolean,
      readonly: Boolean,
      color: String,
    },
    watch: {
      checked: function checked(newValue) {
        var self = this;
        if (!self.f7Toggle) { return; }
        self.f7Toggle.checked = newValue;
      },
    },
    beforeDestroy: function beforeDestroy() {
      var self = this;
      if (self.f7Toggle && self.f7Toggle.destroy && self.f7Toggle.$el) { self.f7Toggle.destroy(); }
    },
    methods: {
      toggle: function toggle() {
        var self = this;
        if (self.f7Toggle && self.f7Toggle.setValue) { self.f7Toggle.toggle(); }
      },
      onF7Ready: function onF7Ready(f7) {
        var self = this;
        if (!self.init) { return; }
        self.$nextTick(function () {
          self.f7Toggle = f7.toggle.create({
            el: self.$el,
            on: {
              change: function change(toggle) {
                self.$emit('toggle:change', toggle.checked);
              },
            },
          });
        });
      },
    },
  };

var label = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"item-title",class:{'item-label': !_vm.floating, 'item-floating-label' : _vm.floating}},[_vm._t("default")],2)},
staticRenderFns: [],
    name: 'f7-label',
    props: {
      floating: Boolean,
      inline: Boolean,
      wrap: {
        type: Boolean,
        default: true,
      },
    },
    render: function render(c) {
      var self = this;

      if (self.inline) {
        var $parent = self.$parent;
        var foundItemContent;
        while ($parent && !foundItemContent) {
          var tag = $parent.$vnode && $parent.$vnode.tag;
          if (tag && (tag.indexOf('list-item') > 0 || tag.indexOf('list-item-content') > 0)) {
            foundItemContent = $parent;
          }
          $parent = $parent.$parent;
        }
        if (foundItemContent) { foundItemContent.inlineLabelForced = true; }
      }

      return c('div', {
        staticClass: 'item-title',
        class: {
          'item-label': !self.floating,
          'item-floating-label': self.floating,
        },
      }, [self.$slots.default]);
    },
  };

var input = {
    name: 'f7-input',
    components: {
      f7Toggle: f7Toggle,
      f7Range: f7Range,
    },
    render: function render(c) {
      var inputEl;
      var self = this;
      var attrs = {
        name: self.name,
        type: self.type,
        placeholder: self.placeholder,
        id: self.id,
        value: self.value,
        size: self.size,
        accept: self.accept,
        autocomplete: self.autocomplete,
        autocorrect: self.autocorrect,
        autocapitalize: self.autocapitalize,
        spellcheck: self.spellcheck,
        autofocus: self.autofocus,
        autosave: self.autosave,
        checked: self.checked,
        disabled: self.disabled,
        max: self.max,
        maxlength: self.maxlength,
        min: self.min,
        minlength: self.minlength,
        step: self.step,
        multiple: self.multiple,
        readonly: self.readonly,
        required: self.required,
        color: self.color,
        pattern: self.pattern,
        validate: self.validate,
        tabindex: self.tabindex,
        'data-error-message': self.errorMessage,
      };
      var on = {
        focus: self.onFocus,
        blur: self.onBlur,
        input: self.onInput,
        change: self.onChange,
        click: self.onClick,
        keypress: self.onKeyPress,
        keyup: self.onKeyUp,
        keydown: self.onKeyDown,
        beforeinput: self.onBeforeInput,
        compositionstart: self.onCompositionStart,
        compositionupdate: self.onCompositionUpdate,
        compositionend: self.onCompositionEnd,
        focusin: self.onFocusIn,
        focusout: self.onFocusOut,
        dblclick: self.onDblClick,
        mousedown: self.onMouseDown,
        mouseenter: self.onMouseEnter,
        mouseleave: self.onMouseLeave,
        mousemove: self.onMouseMove,
        mouseout: self.onMouseOut,
        mouseover: self.onMouseOver,
        mouseup: self.onMouseUp,
        wheel: self.onWheel,
        select: self.onSelect,
        'textarea:resize': self.onTextareaResize,
        'input:notempty': self.onInputNotEmpty,
        'input:empty': self.onInputEmpty,
        'input:clear': self.onInputClear,
      };
      if (self.type === 'select' || self.type === 'textarea' || self.type === 'file') {
        delete attrs.value;
        if (self.type === 'select') {
          inputEl = c('select', {
            attrs: attrs, on: on, style: self.inputStyle, domProps: { value: self.value },
          }, self.$slots.default);
        } else if (self.type === 'file') {
          inputEl = c('input', { attrs: attrs, style: self.inputStyle, on: on }, self.$slots.default);
        } else {
          inputEl = c('textarea', {
            attrs: attrs,
            style: self.inputStyle,
            on: on,
            class: { resizable: self.resizable },
            domProps: { value: self.value },
          }, self.$slots.default);
        }
      } else if ((self.$slots.default && self.$slots.default.length > 0) || !self.type) {
        inputEl = self.$slots.default;
      } else if (self.type === 'toggle') {
        inputEl = c('f7-toggle', { props: attrs, on: on });
      } else if (self.type === 'range') {
        inputEl = c('f7-range', { props: attrs, on: on });
      } else {
        inputEl = c('input', {
          attrs: attrs,
          style: self.inputStyle,
          on: on,
          domProps: { value: self.value, checked: self.checked },
        });
      }

      var clearButtonEl;
      if (self.clearButton) {
        clearButtonEl = c('span', { staticClass: 'input-clear-button' });
      }

      var $parent = self.$parent;
      var foundItemContent;
      while ($parent && !foundItemContent) {
        var tag = $parent.$vnode && $parent.$vnode.tag;
        if (tag && (tag.indexOf('list-item') > 0 || tag.indexOf('list-item-content') > 0)) {
          foundItemContent = $parent;
        }
        $parent = $parent.$parent;
      }
      if (foundItemContent) { foundItemContent.itemInputForced = true; }
      if (foundItemContent && (self.info || (self.$slots.info && self.$slots.info.length))) { foundItemContent.itemInputWithInfoForced = true; }

      var infoEl;
      if (self.info || (self.$slots.info && self.$slots.info.length)) {
        infoEl = c('div', { staticClass: 'item-input-info' }, [self.info, self.$slots.info]);
      }

      var itemInput = self.wrap ? c('div', { staticClass: 'item-input-wrap' }, [inputEl, clearButtonEl, infoEl]) : inputEl;
      return itemInput;
    },
    props: {
      // Inputs
      type: String,
      name: String,
      value: [String, Number],
      placeholder: String,
      id: String,
      size: [String, Number],
      accept: [String, Number],
      autocomplete: [String],
      autocorrect: [String],
      autocapitalize: [String],
      spellcheck: [String],
      autofocus: Boolean,
      autosave: String,
      checked: Boolean,
      disabled: Boolean,
      max: [String, Number],
      min: [String, Number],
      step: [String, Number],
      maxlength: [String, Number],
      minlength: [String, Number],
      multiple: Boolean,
      readonly: Boolean,
      required: Boolean,
      inputStyle: String,
      pattern: String,
      validate: Boolean,
      tabindex: [String, Number],
      resizable: Boolean,
      clearButton: Boolean,

      // Error, Info
      errorMessage: String,
      info: String,

      // Components
      color: String,
      wrap: {
        type: Boolean,
        default: true,
      },
    },
    watch: {
      value: function value() {
        var self = this;
        if (self.type === 'range' || self.type === 'toggle') { return; }
        var f7 = self.$f7;
        if (!f7) { return; }
        self.$nextTick(function () {
          f7.input.checkEmptyState(self.$el.querySelector('input, select, textarea'));
          if (self.validate) {
            f7.input.validate(self.$el.querySelector('input, select, textarea'));
          }
          if (self.resizable) {
            f7.input.resizeTextarea(self.$el.querySelector('input, select, textarea'));
          }
        });
      },
    },
    methods: {
      onF7Ready: function onF7Ready(f7) {
        var self = this;
        f7.input.checkEmptyState(self.$el.querySelector('input, select, textarea'));
        if (self.validate) {
          f7.input.validate(self.$el.querySelector('input, select, textarea'));
        }
        if (self.resizable) {
          f7.input.resizeTextarea(self.$el.querySelector('input, select, textarea'));
        }
      },
      onTextareaResize: function onTextareaResize(event) {
        this.$emit('textarea:resize', event);
      },
      onInputNotEmpty: function onInputNotEmpty(event) {
        this.$emit('input:notempty', event);
      },
      onInputEmpty: function onInputEmpty(event) {
        this.$emit('input:empty', event);
      },
      onInputClear: function onInputClear(event) {
        this.$emit('input:clear', event);
      },
      onInput: function onInput(event) {
        this.$emit('input', event);
      },
      onFocus: function onFocus(event) {
        this.$emit('focus', event);
      },
      onBlur: function onBlur(event) {
        this.$emit('blur', event);
      },
      onChange: function onChange(event) {
        var self = this;
        self.$emit('change', event);
      },
      onClick: function onClick(event) {
        this.$emit('click', event);
      },
      onKeyPress: function onKeyPress(event) {
        this.$emit('keypress', event);
      },
      onKeyUp: function onKeyUp(event) {
        this.$emit('keyup', event);
      },
      onKeyDown: function onKeyDown(event) {
        this.$emit('keydown', event);
      },
      onBeforeInput: function onBeforeInput(event) {
        this.$emit('beforeinput', event);
      },
      onCompositionStart: function onCompositionStart(event) {
        this.$emit('compositionstart', event);
      },
      onCompositionUpdate: function onCompositionUpdate(event) {
        this.$emit('compositionupdate', event);
      },
      onCompositionEnd: function onCompositionEnd(event) {
        this.$emit('compositionend', event);
      },
      onFocusIn: function onFocusIn(event) {
        this.$emit('focusin', event);
      },
      onFocusOut: function onFocusOut(event) {
        this.$emit('focusout', event);
      },
      onDblClick: function onDblClick(event) {
        this.$emit('dblclick', event);
      },
      onMouseDown: function onMouseDown(event) {
        this.$emit('mousedown', event);
      },
      onMouseEnter: function onMouseEnter(event) {
        this.$emit('mouseenter', event);
      },
      onMouseLeave: function onMouseLeave(event) {
        this.$emit('mouseleave', event);
      },
      onMouseMove: function onMouseMove(event) {
        this.$emit('mousemove', event);
      },
      onMouseOut: function onMouseOut(event) {
        this.$emit('mouseout', event);
      },
      onMouseOver: function onMouseOver(event) {
        this.$emit('mouseover', event);
      },
      onMouseUp: function onMouseUp(event) {
        this.$emit('mouseup', event);
      },
      onWheel: function onWheel(event) {
        this.$emit('wheel', event);
      },
      onSelect: function onSelect(event) {
        this.$emit('select', event);
      },
    },
  };

exports.Framework7Vue = vuePlugin;
exports.f7Views = views;
exports.f7View = view;
exports.f7Page = page;
exports.f7Navbar = navbar;
exports.f7NavLeft = f7NavLeft;
exports.f7NavRight = navRight;
exports.f7NavTitle = f7NavTitle;
exports.f7Block = block;
exports.f7BlockTitle = blockTitle;
exports.f7BlockHeader = blockHeader;
exports.f7BlockFooter = blockFooter;
exports.f7Card = card;
exports.f7CardHeader = f7CardHeader;
exports.f7CardFooter = f7CardFooter;
exports.f7CardContent = f7CardContent;
exports.f7Chip = chip;
exports.f7Icon = f7Icon;
exports.f7Col = col;
exports.f7Row = row;
exports.f7Badge = f7Badge;
exports.f7Preloader = preloader;
exports.f7Statusbar = statusbar;
exports.f7Subnavbar = subnavbar;
exports.f7Tabs = tabs;
exports.f7Tab = tab;
exports.f7PageContent = f7PageContent;
exports.f7Fab = fab;
exports.f7FabButton = fabButton;
exports.f7FabButtons = fabButtons;
exports.f7Toolbar = toolbar;
exports.f7Progressbar = progressbar;
exports.f7LoginScreenTitle = loginScreenTitle;
exports.f7Swiper = swiper;
exports.f7SwiperSlide = swiperSlide;
exports.f7List = list;
exports.f7ListItem = listItem;
exports.f7ListItemCell = listItemCell;
exports.f7ListItemRow = listItemRow;
exports.f7ListItemContent = f7ListItemContent;
exports.f7ListButton = listButton;
exports.f7SwipeoutActions = swipeoutActions;
exports.f7SwipeoutButton = swipeoutButton;
exports.f7Link = f7Link;
exports.f7Button = button;
exports.f7Segmented = segmented;
exports.f7Accordion = accordion;
exports.f7AccordionItem = accordionItem;
exports.f7AccordionToggle = accordionToggle;
exports.f7AccordionContent = accordionContent;
exports.f7Checkbox = checkbox;
exports.f7Radio = radio;
exports.f7Range = f7Range;
exports.f7Toggle = f7Toggle;
exports.f7Label = label;
exports.f7Input = input;

Object.defineProperty(exports, '__esModule', { value: true });

})));
