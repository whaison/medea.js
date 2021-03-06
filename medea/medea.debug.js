
/* medea.js - Open Source, High-Performance 3D Engine based on WebGL.
 *
 * (c) 2011-2013, Alexander C. Gessler
 *  https://github.com/acgessler/medea.js
 *
 * Made available under the terms and conditions of a 3-clause BSD license.
 *
 */

medealib.define('debug',['visualizer', 'input_handler', 'sprintf-0.7.js', 'MiniStatsDisplay.js', 'dat.gui.min.js'],function(medealib, undefined) {
	"use strict";
	var medea = this;


	this.DebugPanel = medealib.Class.extend({

		  where 						: null
		, win 							: null
		, input 						: null
		, vis 							: null
		, show_normals 					: false
		, show_bbs 						: false
		, show_bbs_draw_range 			: 50
		, show_bbs_draw_nodes 			: true
		, show_bbs_show_cull_state 		: true
		, show_ministats 				: true
		, last_update_time 				: 0.0
		, wireframe 					: false
		, last_show_ministats			: null
		, stats_shortlist				: null
		,


		init : function(where,win) {
			var f1, f2;

			this.where = where;
			this.win = win;
			this.input = {};
			this.vis = {};

			this.fps_stats = new MiniStatsDisplay({
				  caption 	: 'fps'
				, width		: 140
				, left 		: 0
				, top 		: 0
				, style     : 0
				, autorange	: 50
			});

			this.primitives_stats = new MiniStatsDisplay({
				  caption 	: 'primitives'
				, width		: 140
				, left 		: 0
				, top 		: 46
				, style     : 1
				, autorange	: 50
			});


			this.batches_stats = new MiniStatsDisplay({
				  caption 	: 'batches'
				, width		: 140
				, left 		: 0
				, top 		: 92
				, style     : 3
				, autorange	: 50
			});

			this.stats_shortlist = [
				this.fps_stats,
				this.primitives_stats,
				this.batches_stats
			];

			this.gui = new dat.GUI();
			f1 = this.gui.addFolder('Core');
			f1.add(this, 'wireframe');

			f1 = this.gui.addFolder('Visualizers');
			f1.add(this, 'show_normals');

			f1.add(this, 'show_bbs');
				f2 = f1.addFolder('show_bbs Settings');
				f2.add(this, 'show_bbs_draw_range');
				f2.add(this, 'show_bbs_draw_nodes');
				f2.add(this, 'show_bbs_show_cull_state');

			f1 = this.gui.addFolder('Debug');
			f1.add(this, 'show_ministats');
		},


		Dispose : function() {
			this.gui.destroy();

			this.stats_shortlist.forEach(function(e) {
				e.destroy();
			});
		},


		BeginFrame : function() {
			this._SetVisualizer('showbbs', this.show_bbs);
			this._SetVisualizer('shownormals', this.show_normals);

			if(this.vis.showbbs) {
				this.vis.showbbs.ShowCullState(this.show_bbs_show_cull_state);
				this.vis.showbbs.DrawNodes(this.show_bbs_draw_nodes);
				this.vis.showbbs.DrawRange(this.show_bbs_draw_range);
			}

			if(this.show_ministats !== this.last_show_ministats){
				for(var i = this.stats_shortlist.length - 1; i >= 0; --i) {
					this.stats_shortlist[i].container.style.display = this.show_ministats ? 'block' : 'none';
				}
				this.last_show_ministats = this.show_ministats;
			}

			medea.Wireframe(this.wireframe);
		},


		EndFrame: function() {
			var stats = medea.GetStatistics()
			,	time = medea.GetTime()
			;

			// update stats every 1/10th second to save DOM cost
			if (time - this.last_update_time >= 0.1) {
				this.last_update_time =  time;

				this.fps_stats.update(stats.smoothed_fps);
				this.primitives_stats.update(stats.primitives_frame);
				this.batches_stats.update(stats.batches_frame);
			}
		},


		_SetVisualizer : function(name, state, clb) {
			var vis = this.vis;
			if (vis[name] === false) {
				return;
			}

			if (state && !vis[name]) {
				vis[name] = false;

				var outer = this;
				medea.CreateVisualizer(name,'debug_panel_visualizer:'+name,function(vis) {
					outer.vis[name] = vis;
					outer._AddVisualizer(name);
					if(clb) {
						clb(vis);
					}
				});
			}
			else if (vis[name]) {
				if (!state) {
					this._RemoveVisualizer(name);
				}
				else {
					this._AddVisualizer(name);
				}
			}
		},


		_AddVisualizer : function(name) {
			var vps = medea.GetViewports();
			for(var i = 0; i < vps.length; ++i) {
				vps[i].AddVisualizer(this.vis[name]);
			}
		},


		_RemoveVisualizer : function(name) {
			var vps = this.vis[name].GetViewports().slice(0);
			for(var i = 0; i < vps.length; ++i) {
				vps[i].RemoveVisualizer(this.vis[name]);
			}
		},
	});
});

