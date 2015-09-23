.PHONY: server watch clean all

TS_FILES := $(shell find src/ -type f)

all: public/js/clock.js public/assets/clock.json

public/js/clock.js: src/main.ts $(TS_FILES)
	-tsc --out $@ $<

public/assets/clock.json: assets/models/clock.dae
	utils/collada2three.py -o $@ $<

server:
	(cd public && python -m SimpleHTTPServer 8989)

watch:
	fswatch -l 0.3 -o src assets | while read; do make && echo OK; done

clean:
	-rm -f public/js/clock.js public/assets/clock.json
