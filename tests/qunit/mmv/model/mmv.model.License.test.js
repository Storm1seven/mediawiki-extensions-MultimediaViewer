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

( function( mw, $ ) {

	QUnit.module( 'mmv.model.License', QUnit.newMwEnvironment() );

	QUnit.test( 'License constructor sanity check', 11, function( assert ) {
		var license,
			shortName = 'CC-BY-SA-3.0',
			internalName = 'cc-by-sa-3.0',
			longName = 'Creative Commons Attribution--Share-Alike 3.0',
			url = 'http://creativecommons.org/licenses/by-sa/3.0/';

		license = new mw.mmv.model.License( shortName );
		assert.ok( license, 'License created successfully' );
		assert.strictEqual( license.shortName, shortName, 'License has correct short name' );
		assert.ok( !license.internalName, 'License has no internal name' );
		assert.ok( !license.longName, 'License has no long name' );
		assert.ok( !license.deedUrl, 'License has no deed URL' );

		license = new mw.mmv.model.License( shortName, internalName, longName, url );
		assert.ok( license, 'License created successfully' );
		assert.strictEqual( license.shortName, shortName, 'License has correct short name' );
		assert.strictEqual( license.internalName, internalName, 'License has correct internal name' );
		assert.strictEqual( license.longName, longName, 'License has correct long name' );
		assert.strictEqual( license.deedUrl, url, 'License has correct deed URL' );

		try {
			license = new mw.mmv.model.License();
		} catch( e ) {
			assert.ok( e, 'License cannot be created without a short name' );
		}
	} );

	QUnit.test( 'getShortName()', 3, function( assert ) {
		var existingMessageKey = 'Internal name that does exist',
			nonExistingMessageKey = 'Internal name that does not exist',
			license1 = new mw.mmv.model.License( 'Shortname' ),
			license2 = new mw.mmv.model.License( 'Shortname', nonExistingMessageKey ),
			license3 = new mw.mmv.model.License( 'Shortname', existingMessageKey ),
			oldMwMessage = mw.message,
			oldMwMessagesExists = mw.messages.exists;

		mw.message = function ( name ) {
			return name === 'multimediaviewer-license-' + existingMessageKey
				? { text: function () { return 'Translated name'; } }
				: oldMwMessage.apply( mw, arguments );
		};
		mw.messages.exists = function ( name ) {
			return name === 'multimediaviewer-license-' + existingMessageKey
				? true : oldMwMessagesExists.apply( mw.messages, arguments );
		};

		assert.strictEqual( license1.getShortName(), 'Shortname',
			'Short name is returned when there is no translated name' );
		assert.strictEqual( license2.getShortName(), 'Shortname',
			'Short name is returned when translated name is missing' );
		assert.strictEqual( license3.getShortName(), 'Translated name',
			'Translated name is returned when it exists' );

		mw.message = oldMwMessage;
		mw.messages.exists = oldMwMessagesExists;
	} );

	QUnit.test( 'getShortLink()', 6, function( assert ) {
		var $html,
			license1 = new mw.mmv.model.License( 'lorem ipsum' ),
			license2 = new mw.mmv.model.License( 'lorem ipsum', 'lipsum' ),
			license3 = new mw.mmv.model.License( 'lorem ipsum', 'lipsum', 'Lorem ipsum dolor sit amet' ),
			license4 = new mw.mmv.model.License( 'lorem ipsum', 'lipsum', 'Lorem ipsum dolor sit amet',
				'http://www.lipsum.com/' );

		assert.strictEqual( license1.getShortLink(), 'lorem ipsum',
			'Code for license without link is formatted correctly' );
		assert.strictEqual( license2.getShortLink(), 'lorem ipsum',
			'Code for license without link is formatted correctly' );
		assert.strictEqual( license3.getShortLink(), 'lorem ipsum',
			'Code for license without link is formatted correctly' );

		$html = $( license4.getShortLink() );
		assert.strictEqual( $html.text(), 'lorem ipsum',
			'Text for license with link is formatted correctly' );
		assert.strictEqual( $html.prop( 'href' ), 'http://www.lipsum.com/',
			'URL for license with link is formatted correctly' );
		assert.strictEqual( $html.prop( 'title' ), 'Lorem ipsum dolor sit amet',
			'Title for license with link is formatted correctly' );
	} );

}( mediaWiki, jQuery ) );
