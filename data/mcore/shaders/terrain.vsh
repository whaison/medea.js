

/* medea - an Open Source, WebGL-based 3d engine for next-generation browser games.
 * (or alternatively, for clumsy and mostly useless tech demos written solely for fun)
 *
 * medea is (c) 2011, Alexander C. Gessler
 * licensed under the terms and conditions of a 3 clause BSD license.
 */
 
#ifndef INCLUDED_MEDEA_TERRAIN_VSH
#define INCLUDED_MEDEA_TERRAIN_VSH

#include <remote:mcore/shaders/core.vsh>


/** */
struct TerrainVertex {

	vec3 POSITION;
	vec3 NORMAL;
	vec3 TANGENT;
	vec3 BITANGENT;
	vec2 TEXCOORD0;
};

/** */
void GetTerrainVertex(out TerrainVertex vert) {

	vert.POSITION = FetchPosition();

#ifdef ENABLE_TERRAIN_VERTEX_FETCH
	_add_uniform(vec4,_tvf_range);
	_add_uniform(vec3,_tvf_wpos);
	_add_uniform(vec3,_tvf_scale);
	_add_uniform(vec3,_tvf_uvdelta);
	_add_uniform(sampler2D,_tvf_height_map);

    vec2 uv = _tvf_range.xy + TEXCOORD0 * _tvf_range.zw;
	
    vert.POSITION.y = texture2D(_tvf_height_map, uv).r;
    vert.POSITION *= _tvf_scale.xyz;
	vert.POSITION += _tvf_wpos.xyz;
    
    vert.NORMAL = vec3(0.0,1.0,0.0);
    vert.TANGENT = vec3(1.0,0.0,0.0);
    vert.BITANGENT = vec3(0.0,0.0,1.0);
	
#else

	vert.NORMAL = FetchNormal();
	vert.TANGENT = FetchTangent();
	vert.BITANGENT = FetchBitangent();
	
#endif

	vert.TEXCOORD0 = FetchTexCoord();
	
#ifdef ENABLE_TERRAIN_VERTEX_FETCH
	vert.TEXCOORD0 *= _tvf_uvdelta.z;
#endif
}


#endif //  INCLUDED_MEDEA_CORE_VSH




