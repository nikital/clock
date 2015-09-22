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

        self.scenes = {}
        self.nodes = {}

        self.parse_scenes (self.root)

    def parse_scenes (self, root_xml):
        visual_scenes = root_xml.find ('library_visual_scenes')
        for scene in visual_scenes.iter ('visual_scene'):
            self.parse_scene (scene)

    def parse_scene (self, scene_xml):
        nodes = []
        for node_xml in scene_xml.iter ('node'):
            transform_str = node_xml.find ("matrix[@sid='transform']").text
            transform = list (float (f) for f in transform_str.split ())

            node_type = 'unk'
            instance = None

            node = self.Node (node_xml.attrib['name'], transform, node_type, instance)

            nodes.append (node)
            self.nodes[node_xml.attrib['id']] = node

        scene = self.Scene (nodes)
        self.scenes[scene_xml.attrib['id']] = scene

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
