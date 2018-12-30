#!/bin/bash

if [ -z "$GRAPHQL_ENDPOINT_URL" ]; then
    echo "GRAPHQL_ENDPOINT_URL environment variable must be set"
    exit 1
fi

REACT_APP_GRAPHQL_ENDPOINT_URL="$GRAPHQL_ENDPOINT_URL" "$@"
