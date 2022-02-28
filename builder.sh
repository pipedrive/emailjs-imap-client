#!/bin/sh
export ex_code=1

rm -rf node_modules/ && npm i && npm run build && export ex_code=0

exit $ex_code
