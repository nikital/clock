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

    def __init__ (self, filename):
        super (Collada, self).__init__ ()
        tree = ElementTree.iterparse (filename)

        # Strip namespaces
        for _, el in tree:
            el.tag = el.tag.split ('}', 1)[1]

        self.root = tree.root

        self.geoms = {}
        self.scenes = {}
        self.nodes = {}

        self.parse_geoms (self.root)
        self.parse_scenes (self.root)

    def parse_geoms (self, root_xml):
        for geom_xml in root_xml.iterfind ('library_geometries/geometry'):
            mesh_xml = geom_xml.find ('mesh')

    def parse_scenes (self, root_xml):
        for scene_xml in root_xml.iterfind ('library_visual_scenes/visual_scene'):
            nodes = self.parse_nodes (scene_xml)

            scene = self.Scene (nodes)
            self.scenes[scene_xml.attrib['id']] = scene

    def parse_nodes (self, scene_xml):
        nodes = []
        for node_xml in scene_xml.iter ('node'):
            transform_str = node_xml.find ("matrix[@sid='transform']").text
            transform = list (float (f) for f in transform_str.split ())

            node_type = 'unk'
            instance = None

            node = self.Node (node_xml.attrib['name'], transform, node_type, instance)
            nodes.append (node)
            self.nodes[node_xml.attrib['id']] = node
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
