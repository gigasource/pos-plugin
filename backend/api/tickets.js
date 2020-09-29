const express = require('express')
const router = express.Router()
const TicketModel = cms.getModel('Ticket')
const _ = require('lodash')

router.post('/', async (req, res) => {
  let {name, store, participants, tasks, notes} = req.body;
  const lastId = (await TicketModel.find({}, {'id': 1}).sort({id: -1}).limit(1))[0];
  const newId = lastId ? lastId.id+1 : 1;
  const now = new Date();
  const insertedTicket = await TicketModel.create({
    id: newId,
    name,
    ...store && {store},
    participants: participants || [],
    tasks: tasks || [],
    notes: notes || [],
    createdAt: now,
    updatedAt: now
  });
  cms.socket.emit('newTicket', insertedTicket);
  const tokens = (await cms.getModel('User').find({
    _id: participants.map(p => typeof p === 'string' ? p : p._id),
    firebaseToken: {$ne: ''}
  }, {
    firebaseToken: 1
  })).map(u => u.firebaseToken);

  if (tokens.length > 0) {
    cms.emit('sendTicket', {
      title: 'Ticket assignment',
      body: `You have been assigned to ticket #${insertedTicket.id}`,
      ticketId: insertedTicket._id,
      tokens
    });
  }
  res.status(201).json(insertedTicket);
});

router.put('/:id', async (req, res) => {
  let { id } = req.params;
  let ticket = req.body;
  if (!id) return res.status(400).json({message: 'Missing ticketId in request'});
  ticket.participants = ticket.participants || [];
  const oldTicket = await TicketModel.findById(id);
  const updatedParticipants = _.without(ticket.participants.map(p => typeof p === 'string' ? p : p._id), ...oldTicket.participants.map(p => p._id.toString()))
  const updatedTicket = await TicketModel.findByIdAndUpdate(id, ticket);
  const tokens = (await cms.getModel('User').find({
    _id: updatedParticipants,
    firebaseToken: {$ne: ''}
  }, {
    firebaseToken: 1
  })).map(u => u.firebaseToken);
  if (tokens.length > 0) {
    cms.emit('sendTicket', {
      title: 'Ticket assignment',
      body: `You have been assigned to ticket #${updatedTicket.id}`,
      ticketId: updatedTicket._id,
      tokens
    });
  }
  res.status(200).json(updatedTicket);
});

router.get('/', async (req, res) => {
  const tickets = await TicketModel.find();
  res.json(tickets);
});

router.get('/:ticketId', async (req, res) => {
  const ticket = await TicketModel.findById(req.params.ticketId);
  if (ticket) res.json(ticket);
  else res.status(404).json({error: 'Ticket not found'});
});

module.exports = router;
