
/* medea.js - Open Source, High-Performance 3D Engine based on WebGL.
 *
 * (c) 2011-2013, Alexander C. Gessler
 *  https://github.com/acgessler/medea.js
 *
 * Made available under the terms and conditions of a 3-clause BSD license.
 *
 */

medealib.define('viewport',['camera','renderqueue','statepool'],function(medealib, undefined) {
	"use strict";
	var medea = this, gl = medea.gl;

	var id_source = 0;

	var viewports = [];
	var enabled_viewports = 0, default_zorder = 0;


	// class Viewport
	medea.Viewport = medealib.Class.extend({
		name:"",
		w : 1.0,
		h : 1.0,
		x : 0.0,
		y : 0.0,
		zorder : 0,
		ccolor : [0.0,0.0,0.0,1.0],
		clearFlags : gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
		enabled : 0xdeadbeef,
		updated : true,
		renderer : null,
		visualizers : null,
		waiting_for_renderer_to_load : false,

		// no rendering happens until Renderer() is set to valid value
		init : function(name,x,y,w,h,zorder,camera,enable,renderer) {
			this.x = x || 0;
			this.y = y || 0;
			this.w = w || 1.0;
			this.h = h || 1.0;
			this.zorder = zorder || 0;
			this.id = id_source++;
			this.name = name || 'UnnamedViewport_' + this.id;
			this.renderer = renderer;
			this.visualizers = [];

			this.Camera(camera || medea.CreateCameraNode(this.name+'_DefaultCam'));

			// viewports are initially enabled since this is what
			// users will most likely want.
			this.Enable(enable);
		},


		AddVisualizer : function(vis) {
			if (this.visualizers.indexOf(vis) !== -1) {
				return;
			}

			var ord = vis.GetOrdinal();
			for (var i = 0; i < this.visualizers.length; ++i) {
				if (ord > this.visualizers[i].GetOrdinal()) {
					this.visualizers.insert(i,vis);
					vis._AddRenderer(this);
					return;
				}
			}
			this.visualizers.push(vis);
			vis._AddViewport(this);
		},


		RemoveVisualizer : function(vis) {
			var idx = this.visualizers.indexOf(vis);
			if(idx !== -1) {
				vis._RemoveViewport(this);
				this.visualizers.splice(idx,1);
			}
		},


		GetVisualizers : function() {
			return this.visualizers;
		},


		Name: medealib.Property('name'),
		Renderer: medealib.Property('renderer'),

		Enabled: function(f) {
			if(f === undefined) {
				return this.enabled;
			}
			this.Enable(f);
		},

		Enable: function(doit) {
			doit = doit === undefined ? true : doit;
			if (this.enabled === doit) {
				return;
			}

			this.enabled = doit;

			// changing the 'enabled' state of a viewport has global effect
			enabled_viewports += (doit?1:-1);
			medea.frame_flags |= medea.FRAME_VIEWPORT_UPDATED;

			this.updated = true;
		},

		GetZOrder: function() {
			return this.zorder;
		},

		ClearColor: function(col) {
			if( col === undefined) {
				return this.ccolor;
			}
			this.ccolor = col;
			this.updated = true;
		},

		Width: function(w) {
			if (w === undefined) {
				return this.w;
			}
			this.w = w;
			this.updated = true;
		},

		SetHeight: function(h) {
			if (h === undefined) {
				return this.h;
			}
			this.h = h;
			this.updated = true;
		},

		X: function(x) {
			if (x === undefined) {
				return this.x;
			}
			this.x = x;
			this.updated = true;
		},

		Y: function(y) {
			if (y === undefined) {
				return this.y;
			}
			this.y = y;
			this.updated = true;
		},

		Pos: function(x,y) {
			if (x === undefined) {
				return [this.x,this.y];
			}
			else if (Array.isArray(x)) {
				this.y = x[1];
				this.x = x[0];
			}
			else {
				this.y = y;
				this.x = x;
			}
			this.updated = true;
		},

		Size: function(w,h) {
			if (w === undefined) {
				return [this.w,this.h];
			}
			else if (Array.isArray(w)) {
				this.h = h[1];
				this.w = w[0];
			}
			else {
				this.h = h;
				this.w = w;
			}
			this.updated = true;
		},

		Rect: function(x,y,w,h) {
			if (x === undefined) {
				return [this.x,this.y,this.w,this.h];
			}
			else if (Array.isArray(x)) {
				this.w = x[3];
				this.h = x[2];
				this.y = x[1];
				this.x = x[0];
			}
			else {
				this.w = w;
				this.h = h;
				this.y = y;
				this.x = x;
			}
			this.updated = true;
		},

		GetAspect: function() {
			var c = medea.canvas;
			medealib.DebugAssert(c.width !== 0 && c.height !== 0, 'canvas width and height may not be 0');
			return (this.w*c.width)/(this.h*c.height);
		},

		Camera : function(cam) {
			if (cam === undefined) {
				return this.camera;
			}
			if (this.camera) {
				this.camera._OnSetViewport(null);
			}
			this.camera = cam;
			if (this.camera) {
				this.camera._OnSetViewport(this);
			}
		},

		// Utility to obtain the current camera world position
		// for this viewport. This handles the corner case
		// that a viewport need not have a camera and returns
		// [0, 0, 0] in this case.
		GetCameraWorldPos : function() {
			if (this.camera) {
				return this.camera.GetWorldPos();
			}
			return [0, 0, 0];
		},

		Render: function(dtime) {
			if (!this.enabled) {
				return;
			}
			if (!this.renderer) {
				if (this.waiting_for_renderer_to_load) {
					return;
				}
				this.waiting_for_renderer_to_load = true;
				medealib.LogDebug('viewport.Render() called, but no Renderer set. Loading ForwardRenderer');

				var outer = this;
				medea.LoadModules('forwardrenderer', function() {
					outer.Renderer(medea.CreateForwardRenderer());
				});
				return;
			}

			var renderer = this.renderer
			, rq = renderer.GetRQManager()
			, statepool = medea.GetDefaultStatePool()
			, cw
			, ch
			, cx
			, cy
			;

			// setup the viewport - we usually only need to do this if we're competing with other viewports
			if (enabled_viewports>1 || (medea.frame_flags & medea.FRAME_VIEWPORT_UPDATED) || this.updated) {
				var cw = medea.canvas.width, ch = medea.canvas.height;
				var cx = Math.floor(this.x*cw), cy = Math.floor(this.y*ch);
				cw = Math.floor(this.w*cw), ch = Math.floor(this.h*ch);

				if (this.clearFlags) {
					if (this.clearFlags & gl.COLOR_BUFFER_BIT) {
						var color = this.ccolor;
						gl.clearColor(color[0], color[1], color[2], color.length === 4 ? color[3] : 1.0);
					}

					gl.scissor(cx,cy,cw,ch);
				}

				gl.viewport(cx,cy,cw,ch);
			}

			// clear the viewport
			if (this.clearFlags) {
				gl.depthMask(true);
				gl.clear(this.clearFlags);
			}

			// let the camera class decide which items to render
			this.camera._FillRenderQueues(rq, statepool);
			renderer.Render(this, statepool);

			// Calling gl.flush() empirically improves performance at 
			// least with firefox.
			gl.flush();
			this.updated = false;
		}
	});


	medea.CreateViewport = function(name,x,y,w,h,zorder,camera,enable) {
		// if no z-order is given, default to stacking
		// viewports on top of each other in creation order.
		if (zorder === undefined) {
			zorder = default_zorder++;
		}

		var vp = new medea.Viewport(name,x,y,w,h,zorder,camera,enable);

		zorder = vp.GetZOrder();
		var vps = viewports;

		for(var i = 0; i < vps.length; ++i) {
			if (vps[i].GetZOrder() >= zorder) {
				vps.slice(i,0,vp);
				vps = null;
				break;
			}
		}

		if (vps) {
			vps.push(vp);
		}

		return vp;
	}

	medea.GetViewports = function() {
		return viewports;
	};

	medea.GetEnabledViewportCount = function() {
		return enabled_viewports;
	};
});



