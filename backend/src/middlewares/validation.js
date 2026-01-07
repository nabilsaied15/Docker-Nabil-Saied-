const Joi = require('joi');

const registerValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const activityValidation = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().valid('running', 'cycling', 'swimming', 'walking', 'gym').required(),
    duration: Joi.number().min(1).required(),
    calories: Joi.number().min(0),
    distance: Joi.number().min(0),
    notes: Joi.string().max(500)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const goalValidation = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).allow('', null),
    type: Joi.string().valid('duration', 'distance', 'calories', 'activities_count').required(),
    target_value: Joi.number().min(0.01).required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().greater(Joi.ref('start_date')).required(),
    status: Joi.string().valid('active', 'completed', 'cancelled')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    console.log('[goalValidation] Erreur de validation:', error.details);
    console.log('[goalValidation] Body reçu:', req.body);
    return res.status(400).json({ 
      message: error.details[0].message,
      details: error.details.map(d => d.message)
    });
  }
  next();
};

const goalUpdateValidation = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000).allow('', null),
    target_value: Joi.number().min(0.01),
    current_value: Joi.number().min(0),
    start_date: Joi.date(),
    end_date: Joi.date(),
    status: Joi.string().valid('active', 'completed', 'cancelled')
  }).min(1); 

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  
  if (req.body.start_date && req.body.end_date) {
    if (new Date(req.body.end_date) <= new Date(req.body.start_date)) {
      return res.status(400).json({ message: 'end_date doit être après start_date' });
    }
  }
  
  next();
};

module.exports = { registerValidation, activityValidation, goalValidation, goalUpdateValidation };