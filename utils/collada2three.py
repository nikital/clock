#! /usr/bin/env python

# This is not a generic parser, it parses Collada files output by
# Blender 2.75 using the features I'm using...

import argparse
import sys
import json
from collections import namedtuple
from xml.etree import ElementTree
from uuid import uuid4 as uuid

class Collada (object):

    Scene = namedtuple ('Scene', 'nodes')
    Node = namedtuple ('Node', 'name transform type instance')
    GeometryWithMaterial = namedtuple ('GeometryWithMaterial', 'geom material')
    Geometry = namedtuple ('Geometry', 'uuid faces vertices normals')
    Face = namedtuple ('Face', 'vertices_idx normals_idx')
    Input = namedtuple ('Input', 'source offset')
    Effect = namedtuple ('Effect', 'uuid diffuse specular shininess')

    def __init__ (self, filename):
        super (Collada, self).__init__ ()
        tree = ElementTree.iterparse (filename)

        # Strip namespaces
        for _, el in tree:
            el.tag = el.tag.split ('}', 1)[1]

        root = tree.root

        self._effects = {}
        self.materials = {}
        self.geoms = {}
        self.scenes = {}
        self._nodes = {}

        self._parse_geoms (root)
        self._parse_effects (root)
        self._parse_materials (root)
        self._parse_scenes (root)

    def _parse_geoms (self, root_xml):
        for geom_xml in root_xml.iterfind ('library_geometries/geometry'):
            mesh_xml = geom_xml.find ('mesh')
            poly_xml = mesh_xml.find ('polylist')

            assert all (int(v) == 3 for v in poly_xml.find ('vcount').text.split ()),\
                'Mesh {} is not triangulated'.format (geom_xml.attrib['name'])

            inputs = {}
            for input_xml in poly_xml.iterfind ('input'):
                input = self.Input (input_xml.attrib['source'].lstrip ('#'), int (input_xml.attrib['offset']))
                inputs[input_xml.attrib['semantic']] = input

            input_xml = mesh_xml.find ("vertices[@id='{}']/input[@semantic='POSITION']".format (inputs['VERTEX'].source))
            input = self.Input (input_xml.attrib['source'].lstrip ('#'), inputs['VERTEX'].offset)
            inputs['POSITION'] = input
            del inputs['VERTEX']

            vertices = self._parse_source (mesh_xml, inputs['POSITION'].source)
            normals = self._parse_source (mesh_xml, inputs['NORMAL'].source)

            faces = []
            stride = len (inputs)
            faces_idx = map (int, poly_xml.find ('p').text.split ())
            for i in xrange (0, len (faces_idx), stride * 3):
                face_vertices = []
                face_normals = []
                for j in xrange (i, i + stride * 3, stride):
                    face_vertices.append (faces_idx[j + inputs['POSITION'].offset])
                    face_normals.append (faces_idx[j + inputs['NORMAL'].offset])
                faces.append (self.Face (face_vertices, face_normals))

            geom = self.Geometry (str (uuid ()), faces, vertices, normals)
            self.geoms[geom_xml.attrib['id']] = geom

    def _parse_source (self, mesh, source_id):
        # TODO Actually parse this (accessors and shit)
        array_str = mesh.find ("source[@id='{}']/float_array".format (source_id)).text
        return map (float, array_str.split ())

    def _parse_effects (self, root_xml):
        for effect_xml in root_xml.iterfind ('library_effects/effect'):
            phong = effect_xml.find ('profile_COMMON/technique/phong')

            def parse_color_to_hex (l):
                vec = map (float, l.split ())
                gamma = 1 / 2.2
                r = int (max (0, min (1, vec[0]) ** gamma) * 255)
                g = int (max (0, min (1, vec[1]) ** gamma) * 255)
                b = int (max (0, min (1, vec[2]) ** gamma) * 255)
                return (r << 16) | (g << 8) | (b)
            
            diffuse = parse_color_to_hex (phong.find ('diffuse/color').text)
            specular = parse_color_to_hex (phong.find ('specular/color').text)
            shininess = float (phong.find ('shininess/float').text)

            effect = self.Effect (str (uuid ()), diffuse, specular, shininess)
            self._effects[effect_xml.attrib['id']] = effect

    def _parse_materials (self, root_xml):
        for material_xml in root_xml.iterfind ('library_materials/material'):
            instance_effect = material_xml.find ('instance_effect').attrib['url']
            effect = self._effects[instance_effect.lstrip ('#')]
            self.materials[material_xml.attrib['id']] = effect

    def _parse_scenes (self, root_xml):
        for scene_xml in root_xml.iterfind ('library_visual_scenes/visual_scene'):
            nodes = self._parse_nodes (scene_xml)

            scene = self.Scene (nodes)
            self.scenes[scene_xml.attrib['id']] = scene

    def _parse_nodes (self, scene_xml):
        nodes = []
        for node_xml in scene_xml.iter ('node'):
            transform_str = node_xml.find ("matrix[@sid='transform']").text
            transform = map (float, transform_str.split ())

            instance_geometry = node_xml.find ('instance_geometry')

            if instance_geometry is not None:
                node_type = 'geom'
                instance = geom = self.geoms[instance_geometry.attrib['url'].lstrip ('#')]
                instance_material = instance_geometry.find (
                    'bind_material/technique_common/instance_material')

                if instance_material is not None:
                    node_type = 'geom_with_material'
                    material = self.materials[instance_material.attrib['target'].lstrip ('#')]
                    instance = self.GeometryWithMaterial (geom, material)
            else:
                node_type = 'unk'
                instance = None

            node = self.Node (node_xml.attrib['name'], transform, node_type, instance)
            nodes.append (node)
            self._nodes[node_xml.attrib['id']] = node
        return nodes

