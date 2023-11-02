#!/bin/bash

DBFILE="./game.db"

SQL="
CREATE TABLE gamescores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    score NUMBER
);
"

if ! command -v sqlite3 &>/dev/null; then
	echo "Error: sqlite3 command not found. Please install SQLite3."
	exit 1
fi

echo "$SQL" | sqlite3 $DBFILE

if [ $? -eq 0 ]; then
	echo "Database and table created successfully!"
else
	echo "An error occurred while creating the database and table."
	exit 1
fi
