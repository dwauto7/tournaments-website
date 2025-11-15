// REPLACE existing tournament creation with bracket-manager
const BracketManager = require('bracket-manager');

router.post('/create', async (req, res) => {
  try {
    const { name, participants, type = 'single-elimination' } = req.body;
    
    // Generate bracket automatically
    const tournament = BracketManager.create({
      name,
      type,
      participants: participants.map((p, i) => ({ id: i + 1, name: p }))
    });
    
    // Save to MongoDB (your existing code)
    const savedTournament = await Tournament.create({
      name,
      bracketData: tournament,
      status: 'active',
      created_at: new Date()
    });
    
    res.json(savedTournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
