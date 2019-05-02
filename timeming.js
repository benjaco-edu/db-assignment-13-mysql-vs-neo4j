const mysql = require('mysql2/promise');
var neo4j = require('neo4j-driver').v1;


let mysqlQueries = {
    "1": `select count(distinct persons1.nodeid) from nodes
left join edges as endorsments1 on nodes.nodeid = endorsments1.sourcenodeid
left join nodes as persons1 on endorsments1.targetnodeid= persons1.nodeid
where nodes.nodeid =`,
    "2": `select count(distinct persons2.nodeid) from nodes
left join edges as endorsments1 on nodes.nodeid = endorsments1.sourcenodeid
left join nodes as persons1 on endorsments1.targetnodeid= persons1.nodeid
left join edges as endorsments2 on persons1.nodeid = endorsments2.sourcenodeid
left join nodes as persons2 on endorsments2.targetnodeid= persons2.nodeid
where nodes.nodeid =`,
    "3": `select count(distinct persons3.nodeid) from nodes
left join edges as endorsments1 on nodes.nodeid = endorsments1.sourcenodeid
left join nodes as persons1 on endorsments1.targetnodeid= persons1.nodeid
left join edges as endorsments2 on persons1.nodeid = endorsments2.sourcenodeid
left join nodes as persons2 on endorsments2.targetnodeid= persons2.nodeid
left join edges as endorsments3 on persons2.nodeid = endorsments3.sourcenodeid
left join nodes as persons3 on endorsments3.targetnodeid= persons3.nodeid
where nodes.nodeid = `,
    "4": `select count(distinct persons4.nodeid) from nodes
left join edges as endorsments1 on nodes.nodeid = endorsments1.sourcenodeid
left join nodes as persons1 on endorsments1.targetnodeid= persons1.nodeid
left join edges as endorsments2 on persons1.nodeid = endorsments2.sourcenodeid
left join nodes as persons2 on endorsments2.targetnodeid= persons2.nodeid
left join edges as endorsments3 on persons2.nodeid = endorsments3.sourcenodeid
left join nodes as persons3 on endorsments3.targetnodeid= persons3.nodeid
left join edges as endorsments4 on persons3.nodeid = endorsments4.sourcenodeid
left join nodes as persons4 on endorsments4.targetnodeid= persons4.nodeid

where nodes.nodeid =`,
    "5": `select count(distinct persons5.nodeid) from nodes
left join edges as endorsments1 on nodes.nodeid = endorsments1.sourcenodeid
left join nodes as persons1 on endorsments1.targetnodeid= persons1.nodeid
left join edges as endorsments2 on persons1.nodeid = endorsments2.sourcenodeid
left join nodes as persons2 on endorsments2.targetnodeid= persons2.nodeid
left join edges as endorsments3 on persons2.nodeid = endorsments3.sourcenodeid
left join nodes as persons3 on endorsments3.targetnodeid= persons3.nodeid
left join edges as endorsments4 on persons3.nodeid = endorsments4.sourcenodeid
left join nodes as persons4 on endorsments4.targetnodeid= persons4.nodeid
left join edges as endorsments5 on persons4.nodeid = endorsments5.sourcenodeid
left join nodes as persons5 on endorsments5.targetnodeid= persons5.nodeid
where nodes.nodeid =`
};

let cypher = `match (a:person{pid:<id>})-[:Endorsments*1..<rels>]->(c:person)
where a <> c
return count(distinct c)`;

function avg(array) {
    return array.reduce( (a,b) => a + b) / array.length;
}

function median(numbers) {
    var median = 0, numsLen = numbers.length;
    numbers.sort();

    if (numsLen % 2 === 0) {
        median = numbers[numsLen / 2 - 1];
    } else {
        median = numbers[(numsLen - 1) / 2];
    }

    return median;
}

(async () => {
    const mysqlConnection = await mysql.createConnection({
        host: 'mysql',
        user: 'nodejs',
        password: 'nodecode',
        database: 'social'
    });
    const neo4jDriver = neo4j.driver("bolt://neo4j", neo4j.auth.basic("neo4j", "test1234"));
    const neo4jSession = neo4jDriver.session();


    let keys = [];
    for (let i = 0; i < 20; i++) {
        keys.push(Math.round(Math.random() * (500000 - 1) + 1))
    }

    console.log("                        MySQL                      Neo4j    ");
    console.log("                   average    median          average    median");
    for (let i = 1; i <= 5; i++) {
        let mysqltimes = [],
            neo4jtimes = [];

        for (let id of keys) {
            let start = new Date();
            await mysqlConnection.execute(mysqlQueries[i]+id);
            let end = new Date() - start
            mysqltimes.push(end);
        }

        for (let id of keys) {
            let q = cypher.replace("<id>", id).replace("<rels>", i);

            let start = new Date();
            await neo4jSession.run(q);
            let end = new Date() - start;
            neo4jtimes.push(end);
        }

        console.log(`Depth${i}             ${avg(mysqltimes).toFixed(1).padStart(7)}   ${median(mysqltimes).toFixed(1).padStart(7)}          ${avg(neo4jtimes).toFixed(1).padStart(7)}   ${median(neo4jtimes).toFixed(1).padStart(7)} `);

    }

    neo4jSession.close();
    process.exit();


})();