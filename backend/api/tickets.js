const express = require('express')
const router = express.Router()
const TicketModel = cms.getModel('Ticket')

router.post('/', async (req, res) => {
  let {name, store, participants, tasks, notes} = req.body;
  if (!store) return res.status(400).json({message: 'Missing storeId in request'});
  const lastId = (await TicketModel.find({}, {'id': 1}).sort({id: -1}).limit(1))[0];
  const newId = lastId ? +lastId.id+1 : 1;
  const now = new Date();
  const insertedTicket = await TicketModel.create({
    id: newId,
    name,
    store,
    participants: participants || [],
    tasks: tasks || [],
    notes: notes || [],
    createdAt: now,
    updatedAt: now
  });
  cms.socket.emit('newTicket', insertedTicket);
  res.status(201).json(insertedTicket);
});

module.exports = router;
