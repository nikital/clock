.PHONY: server

TS_FILES := $(shell find src/ -type f)

public/js/clock.js: src/main.ts $(TS_FILES)
	tsc --watch --out $@ $<

server:
	(cd public && python -m SimpleHTTPServer 8989)
