
const Joi = require("joi");

// Define Joi schema for validation
const Schema = Joi.object({
    fullName: Joi.string().trim()
   .pattern(/^[a-zA-Z'-]+(?: [a-zA-Z'-]+)+$/)
   .required()
   .messages({
     'string.empty': 'Full name is required',
     'string.pattern.base': 'Full name must be in the format: "First Last" or "First Middle Last", starting with an uppercase letter'
   }),
    password: Joi.string().trim().min(6).max(30)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/)
    .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 30 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    }),

    email: Joi.string().trim().email({ tlds: { allow: false } }).required()  
    .messages({
        'string.email': 'Invalid email format',
        'string.empty': 'Email is required'
    }),
    phoneNumber: Joi.string().required()
    .regex(/^(\+234|0)[789][01]\d{8}$/)
    .messages({
        'string.empty': 'Phone number is required',
        'string.pattern.base': 'Invalid Nigerian phone number format. Please use format: 0801234567 or +2348012345678'
    }),
    
});

// Validation middleware
const validateUser = (req, res, next) => {
    const { error } = Schema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    
    next();
};

const mechSchema = Joi.object({
    businessName: Joi.string().trim().min(5).max(100)
    .messages({
        'string.empty': 'business Name is required',
        'string.min': 'business Name must be at least 5 characters long',
        'string.max': 'business Name cannot exceed 500 characters'
    }),
    businessAddress: Joi.string().trim().min(5).max(100)
    .messages({
        'string.empty': 'Business address is required',
        'string.min': 'Business address must be at least 5 characters long',
        'string.max': 'Business address cannot exceed 100 characters'
    }),
    businessRegNumber: Joi.string().trim().pattern(/^RC\d{6,}$/).required() 
        .messages({
            'string.base': 'Registration number must be a string',
            'string.empty': 'Registration number is required',
            'string.pattern.base': 'Registration number must start with "RC" followed by at least 6 digits',
            'any.required': 'Registration number is required'
        }),

    areaOfSpecialization: Joi.string().trim().min(5).max(500)
    .messages({
        'string.empty': 'Area of specialization is required',
        'string.min': 'Area of specialization must be at least 5 characters long',
        'string.max': 'Area of specialization cannot exceed 500 characters'
    }),
    yearsOfExperience: Joi.string().trim()
    .messages({
        'string.empty': 'Area of yearsOfExperience is required',
    }),
});

   
    // // maritalStatus: Joi.string().valid('Married', 'Single', 'Other').required()
    // .messages({
    //     'any.only': 'Marital status must be Married, Single, or Other',
    //     'any.required': 'Marital status is required'
    // }),
    // homeAddress: Joi.string().trim().min(5).max(100)
    // .messages({
    //     'string.empty': 'Home address is required',
    //     'string.min': 'Home address must be at least 5 characters long',
    //     'string.max': 'Home address cannot exceed 100 characters'
    // }),


// Validation middleware
const validateMech = (req, res, next) => {
    const { error } = mechSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    
    next();
};

const bookingSchema = Joi.object({
    vehicle: Joi.object({
      make: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
          'string.empty': 'Vehicle make is required',
          'string.min': 'Vehicle make must be at least 2 character long',
          'string.max': 'Vehicle make must not exceed 50 characters',
        }),
      model: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
          'string.empty': 'Vehicle model is required',
          'string.min': 'Vehicle model must be at least 1 character long',
          'string.max': 'Vehicle model must not exceed 50 characters',
        }),
      year: Joi.number()
        .integer()
        .min(1900)
        .max(new Date().getFullYear())
        .required()
        .messages({
          'number.base': 'Year must be a number',
          'number.integer': 'Year must be an integer',
          'number.min': 'Year must be at least 1900',
          'number.max': `Year must not exceed ${new Date().getFullYear()}`,
          'number.empty': 'Year is required',
        }),
      licensePlate: Joi.string()
        .min(1)
        .max(20)
        .required()
        .messages({
          'string.empty': 'License plate is required',
          'string.min': 'License plate must be at least 1 character long',
          'string.max': 'License plate must not exceed 20 characters',
        }),
    }).required(),
    
    service: Joi.object({
      type: Joi.string()
        .valid('Oil Change', 'Tire Replacement', 'Brake Repair', 'Engine Maintenance', 'Other')
        .required()
        .messages({
          'string.empty': 'Service type is required',
          'any.only': 'Invalid service type',
        }),
      description: Joi.string()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Description must not exceed 500 characters',
        }),
    }).required(),
    
    appointment: Joi.object({
      date: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'A valid date is required',
          'date.format': 'Date must be in ISO format',
        }),
      time: Joi.string()
    }).required(),
    
    location: Joi.string(),
  
    notes: Joi.string()
      .max(300)
      .optional()
      .messages({
        'string.max': 'Notes must not exceed 300 characters',
      }),
  
  }).required();

  const validateBooking = (req, res, next) => {
    const { error } = bookingSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ errors });
    }
    
    next();
};

module.exports = { validateUser, validateMech, validateBooking };

    