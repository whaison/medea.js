
/* medea - an Open Source, WebGL-based 3d engine for next-generation browser games.
 * (or alternatively, for clumsy and mostly useless tech demos written solely for fun)
 *
 * medea is (c) 2011, Alexander C. Gessler
 * licensed under the terms and conditions of a 3 clause BSD license.
 */

medea._addMod('materialgen',['shader','material'],function(undefined) {
	"use strict";
	var medea = this, gl = medea.gl;


	var generate_vertex_shader = function(dir_lights, point_lights, spot_lights) {
		return 
		"uniform sampler2D texture;\
		uniform vec3 LIGHT_D0_DIR;\

		#include <remote:mcore/shaders/core.psh>\n


		void main()
		{
		    gl_FragColor.a = 1.0;
			gl_FragColor.rgb = texture2D(texture, FetchTexCoord() ).rgb * (dot(normalize(LIGHT_D0_DIR), 
				normalize(FetchNormal()))+1.0) * 0.5;
		}

"
	};


	// class MaterialGen
	medea.MaterialGen = medea.Class.extend({
		name : "",
		mat_gen : null,

		init : function(passes, name) {
		},

		Update : function(statepool, passes) {


		}
	});

	medea.CreateMaterialGen = function(color, dummy_light) {
		return new medea.MaterialGen();
	};
});