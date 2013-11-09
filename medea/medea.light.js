/* medea.js - Open Source, High-Performance 3D Engine based on WebGL.
 *
 * (c) 2011-2013, Alexander C. Gessler
 *  https://github.com/acgessler/medea.js
 *
 * Made available under the terms and conditions of a 3-clause BSD license.
 *
 */

medealib.define('light', ['entity'],function(medealib, undefined) {
	"use strict";
	var medea = this, gl = medea.gl;

	

	// class LightJob
	medea.LightJob = medealib.Class.extend({

		distance 	: null,
		light 		: null,
		entity 		: null,
		node 		: null,
		viewport 	: null,

		Draw : function(renderer, statepool) {
			renderer.DrawLight(this, statepool);
		},


		init : function(light,entity,node,viewport) {
			this.light = light;
			this.entity = entity;
			this.node = node;
			this.viewport = viewport;
		},
	});



	// class Light
	this.Light = medea.Entity.extend(
	{
		cast_shadows : false,
		shadowmap_res_bias : 0,
		rq_idx : -1,

		init : function(color, rq) {
			this.color = color || [1,1,1];
			this.rq_idx = rq === undefined ? medea.RENDERQUEUE_LIGHT : rq;
		},


		Render : function(viewport,entity,node,rqmanager) {
			// construct a renderable capable of drawing this light upon request by the render queue manager
			rqmanager.Push(this.rq_idx,new medea.LightJob(this,entity,node,viewport));
		},


		CastShadows : medealib.Property('cast_shadows'),
		ShadowMapResolutionBias : medealib.Property('shadowmap_res_bias'),
	});


	// class DirectionalLight
	this.DirectionalLight = medea.Light.extend(
	{
		dir : null,
		
		init : function(color, dir) {
			this._super(color);
			this.dir = vec3.create(dir || [0,-1,0]); 
			vec3.normalize(this.dir);
		},
	});


	medea.CreateDirectionalLight = function(color, dir) {
		return new medea.DirectionalLight(color, dir);
	};
});