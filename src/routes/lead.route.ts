import { Router } from 'express'
import { runEmailEligibilityValidation } from '../controllers/lead.controller'

const router = Router()

// Trigger eligibility worker
router.post('/validate', runEmailEligibilityValidation)

export default router