def emit_three (collada):
    three = {
        'geometries': [],
        'materials': [],
        'object': {
            'type': 'Scene',
            'children': []
        },
    }

    for geom in collada.geoms.values ():
        faces_three = []
        for face in geom.faces:
            faces_three.append (32)
            faces_three.extend (face.vertices_idx)
            faces_three.extend (face.normals_idx)

        geom_three = {
            'uuid': geom.uuid,
            'type': 'Geometry',
            'data': {
                'vertices': geom.vertices,
                'normals': geom.normals,
                'faces': faces_three
            }
        }

        three['geometries'].append (geom_three)

    default_material = {
        'uuid': str (uuid ()),
        'type': 'MeshPhongMaterial',
        'color': 0xaaaaaa,
        'emissive': 0
    }
    three['materials'].append (default_material)
    for material in collada.materials.values ():
        material_three = {
            'uuid': material.uuid,
            'type': 'MeshPhongMaterial',
            'color': material.diffuse,
            'specular': material.diffuse,
            'shininess': material.shininess,
        }
        three['materials'].append (material_three)

    assert len (collada.scenes) == 1
    scene = collada.scenes.values ()[0]
    for node in scene.nodes:
        if node.type not in ['geom', 'geom_with_material']:
            continue
        node_three = {
            'type': 'Mesh',
            'name': node.name,
            'matrix': reorder_matrix4 (node.transform),
        }
        if node.type == 'geom':
            node_three['geometry'] = node.instance.uuid
            node_three['material'] = default_material['uuid']
        elif node.type == 'geom_with_material':
            node_three['geometry'] = node.instance.geom.uuid
            node_three['material'] = node.instance.material.uuid
            node_three['metal'] = 1

        three['object']['children'].append (node_three)

    return three

def reorder_matrix4 (matrix4):
    matrix4_out = matrix4[:]
    for i in xrange (4):
        for j in xrange (4):
            matrix4_out[i + j * 4] = matrix4[i * 4 + j]
    return matrix4_out

def parse_args ():
    parser = argparse.ArgumentParser ()
    parser.add_argument ('dae', help='Input COLLADA file')
    parser.add_argument ('-o', '--output', help='Output three.js JSON file')

    args = parser.parse_args ()
    if args.output is not None:
        args.output = open (args.output, 'w')
    else :
        args.output = sys.stdout
    return args

def main ():
    args = parse_args ()
    collada = Collada (args.dae)
    three = emit_three (collada)

    json.dump (three, args.output, separators = (',', ':'))
    args.output.write ('\n')

if __name__ == '__main__':
    sys.exit (main ())
