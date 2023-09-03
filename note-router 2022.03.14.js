const express = require("express");
const router = express.Router();
const { nanoid } = require('nanoid');
const markdown = require( "markdown" ).markdown;
const pdf = require('html-pdf');
const connectionDB = require('./db.js');
const auth = require('./auth.js').auth;
const { logger } = require('./logger.js');

let noteDb = connectionDB.noteDb();

router.post('/createnote', auth(), async (req, res) => {
  logger.info('createnote req.body', req.body);
  req.body.created = new Date();
  req.body._id = nanoid();
  req.body.isArchived = false;
  req.body.html = markdown.toHTML(req.body.text);
  let q1 = await noteDb.insertOne(req.body);
  logger.info('noteDb.insertOne(req.body)', q1);
  res.json({_id: req.body._id })
})

let html1;
router.post('/getnote', auth(), async (req, res) => {
  const { id } = req.body;
  //logger.info('getnote, req.body', id );
  logger.info('logger.info id', id);
  let notesArr = await noteDb
    .find({_id: id})
    .toArray();
  html1 = notesArr[0].html;
  logger.info('getnote, notesArr', notesArr[0].html );

  res.json(notesArr[0]);
})

router.post('/getnotes', auth(), async (req, res) => {
  logger.info('getnotes req.body', req.body);
  req.body.search = req.body.search.toLowerCase()
  let notesArr = await noteDb
    .find({username: req.body.username, title: { $regex: req.body.search, $options: 'i' }})
    .toArray();
  if (req.body.search) {
    notesArr.forEach((e) => e.highlights = req.body.search)
  }
  logger.info('noteDb.find({username: req.body.username})', notesArr);
  let hasMore;
  if (req.body.age == 'archive') {
    notesArr = notesArr.filter((n) => n.isArchived == true )
  }
  else if (req.body.age == '1week') {
    notesArr = notesArr.filter((n) => n.isArchived == false && n.created > new Date() - 604800000)
  }
  else if (req.body.age == '1month') {
    notesArr = notesArr.filter((n) => n.isArchived == false && n.created > new Date() - 2592000000)
  }
  else if (req.body.age == '3months') {
    notesArr = notesArr.filter((n) => n.isArchived == false && n.created > new Date() - 7776000000)
  }
  else {
    notesArr = notesArr.filter((n) => n.isArchived == false )
  }
  notesArr.sort((a, b) => {
    if (Date.parse(a.created) > Date.parse(b.created)) return -1;
    if (Date.parse(a.created) == Date.parse(b.created)) return 0;
    if (Date.parse(a.created) < Date.parse(b.created)) return 1;
  })
  let pages = Math.ceil(notesArr.length / 20);
  logger.info('Math.ceil(notesArr.length / 20)', pages);
  pages / req.body.page > 1 ? hasMore = true : hasMore = false ;
  notesArr = notesArr.slice((req.body.page -1) * 20, req.body.page * 20);
  res.json({
    type: 'notes',
    data: notesArr,
    hasMore: hasMore
  });
});

router.post('/editnote', auth(), async (req, res) => {
  logger.info('/editnote, req.body', req.body);

  req.body.html = markdown.toHTML(req.body.text);
  let q = await noteDb.updateOne(
    { _id: req.body.id },
    {
      $set: {
        title: req.body.title,
        text: req.body.text,
        html: req.body.html
      }
    }
  )
  logger.info('await noteDb.updateOne(', q)
  res.json({ q });
})

router.post('/archivenote', auth(), async (req, res) => {
  logger.info('/archivenote, req.body', req.body);
  let q = await noteDb.updateOne(
    { _id: req.body.id },
    {
      $set: {
        isArchived: true
      }
    }
  )
  res.json({ q });
});

router.post('/unarchivenote', auth(), async (req, res) => {
  logger.info('/UNarchivenote, req.body', req.body);
  let q = await noteDb.updateOne(
    { _id: req.body.id },
    {
      $set: {
        isArchived: false
      }
    }
  )
  res.json({ q });
});

router.post('/deletenote', auth(), async (req, res) => {
  logger.info('/deletenote, req.body', req.body);
  let q = await noteDb.deleteOne({ _id: req.body.id});
  res.json(q);

});

router.post('/deleteallarchived', auth(), async (req, res) => {
  logger.info('/deleteallarchived, req.body', req.body);
  let q = await noteDb.deleteMany({
    username: req.body.username,
    isArchived: true
  });
  res.json(q);
});

router.post('/createpdf', auth(), async (req, res) => {
  logger.info('/createpdf, req.body', req.body);
  pdf.create(html1, {}).toBuffer(function(err, buffer){
    logger.info('This is a buffer:', buffer);
    res.send(buffer);
  });
});

module.exports = router;
