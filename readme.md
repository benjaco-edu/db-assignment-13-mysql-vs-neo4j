# Database assignment 13 - mysql vs neo4j

https://github.com/datsoftlyngby/soft2019spring-databases/blob/master/assignments/assignment13.md

## Pre setup

Download https://github.com/datsoftlyngby/soft2019spring-databases/raw/master/data/archive_graph.tar.gz

Unzip it

Enter the new folder `cd archive_graph`

You should now be inside a terminal in the same folder as social_network_edges.csv and social_network_nodes.csv

## Setup neo4j

Start neo4j

```bash
sudo docker run -d --name neo4j --rm --publish=7474:7474 --publish=7687:7687 -v $(pwd):/var/lib/neo4j/import --env NEO4J_AUTH=neo4j/test1234 --env=NEO4J_dbms_memory_pagecache_size=4G --env=NEO4J_dbms_memory_heap_initial__size=4G --env=NEO4J_dbms_memory_heap_max__size=4G neo4j
```

Open http://localhost:7474/browser/

Use credentials `neo4j` as username with password `test1234`

### Import data
```
USING PERIODIC COMMIT
LOAD CSV WITH HEADERS FROM "file:///social_network_nodes.csv" AS row  FIELDTERMINATOR ","
WITH row
CREATE (a:person {
    pid: toInteger(row.node_id),
	name: row.name,
	job: row.job,
	birthday: row.birthday
})
```
### Make index
```
create index on :person(pid)
```
### Make Relations
```
USING PERIODIC COMMIT
LOAD CSV WITH HEADERS FROM "file:///social_network_edges.csv" AS row  FIELDTERMINATOR ","
WITH row
Match (p1:person {pid: toInteger(row.source_node_id)}), (p2:person {pid: toInteger(row.target_node_id) })
create (p1)-[:Endorsments]->(p2)
```
Give it a few minutes, it should not take that long, it can finish while the mysql database is being setup

## Setup mysql

Start mysql

```
sudo docker run --rm --name mysql -p 3306:3306 -v $(pwd):/mnt/import -e MYSQL_ROOT_PASSWORD=pass1234 -d mysql
```

> ```
> sudo docker exec -it mysql bash
>
> cd /mnt/import
>
> mysql -u root -ppass1234  --local-infile
> ```
> > ```
> > SET GLOBAL local_infile = 1;
> >
> > CREATE DATABASE social;
> > USE social;
> >
> > CREATE TABLE nodes (
> >     node_id INT ,
> >     name VARCHAR(100),
> >     job VARCHAR(100),
> >     birthday VARCHAR(10),
> >     PRIMARY KEY (node_id)
> > );
> >
> > CREATE TABLE edges (
> >     source_node_id INT,
> >     target_node_id INT
> > );
> >
> > ALTER TABLE edges
> > ADD INDEX inx_src (source_node_id ASC),
> > ADD INDEX inx_trg (target_node_id ASC);
> >
> >
> > LOAD DATA LOCAL INFILE './social_network_nodes.csv'  INTO TABLE nodes  FIELDS TERMINATED BY ','  ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
> >
> > LOAD DATA LOCAL INFILE './social_network_edges.csv'  INTO TABLE edges  FIELDS TERMINATED BY ','  ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
> >
> >
> > use mysql;
> >
> > CREATE USER 'nodejs'@'%' IDENTIFIED WITH mysql_native_password BY 'nodecode';
> > grant all privileges on social.* to 'nodejs'@'%';
> > FLUSH PRIVILEGES;
> >
> >
> > exit;
> > ```
> ```
> exit
> ```

## Speed Test

```
> sudo docker run --link neo4j:neo4j --link mysql:mysql bslcphbussiness/db-assignment-13-mysql-vs-neo4j
                        MySQL                      Neo4j
                   average    median          average    median
Depth1                 2.5       2.0             16.6      11.0
Depth2                22.1      26.0             13.2      13.0
Depth3               414.1     330.0             51.7      36.0
Depth4              7204.1    2551.0           1038.2     391.0
Depth5            142406.3  327368.0           6118.4    4309.0
```

### Build

`sudo docker build -t bslcphbussiness/db-assignment-13-mysql-vs-neo4j .`

## Cleanup
```
sudo docker rm -f mysql
sudo docker rm -f neo4j
sudo docker rmi bslcphbussiness/db-assignment-13-mysql-vs-neo4j
```