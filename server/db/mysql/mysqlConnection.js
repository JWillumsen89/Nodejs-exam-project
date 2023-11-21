// Import the mysql2 library
import mysql from 'mysql2';

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Bowie2018',
    database: 'mandatoryii',
    waitForConnections: true, // (optional) Set to true if you want to wait for available connections.
    connectionLimit: 10, // (optional) Adjust the number of connections in the pool as needed.
});

pool.getConnection((err, connection) => {
    if (err) throw err; // not connected!
    console.log('Connected!');
});

export default pool.promise();
