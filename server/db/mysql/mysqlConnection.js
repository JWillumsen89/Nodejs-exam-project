// Import the mysql2 library
import mysql from 'mysql2';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true, // (optional) Set to true if you want to wait for available connections.
    connectionLimit: 10, // (optional) Adjust the number of connections in the pool as needed.
});

pool.getConnection((err, connection) => {
    if (err) throw err; // not connected!
    console.log('Connected!');
});

export default pool.promise();
