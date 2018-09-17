testPath="test/${1:-}"
node_modules/.bin/tape `find $testPath -type f -name '*.spec.js'` | node_modules/.bin/faucet