const { MongoClient } = require('mongodb');

const clientDb = new MongoClient(process.env.DB_URI);

exports.connection = async function() {
    await clientDb.connect();
    console.log('exports.conn')
    return;
};

exports.noteDb = function() {
    console.log('exports.noteDb')
    const db = clientDb.db('skillbox');
    const noteDb = db.collection('notes');
    return noteDb;
};

exports.userDb = function() {
    console.log('exports.userDb')
    const db = clientDb.db('skillbox');
    const userDb = db.collection('users');
    return userDb;
}

