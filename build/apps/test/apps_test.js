var steal = require('../../../node'),
	rimraf = require("rimraf").sync;

suite("Apps");

process.chdir("..");

var setupMultiBuild = function(after) {
		/**
		 * Setup for multi-build packaging tests
		 *
		 * Project module dependency diagram:
		 *
		 * app_x           app_y         app_z
		 *
		 *  ^          7    ^           7   ^
		 *  |        /      |         /     |
		 *  |      /        |       /       |
		 *
		 * plugin_xy       plugin_yz     plugin_z
		 *
		 *  ^             7
		 *  |           /
		 *  |         /
		 *
		 * nested_plugin_xyz
		 *
		 *
		 * Modules should be grouped up into packages, based upon shared
		 * dependencies. The packages should be structured as follows:
		 *
		 * packages/0 -> (contains) -> nested_plugin_xyz
		 *
		 * packages/1 -> (depends on) -> packages/0 for nested_plugin_xyz
		 *            -> (contains) -> plugin_xy
		 *
		 *
		 * packages/2 -> (depends on) -> packages/0 for nested_plugin_xyz
		 *            -> (contains) -> plugin_yz
		 *
		 * app_x/production -> (loads) -> packages/0 for nested_plugin_xyz
		 *                  -> (loads) -> packages/1 for plugin_xy
		 *                  -> (contains) -> app_x
		 *
		 * app_y/production -> (loads) -> packages/0 for nested_plugin_xyz
		 *                  -> (loads) -> packages/1 for plugin_xy
		 *                  -> (loads) -> packages/2 for plugin_yz
		 *                  -> (contains) -> app_y
		 *
		 * app_z/production -> (loads) -> packages/0 for nested_plugin_xyz
		 *                  -> (loads) -> packages/2 for plugin_yz
		 *                  -> (contains) -> plugin_z
		 *                  -> (contains) -> app_z
		 *
		 * This test multi-build project will allow testing of a few cases:
		 * - Packaging a direct dependency
		 * - Packaging an indirect dependency (dependency of another dependency)
		 * - Packaging an indirect dependency once, when it is imported more than once
		 * - Including a direct dependency
		 *   (plugin_z, because it is only imported in one app module)
		 *
		 */

		steal("steal/build","steal/build/apps", function(build, apps){

debugger;

	// the following isn't all that's required
	//s2.config('root','');
	
				var buildOptions = {
						// compressor: "uglify" // uglify is much faster
				};

				// @todo: Work out why STEALPRINT doesn't prevent print() statements
				//        during build
				// STEALPRINT = false;

				apps(["steal/build/apps/test/multibuild/app_x",
					"steal/build/apps/test/multibuild/app_y",
					"steal/build/apps/test/multibuild/app_z"], buildOptions, function(){

					// Execute callback
					after();

					// Tear down
					rimraf("steal/build/apps/test/multibuild/app_x/production.js");
					rimraf("steal/build/apps/test/multibuild/app_y/production.js");
					rimraf("steal/build/apps/test/multibuild/app_z/production.js");
					rimraf("steal/build/apps/test/multibuild/app_x/production.css");
					rimraf("steal/build/apps/test/multibuild/app_y/production.css");
					rimraf("steal/build/apps/test/multibuild/app_z/production.css");
					rimraf("packages/0.js");
					rimraf("packages/1.js");
					rimraf("packages/2.js");
					rimraf("packages/0.css");
					rimraf("packages/1.css");
					rimraf("packages/2.css");
				});
		});
};

