.PHONY: server watch clean

TS_FILES := $(shell find src/ -type f)

public/js/clock.js: src/main.ts $(TS_FILES)
	tsc $(TSC_FLAGS) --out $@ $<

server:
	(cd public && python -m SimpleHTTPServer 8989)

watch:
	$(MAKE) TSC_FLAGS=--watch

clean:
	-rm -f public/js/clock.js
