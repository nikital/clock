#! /usr/bin/env python

import argparse
import sys
from collections import namedtuple
from xml.etree import ElementTree

class Collada (object):

    Scene = namedtuple ('Scene',
                        ['nodes'])
    Node = namedtuple ('Node',
                       ['name', 'transform', 'type', 'instance'])
    Geometry = namedtuple ('Geometry',
                       ['faces', 'vertices', 'normals'])
    Face = namedtuple ('Face',
                       ['vertices_idx', 'normals_idx'])
    Input = namedtuple ('Input',
                       ['source', 'offset'])

    def __init__ (self, filename):
        super (Collada, self).__init__ ()
        tree = ElementTree.iterparse (filename)

        # Strip namespaces
        for _, el in tree:
            el.tag = el.tag.split ('}', 1)[1]

        root = tree.root

        self._geoms = {}
        self.scenes = {}
        self._nodes = {}

        self._parse_geoms (root)
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

            geom = self.Geometry (faces, vertices, normals)
            self._geoms[geom_xml.attrib['id']] = geom

    def _parse_source (self, mesh, source_id):
        # TODO Actually parse this (accessors and shit)
        array_str = mesh.find ("source[@id='{}']/float_array".format (source_id)).text
        return map (float, array_str.split ())

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
                instance = self._geoms[instance_geometry.attrib['url'].lstrip ('#')]
            else:
                node_type = 'unk'
                instance = None

            node = self.Node (node_xml.attrib['name'], transform, node_type, instance)
            nodes.append (node)
            self._nodes[node_xml.attrib['id']] = node
        return nodes

def parse_args ():
    parser = argparse.ArgumentParser ()
    parser.add_argument ('dae', help='Input COLLADA file')
    parser.add_argument ('-o', '--output', help='Output three.js JSON file')

    args = parser.parse_args ()
    return args

def main ():
    args = parse_args ()
    collada = Collada (args.dae)
    print collada.scenes

if __name__ == '__main__':
    sys.exit (main ())