test("multibuild creates JS/CSS packages with the right contents", function(done){
		setupMultiBuild(function(){
				var contents;
				contents = readFile("packages/app_x-app_y-app_z.js");

				equals(/init_nested_plugin_xyz/.test(contents), true,
								"content of nested_plugin_xyz.js should be packaged");

				contents = readFile("packages/app_x-app_y.js");
				equals(/init_plugin_xy/.test(contents), true,
								"content of plugin_xy.js should be packaged");

				contents = readFile("packages/app_y-app_z.js");
				equals(/init_plugin_yz/.test(contents), true,
								"content of plugin_yz.js should be packaged");

				contents = readFile("steal/build/apps/test/multibuild/app_x/production.js");
				equals(/init_app_x/.test(contents), true,
								"content of app_x.js should be packaged");

				contents = readFile("steal/build/apps/test/multibuild/app_y/production.js");
				equals(/init_app_y/.test(contents), true,
								"content of app_y.js should be packaged");

				contents = readFile("steal/build/apps/test/multibuild/app_z/production.js");
				equals(/init_app_z/.test(contents), true,
								"content of app_z.js should be packaged");
				equals(/init_plugin_z/.test(contents), true,
								"content of plugin_z.js should be packaged");
								
								
				contents = readFile("packages/app_x-app_y-app_z.css");
				equals(/#nested_plugin_xyz_styles/.test(contents), true,
								"content of nested_plugin_xyz.css should be packaged");

				contents = readFile("packages/app_x-app_y.css");
				equals(/#plugin_xy_styles/.test(contents), true,
								"content of plugin_xy.css should be packaged");

				contents = readFile("packages/app_y-app_z.css");
				equals(/#plugin_yz_styles/.test(contents), true,
								"content of plugin_yz.css should be packaged");

				contents = readFile("steal/build/apps/test/multibuild/app_x/production.css");
				equals(/#app_x_styles/.test(contents), true,
								"content of app_x.css should be packaged");

				contents = readFile("steal/build/apps/test/multibuild/app_y/production.css");
				equals(/#app_y_styles/.test(contents), true,
								"content of app_y.css should be packaged");

				contents = readFile("steal/build/apps/test/multibuild/app_z/production.css");
				equals(/#app_z_styles/.test(contents), true,
								"content of app_z.css should be packaged");
				equals(/#plugin_z_styles/.test(contents), true,
								"content of plugin_z.css should be packaged");
								
				var linkTags;

				open("steal/build/apps/test/multibuild/app_x/app_x.prod.html");
				linkTags = document.getElementsByTagName("link");
				equals(/packages\/app_x-app_y-app_z\.css/.test(linkTags[0].href), true,
								"loaded direct dependencies stylesheet");
				equals(/packages\/app_x-app_y\.css/.test(linkTags[1].href), true,
								"loaded indirect dependencies stylesheet");
				equals(/multibuild\/app_x\/production\.css/.test(linkTags[2].href), true,
								"loaded app dependencies stylesheet");
				equals(linkTags.length, 3,
								"3 stylesheets are loaded");
								
				equals(modulesLoaded[0], "nested_plugin_xyz",
								"nested_plugin_xyz should have loaded");
				equals(modulesLoaded[1], "plugin_xy",
								"plugin_xy should have loaded");
				equals(modulesLoaded[2], "app_x",
								"app_x should have loaded");


				open("steal/build/apps/test/multibuild/app_y/app_y.prod.html");
				linkTags = document.getElementsByTagName("link");
				equals(linkTags.length, 4,
								"4 stylesheets are loaded");
				equals(modulesLoaded[0], "nested_plugin_xyz",
								"nested_plugin_xyz should have loaded (just once, even though it's included twice')");
				equals(modulesLoaded[1], "plugin_yz",
								"plugin_xy should have loaded");
				equals(modulesLoaded[2], "plugin_xy",
								"plugin_yz should have loaded");
				equals(modulesLoaded[3], "app_y",
								"app_y should have loaded");

				open("steal/build/apps/test/multibuild/app_z/app_z.prod.html");
				linkTags = document.getElementsByTagName("link");
				equals(linkTags.length, 3,
								"3 stylesheets are loaded");
				equals(modulesLoaded[0], "nested_plugin_xyz",
								"nested_plugin_xyz should have loaded");
				equals(modulesLoaded[1], "plugin_yz",
								"plugin_yz should have loaded");
				equals(modulesLoaded[2], "plugin_z",
								"plugin_z should have loaded");
				equals(modulesLoaded[3], "app_z",
								"app_z should have loaded");
		});
});
