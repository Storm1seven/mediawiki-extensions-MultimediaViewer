/*
 * This file is part of the MediaWiki extension MediaViewer.
 *
 * MediaViewer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * MediaViewer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MediaViewer.  If not, see <http://www.gnu.org/licenses/>.
 */

( function ( mw, $ ) {
	var CP;

	/**
	 * @class mw.mmv.Config
	 * Contains/retrieves configuration/environment information for MediaViewer.
	 * @constructor
	 */
	function Config( viewerConfig, mwConfig, mwUser, api, localStorage ) {
		/**
		 * A plain object storing MediaViewer-specific settings
		 * @type {Object}
		 */
		this.viewerConfig = viewerConfig;

		/**
		 * The mw.config object, for dependency injection
		 * @type {mw.Map}
		 */
		this.mwConfig = mwConfig;

		/**
		 * mw.user object, for dependency injection
		 * @type {Object}
		 */
		this.mwUser = mwUser;

		/**
		 * API object, for dependency injction
		 * @type {mw.Api}
		 */
		this.api = api;

		/**
		 * The localStorage object, for dependency injection
		 * @type {Object}
		 */
		this.localStorage = localStorage;
	}
	CP = Config.prototype;

	/**
	 * Get value from local storage or fail gracefully.
	 * @param {string} key
	 * @param {*} [fallback] value to return when key is not set or localStorage is not supported
	 * @returns {*} stored value or fallback or null if neither exists
	 */
	CP.getFromLocalStorage = function ( key, fallback ) {
		var value = null;
		if ( this.localStorage ) {
			value = this.localStorage.getItem( key );
		}
		if ( value === null && fallback !== undefined ) {
			value = fallback;
		}
		return value;
	};

	/**
	 * Set item in local storage or fail gracefully.
	 * @param {string} key
	 * @param {*} value
	 * @return {boolean} whether storing the item was successful
	 */
	CP.setInLocalStorage = function ( key, value ) {
		var success = false;
		if ( this.localStorage ) {
			try {
				this.localStorage.setItem( key, value );
				success = true;
			} catch ( e ) {}
		}
		return success;
	};

	/**
	 * Remove item from local storage or fail gracefully.
	 * @param {string} key
	 * @return {boolean} whether storing the item was successful
	 */
	CP.removeFromLocalStorage = function ( key ) {
		if ( this.localStorage ) {
			try {
				this.localStorage.removeItem( key );
				return true;
			} catch ( e ) {
				return false;
			}
		}
		return true; // since we never even stored the value, this is considered a success
	};

	/**
	 * Set user preference via AJAX
	 * @param {string} key
	 * @param {string} value
	 * @returns {jQuery.Promise} a deferred which resolves/rejects on success/failure respectively
	 */
	CP.setUserPreference = function ( key, value ) {
		return this.api.postWithToken( 'options', {
			action: 'options',
			optionname: key,
			optionvalue: value
		} );
	};

	/**
	 * Returns true if MediaViewer should handle thumbnail clicks.
	 */
	CP.isMediaViewerEnabledOnClick = function () {
		// IMPORTANT: mmv.head.js uses the same logic but does not use this class to be lightweight. Make sure to keep it in sync.
		return this.mwConfig.get( 'wgMediaViewer' ) // global opt-out switch, can be set in user JS
			&& this.mwConfig.get( 'wgMediaViewerOnClick' ) // thumbnail opt-out, can be set in preferences
			&& ( !this.mwUser.isAnon() || this.getFromLocalStorage( 'wgMediaViewerOnClick', 1 ) === 1 ); // thumbnail opt-out for anons
	};

	/**
	 * (Semi-)permanently stores the setting whether MediaViewer should handle thumbnail clicks.
	 * - for logged-in users, we use preferences
	 * - for anons, we use localStorage
	 * - for anons with old browsers, we don't do anything
	 * @param {boolean} enabled
	 * @return {jQuery.Promise} a deferred which resolves/rejects on success/failure respectively
	 */
	CP.setMediaViewerEnabledOnClick = function ( enabled ) {
		var config = this,
			success = true;

		if ( this.mwUser.isAnon() ) {
			if ( !enabled ) {
				success = this.setInLocalStorage( 'wgMediaViewerOnClick', '0' ); // localStorage stringifies everything, best use strings in the first place
			} else {
				success = this.removeFromLocalStorage( 'wgMediaViewerOnClick' );
			}
			if ( success ) {
				config.mwConfig.set( 'wgMediaViewerOnClick', enabled );
				return $.Deferred().resolve();
			} else {
				return $.Deferred().reject();
			}
		} else {
			return this.setUserPreference( 'multimediaviewer-enable', enabled ? true : '').then( function () {  // wow our prefs API sucks
				// make the change work without a reload
				config.mwConfig.set( 'wgMediaViewerOnClick', enabled );
			} );
		}
	};

	/**
	 * Returns true if #setMediaViewerEnabledOnClick() is supported.
	 * @return {boolean}
	 */
	CP.canSetMediaViewerEnabledOnClick = function () {
		return !this.mwUser.isAnon() || !!this.localStorage;
	};

	mw.mmv.Config = Config;
} ( mediaWiki, jQuery ) );
